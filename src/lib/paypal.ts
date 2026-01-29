// PayPal API configuration and helpers

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!
const PAYPAL_API_URL = 'https://api-m.paypal.com' // Live API

// Get PayPal access token
export async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal auth error:', error)
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

// Create a PayPal order
export async function createPayPalOrder(amount: string, userEmail: string, userId: string): Promise<{ id: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount,
          },
          description: 'VivaahReady Profile Verification',
          custom_id: userId, // Store user ID for webhook
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'VivaahReady',
            locale: 'en-US',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vivaahready.com'}/payment/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vivaahready.com'}/payment`,
          },
        },
      },
      application_context: {
        shipping_preference: 'NO_SHIPPING',
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal create order error:', error)
    throw new Error('Failed to create PayPal order')
  }

  const order = await response.json()

  // Find the approval URL
  const approvalUrl = order.links?.find((link: { rel: string; href: string }) => link.rel === 'payer-action')?.href
    || order.links?.find((link: { rel: string; href: string }) => link.rel === 'approve')?.href

  return {
    id: order.id,
    approvalUrl: approvalUrl || '',
  }
}

// Capture a PayPal order (after user approves)
export async function capturePayPalOrder(orderId: string): Promise<{ success: boolean; customId?: string; payerId?: string }> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal capture error:', error)
    return { success: false }
  }

  const data = await response.json()

  // Get the custom_id (user ID) from the purchase unit
  const customId = data.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
    || data.purchase_units?.[0]?.custom_id

  return {
    success: data.status === 'COMPLETED',
    customId,
    payerId: data.payer?.payer_id,
  }
}

// Verify webhook signature
export async function verifyPayPalWebhook(
  headers: { [key: string]: string },
  body: string,
  webhookId: string
): Promise<boolean> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  })

  if (!response.ok) {
    console.error('PayPal webhook verification failed')
    return false
  }

  const data = await response.json()
  return data.verification_status === 'SUCCESS'
}
