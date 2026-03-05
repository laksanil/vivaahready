import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awardDailyLoginPoints, getEngagementSummary } from '@/lib/engagementPoints'

export const dynamic = 'force-dynamic'

/**
 * GET /api/engagement - Returns engagement points summary
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Idempotent: awards daily-login points at most once per configured PST day.
  await awardDailyLoginPoints(session.user.id).catch((error) => {
    console.error('Failed to award daily login points:', error)
  })

  const summary = await getEngagementSummary(session.user.id)
  if (!summary) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(summary)
}

/**
 * POST /api/engagement - Manual redemption is disabled (boosts are automatic)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (body.action === 'redeem_boost') {
    const summary = await getEngagementSummary(session.user.id)
    return NextResponse.json(
      { error: 'Boost activates automatically when you reach 100 points.', ...summary },
      { status: 400 }
    )
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
