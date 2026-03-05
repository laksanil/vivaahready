import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'

const WELCOME_BACKFILL_WINDOW_MS = 24 * 60 * 60 * 1000

async function ensureRecentWelcomeNotification(userId: string): Promise<void> {
  const [existingWelcome, profile] = await Promise.all([
    prisma.notification.findFirst({
      where: { userId, type: 'welcome' },
      select: { id: true },
    }),
    prisma.profile.findUnique({
      where: { userId },
      select: { id: true, createdAt: true },
    }),
  ])

  if (existingWelcome || !profile) {
    return
  }

  if (Date.now() - profile.createdAt.getTime() > WELCOME_BACKFILL_WINDOW_MS) {
    return
  }

  const sentAt = profile.createdAt
  await prisma.notification.create({
    data: {
      userId,
      type: 'welcome',
      title: 'Welcome to VivaahReady!',
      body: 'Welcome to VivaahReady — and thank you for creating your account. Complete your profile and start viewing mutual-preference matches.',
      url: '/dashboard',
      data: JSON.stringify({
        profileId: profile.id,
        __deliveryModes: ['in_app'],
        __sentAt: sentAt.toISOString(),
      }),
    },
  })
}

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

    await ensureRecentWelcomeNotification(targetUser.userId).catch((error) => {
      console.error('Failed to ensure welcome notification:', error)
    })

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
