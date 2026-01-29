import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { capturePayPalOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

// Retry helper with exponential backoff
async function captureWithRetry(orderId: string, maxRetries: number = 3): Promise<{ success: boolean; error?: string; customId?: string; payerId?: string }> {
  let lastError = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await capturePayPalOrder(orderId)

    if (result.success) {
      return result
    }

    lastError = (result as { error?: string }).error || 'Unknown error'
    console.log(`PayPal capture attempt ${attempt}/${maxRetries} failed:`, lastError)

    // Don't retry if order is already captured or invalid
    if (lastError.includes('ORDER_ALREADY_CAPTURED') || lastError.includes('INVALID_RESOURCE_ID')) {
      break
    }

    // Wait before retrying (exponential backoff: 1s, 2s, 4s)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
    }
  }

  return { success: false, error: lastError }
}

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

    // Update pending payment attempt count
    await prisma.pendingPayment.updateMany({
      where: { paypalOrderId: orderId },
      data: { captureAttempts: { increment: 1 } },
    })

    // Capture the PayPal order with retry logic
    const result = await captureWithRetry(orderId)

    if (!result.success) {
      const errorMsg = (result as { error?: string }).error || 'Unknown error'
      console.error('PayPal capture failed for order:', orderId, 'error:', errorMsg)

      // Update pending payment with error
      await prisma.pendingPayment.updateMany({
        where: { paypalOrderId: orderId },
        data: {
          status: 'failed',
          lastError: errorMsg.substring(0, 500), // Truncate long errors
        },
      })

      return NextResponse.json(
        { error: 'Payment capture failed. The order may have already been processed or expired. Please try again.' },
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
      // Mark pending payment as captured
      prisma.pendingPayment.updateMany({
        where: { paypalOrderId: orderId },
        data: {
          status: 'captured',
          capturedAt: new Date(),
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
