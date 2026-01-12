import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']
const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

// Helper to check admin authentication
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

// Stats returned from user API - same counts users see
interface UserStats {
  potentialMatches: number
  mutualMatches: number
  interestsSent: { total: number; pending: number; accepted: number; rejected: number }
  interestsReceived: { total: number; pending: number; accepted: number; rejected: number }
  declined: number
}

// Helper to get all stats by calling the same API users use
async function getStatsForUser(userId: string, baseUrl: string, cookieHeader: string): Promise<UserStats> {
  const defaultStats: UserStats = {
    potentialMatches: 0,
    mutualMatches: 0,
    interestsSent: { total: 0, pending: 0, accepted: 0, rejected: 0 },
    interestsReceived: { total: 0, pending: 0, accepted: 0, rejected: 0 },
    declined: 0,
  }

  try {
    const response = await fetch(`${baseUrl}/api/matches/auto?viewAsUser=${userId}`, {
      headers: {
        'Cookie': cookieHeader,
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch stats for user ${userId}: ${response.status}`)
      return defaultStats
    }

    const data = await response.json()
    // Return stats from user API - this is exactly what users see
    return data.stats || defaultStats
  } catch (error) {
    console.error(`Error fetching stats for user ${userId}:`, error)
    return defaultStats
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get base URL and cookies for internal API calls
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const cookieHeader = request.headers.get('cookie') || ''

    const { searchParams } = url
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const gender = searchParams.get('gender')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'lastLogin' // lastLogin, interestsReceived, interestsSent, createdAt
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const filter = searchParams.get('filter') // inactive, no_interests, no_matches

    // Build where clause
    const where: any = {}

    if (gender) {
      where.gender = gender
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { currentLocation: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get all profiles with user data
    const profiles = await prisma.profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            lastLogin: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get comprehensive stats for each profile by calling the same API users see
    const profilesWithStats = await Promise.all(
      profiles.map(async (profile) => {
        // Get all stats from the user API - ensures admin sees exact same counts as users
        const userStats = await getStatsForUser(profile.user.id, baseUrl, cookieHeader)

        // Get reports filed by this user (not part of user-facing stats)
        const reportsFiled = await prisma.report.count({
          where: { reporterId: profile.user.id }
        })

        // Get reports received by this user (not part of user-facing stats)
        const reportsReceived = await prisma.report.count({
          where: { reportedUserId: profile.user.id }
        })

        // Calculate days since signup and last login
        const now = new Date()
        const createdAt = new Date(profile.user.createdAt)
        const lastLogin = profile.user.lastLogin ? new Date(profile.user.lastLogin) : null

        const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        const daysSinceLastLogin = lastLogin
          ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          : null

        return {
          id: profile.id,
          odNumber: profile.odNumber,
          gender: profile.gender,
          currentLocation: profile.currentLocation,
          occupation: profile.occupation,
          qualification: profile.qualification,
          approvalStatus: profile.approvalStatus,
          isVerified: profile.isVerified,
          isSuspended: profile.isSuspended,
          createdAt: profile.createdAt,
          user: {
            id: profile.user.id,
            name: profile.user.name,
            email: profile.user.email,
            phone: profile.user.phone,
            lastLogin: profile.user.lastLogin,
            createdAt: profile.user.createdAt,
          },
          stats: {
            // All these come from user API - same counts users see
            interestsReceived: userStats.interestsReceived,
            interestsSent: userStats.interestsSent,
            mutualMatches: userStats.mutualMatches,
            potentialMatches: userStats.potentialMatches,
            declined: userStats.declined,
            // These are admin-only stats
            reportsFiled,
            reportsReceived,
            daysSinceSignup,
            daysSinceLastLogin,
          }
        }
      })
    )

    // Apply filter
    let filteredProfiles = profilesWithStats
    if (filter === 'inactive') {
      // Users who haven't logged in for 7+ days
      filteredProfiles = profilesWithStats.filter(p =>
        p.stats.daysSinceLastLogin === null || p.stats.daysSinceLastLogin >= 7
      )
    } else if (filter === 'no_interests') {
      // Users who haven't received any interests
      filteredProfiles = profilesWithStats.filter(p =>
        p.stats.interestsReceived.total === 0
      )
    } else if (filter === 'no_matches') {
      // Users with no mutual matches
      filteredProfiles = profilesWithStats.filter(p =>
        p.stats.mutualMatches === 0
      )
    } else if (filter === 'pending_response') {
      // Users with pending interests to respond to
      filteredProfiles = profilesWithStats.filter(p =>
        p.stats.interestsReceived.pending > 0
      )
    }

    // Sort
    filteredProfiles.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'lastLogin':
          aVal = a.user.lastLogin ? new Date(a.user.lastLogin).getTime() : 0
          bVal = b.user.lastLogin ? new Date(b.user.lastLogin).getTime() : 0
          break
        case 'interestsReceived':
          aVal = a.stats.interestsReceived.total
          bVal = b.stats.interestsReceived.total
          break
        case 'interestsSent':
          aVal = a.stats.interestsSent.total
          bVal = b.stats.interestsSent.total
          break
        case 'mutualMatches':
          aVal = a.stats.mutualMatches
          bVal = b.stats.mutualMatches
          break
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    // Paginate
    const total = filteredProfiles.length
    const paginatedProfiles = filteredProfiles.slice((page - 1) * limit, page * limit)

    // Calculate summary stats
    const summary = {
      totalProfiles: profilesWithStats.length,
      activeToday: profilesWithStats.filter(p => p.stats.daysSinceLastLogin === 0).length,
      activeThisWeek: profilesWithStats.filter(p => p.stats.daysSinceLastLogin !== null && p.stats.daysSinceLastLogin <= 7).length,
      inactive: profilesWithStats.filter(p => p.stats.daysSinceLastLogin === null || p.stats.daysSinceLastLogin > 7).length,
      neverLoggedIn: profilesWithStats.filter(p => p.stats.daysSinceLastLogin === null).length,
      noInterestsReceived: profilesWithStats.filter(p => p.stats.interestsReceived.total === 0).length,
      pendingResponses: profilesWithStats.filter(p => p.stats.interestsReceived.pending > 0).length,
      totalMutualMatches: profilesWithStats.reduce((sum, p) => sum + p.stats.mutualMatches, 0),
    }

    return NextResponse.json({
      profiles: paginatedProfiles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary,
    })
  } catch (error) {
    console.error('Admin matches error:', error)
    return NextResponse.json({ error: 'Failed to fetch match data' }, { status: 500 })
  }
}
