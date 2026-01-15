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
      pendingDeletions,
      verified,
      unverified,
      recentProfiles,
      referralSourceProfiles,
      usersWithoutProfile
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { gender: 'female' } }),
      prisma.profile.count({ where: { gender: 'male' } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'pending' } }),
      prisma.profile.count({ where: { approvalStatus: 'pending' } }),
      prisma.profile.count({ where: { isSuspended: true } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.deletionRequest.count({ where: { status: { in: ['pending', 'approved'] } } }),
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
      }),
      prisma.user.count({ where: { profile: null } })
    ])

    // Mapping to unify similar referral sources
    const unifySource = (source: string | null): string => {
      if (!source) return 'unknown'
      const s = source.toLowerCase().trim()

      // WhatsApp variations
      if (s.includes('whatsapp') || s.includes('wa') || s === 'watsapp' || s === 'whatapp') {
        return 'whatsapp'
      }
      // Instagram variations
      if (s.includes('instagram') || s === 'insta' || s === 'ig') {
        return 'instagram'
      }
      // Facebook variations
      if (s.includes('facebook') || s === 'fb') {
        return 'facebook'
      }
      // Google variations
      if (s.includes('google') || s === 'search') {
        return 'google'
      }
      // YouTube variations
      if (s.includes('youtube') || s === 'yt') {
        return 'youtube'
      }
      // LinkedIn variations
      if (s.includes('linkedin')) {
        return 'linkedin'
      }
      // Friend/family word of mouth
      if (s === 'friend' || s === 'friends') {
        return 'friend'
      }
      if (s === 'family' || s === 'relative' || s === 'relatives') {
        return 'family'
      }
      // Temple/religious
      if (s.includes('temple') || s.includes('religious') || s.includes('mandir') || s.includes('church')) {
        return 'temple'
      }
      // Community events
      if (s.includes('community') || s.includes('event') || s.includes('meetup')) {
        return 'community_event'
      }
      // Organization
      if (s.includes('organization') || s.includes('org')) {
        return 'organization'
      }
      // Advertisement
      if (s.includes('adverti') || s.includes('ad ') || s === 'ad' || s === 'ads') {
        return 'advertisement'
      }
      return source // Return original if no match
    }

    // Transform and unify referral stats
    const referralStats: Record<string, number> = {}
    referralSourceProfiles.forEach((item: { referralSource: string | null, _count: { referralSource: number } }) => {
      const unifiedSource = unifySource(item.referralSource)
      referralStats[unifiedSource] = (referralStats[unifiedSource] || 0) + item._count.referralSource
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
      pendingDeletions,
      verified,
      unverified,
      usersWithoutProfile,
      recentProfiles,
      referralStats
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
