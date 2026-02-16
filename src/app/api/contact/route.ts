import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { sendEmail } from '@/lib/email'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { name, email, subject, message, website } = body
    const normalizedName = String(name || '').trim()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedSubject = String(subject || '').trim()
    const normalizedMessage = String(message || '').trim()

    // Honeypot check - if filled, it's a bot
    if (website) {
      // Silently reject but return success to not alert bots
      console.log('Honeypot triggered - bot submission rejected')
      return NextResponse.json({ success: true })
    }

    // Validate required fields
    if (!normalizedName || !normalizedEmail || !normalizedSubject || !normalizedMessage) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Store in support messages so it appears directly in Admin > Messages tab
    const supportMessage = await prisma.supportMessage.create({
      data: {
        userId: session?.user?.id || null,
        name: normalizedName,
        email: normalizedEmail,
        subject: normalizedSubject,
        message: normalizedMessage,
        context: 'contact_form',
        status: 'new',
      },
    })

    // Send confirmation email to the user
    const confirmationResult = await sendEmail({
      to: normalizedEmail,
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
              <h2 style="color: #1f2937; margin: 0 0 16px 0;">Thank you for reaching out, ${normalizedName.split(' ')[0]}!</h2>

              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                We've received your message and appreciate you taking the time to contact us.
                Our team will review your inquiry and get back to you within 24 hours.
              </p>

              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;"><strong>Your message:</strong></p>
                <p style="color: #1f2937; margin: 0; font-style: italic;">"${normalizedMessage.substring(0, 200)}${normalizedMessage.length > 200 ? '...' : ''}"</p>
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
Thank you for reaching out, ${normalizedName.split(' ')[0]}!

We've received your message and appreciate you taking the time to contact us.
Our team will review your inquiry and get back to you within 24 hours.

Your message:
"${normalizedMessage.substring(0, 200)}${normalizedMessage.length > 200 ? '...' : ''}"

In the meantime, if you have any urgent questions, feel free to message us on WhatsApp at https://wa.me/15103968605.

Warm regards,
The VivaahReady Team

© ${new Date().getFullYear()} VivaahReady. All rights reserved.
      `
    })

    if (!confirmationResult.success) {
      // The user message is already persisted for admin follow-up, so don't fail submission.
      console.error('Contact confirmation email failed:', confirmationResult.error)
    }

    return NextResponse.json({
      success: true,
      ticketId: supportMessage.id.substring(0, 8).toUpperCase(),
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
