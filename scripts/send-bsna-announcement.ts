import * as fs from 'fs'
import { Resend } from 'resend'

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let value = trimmed.slice(eqIdx + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  if (!process.env[key]) process.env[key] = value
}

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'VivaahReady <noreply@vivaahready.com>'
const SUBJECT = 'VivaahReady — A Matrimonial Platform Built for Our Community'

// Parse CSV (handles quoted fields with commas)
function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let fields: string[] = []

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else if ((char === '\n' || (char === '\r' && next === '\n')) && !inQuotes) {
      fields.push(current)
      rows.push(fields)
      fields = []
      current = ''
      if (char === '\r') i++
    } else if (char === '\r' && !inQuotes) {
      fields.push(current)
      rows.push(fields)
      fields = []
      current = ''
    } else {
      current += char
    }
  }
  if (current || fields.length > 0) {
    fields.push(current)
    rows.push(fields)
  }
  return rows
}

function buildEmailHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VivaahReady — Built for Our Community</title>
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
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px; text-align: center; line-height: 1.4;">
                A Matrimonial Platform Built for Our Community
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to <strong style="color: #1f2937;">VivaahReady</strong> — a premium, tech-forward, trust-first matrimonial platform for South Asian families in the U.S.
              </p>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong style="color: #1f2937;">Started by Brahmins</strong>, VivaahReady is built with a deep understanding of our community's values, traditions, and preferences.
              </p>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Unlike traditional matrimonial sites, VivaahReady eliminates outdated profiles and the guesswork of whether you meet the other person's preferences — you only see <strong>mutual matches</strong>.
              </p>

              <!-- How It Works -->
              <h3 style="margin: 28px 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">How VivaahReady Works</h3>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">1</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Create your profile (free)</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Set your preferences and deal-breakers for what matters most to you.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">2</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">View mutual matches only</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Your preferences match theirs, and theirs match yours. No wasted time.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">3</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">Express interest & connect</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Contact details are shared only after both sides express mutual interest.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Privacy & Trust -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 15px; font-weight: 600;">Privacy & Trust</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Names and photos are visible only to verified members. Every profile is reviewed before going live. No tracking, no ads.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Founding Members Offer -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border: 1px solid #6ee7b7;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #065f46; font-size: 18px; font-weight: 700;">Founding Members Offer</p>
                    <p style="margin: 0; color: #047857; font-size: 15px; line-height: 1.6;">
                      Get <strong>50% off</strong> verification as a founding member. Offer ends March 1, 2026.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://vivaahready.com" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                      Create Your Free Profile
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.6;">
                Questions? Reach us at <a href="mailto:support@vivaahready.com" style="color: #dc2626; text-decoration: none;">support@vivaahready.com</a>
                <br>WhatsApp: +1 (925) 577-7559
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                Warmly,<br><strong style="color: #6b7280;">Team VivaahReady</strong>
              </p>
              <p style="margin: 12px 0 0 0; color: #d1d5db; font-size: 11px;">
                <a href="https://vivaahready.com" style="color: #9ca3af; text-decoration: none;">vivaahready.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildPlainText(): string {
  return `Hello,

Welcome to VivaahReady — a premium, tech-forward, trust-first matrimonial platform for South Asian families in the U.S.

Started by Brahmins, VivaahReady is built with a deep understanding of our community's values, traditions, and preferences.

Unlike traditional matrimonial sites, VivaahReady eliminates outdated profiles and the guesswork of whether you meet the other person's preferences — you only see mutual matches.

How VivaahReady Works:

1. Create your profile (free) — Set your preferences and deal-breakers for what matters most to you.
2. View mutual matches only — Your preferences match theirs, and theirs match yours. No wasted time.
3. Express interest & connect — Contact details are shared only after both sides express mutual interest.

Privacy & Trust:
- Names and photos are visible only to verified members
- Every profile is reviewed before going live
- No tracking, no ads

Founding Members Offer (ends March 1, 2026):
Get 50% off verification as a founding member.

Create your free profile: https://vivaahready.com

Questions? support@vivaahready.com | WhatsApp: +1 (925) 577-7559

Warmly,
Team VivaahReady`
}

async function main() {
  const DRY_RUN = process.argv.includes('--dry-run')
  const SEND_ONE = process.argv.includes('--send-one')

  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY not found. Make sure .env.local is set up.')
    process.exit(1)
  }

  const csvContent = fs.readFileSync('bsna-leads.csv', 'utf-8')
  const rows = parseCSV(csvContent)

  // Column 26 = "Contact email address"
  const contactEmailIdx = 26
  const nameIdx = 3 // "What is your name (last name, first name)?"
  const candidateFirstIdx = 8
  const candidateLastIdx = 7

  interface Contact {
    name: string
    email: string
  }

  const contacts: Contact[] = []
  const seenEmails = new Set<string>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 27) continue

    const email = (row[contactEmailIdx] || '').trim().toLowerCase()
    if (!email || !email.includes('@')) continue

    // Deduplicate
    if (seenEmails.has(email)) continue
    seenEmails.add(email)

    const candidateFirst = (row[candidateFirstIdx] || '').trim()
    const candidateLast = (row[candidateLastIdx] || '').trim()
    const fillerName = (row[nameIdx] || '').trim()
    const name = candidateFirst
      ? `${candidateFirst} ${candidateLast}`.trim()
      : fillerName || 'Unknown'

    contacts.push({ name, email })
  }

  console.log(`Found ${contacts.length} unique contacts with email addresses`)
  console.log('')

  if (DRY_RUN) {
    console.log('=== DRY RUN — No emails will be sent ===')
    console.log('')
    contacts.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} — ${c.email}`)
    })
    console.log('')
    console.log('--- EMAIL PREVIEW (HTML saved to bsna-email-preview.html) ---')
    fs.writeFileSync('bsna-email-preview.html', buildEmailHTML())
    console.log('Subject:', SUBJECT)
    console.log('From:', FROM_EMAIL)
    console.log(`Total: ${contacts.length} emails would be sent`)
    return
  }

  if (SEND_ONE) {
    // Send to first contact only as a test
    const first = contacts[0]
    if (!first) {
      console.log('No contacts found')
      return
    }
    console.log(`Sending test email to: ${first.name} <${first.email}>`)
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: first.email,
        subject: SUBJECT,
        html: buildEmailHTML(),
        text: buildPlainText(),
      })
      console.log('Sent successfully:', result)
    } catch (error) {
      console.error('Failed:', error)
    }
    return
  }

  // Send to all contacts with rate limiting (2 per second to respect Resend limits)
  console.log(`Sending ${contacts.length} emails...`)
  console.log('')

  let sent = 0
  let failed = 0

  for (const contact of contacts) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: contact.email,
        subject: SUBJECT,
        html: buildEmailHTML(),
        text: buildPlainText(),
      })
      sent++
      console.log(`✓ ${sent}/${contacts.length} — ${contact.name} <${contact.email}>`)
    } catch (error) {
      failed++
      console.error(`✗ FAILED — ${contact.name} <${contact.email}>:`, error)
    }

    // Rate limit: wait 500ms between sends
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('')
  console.log('=== DONE ===')
  console.log(`Sent: ${sent}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${contacts.length}`)
}

main().catch(console.error)
