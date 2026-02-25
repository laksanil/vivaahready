import { readFileSync } from 'fs'
import { Resend } from 'resend'

// Load env
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
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

const receivers = [
  { name: 'Shashank', email: 'sunnygovind24@gmail.com' },
  { name: 'Adithya', email: 'apv737@gmail.com' },
  { name: 'Harish', email: 'vamsiraman13@gmail.com' },
  { name: 'Santosh', email: 'santosh.pingali12@gmail.com' },
  { name: 'Rakesh', email: 'nagaveena.raju@gmail.com' },
  { name: 'Krishna', email: 'avanukur@gmail.com' },
]

const senderName = 'Durga'

async function sendReminder(receiver) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [receiver.email],
    replyTo: 'support@vivaahready.com',
    subject: `Reminder: ${senderName} is waiting to hear from you on VivaahReady`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">VivaahReady</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Meaningful Connections</p>
    </div>

    <div style="padding: 32px;">
      <h2 style="color: #1f2937; margin: 0 0 16px 0;">Hi ${receiver.name},</h2>

      <p style="color: #4b5563; line-height: 1.8; margin-bottom: 16px;">
        <strong>${senderName}</strong> has expressed interest in your profile on VivaahReady and is waiting to hear from you!
      </p>

      <p style="color: #4b5563; line-height: 1.8; margin-bottom: 24px;">
        Log in to your account to view ${senderName}'s profile and respond to the interest. Don't miss this opportunity for a meaningful connection!
      </p>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://vivaahready.com/matches?tab=received" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          View Interest
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; text-align: center;">
        If you have any questions, contact us at <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a> or call <strong>(925) 577-7559</strong>.
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
    text: `Hi ${receiver.name},

${senderName} has expressed interest in your profile on VivaahReady and is waiting to hear from you!

Log in to your account to view ${senderName}'s profile and respond: https://vivaahready.com/matches?tab=received

If you have any questions, contact us at support@vivaahready.com or call (925) 577-7559.

Warm regards,
The VivaahReady Team`
  })

  if (error) {
    console.error(`  ✗ ${receiver.name} (${receiver.email}): FAILED -`, error.message || error)
  } else {
    console.log(`  ✓ ${receiver.name} (${receiver.email}): Sent (ID: ${data?.id})`)
  }
}

async function main() {
  console.log(`Sending reminder emails to ${receivers.length} receivers of Durga's interest...\n`)

  for (const receiver of receivers) {
    await sendReminder(receiver)
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 600))
  }

  console.log('\nDone!')
}

main()
