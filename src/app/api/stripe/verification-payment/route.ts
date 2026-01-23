import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { isTestMode } from '@/lib/testMode'

// Initialize Stripe only if the key exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
}) : null

const VERIFICATION_FEE = 5000 // $50 in cents

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has an approved profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Please create your profile first' }, { status: 400 })
    }

    if (profile.approvalStatus === 'approved') {
      return NextResponse.json({ error: 'Your profile is already verified' }, { status: 400 })
    }

    // Check if user already paid
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.profilePaid) {
      return NextResponse.json({ error: 'Payment already completed. Your profile is pending admin review.' }, { status: 400 })
    }

    if (isTestMode) {
      return NextResponse.json({
        url: '/payment/success?session_id=test',
        sessionId: 'test_session'
      })
    }

    // Check if Stripe is configured
    if (!stripe) {
      console.error('Stripe is not configured - STRIPE_SECRET_KEY is missing')
      return NextResponse.json({ error: 'Payment system is not configured. Please contact support.' }, { status: 500 })
    }

    // Create one-time payment checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email!,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'VivaahReady Profile Verification',
              description: 'One-time verification fee to unlock full platform access. Includes profile verification, ability to view full profiles, express interest, and connect with matches.',
              images: [`${process.env.NEXTAUTH_URL}/logo-transparent.png`],
            },
            unit_amount: VERIFICATION_FEE,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
      metadata: {
        userId: session.user.id,
        profileId: profile.id,
        type: 'verification_payment',
      },
    })

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Verification payment error:', error)
    // Provide more specific error message if it's a Stripe error
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error details:', error.message, error.type)
      return NextResponse.json({ error: `Payment error: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

// Verify payment status and update profile
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
      return NextResponse.json({
        paid: true,
        paymentId: 'test_payment',
        message: 'Payment successful! Your profile is now pending admin verification.'
      })
    }

    // Check if Stripe is configured
    if (!stripe) {
      console.error('Stripe is not configured - STRIPE_SECRET_KEY is missing')
      return NextResponse.json({ error: 'Payment system is not configured. Please contact support.' }, { status: 500 })
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

    // Update subscription record
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        profilePaid: true,
        profilePaymentId: checkoutSession.payment_intent as string,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        plan: 'verified',
        status: 'active',
        profilePaid: true,
        profilePaymentId: checkoutSession.payment_intent as string,
      },
    })

    // Update profile status to pending (awaiting admin approval)
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        approvalStatus: 'pending',
      },
    })

    return NextResponse.json({
      paid: true,
      paymentId: checkoutSession.payment_intent as string,
      message: 'Payment successful! Your profile is now pending admin verification.',
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
