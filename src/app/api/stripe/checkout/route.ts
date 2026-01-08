import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const PRICE_MAP: Record<string, { amount: number; interval: 'month' | 'year'; intervalCount: number }> = {
  price_premium_monthly: { amount: 4000, interval: 'month', intervalCount: 1 },
  price_premium_quarterly: { amount: 9900, interval: 'month', intervalCount: 3 },
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId } = await request.json()

    if (!priceId || !PRICE_MAP[priceId]) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const priceConfig = PRICE_MAP[priceId]

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: priceId === 'price_premium_monthly' ? 'VivaahReady Premium' : 'VivaahReady Premium Plus',
              description: 'Full access to all premium features',
            },
            recurring: {
              interval: priceConfig.interval,
              interval_count: priceConfig.intervalCount,
            },
            unit_amount: priceConfig.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?subscription=cancelled`,
      metadata: {
        userId: session.user.id,
        priceId,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
