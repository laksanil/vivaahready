import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPayPalOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

// Get current price from database
async function getCurrentPrice(): Promise<number> {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) return 50

    const now = new Date()
    if (settings.promoPrice && settings.promoEndDate && new Date(settings.promoEndDate) > now) {
      return settings.promoPrice
    }

    return settings.verificationPrice
  } catch {
    return 50
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const amount = await getCurrentPrice()
    const amountStr = amount.toFixed(2)

    const order = await createPayPalOrder(amountStr, session.user.email, session.user.id)

    // Track the pending payment for recovery if capture fails
    await prisma.pendingPayment.upsert({
      where: { paypalOrderId: order.id },
      update: {
        userId: session.user.id,
        status: 'pending',
      },
      create: {
        userId: session.user.id,
        paypalOrderId: order.id,
        amount: amountStr,
        status: 'pending',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: order.approvalUrl,
    })
  } catch (error) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
