import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

// Get all deletion requests
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const where = status && status !== 'all' ? { status } : {}

    const deletionRequests = await prisma.deletionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Get all user IDs from deletion requests
    const userIds = deletionRequests.map(req => req.userId)

    // Single batched query for all users
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profile: {
          select: {
            id: true,
            odNumber: true,
            gender: true,
            currentLocation: true,
          },
        },
      },
    })

    // Build map for quick lookup
    const userMap = new Map(users.map(u => [u.id, u]))

    // Map requests with users
    const requestsWithUsers = deletionRequests.map(req => ({
      ...req,
      user: userMap.get(req.userId) || null
    }))

    return NextResponse.json({ requests: requestsWithUsers })
  } catch (error) {
    console.error('Get deletion requests error:', error)
    return NextResponse.json(
      { error: 'Failed to get deletion requests' },
      { status: 500 }
    )
  }
}
