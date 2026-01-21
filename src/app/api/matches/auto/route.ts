import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'
import { getMatchResultsForUser } from '@/lib/matchService'

export const dynamic = 'force-dynamic'

// GET - Get auto-matched profiles for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId, isAdminView } = targetUser

    const matchResults = await getMatchResultsForUser(targetUserId, { debug: true })
    if (!matchResults) {
      return NextResponse.json({
        matches: [],
        message: 'Please complete your profile to see matches'
      })
    }

    // Get target user's name if admin view
    let targetUserName = session?.user?.name || 'User'
    if (isAdminView) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { name: true }
      })
      targetUserName = targetUser?.name || 'Unknown'
    }

    return NextResponse.json({
      ...matchResults,
      isAdminView,
      viewingUserId: isAdminView ? targetUserId : undefined,
      viewingUserName: isAdminView ? targetUserName : undefined,
      myProfile: {
        ...matchResults.myProfile,
        userName: targetUserName,
      },
    })
  } catch (error) {
    console.error('Auto-match error:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
