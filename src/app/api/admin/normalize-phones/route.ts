import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { normalizePhoneE164 } from '@/lib/phone'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/normalize-phones
 * Normalizes all existing user phone numbers to E.164 format.
 * Admin-only. Returns a report of changes made.
 */
export async function POST() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all users with a phone number
    const users = await prisma.user.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    })

    let normalized = 0
    let skipped = 0
    let alreadyE164 = 0
    let invalid = 0
    const changes: { id: string; from: string; to: string }[] = []
    const invalidEntries: { id: string; phone: string }[] = []

    for (const user of users) {
      const raw = user.phone
      if (!raw || !raw.trim()) {
        skipped++
        continue
      }

      const e164 = normalizePhoneE164(raw)

      if (!e164) {
        invalid++
        invalidEntries.push({ id: user.id, phone: raw })
        continue
      }

      if (raw === e164) {
        alreadyE164++
        continue
      }

      // Update to normalized format
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: e164 },
      })

      normalized++
      changes.push({ id: user.id, from: raw, to: e164 })
    }

    return NextResponse.json({
      ok: true,
      totalUsersWithPhone: users.length,
      normalized,
      alreadyE164,
      skipped,
      invalid,
      changes,
      invalidEntries,
    })
  } catch (error) {
    console.error('Phone normalization error:', error)
    return NextResponse.json({ error: 'Failed to normalize phones' }, { status: 500 })
  }
}
