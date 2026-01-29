import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPayPalOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create PayPal order - TESTING: $1 (change back to 50.00 after testing)
    const order = await createPayPalOrder('1.00', session.user.email, session.user.id)

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
        amount: '1.00',
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
