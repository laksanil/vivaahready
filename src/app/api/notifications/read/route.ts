import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)

    if (!targetUser?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const now = new Date()

    if (body.all) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId: targetUser.userId, read: false },
        data: { read: true, readAt: now },
      })
      return NextResponse.json({ success: true })
    }

    if (body.id) {
      // Mark single notification as read
      await prisma.notification.updateMany({
        where: { id: body.id, userId: targetUser.userId },
        data: { read: true, readAt: now },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing id or all parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
