import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// GET - List all users with filtering and pagination
export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    const userId = searchParams.get('userId') // For fetching single user

    // If fetching single user by ID
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true,
          _count: {
            select: {
              sentMatches: true,
              receivedMatches: true,
            }
          }
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({ users: [user], total: 1, totalPages: 1 })
    }

    // Build where clause based on filters
    const whereClause: any = {}

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { profile: { odNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Status filters
    switch (filter) {
      case 'with_profile':
        whereClause.profile = { isNot: null }
        break
      case 'no_profile':
        whereClause.profile = null
        break
      case 'approved':
        whereClause.profile = { approvalStatus: 'approved' }
        break
      case 'pending':
        whereClause.profile = { approvalStatus: 'pending' }
        break
      case 'suspended':
        whereClause.profile = { isSuspended: true }
        break
    }

    // Get total count
    const total = await prisma.user.count({ where: whereClause })

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: {
          select: {
            id: true,
            odNumber: true,
            gender: true,
            currentLocation: true,
            occupation: true,
            approvalStatus: true,
            isVerified: true,
            isSuspended: true,
            suspendedReason: true,
            photoUrls: true,
            profileImageUrl: true,
          }
        },
        subscription: {
          select: {
            plan: true,
            profilePaid: true,
          }
        },
        _count: {
          select: {
            sentMatches: true,
            receivedMatches: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
