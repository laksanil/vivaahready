import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create PayPal order for $50 verification payment
    const order = await createPayPalOrder('50.00', session.user.email, session.user.id)

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
