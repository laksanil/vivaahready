import { Resend } from 'resend'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Use Resend's default domain (no verification needed)
// You can change this to operations@vivaahready.com after verifying your domain in Resend
const FROM_EMAIL = 'VivaahReady <onboarding@resend.dev>'
const REPLY_TO = 'no-reply@vivaahready.com'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
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
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px;">Welcome, ${firstName}!</h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for joining VivaahReady. We're excited to help you find meaningful connections with privacy-first matchmaking.
              </p>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Here's what happens next:
              </p>

              <!-- Steps -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #fef2f2; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="color: #dc2626; font-weight: bold; font-size: 14px;">1</span>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Complete Your Profile</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Add your details, photos, and preferences</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #fef2f2; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="color: #dc2626; font-weight: bold; font-size: 14px;">2</span>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Profile Verification</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Our team will review your profile</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #fef2f2; border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="color: #dc2626; font-weight: bold; font-size: 14px;">3</span>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">View Mutual Matches</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">See compatible profiles with match scores</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://vivaahready.com/dashboard" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Complete Your Profile</a>
                  </td>
                </tr>
              </table>

              <!-- Privacy Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #1f2937;">Privacy First:</strong> Your contact details are only shared after mutual interest. Photos and names are visible only to verified, compatible matches.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
                Questions? Reply to this email or contact us at support@vivaahready.com
              </p>
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

  const text = `
Welcome to VivaahReady, ${firstName}!

Thank you for joining VivaahReady. We're excited to help you find meaningful connections with privacy-first matchmaking.

Here's what happens next:

1. Complete Your Profile - Add your details, photos, and preferences
2. Profile Verification - Our team will review your profile
3. View Mutual Matches - See compatible profiles with match scores

Complete your profile: https://vivaahready.com/dashboard

Privacy First: Your contact details are only shared after mutual interest. Photos and names are visible only to verified, compatible matches.

Questions? Reply to this email or contact us at support@vivaahready.com

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
`

  return sendEmail({
    to: email,
    subject: `Welcome to VivaahReady, ${firstName}!`,
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
