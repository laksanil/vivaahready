import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * SNS Webhook endpoint
 * Handles:
 * - SubscriptionConfirmation: Auto-confirms SNS topic subscriptions
 * - Notification: Processes incoming SNS messages
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const message = JSON.parse(body)

    const messageType = request.headers.get('x-amz-sns-message-type')

    // Handle subscription confirmation
    if (messageType === 'SubscriptionConfirmation') {
      const subscribeUrl = message.SubscribeURL
      if (subscribeUrl) {
        // Confirm the subscription by visiting the URL
        await fetch(subscribeUrl)
        console.log('SNS subscription confirmed for topic:', message.TopicArn)
      }
      return NextResponse.json({ confirmed: true })
    }

    // Handle unsubscribe confirmation
    if (messageType === 'UnsubscribeConfirmation') {
      console.log('SNS unsubscribe confirmed for topic:', message.TopicArn)
      return NextResponse.json({ confirmed: true })
    }

    // Handle notification messages
    if (messageType === 'Notification') {
      let payload
      try {
        payload = JSON.parse(message.Message)
      } catch {
        payload = { raw: message.Message }
      }

      console.log('SNS notification received:', {
        topicArn: message.TopicArn,
        messageId: message.MessageId,
        event: payload.event,
        timestamp: payload.timestamp,
      })

      // Process the notification based on event type
      // Future: Route to specific handlers, trigger Lambda-like processing, etc.

      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ error: 'Unknown message type' }, { status: 400 })
  } catch (error) {
    console.error('SNS webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'sns-webhook',
    timestamp: new Date().toISOString(),
  })
}
