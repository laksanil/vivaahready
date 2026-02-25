import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEngagementSummary, redeemBoost } from '@/lib/engagementPoints'

export const dynamic = 'force-dynamic'

/**
 * GET /api/engagement - Returns engagement points summary
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary = await getEngagementSummary(session.user.id)
  if (!summary) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(summary)
}

/**
 * POST /api/engagement - Redeem a boost
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (body.action === 'redeem_boost') {
    const result = await redeemBoost(session.user.id)
    if (!result.success) {
      return NextResponse.json({ error: result.error, expiresAt: result.expiresAt }, { status: 400 })
    }

    const summary = await getEngagementSummary(session.user.id)
    return NextResponse.json({ success: true, expiresAt: result.expiresAt, ...summary })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
