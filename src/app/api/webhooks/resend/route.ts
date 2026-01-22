import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Email to forward incoming support emails to
const FORWARD_TO_EMAIL = 'usdesivivah@gmail.com'

// Resend webhook for incoming emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Resend webhook received:', JSON.stringify(body, null, 2))

    // Resend sends different event types
    const { type, data } = body

    // Handle incoming email event
    if (type === 'email.received') {
      // Webhook only contains metadata, need to fetch full email via API
      const emailId = data.email_id
      const from = data.from
      const to = data.to
      const subject = data.subject

      console.log('Incoming email:', { emailId, from, to, subject })

      if (resend && emailId) {
        // Fetch the full email content from Resend API
        let emailContent = ''
        let emailText = ''

        try {
          // Use fetch to get the email content since Resend SDK might not have this method
          const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            },
          })

          if (response.ok) {
            const emailData = await response.json()
            emailContent = emailData.html || ''
            emailText = emailData.text || ''
            console.log('Fetched email content for:', emailId)
          } else {
            console.log('Could not fetch email content, status:', response.status)
          }
        } catch (fetchError) {
          console.error('Error fetching email content:', fetchError)
        }

        // Forward the email to your personal Gmail
        await resend.emails.send({
          from: 'VivaahReady Support <noreply@vivaahready.com>',
          to: [FORWARD_TO_EMAIL],
          subject: `[Support] ${subject || 'No Subject'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${from || 'Unknown'}</p>
                <p style="margin: 0 0 8px 0;"><strong>To:</strong> ${Array.isArray(to) ? to.join(', ') : to || 'Unknown'}</p>
                <p style="margin: 0;"><strong>Subject:</strong> ${subject || 'No Subject'}</p>
              </div>
              <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="margin: 0 0 16px 0; color: #1f2937;">Message:</h3>
                ${emailContent || `<pre style="white-space: pre-wrap;">${emailText || 'No content available - check Resend dashboard'}</pre>`}
              </div>
              <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
                This email was forwarded from support@vivaahready.com
              </p>
            </div>
          `,
          text: `
From: ${from || 'Unknown'}
To: ${Array.isArray(to) ? to.join(', ') : to || 'Unknown'}
Subject: ${subject || 'No Subject'}

Message:
${emailText || 'No content available - check Resend dashboard'}

---
This email was forwarded from support@vivaahready.com
          `,
          replyTo: typeof from === 'string' ? from : undefined,
        })

        console.log('Email forwarded to:', FORWARD_TO_EMAIL)
      }

      return NextResponse.json({ success: true, message: 'Email forwarded' })
    }

    // Handle other webhook events (delivery, bounce, etc.)
    if (type === 'email.delivered') {
      console.log('Email delivered:', data.email_id)
    } else if (type === 'email.bounced') {
      console.log('Email bounced:', data.email_id, data.bounce_type)
    } else if (type === 'email.complained') {
      console.log('Email complaint:', data.email_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Resend may send a GET request to verify the webhook endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'resend-webhook' })
}
