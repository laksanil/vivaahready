import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']
const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

// Helper to check admin authentication (either via cookie or NextAuth session)
async function isAdminAuthenticated(): Promise<boolean> {
  const adminSession = cookies().get('admin_session')
  if (adminSession?.value === ADMIN_TOKEN) {
    return true
  }
  const session = await getServerSession(authOptions)
  if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
    return true
  }
  return false
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalProfiles,
      brides,
      grooms,
      totalMatches,
      pendingMatches,
      pendingApproval,
      suspended,
      pendingReports,
      verified,
      unverified,
      recentProfiles,
      referralSourceProfiles
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { gender: 'female' } }),
      prisma.profile.count({ where: { gender: 'male' } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'pending' } }),
      prisma.profile.count({ where: { approvalStatus: 'pending' } }),
      prisma.profile.count({ where: { isSuspended: true } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.profile.count({ where: { isVerified: true } }),
      prisma.profile.count({ where: { isVerified: false } }),
      prisma.profile.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          odNumber: true,
          gender: true,
          currentLocation: true,
          approvalStatus: true,
          createdAt: true,
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.profile.groupBy({
        by: ['referralSource'],
        _count: { referralSource: true }
      })
    ])

    // Transform referral stats into a more usable format
    const referralStats: Record<string, number> = {}
    referralSourceProfiles.forEach((item: { referralSource: string | null, _count: { referralSource: number } }) => {
      const source = item.referralSource || 'unknown'
      referralStats[source] = item._count.referralSource
    })

    return NextResponse.json({
      totalProfiles,
      brides,
      grooms,
      totalMatches,
      pendingMatches,
      pendingApproval,
      suspended,
      pendingReports,
      verified,
      unverified,
      recentProfiles,
      referralStats
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
