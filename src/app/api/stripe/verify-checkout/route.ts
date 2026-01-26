import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { isTestMode } from '@/lib/testMode'
import { getActivePrice } from '@/lib/pricing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already paid
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.profilePaid) {
      return NextResponse.json({ error: 'Already verified', alreadyPaid: true }, { status: 400 })
    }

    // Check if user has a profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Please create a profile first' }, { status: 400 })
    }

    // In test mode, simulate payment and redirect to success
    if (isTestMode) {
      // Mark as paid in test mode
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: {
          profilePaid: true,
          profilePaymentId: `TEST_${Date.now()}`,
        },
        create: {
          userId: session.user.id,
          profilePaid: true,
          profilePaymentId: `TEST_${Date.now()}`,
        },
      })

      if (profile.approvalStatus !== 'approved') {
        await prisma.profile.update({
          where: { id: profile.id },
          data: { approvalStatus: 'pending' },
        })
      }

      return NextResponse.json({ url: '/matches?payment=success' })
    }

    const priceInCents = getActivePrice() * 100

    // Create Stripe checkout session for one-time verification payment
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email!,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'VivaahReady Verification',
              description: 'One-time verification fee — lifetime access, no subscriptions',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/matches?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/get-verified?payment=cancelled`,
      metadata: {
        userId: session.user.id,
        type: 'verification_payment',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe verify checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
