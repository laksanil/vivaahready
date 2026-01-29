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

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Capture the PayPal order
    const result = await capturePayPalOrder(orderId)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Payment capture failed' },
        { status: 400 }
      )
    }

    // Always use the current session user - don't rely on customId from PayPal
    // This ensures the logged-in user gets credited, not whoever created the order
    const userId = session.user.id

    // Mark payment as complete in database
    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId },
        update: {
          profilePaid: true,
          profilePaymentId: `paypal_${orderId}`,
        },
        create: {
          userId,
          profilePaid: true,
          profilePaymentId: `paypal_${orderId}`,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: {
          approvalStatus: 'pending',
        },
      }),
    ])

    console.log(`PayPal payment captured for user: ${userId}, order: ${orderId}`)

    return NextResponse.json({
      success: true,
      message: 'Payment captured successfully',
    })
  } catch (error) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
