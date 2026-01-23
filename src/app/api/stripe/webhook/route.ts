import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle checkout.session.completed (from Payment Links)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleSuccessfulPayment(session)
  }

  return NextResponse.json({ received: true })
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email

  if (!customerEmail) {
    console.error('No customer email in session')
    return
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
  })

  if (!user) {
    console.error(`User not found for email: ${customerEmail}`)
    return
  }

  // Check if this is a $50 verification payment (amount is in cents)
  const amountPaid = session.amount_total
  if (amountPaid === 5000) {
    await markPaymentComplete(user.id, session.id)
    console.log(`Verification payment completed for user: ${user.id}`)
  }
}

async function markPaymentComplete(userId: string, paymentId: string) {
  try {
    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId },
        update: {
          profilePaid: true,
          profilePaymentId: paymentId,
        },
        create: {
          userId,
          profilePaid: true,
          profilePaymentId: paymentId,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: {
          approvalStatus: 'pending',
        },
      }),
    ])
  } catch (error) {
    console.error('Error marking payment complete:', error)
    throw error
  }
}
