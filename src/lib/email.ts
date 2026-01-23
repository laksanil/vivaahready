import { Resend } from 'resend'
import { isTestMode } from '@/lib/testMode'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Use vivaahready.com domain (requires domain verification in Resend)
// Falls back to Resend's test domain if not verified yet
const DOMAIN_VERIFIED = process.env.RESEND_DOMAIN_VERIFIED === 'true'
const FROM_EMAIL = DOMAIN_VERIFIED
  ? 'VivaahReady <noreply@vivaahready.com>'
  : 'VivaahReady <onboarding@resend.dev>'
const REPLY_TO = 'noreply@vivaahready.com'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (isTestMode) {
    console.info('Email skipped in test mode', { to, subject })
    return { success: true, id: 'test-email' }
  }
  // Skip if Resend is not configured
  if (!resend) {
    console.warn('Email not sent: RESEND_API_KEY not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

// Welcome email for new users
export async function sendWelcomeEmail(email: string, name: string) {
  const firstName = name.split(' ')[0]

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to VivaahReady</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
              <img src="https://vivaahready.com/logo-icon.png" alt="VivaahReady" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VivaahReady</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Meaningful Connections</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to VivaahReady, and thank you for submitting your profile.
              </p>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You've taken the first step toward finding a meaningful, serious connection. We're here to help make that journey private, intentional, and respectful.
              </p>

              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">What happens next:</h3>

              <!-- Steps -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 8px; vertical-align: top; padding-top: 8px;">
                          <span style="color: #dc2626; font-size: 16px;">•</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Your profile is received</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">We'll review it to ensure it meets our community standards. You'll receive a confirmation once it's approved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 8px; vertical-align: top; padding-top: 8px;">
                          <span style="color: #dc2626; font-size: 16px;">•</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Privacy by default</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Your photos, name, and contact details are never shown publicly. Only mutual matches—based on your preferences—can see your profile.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 8px; vertical-align: top; padding-top: 8px;">
                          <span style="color: #dc2626; font-size: 16px;">•</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Connect when you're ready</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">If both you and a match express interest, we'll facilitate a connection. A one-time $50 verification fee applies before sharing contact details—this ensures only serious, committed individuals proceed.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 8px; vertical-align: top; padding-top: 8px;">
                          <span style="color: #dc2626; font-size: 16px;">•</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">More intentional matchmaking</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">We focus on compatibility, not endless browsing. You'll receive curated matches—not a sea of profiles—so every suggestion counts.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Privacy Promise -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 15px; font-weight: 600;">Our privacy promise:</p>
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                      We do not share your photos or personal contact information unless you choose to proceed with a match. Your trust and safety are our top priorities.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 15px;">Warm regards,</p>
                    <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 15px; font-weight: 600;">VivaahReady Support</p>
                    <p style="margin: 0; color: #dc2626; font-size: 14px;">
                      <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `Hello,

Welcome to VivaahReady, and thank you for submitting your profile.

You've taken the first step toward finding a meaningful, serious connection. We're here to help make that journey private, intentional, and respectful.

What happens next:

• Your profile is received
  We'll review it to ensure it meets our community standards. You'll receive a confirmation once it's approved.

• Privacy by default
  Your photos, name, and contact details are never shown publicly. Only mutual matches—based on your preferences—can see your profile.

• Connect when you're ready
  If both you and a match express interest, we'll facilitate a connection. A one-time $50 verification fee applies before sharing contact details—this ensures only serious, committed individuals proceed.

• More intentional matchmaking
  We focus on compatibility, not endless browsing. You'll receive curated matches—not a sea of profiles—so every suggestion counts.

Our privacy promise:
We do not share your photos or personal contact information unless you choose to proceed with a match. Your trust and safety are our top priorities.

Warm regards,
VivaahReady Support
support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`

  return sendEmail({
    to: email,
    subject: `Welcome to VivaahReady!`,
    html,
    text,
  })
}

// Profile approved email
export async function sendProfileApprovedEmail(email: string, name: string) {
  const firstName = name.split(' ')[0]

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VivaahReady</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Meaningful Connections</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">Profile Approved</span>
              </div>

              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; text-align: center;">Great news, ${firstName}!</h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                Your profile has been reviewed and approved. You can now view your mutual matches and start connecting!
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://vivaahready.com/matches" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View My Matches</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Remember: Contact details are shared only after mutual interest.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  return sendEmail({
    to: email,
    subject: `Your VivaahReady profile is approved!`,
    html,
  })
}

// New interest received email
export async function sendNewInterestEmail(
  email: string,
  recipientName: string,
  senderFirstName: string,
  senderProfileId: string
) {
  const recipientFirstName = recipientName.split(' ')[0]

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You Have a New Interest!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #f43f5e 50%, #ec4899 100%); padding: 32px 40px; text-align: center;">
              <img src="https://vivaahready.com/logo-icon.png" alt="VivaahReady" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VivaahReady</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Meaningful Connections</p>
            </td>
          </tr>

          <!-- Exciting announcement banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #fef2f2 0%, #fff1f2 50%, #fef2f2 100%); padding: 20px 40px; text-align: center; border-bottom: 1px solid #fecaca;">
              <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: 600;">
                ✨ Exciting News! ✨
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; text-align: center; line-height: 1.4;">
                Hi ${recipientFirstName}, you've received a new interest!
              </h2>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7; text-align: center;">
                Great news! <strong style="color: #dc2626;">${senderFirstName}</strong> has expressed interest in your profile. This could be the beginning of something wonderful!
              </p>

              <!-- Highlight box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background: linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%); border-radius: 12px; border: 1px solid #fecaca;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Someone special is interested in you</p>
                    <p style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 700;">${senderFirstName}</p>
                    <p style="margin: 8px 0 0 0; color: #dc2626; font-size: 14px;">wants to connect with you 💫</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 15px; line-height: 1.6; text-align: center;">
                Take a moment to view their profile and see if you feel a connection too. If both of you express mutual interest, we'll help facilitate the next steps!
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://vivaahready.com/profile/${senderProfileId}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                      View ${senderFirstName}'s Profile
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Privacy note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #f3f4f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5; text-align: center;">
                      🔒 <strong>Privacy First:</strong> Contact details are only shared after both parties express mutual interest.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 15px;">Wishing you the best,</p>
                    <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 15px; font-weight: 600;">The VivaahReady Team</p>
                    <p style="margin: 0; color: #dc2626; font-size: 14px;">
                      <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `Hi ${recipientFirstName},

Exciting news! You've received a new interest on VivaahReady!

${senderFirstName} has expressed interest in your profile. This could be the beginning of something wonderful!

Take a moment to view their profile and see if you feel a connection too. If both of you express mutual interest, we'll help facilitate the next steps!

View ${senderFirstName}'s Profile: https://vivaahready.com/profile/${senderProfileId}

Privacy First: Contact details are only shared after both parties express mutual interest.

Wishing you the best,
The VivaahReady Team
support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`

  return sendEmail({
    to: email,
    subject: `💝 ${senderFirstName} is interested in you on VivaahReady!`,
    html,
    text,
  })
}

// Mutual match / Interest accepted email
export async function sendInterestAcceptedEmail(
  email: string,
  recipientName: string,
  matchFirstName: string,
  matchProfileId: string
) {
  const recipientFirstName = recipientName.split(' ')[0]

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>It's a Match!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Celebratory Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #f43f5e 50%, #ec4899 100%); padding: 40px; text-align: center;">
              <img src="https://vivaahready.com/logo-icon.png" alt="VivaahReady" style="height: 60px; width: auto; margin-bottom: 12px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">It's a Match!</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">Congratulations, ${recipientFirstName}!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px; text-align: center; line-height: 1.4;">
                ${matchFirstName} accepted your interest!
              </h2>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7; text-align: center;">
                Great news! <strong style="color: #dc2626;">${matchFirstName}</strong> has accepted your interest. You now have a mutual connection and can take the next steps to get to know each other better!
              </p>

              <!-- Celebration box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background: linear-gradient(135deg, #fef2f2 0%, #fdf2f8 50%, #fef2f2 100%); border-radius: 12px; border: 2px solid #fecaca;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px; font-weight: 600;">🌟 You're now connected with</p>
                    <p style="margin: 0; color: #1f2937; font-size: 28px; font-weight: 700;">${matchFirstName}</p>
                    <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">Your journey together begins now! 💫</p>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 28px 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">What's next?</h3>

              <!-- Steps -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #dc2626, #f43f5e); color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">1</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">View your connections</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Head to your Connections page to see ${matchFirstName}'s full profile and contact details.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #dc2626, #f43f5e); color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">2</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Reach out and connect</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">You can now see their phone number, email, and social profiles. Don't be shy—send a warm message to start the conversation!</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #dc2626, #f43f5e); color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">3</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Take it at your own pace</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Whether it's a phone call, video chat, or meeting in person, take the time to truly get to know each other.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 28px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://vivaahready.com/connections" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4); margin-right: 12px;">
                      View Connections
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 12px;">
                    <a href="https://vivaahready.com/profile/${matchProfileId}" style="display: inline-block; color: #dc2626; text-decoration: none; font-weight: 600; font-size: 14px;">
                      View ${matchFirstName}'s Profile →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tip box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>💡 Tip:</strong> First impressions matter! A thoughtful, personalized message that references something from their profile shows genuine interest and helps break the ice.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 15px;">Wishing you all the best,</p>
                    <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 15px; font-weight: 600;">The VivaahReady Team</p>
                    <p style="margin: 0; color: #dc2626; font-size: 14px;">
                      <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `Hi ${recipientFirstName},

🎉 It's a Match! Congratulations!

${matchFirstName} has accepted your interest. You now have a mutual connection and can take the next steps to get to know each other better!

What's next?

1. View your connections
   Head to your Connections page to see ${matchFirstName}'s full profile and contact details.

2. Reach out and connect
   You can now see their phone number, email, and social profiles. Don't be shy—send a warm message to start the conversation!

3. Take it at your own pace
   Whether it's a phone call, video chat, or meeting in person, take the time to truly get to know each other.

View Connections: https://vivaahready.com/connections
View ${matchFirstName}'s Profile: https://vivaahready.com/profile/${matchProfileId}

💡 Tip: First impressions matter! A thoughtful, personalized message that references something from their profile shows genuine interest and helps break the ice.

Wishing you all the best,
The VivaahReady Team
support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`

  return sendEmail({
    to: email,
    subject: `🎉 It's a Match! ${matchFirstName} accepted your interest on VivaahReady`,
    html,
    text,
  })
}

// New match notification email
export async function sendNewMatchEmail(email: string, name: string, matchCount: number) {
  const firstName = name.split(' ')[0]

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VivaahReady</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px;">You have ${matchCount} new ${matchCount === 1 ? 'match' : 'matches'}!</h2>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${firstName}, someone compatible is waiting to connect with you on VivaahReady.
              </p>

              <a href="https://vivaahready.com/matches" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Matches</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  return sendEmail({
    to: email,
    subject: `You have ${matchCount} new ${matchCount === 1 ? 'match' : 'matches'} on VivaahReady!`,
    html,
  })
}

// Profile deletion confirmation email
export async function sendProfileDeletedEmail(
  email: string,
  name: string,
  reason: string,
  otherReason?: string | null
) {
  const firstName = name.split(' ')[0]
  const isMarriageReason = reason === 'marriage_vivaahready' || reason === 'marriage_other'

  // Get human-readable reason label
  const reasonLabels: Record<string, string> = {
    'marriage_vivaahready': 'Marriage Fixed via VivaahReady',
    'marriage_other': 'Marriage Fixed via Other Sources',
    'no_longer_looking': 'No Longer Looking',
    'not_satisfied': 'Not Satisfied with Matches',
    'privacy_concerns': 'Privacy Concerns',
    'taking_break': 'Taking a Break',
    'other': otherReason || 'Other',
  }

  const reasonLabel = reasonLabels[reason] || reason

  // Different content for marriage vs other reasons
  const marriageContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fce7f3; color: #be185d; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">Congratulations!</span>
    </div>

    <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; text-align: center;">Wishing You a Lifetime of Happiness!</h2>

    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
      Dear ${firstName}, we are thrilled to hear about your wonderful news! Congratulations on finding your life partner${reason === 'marriage_vivaahready' ? ' through VivaahReady' : ''}.
    </p>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
      As requested, your profile has been successfully deleted from our platform. We are honored to have been part of your journey.
    </p>

    <!-- Marriage wishes box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 12px; border: 1px solid #fbcfe8;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0; color: #be185d; font-size: 18px; font-weight: 600;">May your journey together be filled with</p>
          <p style="margin: 8px 0 0 0; color: #9d174d; font-size: 16px;">love, laughter, and endless happiness!</p>
        </td>
      </tr>
    </table>
  `

  const regularContent = `
    <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; text-align: center;">Your Profile Has Been Deleted</h2>

    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
      Dear ${firstName}, as per your request, your profile has been successfully deleted from VivaahReady.
    </p>

    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
      We're sorry to see you go. If you ever decide to return to your search for a life partner, we'll be here to welcome you back.
    </p>

    <!-- Reason box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #f3f4f6; border-radius: 8px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <strong>Reason for leaving:</strong> ${reasonLabel}
          </p>
        </td>
      </tr>
    </table>
  `

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isMarriageReason ? 'Congratulations!' : 'Profile Deleted'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
              <img src="https://vivaahready.com/logo-icon.png" alt="VivaahReady" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VivaahReady</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Meaningful Connections</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${isMarriageReason ? marriageContent : regularContent}

              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                All your personal data has been removed from our systems.
              </p>

              <!-- Signature -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 15px;">${isMarriageReason ? 'With warm wishes,' : 'Best regards,'}</p>
                    <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 15px; font-weight: 600;">The VivaahReady Team</p>
                    <p style="margin: 0; color: #dc2626; font-size: 14px;">
                      <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = isMarriageReason
    ? `Dear ${firstName},

Congratulations on finding your life partner${reason === 'marriage_vivaahready' ? ' through VivaahReady' : ''}!

As requested, your profile has been successfully deleted from our platform. We are honored to have been part of your journey.

May your journey together be filled with love, laughter, and endless happiness!

All your personal data has been removed from our systems.

With warm wishes,
The VivaahReady Team
support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`
    : `Dear ${firstName},

As per your request, your profile has been successfully deleted from VivaahReady.

We're sorry to see you go. If you ever decide to return to your search for a life partner, we'll be here to welcome you back.

Reason for leaving: ${reasonLabel}

All your personal data has been removed from our systems.

Best regards,
The VivaahReady Team
support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`

  return sendEmail({
    to: email,
    subject: isMarriageReason
      ? `Congratulations from VivaahReady! Wishing you a lifetime of happiness`
      : `Your VivaahReady profile has been deleted`,
    html,
    text,
  })
}

// Email verification code
export async function sendEmailVerificationCode(email: string, code: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
              <img src="https://vivaahready.com/logo-icon.png" alt="VivaahReady" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VivaahReady</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Meaningful Connections</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; text-align: center;">Verify Your Email</h2>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                Enter this code to verify your email address and continue creating your profile.
              </p>

              <!-- Code Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td style="text-align: center;">
                    <div style="display: inline-block; background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 12px; padding: 20px 40px;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
                      <p style="margin: 0; color: #1f2937; font-size: 40px; font-weight: bold; letter-spacing: 12px;">${code}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                This code expires in 10 minutes.
              </p>

              <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                If you didn't request this code, you can safely ignore this email.
              </p>

              <!-- Signature -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 15px; font-weight: 600;">The VivaahReady Team</p>
                    <p style="margin: 0; color: #dc2626; font-size: 14px;">
                      <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `Your VivaahReady verification code is: ${code}

Enter this code to verify your email address and continue creating your profile.

This code expires in 10 minutes.

If you didn't request this code, you can safely ignore this email.

The VivaahReady Team
support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`

  return sendEmail({
    to: email,
    subject: `${code} is your VivaahReady verification code`,
    html,
    text,
  })
}

// Account suspended email
export async function sendAccountSuspendedEmail(
  email: string,
  name: string,
  reason: string
) {
  const firstName = name.split(' ')[0]

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspended</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
              <img src="https://vivaahready.com/logo-icon.png" alt="VivaahReady" style="height: 60px; width: auto; margin-bottom: 8px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VivaahReady</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Meaningful Connections</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #fef2f2; color: #dc2626; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">Account Suspended</span>
              </div>

              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; text-align: center;">Your Account Has Been Suspended</h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                Dear ${firstName}, your VivaahReady account has been temporarily suspended.
              </p>

              <!-- Reason box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>Reason:</strong> ${reason}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                If you believe this was done in error or would like to discuss this matter, please contact our support team.
              </p>

              <!-- Contact options -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Contact Us</p>

                    <!-- Email button -->
                    <a href="mailto:support@vivaahready.com" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px;">
                      Email Support
                    </a>

                    <!-- WhatsApp button -->
                    <a href="https://wa.me/19258193653" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px;">
                      WhatsApp Support
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Contact details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #f3f4f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Email:</strong> <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      <strong>WhatsApp:</strong> <a href="https://wa.me/19258193653" style="color: #25D366; text-decoration: none;">+1 (925) 819-3653</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 15px;">Regards,</p>
                    <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 15px; font-weight: 600;">The VivaahReady Team</p>
                    <p style="margin: 0; color: #dc2626; font-size: 14px;">
                      <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `Dear ${firstName},

Your VivaahReady account has been temporarily suspended.

Reason: ${reason}

If you believe this was done in error or would like to discuss this matter, please contact our support team.

Contact Us:
- Email: support@vivaahready.com
- WhatsApp: +1 (925) 819-3653

Regards,
The VivaahReady Team
support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`

  return sendEmail({
    to: email,
    subject: `Your VivaahReady account has been suspended`,
    html,
    text,
  })
}
