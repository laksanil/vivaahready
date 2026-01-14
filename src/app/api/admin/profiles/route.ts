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
    const filter = searchParams.get('filter') // pending, verified, unverified, suspended

    const where: any = {}

    // Apply filter based on tab
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

    if (search) {
      where.OR = [
        { odNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { currentLocation: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
      ]
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
            select: { id: true, name: true, email: true, phone: true, lastLogin: true }
          }
        }
      }),
      prisma.profile.count({ where })
    ])

    // Get interest stats for each profile
    const profilesWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const [interestsReceived, interestsSent] = await Promise.all([
          // Interests received by this profile's user
          prisma.match.groupBy({
            by: ['status'],
            where: { receiverId: profile.user.id },
            _count: { status: true }
          }),
          // Interests sent by this profile's user
          prisma.match.groupBy({
            by: ['status'],
            where: { senderId: profile.user.id },
            _count: { status: true }
          })
        ])

        // Transform to counts
        const receivedStats = {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
        }
        interestsReceived.forEach((item) => {
          receivedStats[item.status as keyof typeof receivedStats] = item._count.status
          receivedStats.total += item._count.status
        })

        const sentStats = {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
        }
        interestsSent.forEach((item) => {
          sentStats[item.status as keyof typeof sentStats] = item._count.status
          sentStats.total += item._count.status
        })

        return {
          ...profile,
          interestStats: {
            received: receivedStats,
            sent: sentStats,
          }
        }
      })
    )

    return NextResponse.json({
      profiles: profilesWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Admin profiles error:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}
