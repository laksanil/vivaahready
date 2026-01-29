import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyPayPalWebhook } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()

    // Get PayPal headers for verification
    const paypalHeaders: { [key: string]: string } = {
      'paypal-auth-algo': headersList.get('paypal-auth-algo') || '',
      'paypal-cert-url': headersList.get('paypal-cert-url') || '',
      'paypal-transmission-id': headersList.get('paypal-transmission-id') || '',
      'paypal-transmission-sig': headersList.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': headersList.get('paypal-transmission-time') || '',
    }

    // Verify webhook signature if webhook ID is configured
    if (PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyPayPalWebhook(paypalHeaders, body, PAYPAL_WEBHOOK_ID)
      if (!isValid) {
        console.error('PayPal webhook verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    console.log('PayPal webhook event:', event.event_type)

    // Handle payment capture completed
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      await handlePaymentCaptured(event.resource)
    }

    // Handle checkout order completed
    if (event.event_type === 'CHECKOUT.ORDER.COMPLETED') {
      await handleOrderCompleted(event.resource)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentCaptured(resource: {
  custom_id?: string
  id?: string
  supplementary_data?: {
    related_ids?: {
      order_id?: string
    }
  }
}) {
  const userId = resource.custom_id
  const paymentId = resource.id
  const orderId = resource.supplementary_data?.related_ids?.order_id

  if (!userId) {
    console.error('No user ID in payment capture webhook')
    return
  }

  await markPaymentComplete(userId, `paypal_${orderId || paymentId}`)
  console.log(`Payment captured via webhook for user: ${userId}`)
}

async function handleOrderCompleted(resource: {
  id?: string
  purchase_units?: Array<{
    custom_id?: string
    payments?: {
      captures?: Array<{
        id?: string
      }>
    }
  }>
}) {
  const orderId = resource.id
  const customId = resource.purchase_units?.[0]?.custom_id

  if (!customId) {
    console.error('No custom_id in order completed webhook')
    return
  }

  await markPaymentComplete(customId, `paypal_${orderId}`)
  console.log(`Order completed via webhook for user: ${customId}`)
}

async function markPaymentComplete(userId: string, paymentId: string) {
  try {
    // Check if already paid
    const existing = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (existing?.profilePaid) {
      console.log(`User ${userId} already marked as paid, skipping`)
      return
    }

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

    console.log(`Payment marked complete for user: ${userId}`)
  } catch (error) {
    console.error('Error marking payment complete:', error)
    throw error
  }
}
