import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { capturePayPalOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, registrationId } = await request.json()

    if (!orderId || !registrationId) {
      return NextResponse.json({ error: 'Order ID and Registration ID required' }, { status: 400 })
    }

    // Verify registration belongs to user
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Verify the profile belongs to the current user
    const profile = await prisma.profile.findUnique({
      where: { id: registration.profileId },
      select: { userId: true },
    })

    if (!profile || profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update pending payment attempt count
    await prisma.pendingPayment.updateMany({
      where: { paypalOrderId: orderId },
      data: { captureAttempts: { increment: 1 } },
    })

    // Capture the PayPal order
    const result = await capturePayPalOrder(orderId)

    if (!result.success) {
      const errorMsg = (result as { error?: string }).error || 'Unknown error'
      console.error('Event PayPal capture failed:', orderId, errorMsg)

      await prisma.pendingPayment.updateMany({
        where: { paypalOrderId: orderId },
        data: {
          status: 'failed',
          lastError: errorMsg.substring(0, 500),
        },
      })

      return NextResponse.json(
        { error: 'Payment capture failed. Please try again.' },
        { status: 400 }
      )
    }

    // Mark registration as paid and pending payment as captured
    await prisma.$transaction([
      prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: 'paid',
          paymentId: `paypal_${orderId}`,
          amountPaid: Math.round((registration.event.price || 25) * 100),
        },
      }),
      prisma.pendingPayment.updateMany({
        where: { paypalOrderId: orderId },
        data: {
          status: 'captured',
          capturedAt: new Date(),
        },
      }),
    ])

    console.log(`Event payment captured for user: ${session.user.id}, registration: ${registrationId}, order: ${orderId}`)

    return NextResponse.json({
      success: true,
      message: 'Payment captured successfully',
    })
  } catch (error) {
    console.error('Error capturing event payment:', error)
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
