import twilio from 'twilio'
import { isTestMode } from '@/lib/testMode'

// Initialize Twilio client only if credentials are available
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+19252022767'
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${twilioPhoneNumber}`

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null

interface SendSmsParams {
  to: string
  body: string
}

interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an SMS message using Twilio
 */
export async function sendSms({ to, body }: SendSmsParams): Promise<SendSmsResult> {
  if (isTestMode) {
    console.info('SMS skipped in test mode', { to, body: body.substring(0, 50) + '...' })
    return { success: true, messageId: 'test-sms' }
  }

  if (!twilioClient) {
    console.warn('SMS not sent: Twilio credentials not configured')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    // Use Messaging Service if available (required for A2P 10DLC), otherwise use phone number
    const messageOptions: {
      to: string
      body: string
      from?: string
      messagingServiceSid?: string
    } = {
      to,
      body,
    }

    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid
    } else {
      messageOptions.from = twilioPhoneNumber
    }

    const message = await twilioClient.messages.create(messageOptions)

    console.log('SMS sent successfully:', message.sid)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('SMS sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send OTP verification code via SMS
 */
export async function sendOtpSms(phoneNumber: string, otp: string): Promise<SendSmsResult> {
  const body = `Your VivaahReady verification code is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`
  return sendSms({ to: phoneNumber, body })
}

/**
 * Send welcome SMS to new users
 */
export async function sendWelcomeSms(phoneNumber: string, firstName: string): Promise<SendSmsResult> {
  const body = `Welcome to VivaahReady, ${firstName}! Your account has been created. Start exploring meaningful connections today at vivaahready.com. Reply STOP to opt out.`
  return sendSms({ to: phoneNumber, body })
}

/**
 * Send new match notification SMS
 */
export async function sendMatchNotificationSms(
  phoneNumber: string,
  firstName: string,
  matchName: string
): Promise<SendSmsResult> {
  const body = `Hi ${firstName}! Great news - you have a new match on VivaahReady! ${matchName} is interested in connecting with you. Log in to view their profile: vivaahready.com. Reply STOP to opt out.`
  return sendSms({ to: phoneNumber, body })
}

/**
 * Send match request accepted notification SMS
 */
export async function sendMatchAcceptedSms(
  phoneNumber: string,
  firstName: string,
  matchName: string
): Promise<SendSmsResult> {
  const body = `Congratulations ${firstName}! ${matchName} has accepted your match request on VivaahReady. You can now start a conversation! Log in: vivaahready.com. Reply STOP to opt out.`
  return sendSms({ to: phoneNumber, body })
}

/**
 * Send profile approved notification SMS
 */
export async function sendProfileApprovedSms(
  phoneNumber: string,
  firstName: string
): Promise<SendSmsResult> {
  const body = `Great news ${firstName}! Your VivaahReady profile has been approved and is now live. Start finding your perfect match: vivaahready.com. Reply STOP to opt out.`
  return sendSms({ to: phoneNumber, body })
}

/**
 * Send profile view notification SMS
 */
export async function sendProfileViewedSms(
  phoneNumber: string,
  firstName: string,
  viewerName: string
): Promise<SendSmsResult> {
  const body = `Hi ${firstName}! ${viewerName} viewed your profile on VivaahReady. Check them out: vivaahready.com. Reply STOP to opt out.`
  return sendSms({ to: phoneNumber, body })
}

/**
 * Format phone number to E.164 format for Twilio
 * Expects phone numbers in format: +1XXXXXXXXXX or similar
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters except the leading +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // If already in E.164 format, return as is
  if (cleaned.startsWith('+')) {
    return cleaned
  }

  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }

  // If it's an 11-digit number starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }

  // Otherwise, assume it needs a + prefix
  return `+${cleaned}`
}

// ============================================
// WhatsApp Messaging Functions
// ============================================

interface SendWhatsAppParams {
  to: string
  body: string
}

interface SendWhatsAppTemplateParams {
  to: string
  templateName: string
  templateVariables: string[]
  contentSid?: string
}

interface SendWhatsAppResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Format phone number for WhatsApp (adds whatsapp: prefix)
 */
export function formatWhatsAppNumber(phone: string): string {
  const e164 = formatPhoneNumber(phone)
  if (e164.startsWith('whatsapp:')) {
    return e164
  }
  return `whatsapp:${e164}`
}

/**
 * Send a WhatsApp message (free-form, only works within 24-hour session window)
 * Use this for replies to user-initiated conversations
 */
export async function sendWhatsApp({ to, body }: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  if (isTestMode) {
    console.info('WhatsApp skipped in test mode', { to, body: body.substring(0, 50) + '...' })
    return { success: true, messageId: 'test-whatsapp' }
  }

  if (!twilioClient) {
    console.warn('WhatsApp not sent: Twilio credentials not configured')
    return { success: false, error: 'WhatsApp service not configured' }
  }

  try {
    const message = await twilioClient.messages.create({
      from: twilioWhatsAppNumber,
      to: formatWhatsAppNumber(to),
      body,
    })

    console.log('WhatsApp message sent successfully:', message.sid)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('WhatsApp sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send a WhatsApp template message (for business-initiated conversations)
 * Templates must be pre-approved by Meta/WhatsApp
 *
 * @param to - Recipient phone number
 * @param contentSid - The Content SID from Twilio Content API (starts with HX...)
 * @param contentVariables - Variables to substitute in the template (as JSON object)
 */
export async function sendWhatsAppTemplate({
  to,
  contentSid,
  contentVariables,
}: {
  to: string
  contentSid: string
  contentVariables?: Record<string, string>
}): Promise<SendWhatsAppResult> {
  if (isTestMode) {
    console.info('WhatsApp template skipped in test mode', { to, contentSid })
    return { success: true, messageId: 'test-whatsapp-template' }
  }

  if (!twilioClient) {
    console.warn('WhatsApp not sent: Twilio credentials not configured')
    return { success: false, error: 'WhatsApp service not configured' }
  }

  try {
    const messageOptions: {
      from: string
      to: string
      contentSid: string
      contentVariables?: string
    } = {
      from: twilioWhatsAppNumber,
      to: formatWhatsAppNumber(to),
      contentSid,
    }

    if (contentVariables) {
      messageOptions.contentVariables = JSON.stringify(contentVariables)
    }

    const message = await twilioClient.messages.create(messageOptions)

    console.log('WhatsApp template sent successfully:', message.sid)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('WhatsApp template sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send WhatsApp welcome message to new subscriber
 * Note: Requires approved template in Twilio Content API
 */
export async function sendWhatsAppWelcome(
  phoneNumber: string,
  firstName: string,
  contentSid: string
): Promise<SendWhatsAppResult> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    contentSid,
    contentVariables: { '1': firstName },
  })
}

/**
 * Send WhatsApp match notification
 * Note: Requires approved template in Twilio Content API
 */
export async function sendWhatsAppMatchNotification(
  phoneNumber: string,
  firstName: string,
  matchName: string,
  contentSid: string
): Promise<SendWhatsAppResult> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    contentSid,
    contentVariables: { '1': firstName, '2': matchName },
  })
}

/**
 * Send WhatsApp event announcement to all subscribers
 * Note: Requires approved template in Twilio Content API
 */
export async function sendWhatsAppEventAnnouncement(
  phoneNumber: string,
  firstName: string,
  eventName: string,
  eventDate: string,
  eventLink: string,
  contentSid: string
): Promise<SendWhatsAppResult> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    contentSid,
    contentVariables: {
      '1': firstName,
      '2': eventName,
      '3': eventDate,
      '4': eventLink,
    },
  })
}

/**
 * Send bulk WhatsApp messages to multiple recipients
 * Useful for announcements to all subscribers
 */
export async function sendBulkWhatsApp(
  recipients: { phoneNumber: string; variables: Record<string, string> }[],
  contentSid: string
): Promise<{ total: number; successful: number; failed: number; errors: string[] }> {
  const results = {
    total: recipients.length,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const recipient of recipients) {
    const result = await sendWhatsAppTemplate({
      to: recipient.phoneNumber,
      contentSid,
      contentVariables: recipient.variables,
    })

    if (result.success) {
      results.successful++
    } else {
      results.failed++
      results.errors.push(`${recipient.phoneNumber}: ${result.error}`)
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}
