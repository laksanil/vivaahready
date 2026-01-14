import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

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
