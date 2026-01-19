import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { isTestMode } from '@/lib/testMode'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const PROFILE_PAYMENT_AMOUNT = 1000 // $10 in cents

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already paid for profile
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.profilePaid) {
      return NextResponse.json({ error: 'Profile payment already completed' }, { status: 400 })
    }

    // Check if user already has a profile
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 })
    }

    // Get profile data from request (to store in metadata)
    const { profileData } = await request.json()

    if (isTestMode) {
      return NextResponse.json({
        url: '/profile/create/payment-success?session_id=test',
        sessionId: 'test_session'
      })
    }

    // Create one-time payment checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email!,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'VivaahReady Profile Creation',
              description: 'One-time fee to create your matrimony profile and start connecting',
            },
            unit_amount: PROFILE_PAYMENT_AMOUNT,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/profile/create/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/profile/create?payment=cancelled`,
      metadata: {
        userId: session.user.id,
        type: 'profile_payment',
        // Store profile data reference (we'll save actual data in localStorage)
      },
    })

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Profile payment error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

// Verify payment status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    if (isTestMode) {
      return NextResponse.json({ paid: true, paymentId: 'test_payment' })
    }

    // Retrieve Stripe session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({
        paid: false,
        status: checkoutSession.payment_status,
      })
    }

    // Verify this session belongs to this user
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    return NextResponse.json({
      paid: true,
      paymentId: checkoutSession.payment_intent as string,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
