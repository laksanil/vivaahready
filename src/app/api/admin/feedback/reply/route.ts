import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feedbackId, subject, message } = await request.json()

    if (!feedbackId || !subject || !message) {
      return NextResponse.json({ error: 'feedbackId, subject, and message are required' }, { status: 400 })
    }

    // Get feedback with user relation to find email
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    if (!feedback.user.email) {
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 })
    }

    // Convert plain text message to HTML (preserve line breaks)
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="white-space: pre-line; color: #1f2937; font-size: 15px; line-height: 1.7;">
${message}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          This email is in response to your feedback on VivaahReady.
        </p>
      </div>
    `

    const result = await sendEmail({
      to: feedback.user.email,
      subject,
      html: htmlBody,
      text: message,
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sentTo: feedback.user.email,
      emailId: result.id,
    })
  } catch (error) {
    console.error('Feedback reply error:', error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}
