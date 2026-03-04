import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)

    if (!targetUser?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const all = searchParams.get('all') === 'true'
    const limit = all ? undefined : (limitParam ? parseInt(limitParam, 10) : 20)

    const notifications = await prisma.notification.findMany({
      where: { userId: targetUser.userId },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: targetUser.userId, read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
