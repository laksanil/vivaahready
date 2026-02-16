import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, website } = body

    // Honeypot check - if filled, it's a bot
    if (website) {
      // Silently reject but return success to not alert bots
      console.log('Honeypot triggered - bot submission rejected')
      return NextResponse.json({ success: true })
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Send email to support (directly to Gmail since support@vivaahready.com forwards there anyway)
    const result = await sendEmail({
      to: 'usdesivivah@gmail.com',
      subject: `[Contact Form] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px; color: #374151;">Name:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                  <a href="mailto:${email}" style="color: #dc2626; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Subject:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${subject}</td>
              </tr>
            </table>

            <div style="margin-top: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
              <div style="background-color: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="color: #1f2937; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Reply directly to this email to respond to ${name}.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Reply directly to this email to respond to ${name}.
      `
    })

    if (!result.success) {
      console.error('Failed to send contact email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }

    // Send confirmation email to the user
    await sendEmail({
      to: email,
      subject: 'We received your message - VivaahReady',
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
              <h2 style="color: #1f2937; margin: 0 0 16px 0;">Thank you for reaching out, ${name.split(' ')[0]}!</h2>

              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                We've received your message and appreciate you taking the time to contact us.
                Our team will review your inquiry and get back to you within 24 hours.
              </p>

              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;"><strong>Your message:</strong></p>
                <p style="color: #1f2937; margin: 0; font-style: italic;">"${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"</p>
              </div>

              <p style="color: #4b5563; line-height: 1.6;">
                In the meantime, if you have any urgent questions, feel free to message us on
                <a href="https://wa.me/15103968605" style="color: #dc2626; text-decoration: none;">WhatsApp</a>.
              </p>

              <p style="color: #4b5563; margin-top: 24px;">
                Warm regards,<br>
                <strong>The VivaahReady Team</strong>
              </p>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} VivaahReady. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Thank you for reaching out, ${name.split(' ')[0]}!

We've received your message and appreciate you taking the time to contact us.
Our team will review your inquiry and get back to you within 24 hours.

Your message:
"${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"

In the meantime, if you have any urgent questions, feel free to message us on WhatsApp at https://wa.me/15103968605.

Warm regards,
The VivaahReady Team

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
