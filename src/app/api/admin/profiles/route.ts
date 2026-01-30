import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const gender = searchParams.get('gender')
    const search = searchParams.get('search')
    const filter = searchParams.get('filter') // pending, verified, unverified, suspended, no_photos, no_profile, deletions
    const userId = searchParams.get('userId')

    // no_profile filter is removed - users without profiles shouldn't exist
    if (filter === 'no_profile') {
      return NextResponse.json({
        profiles: [],
        total: 0,
        page,
        totalPages: 0,
        tabCounts: null,
      })
    }

    // Special case: deletions filter - return profiles with pending deletion requests
    if (filter === 'deletions') {
      const deletionRequests = await prisma.deletionRequest.findMany({
        where: {
          status: { in: ['pending', 'approved'] },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      const totalDeletions = await prisma.deletionRequest.count({
        where: { status: { in: ['pending', 'approved'] } },
      })

      // Fetch user data for each deletion request
      const userIds = deletionRequests.map(req => req.userId)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: { profile: true },
      })
      const userMap = new Map(users.map(u => [u.id, u]))

      // Transform deletion requests to profile-like structure
      const profilesFromDeletions = deletionRequests.map((req) => {
        const user = userMap.get(req.userId)
        return {
          id: user?.profile?.id || null,
          odNumber: user?.profile?.odNumber || null,
          gender: user?.profile?.gender || null,
          dateOfBirth: null,
          height: null,
          currentLocation: user?.profile?.currentLocation || null,
          occupation: null,
          qualification: null,
          caste: null,
          isVerified: user?.profile?.isVerified || false,
          isSuspended: user?.profile?.isSuspended || false,
          suspendedReason: null,
          approvalStatus: user?.profile?.approvalStatus || 'no_profile',
          createdAt: user?.profile?.createdAt || req.createdAt,
          updatedAt: null,
          photoUrls: null,
          profileImageUrl: null,
          drivePhotosLink: null,
          user: {
            id: user?.id || req.userId,
            name: user?.name || 'Unknown',
            email: user?.email || '',
            phone: user?.phone || null,
            lastLogin: user?.lastLogin || null,
          },
          hasProfile: !!user?.profile,
          interestStats: null,
          deletionRequest: {
            id: req.id,
            reason: req.reason,
            otherReason: req.otherReason,
            status: req.status,
            adminNotes: req.adminNotes,
            createdAt: req.createdAt,
            processedAt: req.processedAt,
          },
        }
      })

      // Get counts for all tabs (only on first page)
      let tabCounts = null
      if (page === 1) {
        const [
          allCount,
          pendingCount,
          approvedCount,
          suspendedCount,
          noPhotosCount,
          bridesCount,
          groomsCount,
        ] = await Promise.all([
          prisma.profile.count(),
          prisma.profile.count({ where: { approvalStatus: 'pending' } }),
          prisma.profile.count({ where: { approvalStatus: 'approved', isSuspended: false } }),
          prisma.profile.count({ where: { isSuspended: true } }),
          prisma.profile.count({
            where: {
              AND: [
                { OR: [{ photoUrls: null }, { photoUrls: '' }] },
                { OR: [{ profileImageUrl: null }, { profileImageUrl: '' }] },
                { OR: [{ drivePhotosLink: null }, { drivePhotosLink: '' }] },
              ],
            },
          }),
          prisma.profile.count({ where: { gender: 'female' } }),
          prisma.profile.count({ where: { gender: 'male' } }),
        ])

        tabCounts = {
          all: allCount,
          pending: pendingCount,
          approved: approvedCount,
          suspended: suspendedCount,
          no_photos: noPhotosCount,
          deletions: totalDeletions,
          brides: bridesCount,
          grooms: groomsCount,
        }
      }

      return NextResponse.json({
        profiles: profilesFromDeletions,
        total: totalDeletions,
        page,
        totalPages: Math.ceil(totalDeletions / limit),
        tabCounts,
      })
    }

    // Standard profile filters
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    // Check if search is a VR ID (skip filters to search across all profiles)
    const isVrIdSearch = search && search.toUpperCase().startsWith('VR')

    // Apply filter based on tab (skip if searching for VR ID)
    if (!isVrIdSearch) {
      if (filter === 'pending') {
        where.approvalStatus = 'pending'
      } else if (filter === 'approved') {
        where.approvalStatus = 'approved'
        where.isSuspended = false
      } else if (filter === 'verified') {
        where.isVerified = true
      } else if (filter === 'unverified') {
        where.isVerified = false
      } else if (filter === 'suspended') {
        where.isSuspended = true
      } else if (filter === 'no_photos') {
        // Profiles with no photos at all
        where.AND = [
          { OR: [{ photoUrls: null }, { photoUrls: '' }] },
          { OR: [{ profileImageUrl: null }, { profileImageUrl: '' }] },
          { OR: [{ drivePhotosLink: null }, { drivePhotosLink: '' }] },
        ]
      }

      if (gender) {
        where.gender = gender
      }
    }

    if (search) {
      // Strip non-digit chars for phone search (e.g. "+91 963-269-8613" → "919632698613")
      const phoneDigits = search.replace(/[^0-9]/g, '')
      const searchConditions: any[] = [
        { odNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { currentLocation: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
      ]
      // Add phone search if input looks like it could be a phone number (has digits)
      if (phoneDigits.length >= 4) {
        searchConditions.push(
          { user: { phone: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: phoneDigits, mode: 'insensitive' } } },
        )
      }
      where.OR = searchConditions
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          odNumber: true,
          gender: true,
          dateOfBirth: true,
          height: true,
          currentLocation: true,
          occupation: true,
          qualification: true,
          caste: true,
          isVerified: true,
          isSuspended: true,
          suspendedReason: true,
          approvalStatus: true,
          createdAt: true,
          updatedAt: true,
          photoUrls: true,
          profileImageUrl: true,
          drivePhotosLink: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              lastLogin: true,
              subscription: {
                select: {
                  profilePaid: true,
                }
              }
            }
          }
        }
      }),
      prisma.profile.count({ where })
    ])

    // Get all user IDs to batch fetch interest stats
    const userIds = profiles.map(p => p.user.id)

    // Single batched query for received interests
    const receivedInterests = await prisma.match.groupBy({
      by: ['receiverId', 'status'],
      where: { receiverId: { in: userIds } },
      _count: { status: true }
    })

    // Single batched query for sent interests
    const sentInterests = await prisma.match.groupBy({
      by: ['senderId', 'status'],
      where: { senderId: { in: userIds } },
      _count: { status: true }
    })

    // Build maps for quick lookup
    const receivedMap = new Map<string, { total: number; pending: number; accepted: number; rejected: number }>()
    const sentMap = new Map<string, { total: number; pending: number; accepted: number; rejected: number }>()

    // Initialize maps for all users
    userIds.forEach(id => {
      receivedMap.set(id, { total: 0, pending: 0, accepted: 0, rejected: 0 })
      sentMap.set(id, { total: 0, pending: 0, accepted: 0, rejected: 0 })
    })

    // Populate received stats
    receivedInterests.forEach((item) => {
      const stats = receivedMap.get(item.receiverId)
      if (stats) {
        stats[item.status as keyof typeof stats] = item._count.status
        stats.total += item._count.status
      }
    })

    // Populate sent stats
    sentInterests.forEach((item) => {
      const stats = sentMap.get(item.senderId)
      if (stats) {
        stats[item.status as keyof typeof stats] = item._count.status
        stats.total += item._count.status
      }
    })

    // Map profiles with stats
    const profilesWithStats = profiles.map(profile => ({
      ...profile,
      hasProfile: true,
      deletionRequest: null,
      interestStats: {
        received: receivedMap.get(profile.user.id) || { total: 0, pending: 0, accepted: 0, rejected: 0 },
        sent: sentMap.get(profile.user.id) || { total: 0, pending: 0, accepted: 0, rejected: 0 },
      }
    }))

    // Get counts for all tabs (only on first page to avoid repeated queries)
    let tabCounts = null
    if (page === 1) {
      const [
        allCount,
        pendingCount,
        approvedCount,
        suspendedCount,
        noPhotosCount,
        deletionsCount,
        bridesCount,
        groomsCount,
      ] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({ where: { approvalStatus: 'pending' } }),
        prisma.profile.count({ where: { approvalStatus: 'approved', isSuspended: false } }),
        prisma.profile.count({ where: { isSuspended: true } }),
        prisma.profile.count({
          where: {
            AND: [
              { OR: [{ photoUrls: null }, { photoUrls: '' }] },
              { OR: [{ profileImageUrl: null }, { profileImageUrl: '' }] },
              { OR: [{ drivePhotosLink: null }, { drivePhotosLink: '' }] },
            ],
          },
        }),
        prisma.deletionRequest.count({ where: { status: { in: ['pending', 'approved'] } } }),
        prisma.profile.count({ where: { gender: 'female' } }),
        prisma.profile.count({ where: { gender: 'male' } }),
      ])

      tabCounts = {
        all: allCount,
        pending: pendingCount,
        approved: approvedCount,
        suspended: suspendedCount,
        no_photos: noPhotosCount,
        deletions: deletionsCount,
        brides: bridesCount,
        grooms: groomsCount,
      }
    }

    return NextResponse.json({
      profiles: profilesWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      tabCounts,
    })
  } catch (error) {
    console.error('Admin profiles error:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}
