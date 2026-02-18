import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import { isTestMode } from '@/lib/testMode'

// Configure VAPID keys for Web Push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@vivaahready.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

interface PushResult {
  success: boolean
  sent: number
  failed: number
  errors?: string[]
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (isTestMode) {
    console.info('Push notification skipped in test mode', { endpoint: subscription.endpoint })
    return { success: true }
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('Push not sent: VAPID keys not configured')
    return { success: false, error: 'Push service not configured' }
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        ...payload,
        icon: payload.icon || '/logo-icon.png',
        badge: payload.badge || '/logo-icon.png',
      })
    )
    return { success: true }
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode
    // 410 Gone or 404 means the subscription is no longer valid
    if (statusCode === 410 || statusCode === 404) {
      await prisma.pushSubscription
        .delete({ where: { endpoint: subscription.endpoint } })
        .catch(() => {}) // Ignore if already deleted
      console.log('Removed expired push subscription:', subscription.endpoint)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send a push notification to all subscriptions for a user
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  if (isTestMode) {
    console.info('Push notification skipped in test mode', { userId })
    return { success: true, sent: 0, failed: 0 }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 }
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  )

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
    } else {
      failed++
      if (result.status === 'fulfilled' && result.value.error) {
        errors.push(result.value.error)
      } else if (result.status === 'rejected') {
        errors.push(String(result.reason))
      }
    }
  }

  return { success: failed === 0, sent, failed, errors: errors.length > 0 ? errors : undefined }
}
