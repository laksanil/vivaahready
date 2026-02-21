/**
 * One-time script to send email to Vijaya Nidugondi
 * Run: node scripts/send-email-vijaya.mjs
 */
import { Resend } from 'resend'
import { readFileSync } from 'fs'

// Load .env.local manually
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  // Remove surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  process.env[key] = val
}

const resend = new Resend(process.env.RESEND_API_KEY)

const DOMAIN_VERIFIED = process.env.RESEND_DOMAIN_VERIFIED === 'true'
const FROM_EMAIL = DOMAIN_VERIFIED
  ? 'VivaahReady <noreply@vivaahready.com>'
  : 'VivaahReady <onboarding@resend.dev>'

async function main() {
  console.log('Sending from:', FROM_EMAIL)
  console.log('Domain verified:', DOMAIN_VERIFIED)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ['vnidugondi@gmail.com'],
    replyTo: 'support@vivaahready.com',
    subject: 'Re: Your Inquiry - VivaahReady',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">VivaahReady</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Meaningful Connections</p>
    </div>

    <div style="padding: 32px;">
      <h2 style="color: #1f2937; margin: 0 0 16px 0;">Dear Vijaya,</h2>

      <p style="color: #4b5563; line-height: 1.8; margin-bottom: 16px;">
        Thank you for reaching out to us! Please feel free to go ahead and create a profile for your daughter. If you need any help along the way, don't hesitate to call me at <strong>(925) 577-7559</strong> &mdash; I'm happy to assist anytime.
      </p>

      <p style="color: #4b5563; line-height: 1.8; margin-bottom: 16px;">
        Looking forward to being part of your journey to find a meaningful connection for your daughter.
      </p>

      <p style="color: #4b5563; margin-top: 24px;">
        Warm regards,<br>
        <strong>The VivaahReady Team</strong><br>
        <span style="color: #9ca3af; font-size: 14px;">(925) 577-7559</span>
      </p>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        &copy; ${new Date().getFullYear()} VivaahReady. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Dear Vijaya,

Thank you for reaching out to us! Please feel free to go ahead and create a profile for your daughter. If you need any help along the way, don't hesitate to call me at (925) 577-7559 - I'm happy to assist anytime.

Looking forward to being part of your journey to find a meaningful connection for your daughter.

Warm regards,
The VivaahReady Team
(925) 577-7559`
  })

  if (error) {
    console.error('Failed to send email:', error)
    process.exit(1)
  }

  console.log('Email sent successfully!')
  console.log('Email ID:', data?.id)
}

main()
