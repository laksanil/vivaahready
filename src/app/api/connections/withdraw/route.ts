import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'
import { storeNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// POST - Withdraw from a connection (mutual match)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserId = targetUser.userId

    const body = await request.json()
    const { connectionUserId } = body

    if (!connectionUserId) {
      return NextResponse.json({ error: 'connectionUserId is required' }, { status: 400 })
    }

    // Find all match records between the two users (there can be 1 or 2)
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: connectionUserId },
          { senderId: connectionUserId, receiverId: currentUserId },
        ],
        status: 'accepted',
      },
    })

    if (matches.length === 0) {
      return NextResponse.json({ error: 'No active connection found' }, { status: 404 })
    }

    // Set all match records to 'withdrawn'
    await prisma.match.updateMany({
      where: {
        id: { in: matches.map(m => m.id) },
      },
      data: { status: 'withdrawn' },
    })

    // Get current user's name for the notification
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true, profile: { select: { firstName: true } } },
    })
    const withdrawnByName = currentUser?.profile?.firstName || currentUser?.name?.split(' ')[0] || 'Someone'

    // Send notification to the other user
    storeNotification('connection_withdrawn', connectionUserId, {
      withdrawnByName,
      withdrawnByUserId: currentUserId,
    }).catch(err => console.error('Failed to store connection withdrawn notification:', err))

    return NextResponse.json({
      message: 'Connection withdrawn successfully',
      withdrawnMatchIds: matches.map(m => m.id),
    })
  } catch (error) {
    console.error('Connection withdraw error:', error)
    return NextResponse.json({ error: 'Failed to withdraw connection' }, { status: 500 })
  }
}
