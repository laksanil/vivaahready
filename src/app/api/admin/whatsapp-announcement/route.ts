import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { sendBulkWhatsApp, sendWhatsAppTemplate } from '@/lib/twilio'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for bulk sending

// GET: Fetch WhatsApp subscribers count
export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count users who have opted in to WhatsApp and have a verified phone
    const subscriberCount = await prisma.user.count({
      where: {
        whatsappOptIn: true,
        phone: { not: null },
        phoneVerified: { not: null },
      },
    })

    // Get total users with phone for context
    const totalWithPhone = await prisma.user.count({
      where: {
        phone: { not: null },
        phoneVerified: { not: null },
      },
    })

    return NextResponse.json({
      whatsappSubscribers: subscriberCount,
      totalVerifiedPhones: totalWithPhone,
    })
  } catch (error) {
    console.error('Error fetching WhatsApp subscriber count:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriber count' }, { status: 500 })
  }
}

// POST: Send WhatsApp announcement to all subscribers
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contentSid, templateVariables } = body

    if (!contentSid) {
      return NextResponse.json(
        { error: 'Content SID is required for WhatsApp template messages' },
        { status: 400 }
      )
    }

    // Get all users who have opted in to WhatsApp
    const subscribers = await prisma.user.findMany({
      where: {
        whatsappOptIn: true,
        phone: { not: null },
        phoneVerified: { not: null },
        profile: {
          isNot: null,
          approvalStatus: 'approved',
        },
      },
      select: {
        id: true,
        phone: true,
        profile: {
          select: {
            firstName: true,
          },
        },
      },
    })

    if (subscribers.length === 0) {
      return NextResponse.json({
        total: 0,
        successful: 0,
        failed: 0,
        message: 'No WhatsApp subscribers found',
      })
    }

    // Prepare recipients with their variables
    const recipients = subscribers.map((user) => ({
      phoneNumber: user.phone!,
      variables: {
        '1': user.profile?.firstName || 'there',
        ...templateVariables,
      },
    }))

    // Send bulk WhatsApp messages
    const results = await sendBulkWhatsApp(recipients, contentSid)

    console.log(
      `WhatsApp announcement sent: ${results.successful}/${results.total} (${results.failed} failed)`
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk WhatsApp announcement error:', error)
    return NextResponse.json({ error: 'Failed to send WhatsApp announcements' }, { status: 500 })
  }
}
