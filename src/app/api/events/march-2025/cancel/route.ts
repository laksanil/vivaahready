import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { squareClient } from '@/lib/square'
import { sendEmail } from '@/lib/email'
import { sendSms } from '@/lib/twilio'
import { MARCH_EVENT_CONFIG } from '@/lib/marchEventConfig'

// 48 hours in milliseconds
const REFUND_CUTOFF_MS = 48 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
    }

    const { reason } = await request.json()

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'Please provide a reason for cancellation' }, { status: 400 })
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Find the event
    const event = await prisma.event.findUnique({
      where: { slug: MARCH_EVENT_CONFIG.slug },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Find the registration
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_profileId: {
          eventId: event.id,
          profileId: profile.id,
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (registration.status === 'cancelled') {
      return NextResponse.json({ error: 'Registration already cancelled' }, { status: 400 })
    }

    // Check if within 48-hour window
    const eventDate = new Date(event.eventDate)
    const now = new Date()
    const timeUntilEvent = eventDate.getTime() - now.getTime()
    const canRefund = timeUntilEvent > REFUND_CUTOFF_MS

    let refundId: string | null = null
    let refundSuccess = false
    const paidAmountCents = registration.amountPaid || (event.price * 100)
    const paidAmountText = `$${(paidAmountCents / 100).toFixed(2)}`

    // Process refund if eligible and payment was made
    if (canRefund && registration.paymentStatus === 'paid' && registration.paymentId) {
      try {
        const refundResult = await squareClient.refunds.refundPayment({
          idempotencyKey: `refund-${registration.id}-${Date.now()}`,
          paymentId: registration.paymentId,
          amountMoney: {
            amount: BigInt(paidAmountCents),
            currency: 'USD',
          },
          reason: `Event cancellation: ${reason}`,
        })

        if (refundResult.refund?.id) {
          refundId = refundResult.refund.id
          refundSuccess = true
        }
      } catch (refundError) {
        console.error('Square refund error:', refundError)
        // Continue with cancellation even if refund fails - admin can handle manually
      }
    }

    // Update registration
    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        paymentStatus: refundSuccess ? 'refunded' : registration.paymentStatus,
        refundedAt: refundSuccess ? new Date() : null,
        refundId: refundId,
      },
    })

    // Send confirmation email
    const refundMessage = canRefund
      ? refundSuccess
        ? `Your refund of ${paidAmountText} has been processed and will appear on your statement within 2-10 business days.`
        : 'Your refund is being processed. If you don\'t see it within 5 business days, please contact us.'
      : 'Unfortunately, cancellations within 48 hours of the event are not eligible for refund per our policy.'

    await sendEmail({
      to: profile.user.email,
      subject: 'Registration Cancelled - Singles Zoom Meetup',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #374151; margin-bottom: 20px;">Registration Cancelled</h2>

            <p style="color: #374151;">Hi ${profile.firstName || profile.user.name?.split(' ')[0] || 'there'},</p>

            <p style="color: #374151;">Your registration for the <strong>Singles Zoom Meetup</strong> on March 15, 2026 has been cancelled.</p>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6b7280; margin: 0;"><strong>Refund Status:</strong></p>
              <p style="color: #374151; margin: 5px 0 0 0;">${refundMessage}</p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">We're sorry to see you go! Hope to see you at a future event.</p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              VivaahReady Team
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Your registration for the Singles Zoom Meetup has been cancelled.\n\n${refundMessage}\n\nWe hope to see you at a future event!\n\nVivaahReady Team`,
    })

    // Send SMS if opted in
    if (registration.smsOptIn && profile.user.phone) {
      await sendSms({
        to: profile.user.phone,
        body: `VivaahReady: Your event registration has been cancelled. ${canRefund ? `Refund amount ${paidAmountText} will be processed within 2-10 business days.` : ''}`,
      })
    }

    return NextResponse.json({
      success: true,
      refunded: refundSuccess,
      canRefund,
      message: canRefund
        ? 'Your registration has been cancelled and refund is being processed.'
        : 'Your registration has been cancelled. No refund is available for cancellations within 48 hours of the event.',
    })
  } catch (error) {
    console.error('Cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel registration. Please try again.' },
      { status: 500 }
    )
  }
}
