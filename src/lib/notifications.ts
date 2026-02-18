import { prisma } from '@/lib/prisma'
import {
  sendWelcomeEmail,
  sendProfileApprovedEmail,
  sendNewInterestEmail,
  sendInterestAcceptedEmail,
  sendNewMatchAvailableEmail,
  sendPaymentConfirmationEmail,
  sendNewMatchEmail,
} from '@/lib/email'
import {
  sendWelcomeSms,
  sendProfileApprovedSms,
  sendMatchNotificationSms,
  sendMatchAcceptedSms,
  formatPhoneNumber,
} from '@/lib/sns'
import { sendPushToUser } from '@/lib/webpush'
import { publishToTopic } from '@/lib/sns-topics'

export type NotificationEvent =
  | 'welcome'
  | 'profile_approved'
  | 'new_interest'
  | 'interest_accepted'
  | 'match_available'
  | 'payment_confirmed'
  | 'new_message'

interface NotifyOptions {
  /** The notification event type */
  event: NotificationEvent
  /** The user to notify */
  userId: string
  /** Event-specific data */
  data: Record<string, string>
}

interface NotifyResult {
  email: boolean
  sms: boolean
  push: boolean
}

/**
 * Unified notification service — sends to all enabled channels (email, SMS, push)
 * based on user's notification preferences.
 *
 * Usage:
 *   await notify({
 *     event: 'new_interest',
 *     userId: 'user-id',
 *     data: { senderName: 'John', recipientName: 'Jane', recipientEmail: 'jane@example.com' }
 *   })
 */
export async function notify({ event, userId, data }: NotifyOptions): Promise<NotifyResult> {
  const result: NotifyResult = { email: false, sms: false, push: false }

  // Look up user and their notification preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPreference: true },
  })

  if (!user) return result

  const prefs = user.notificationPreference ?? {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    matchNotifications: true,
    interestNotifications: true,
    messageNotifications: true,
    marketingEmails: false,
  }

  // Check event-level preferences
  const eventEnabled = isEventEnabled(event, prefs)
  if (!eventEnabled) return result

  // Fire all channels in parallel (fire-and-forget pattern)
  const promises: Promise<void>[] = []

  // Email
  if (prefs.emailEnabled && user.email) {
    promises.push(
      sendEventEmail(event, user.email, data)
        .then((sent) => { result.email = sent })
        .catch((err) => { console.error(`[notify] Email failed for ${event}:`, err) })
    )
  }

  // SMS
  if (prefs.smsEnabled && user.phone) {
    promises.push(
      sendEventSms(event, formatPhoneNumber(user.phone), data)
        .then((sent) => { result.sms = sent })
        .catch((err) => { console.error(`[notify] SMS failed for ${event}:`, err) })
    )
  }

  // Push
  if (prefs.pushEnabled) {
    promises.push(
      sendEventPush(event, userId, data)
        .then((sent) => { result.push = sent })
        .catch((err) => { console.error(`[notify] Push failed for ${event}:`, err) })
    )
  }

  // Publish to SNS topic for logging/external consumers (fire-and-forget)
  publishToTopic(event, { userId, ...data }).catch((err) => {
    console.error(`[notify] SNS topic publish failed for ${event}:`, err)
  })

  await Promise.allSettled(promises)
  return result
}

function isEventEnabled(
  event: NotificationEvent,
  prefs: { matchNotifications: boolean; interestNotifications: boolean; messageNotifications: boolean }
): boolean {
  switch (event) {
    case 'match_available':
      return prefs.matchNotifications
    case 'new_interest':
    case 'interest_accepted':
      return prefs.interestNotifications
    case 'new_message':
      return prefs.messageNotifications
    // Always send these regardless of preferences
    case 'welcome':
    case 'profile_approved':
    case 'payment_confirmed':
      return true
    default:
      return true
  }
}

async function sendEventEmail(event: NotificationEvent, email: string, data: Record<string, string>): Promise<boolean> {
  let result
  switch (event) {
    case 'welcome':
      result = await sendWelcomeEmail(email, data.name)
      break
    case 'profile_approved':
      result = await sendProfileApprovedEmail(email, data.name)
      break
    case 'new_interest':
      result = await sendNewInterestEmail(email, data.recipientName, data.senderName, data.senderProfileId || '')
      break
    case 'interest_accepted':
      result = await sendInterestAcceptedEmail(email, data.recipientName, data.matchName, data.contactInfo)
      break
    case 'match_available':
      result = await sendNewMatchAvailableEmail(email, data.name, parseInt(data.matchCount || '1'))
      break
    case 'payment_confirmed':
      result = await sendPaymentConfirmationEmail(email, data.name, parseFloat(data.amount || '0'), data.receiptUrl)
      break
    case 'new_message':
      result = await sendNewMatchEmail(email, data.name, parseInt(data.matchCount || '1'))
      break
    default:
      return false
  }
  return result?.success ?? false
}

async function sendEventSms(event: NotificationEvent, phone: string, data: Record<string, string>): Promise<boolean> {
  let result
  switch (event) {
    case 'welcome':
      result = await sendWelcomeSms(phone, data.name || 'there')
      break
    case 'profile_approved':
      result = await sendProfileApprovedSms(phone, data.name || 'there')
      break
    case 'match_available':
      result = await sendMatchNotificationSms(phone, data.name || 'there', data.matchName || 'Someone')
      break
    case 'interest_accepted':
      result = await sendMatchAcceptedSms(phone, data.name || 'there', data.matchName || 'Someone')
      break
    // OTP and admin responses use direct sendSms/sendOtpSms, not the orchestrator
    default:
      return false
  }
  return result?.success ?? false
}

async function sendEventPush(event: NotificationEvent, userId: string, data: Record<string, string>): Promise<boolean> {
  const pushPayloads: Record<NotificationEvent, { title: string; body: string; url: string; tag: string }> = {
    welcome: {
      title: 'Welcome to VivaahReady!',
      body: 'Complete your profile to start finding meaningful connections.',
      url: '/profile/create',
      tag: 'welcome',
    },
    profile_approved: {
      title: 'Profile Approved!',
      body: 'Your profile is now live. Start exploring matches!',
      url: '/matches',
      tag: 'profile-approved',
    },
    new_interest: {
      title: 'New Interest Received!',
      body: `${data.senderName || 'Someone'} is interested in your profile.`,
      url: '/matches?tab=received',
      tag: 'new-interest',
    },
    interest_accepted: {
      title: "It's a Match!",
      body: `${data.matchName || 'Someone'} accepted your interest. Start chatting!`,
      url: '/messages',
      tag: 'interest-accepted',
    },
    match_available: {
      title: 'New Matches Available!',
      body: `You have ${data.matchCount || 'new'} potential matches waiting.`,
      url: '/matches',
      tag: 'new-matches',
    },
    payment_confirmed: {
      title: 'Payment Confirmed',
      body: 'Your payment has been processed. Your profile is being reviewed.',
      url: '/profile',
      tag: 'payment-confirmed',
    },
    new_message: {
      title: 'New Message',
      body: `${data.senderName || 'Someone'} sent you a message.`,
      url: '/messages',
      tag: 'new-message',
    },
  }

  const payload = pushPayloads[event]
  if (!payload) return false

  const result = await sendPushToUser(userId, payload)
  return result.sent > 0
}
