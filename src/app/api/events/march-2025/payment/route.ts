import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { squareClient, getLocationId, dollarsToCents } from '@/lib/square'
import { sendEmail } from '@/lib/email'
import { sendSms } from '@/lib/twilio'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { registrationId, sourceId, verificationToken } = body

    if (!registrationId || !sourceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the registration
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Get user's profile to verify ownership
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    })

    if (!profile || profile.id !== registration.profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const eventPrice = registration.event.price
    if (!Number.isFinite(eventPrice) || eventPrice <= 0) {
      return NextResponse.json({ error: 'Invalid event pricing configuration' }, { status: 400 })
    }

    // Check if already paid
    if (registration.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    // Process payment with Square
    try {
      const locationId = await getLocationId()
      const idempotencyKey = `event-${registrationId}-${Date.now()}`

      const paymentResult = await squareClient.payments.create({
        sourceId,
        verificationToken,
        idempotencyKey,
        locationId,
        amountMoney: {
          amount: dollarsToCents(eventPrice),
          currency: 'USD',
        },
        note: `VivaahReady Event Registration - ${registration.event.title}`,
        buyerEmailAddress: profile.user.email,
      })

      if (!paymentResult.payment || paymentResult.payment.status !== 'COMPLETED') {
        throw new Error('Payment was not completed')
      }

      // Update registration as paid
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: 'paid',
          paymentId: paymentResult.payment.id,
          amountPaid: Math.round(eventPrice * 100), // Store in cents
          registeredAt: new Date(),
        },
      })

      // Send confirmation email
      const eventDate = new Date(registration.event.eventDate)
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const formattedTime = eventDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })

      await sendEmail({
        to: profile.user.email,
        subject: `You're Registered! ${registration.event.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #e11d48 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">You're Registered!</h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">${registration.event.title}</p>
              </div>

              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Hi ${profile.firstName || profile.user.name?.split(' ')[0] || 'there'},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Congratulations! Your spot is confirmed for our exclusive singles Zoom meetup.
                </p>

                <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Event Details</h3>
                  <p style="margin: 8px 0; color: #374151;">
                    <strong>Date:</strong> ${formattedDate}
                  </p>
                  <p style="margin: 8px 0; color: #374151;">
                    <strong>Time:</strong> ${formattedTime}
                  </p>
                  <p style="margin: 8px 0; color: #374151;">
                    <strong>Format:</strong> Zoom Video Meetup
                  </p>
                  <p style="margin: 8px 0; color: #374151;">
                    <strong>Confirmation #:</strong> ${registration.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>

                <div style="background: #fef3c7; border-radius: 12px; padding: 15px; margin: 24px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>Important:</strong> You will receive the Zoom link 1 hour before the event via email${registration.smsOptIn ? ' and SMS' : ''}${registration.whatsappOptIn ? ' and WhatsApp' : ''}.
                  </p>
                </div>

                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  We're excited to have you! This is a great opportunity to meet like-minded singles from California.
                </p>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Questions? Reply to this email or contact us at support@vivaahready.com
                </p>
              </div>

              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  VivaahReady - Where Verified Singles Meet
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `You're Registered for ${registration.event.title}!\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nFormat: Zoom Video Meetup\nConfirmation #: ${registration.id.substring(0, 8).toUpperCase()}\n\nYou will receive the Zoom link 1 hour before the event.\n\nQuestions? Contact support@vivaahready.com`,
      })

      // Send SMS confirmation if opted in
      if (registration.smsOptIn && profile.user.phone) {
        await sendSms({
          to: profile.user.phone,
          body: `VivaahReady: You're registered for the Singles Zoom Meetup on ${formattedDate} at ${formattedTime}! Confirmation #${registration.id.substring(0, 8).toUpperCase()}. Zoom link will be sent 1 hour before.`,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Payment successful! You are registered.',
      })
    } catch (paymentError) {
      console.error('Square payment error:', paymentError)
      return NextResponse.json(
        { error: 'Payment processing failed. Please try again.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Event payment error:', error)
    return NextResponse.json(
      { error: 'Payment failed. Please try again.' },
      { status: 500 }
    )
  }
}
