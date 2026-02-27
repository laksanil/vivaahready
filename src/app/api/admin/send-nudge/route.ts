import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { sendCompleteProfileNudgeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for bulk sending

export async function POST() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find profiles without photos
    const profilesWithoutPhotos = await prisma.profile.findMany({
      where: {
        AND: [
          { OR: [{ photoUrls: null }, { photoUrls: '' }] },
          { OR: [{ profileImageUrl: null }, { profileImageUrl: '' }] },
        ],
      },
      select: {
        id: true,
        firstName: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    const results = {
      total: profilesWithoutPhotos.length,
      sent: 0,
      failed: 0,
      recipients: [] as { email: string; name: string }[],
      errors: [] as { email: string; error: string }[],
    }

    for (const profile of profilesWithoutPhotos) {
      const email = profile.user.email
      const firstName = profile.firstName || profile.user.name?.split(' ')[0] || ''

      try {
        const result = await sendCompleteProfileNudgeEmail(email, firstName)
        if (result.success) {
          results.sent++
          results.recipients.push({ email, name: firstName })
        } else {
          results.failed++
          results.errors.push({ email, error: String(result.error) })
        }
        // Small delay to avoid Resend rate limits (2 emails/sec on free tier)
        await new Promise((resolve) => setTimeout(resolve, 600))
      } catch (error) {
        results.failed++
        results.errors.push({ email, error: String(error) })
      }
    }

    console.log(`Nudge emails sent: ${results.sent}/${results.total} (${results.failed} failed)`)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk nudge email error:', error)
    return NextResponse.json({ error: 'Failed to send nudge emails' }, { status: 500 })
  }
}
