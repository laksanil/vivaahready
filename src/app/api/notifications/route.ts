import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type NotificationRow = Awaited<ReturnType<typeof prisma.notification.findMany>>[number]

type NotificationLike = NotificationRow | {
  id: string
  userId: string
  type: string
  title: string
  body: string
  url: string | null
  data: string | null
  read: boolean
  readAt: Date | null
  createdAt: Date
}

function firstName(value?: string | null): string {
  const trimmed = String(value || '').trim()
  if (!trimmed) return 'Someone'
  return trimmed.split(/\s+/)[0]
}

function getSentTimestamp(notification: { data?: string | null; createdAt: Date | string }): number {
  const createdAtTime = new Date(notification.createdAt).getTime()
  if (!notification.data) return createdAtTime
  try {
    const parsed = JSON.parse(notification.data) as { __sentAt?: unknown }
    if (typeof parsed.__sentAt === 'string') {
      const sentAtTime = new Date(parsed.__sentAt).getTime()
      if (!Number.isNaN(sentAtTime)) return sentAtTime
    }
  } catch {
    // ignore malformed data payload
  }
  return createdAtTime
}

function notificationKey(notification: { type: string; title: string; data?: string | null; createdAt: Date | string }): string {
  return `${notification.type}|${notification.title}|${getSentTimestamp(notification)}`
}

function buildLegacyData(sentAt: Date, eventId: string, extra: Record<string, string> = {}): string {
  return JSON.stringify({
    ...extra,
    __deliveryModes: ['email'],
    __sentAt: sentAt.toISOString(),
    __legacyEventId: eventId,
  })
}

async function buildLegacyNotifications(userId: string): Promise<NotificationLike[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: {
        select: {
          id: true,
          firstName: true,
          isImported: true,
          approvalStatus: true,
          approvalDate: true,
        },
      },
    },
  })

  if (!user) return []

  const notifications: NotificationLike[] = []

  if (user.email && user.profile?.isImported !== true) {
    const sentAt = user.createdAt
    const eventId = `welcome:${user.id}`
    notifications.push({
      id: `legacy-${eventId}`,
      userId,
      type: 'welcome',
      title: 'Welcome to VivaahReady!',
      body: 'Complete your profile to start finding meaningful connections.',
      url: '/profile/create',
      data: buildLegacyData(sentAt, eventId, {
        name: user.name || 'there',
      }),
      read: true,
      readAt: sentAt,
      createdAt: sentAt,
    })
  }

  if (user.profile?.approvalStatus === 'approved' && user.profile.approvalDate) {
    const sentAt = user.profile.approvalDate
    const eventId = `profile_approved:${user.profile.id}`
    notifications.push({
      id: `legacy-${eventId}`,
      userId,
      type: 'profile_approved',
      title: 'Profile Approved!',
      body: 'Your profile is now live. Start exploring matches!',
      url: '/matches',
      data: buildLegacyData(sentAt, eventId, {
        name: user.name || 'there',
      }),
      read: true,
      readAt: sentAt,
      createdAt: sentAt,
    })
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: {
      id: true,
      status: true,
      senderId: true,
      receiverId: true,
      createdAt: true,
      updatedAt: true,
      sender: {
        select: {
          name: true,
          profile: { select: { firstName: true } },
        },
      },
      receiver: {
        select: {
          name: true,
          profile: { select: { firstName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  for (const match of matches) {
    const accepted = match.status === 'accepted'
    const immediateAcceptance = accepted && Math.abs(match.updatedAt.getTime() - match.createdAt.getTime()) < 2_000

    if (match.receiverId === userId && !immediateAcceptance) {
      const senderName = match.sender?.profile?.firstName || firstName(match.sender?.name)
      const sentAt = match.createdAt
      const eventId = `new_interest:${match.id}`
      notifications.push({
        id: `legacy-${eventId}`,
        userId,
        type: 'new_interest',
        title: 'New Interest Received!',
        body: `${senderName} is interested in your profile.`,
        url: '/matches?tab=received',
        data: buildLegacyData(sentAt, eventId, {
          senderName,
          recipientName: user.name || 'there',
        }),
        read: true,
        readAt: sentAt,
        createdAt: sentAt,
      })
    }

    if (accepted) {
      if (immediateAcceptance && match.receiverId === userId) {
        const matchName = match.sender?.profile?.firstName || firstName(match.sender?.name)
        const sentAt = match.createdAt
        const eventId = `interest_accepted_mutual:${match.id}`
        notifications.push({
          id: `legacy-${eventId}`,
          userId,
          type: 'interest_accepted',
          title: "It's a Match!",
          body: `${matchName} accepted your interest. Start chatting!`,
          url: '/messages',
          data: buildLegacyData(sentAt, eventId, {
            matchName,
            recipientName: user.name || 'there',
          }),
          read: true,
          readAt: sentAt,
          createdAt: sentAt,
        })
      } else if (!immediateAcceptance && match.senderId === userId) {
        const matchName = match.receiver?.profile?.firstName || firstName(match.receiver?.name)
        const sentAt = match.updatedAt
        const eventId = `interest_accepted:${match.id}`
        notifications.push({
          id: `legacy-${eventId}`,
          userId,
          type: 'interest_accepted',
          title: "It's a Match!",
          body: `${matchName} accepted your interest. Start chatting!`,
          url: '/messages',
          data: buildLegacyData(sentAt, eventId, {
            matchName,
            recipientName: user.name || 'there',
          }),
          read: true,
          readAt: sentAt,
          createdAt: sentAt,
        })
      }
    }
  }

  return notifications
}

/**
 * GET /api/notifications - List notifications for the current user
 * Query params: ?unreadOnly=true&limit=20&cursor=<id>&all=true
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const includeAll = searchParams.get('all') === 'true'
  const parsedLimit = parseInt(searchParams.get('limit') || '20', 10)
  const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 50)
  const cursor = searchParams.get('cursor')

  const where = {
    userId: session.user.id,
    ...(unreadOnly ? { read: false } : {}),
  }

  let notifications: NotificationLike[] = []
  let hasMore = false
  let nextCursor: string | null = null

  // Always fetch DB notifications
  const currentNotifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    ...(includeAll ? {} : { take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) }),
  })
  notifications = currentNotifications

  // Always merge legacy notifications (match events, welcome, approval)
  // so dashboard/bell see the full picture, not just DB rows
  if (!unreadOnly) {
    const legacyNotifications = await buildLegacyNotifications(session.user.id)
    const seen = new Set(currentNotifications.map(notificationKey))
    for (const legacy of legacyNotifications) {
      const key = notificationKey(legacy)
      if (seen.has(key)) continue
      seen.add(key)
      notifications.push(legacy)
    }
    notifications.sort((a, b) => {
      const timeDiff = getSentTimestamp(b) - getSentTimestamp(a)
      if (timeDiff !== 0) return timeDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  if (!includeAll) {
    hasMore = notifications.length > limit
    if (hasMore) notifications = notifications.slice(0, limit)
    nextCursor = hasMore ? notifications[notifications.length - 1]?.id : null
  }

  // Count actual unread from DB
  const dbUnreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })

  // Also count legacy notifications that don't have a matching DB entry yet
  // (these are synthesized from match/user data and would otherwise show as 0)
  const allDbNotifs = await prisma.notification.findMany({
    where: { userId: session.user.id },
    select: { type: true, title: true, data: true, createdAt: true },
  })
  const legacyNotifs = await buildLegacyNotifications(session.user.id)
  const seenKeys = new Set(allDbNotifs.map(n => notificationKey(n)))
  const unseenLegacyCount = legacyNotifs.filter(l => !seenKeys.has(notificationKey(l))).length

  const unreadCount = dbUnreadCount + unseenLegacyCount

  return NextResponse.json({
    notifications,
    unreadCount,
    hasMore,
    nextCursor,
  })
}
