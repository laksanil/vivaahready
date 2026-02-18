import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import type { MessageAttributeValue } from '@aws-sdk/client-sns'
import { isTestMode } from '@/lib/testMode'

// Initialize SNS client only if credentials are available
const region = process.env.AWS_REGION || 'us-east-1'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const snsClient =
  accessKeyId && secretAccessKey
    ? new SNSClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      })
    : null

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
 * Send an SMS message using Amazon SNS
 */
export async function sendSms({ to, body }: SendSmsParams): Promise<SendSmsResult> {
  if (isTestMode) {
    console.info('SMS skipped in test mode', { to, body: body.substring(0, 50) + '...' })
    return { success: true, messageId: 'test-sms' }
  }

  if (!snsClient) {
    console.warn('SMS not sent: AWS credentials not configured')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const messageAttributes: Record<string, MessageAttributeValue> = {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional',
      },
    }

    // Optional sender ID (shown as the "from" name on some carriers)
    const senderId = process.env.SNS_SMS_SENDER_ID
    if (senderId) {
      messageAttributes['AWS.SNS.SMS.SenderID'] = {
        DataType: 'String',
        StringValue: senderId,
      }
    }

    const command = new PublishCommand({
      PhoneNumber: formatPhoneNumber(to),
      Message: body,
      MessageAttributes: messageAttributes,
    })

    const result = await snsClient.send(command)
    console.log('SMS sent successfully via SNS:', result.MessageId)
    return { success: true, messageId: result.MessageId }
  } catch (error) {
    console.error('SNS SMS sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
export async function sendWelcomeSms(
  phoneNumber: string,
  firstName: string
): Promise<SendSmsResult> {
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
 * Format phone number to E.164 format for SNS
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
