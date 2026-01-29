import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { sendAnnouncementEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for bulk sending

export async function POST() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active users who have a profile (existing profile holders)
    const users = await prisma.user.findMany({
      where: {
        profile: {
          isNot: null,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[],
    }

    // Send emails with a small delay between each to avoid rate limits
    for (const user of users) {
      try {
        const result = await sendAnnouncementEmail(user.email)
        if (result.success) {
          results.sent++
        } else {
          results.failed++
          results.errors.push({ email: user.email, error: String(result.error) })
        }
        // Small delay to avoid Resend rate limits (2 emails/sec on free tier)
        await new Promise((resolve) => setTimeout(resolve, 600))
      } catch (error) {
        results.failed++
        results.errors.push({ email: user.email, error: String(error) })
      }
    }

    console.log(`Announcement emails sent: ${results.sent}/${results.total} (${results.failed} failed)`)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk announcement email error:', error)
    return NextResponse.json({ error: 'Failed to send announcement emails' }, { status: 500 })
  }
}
