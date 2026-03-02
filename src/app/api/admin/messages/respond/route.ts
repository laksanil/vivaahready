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
    const body = await request.json()
    const { messageId, response } = body
    // Support both legacy single `method` and new multi-method `methods` array
    const methods: string[] = Array.isArray(body.methods)
      ? body.methods
      : body.method
        ? [body.method]
        : []

    if (!messageId || !response || methods.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the support message
    const message = await prisma.supportMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Always store the response in the database first
    const respondedAt = new Date()
    const respondedVia = methods.join(', ')

    // Build conversation data from existing chat history
    let conversationData: { thread: Array<{ role: string; content: string; timestamp: string }> } = { thread: [] }
    if (message.chatHistory) {
      try {
        conversationData = JSON.parse(message.chatHistory)
      } catch {
        conversationData = { thread: [] }
      }
    }
    conversationData.thread.push({
      role: 'admin',
      content: response,
      timestamp: respondedAt.toISOString(),
    })

    await prisma.supportMessage.update({
      where: { id: messageId },
      data: {
        status: 'replied',
        adminResponse: response,
        respondedAt,
        respondedVia,
        chatHistory: JSON.stringify(conversationData),
      },
    })

    // Create an in-app notification for the message owner so it appears under Notifications.
    if (message.userId) {
      try {
        const truncatedResponse = response.trim().slice(0, 220)
        const body = truncatedResponse.length > 0
          ? truncatedResponse
          : 'Our support team responded to your message.'
        await prisma.notification.create({
          data: {
            userId: message.userId,
            type: 'support_admin_reply',
            title: 'Message from Admin',
            body,
            url: '/admin-messages',
            data: JSON.stringify({
              messageId,
              context: message.context || 'general',
              __deliveryModes: Array.from(new Set(['in_app', ...methods])),
              __sentAt: respondedAt.toISOString(),
            }),
          },
        })
      } catch (notificationError) {
        console.error('Failed to create support admin reply notification:', notificationError)
      }
    }

    // Attempt to deliver via each selected method (best-effort)
    const delivered: string[] = []
    const warnings: string[] = []

    for (const method of methods) {
      try {
        if (method === 'in_app') {
          // In-app only — response is already stored above
          delivered.push('in_app')
        } else if (method === 'email' && message.email) {
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
          delivered.push('email')
        } else if ((method === 'sms' || method === 'whatsapp') && message.phone) {
          await sendSms({
            to: message.phone,
            body: `VivaahReady Support: ${response}`,
          })
          delivered.push(method)
        } else if (method !== 'in_app') {
          warnings.push(`No ${method} contact info available for this user`)
        }
      } catch (sendError) {
        console.error(`Failed to deliver response via ${method}:`, sendError)
        warnings.push(`Delivery via ${method} failed, but response was saved`)
      }
    }

    return NextResponse.json({
      success: true,
      delivered,
      methods,
      ...(warnings.length > 0 ? { warnings } : {}),
    })
  } catch (error) {
    console.error('Error sending response:', error)
    return NextResponse.json(
      { error: 'Failed to send response' },
      { status: 500 }
    )
  }
}
