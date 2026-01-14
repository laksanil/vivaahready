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

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      deletionRequests.map(async (req) => {
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
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
        return { ...req, user }
      })
    )

    return NextResponse.json({ requests: requestsWithUsers })
  } catch (error) {
    console.error('Get deletion requests error:', error)
    return NextResponse.json(
      { error: 'Failed to get deletion requests' },
      { status: 500 }
    )
  }
}
