import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isTestMode } from '@/lib/testMode'

// Stripe Payment Link (no-code solution)
// This is a test mode link - replace with live link when ready for production
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_3cI5kFdwZ0kj1OQgkqdIA00'

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

    // Add user email as prefilled parameter to the payment link
    const paymentUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(session.user.email || '')}`

    return NextResponse.json({ url: paymentUrl })
  } catch (error) {
    console.error('Verification payment error:', error)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
}
