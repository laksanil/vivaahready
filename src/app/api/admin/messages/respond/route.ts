import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendSms } from '@/lib/sns'

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messageId, response, method } = await request.json()

    if (!messageId || !response || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the support message
    const message = await prisma.supportMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Send response based on method
    let sent = false

    if (method === 'email' && message.email) {
      await sendEmail({
        to: message.email,
        subject: 'Re: Your VivaahReady Inquiry',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #7c3aed; margin-bottom: 20px;">Response from VivaahReady Support</h2>

              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Your message:</p>
                <p style="color: #374151; margin: 0;">${message.message}</p>
              </div>

              <div style="border-left: 4px solid #7c3aed; padding-left: 15px; margin-bottom: 20px;">
                <p style="color: #374151; line-height: 1.6; margin: 0;">${response}</p>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                VivaahReady Team
              </p>
            </div>
          </body>
          </html>
        `,
        text: `Response from VivaahReady Support\n\nYour message:\n${message.message}\n\nOur response:\n${response}\n\nBest regards,\nVivaahReady Team`,
      })
      sent = true
    } else if (method === 'sms' && message.phone) {
      await sendSms({
        to: message.phone,
        body: `VivaahReady Support: ${response}`,
      })
      sent = true
    } else if (method === 'whatsapp' && message.phone) {
      // WhatsApp uses the same Twilio API with whatsapp: prefix
      const whatsappNumber = message.phone.startsWith('+')
        ? `whatsapp:${message.phone}`
        : `whatsapp:+1${message.phone.replace(/\D/g, '')}`

      await sendSms({
        to: whatsappNumber,
        body: `VivaahReady Support: ${response}`,
      })
      sent = true
    }

    if (!sent) {
      return NextResponse.json(
        { error: `Cannot send via ${method}. Missing contact information.` },
        { status: 400 }
      )
    }

    // Update the message record
    await prisma.supportMessage.update({
      where: { id: messageId },
      data: {
        status: 'replied',
        adminResponse: response,
        respondedAt: new Date(),
        respondedVia: method,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending response:', error)
    return NextResponse.json(
      { error: 'Failed to send response' },
      { status: 500 }
    )
  }
}
