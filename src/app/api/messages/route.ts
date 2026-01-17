import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// GET - Get all conversations (grouped by user)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = targetUser.userId

    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImageUrl: true,
                photoUrls: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImageUrl: true,
                photoUrls: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Pre-calculate unread counts in single pass (O(n) instead of O(n²))
    const unreadByPartner = new Map<string, number>()
    for (const m of messages) {
      if (m.receiverId === userId && !m.read) {
        unreadByPartner.set(m.senderId, (unreadByPartner.get(m.senderId) ?? 0) + 1)
      }
    }

    // Group messages by conversation partner
    const conversationsMap = new Map<string, {
      partnerId: string
      partnerName: string
      partnerPhoto: string | null
      lastMessage: string
      lastMessageTime: Date
      unreadCount: number
      isLastMessageFromMe: boolean
    }>()

    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId
      const partner = message.senderId === userId ? message.receiver : message.sender

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partnerName: partner.name,
          partnerPhoto: partner.profile?.profileImageUrl || null,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: unreadByPartner.get(partnerId) ?? 0,
          isLastMessageFromMe: message.senderId === userId,
        })
      }
    }

    const conversations = Array.from(conversationsMap.values())

    // Get total unread count
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

    return NextResponse.json({
      conversations,
      totalUnread,
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const senderId = targetUser.userId

    const body = await request.json()
    const { receiverId, content } = body

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Check for mutual match - users must have accepted match to message
    const mutualMatch = await prisma.match.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    })

    if (!mutualMatch) {
      return NextResponse.json({
        error: 'You must have a mutual match to send messages'
      }, { status: 403 })
    }

    // Check sender's subscription for messaging privileges
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      include: {
        subscription: true,
        profile: { select: { approvalStatus: true } }
      }
    })

    // Require approved profile to send messages
    if (sender?.profile?.approvalStatus !== 'approved') {
      return NextResponse.json({
        error: 'Your profile must be approved to send messages'
      }, { status: 403 })
    }

    // Check subscription - free users cannot send messages (premium feature)
    // Note: Admins impersonating users bypass this check for testing
    if (!targetUser.isAdminView && sender?.subscription?.plan === 'free') {
      return NextResponse.json({
        error: 'Upgrade to premium to send messages',
        upgradeRequired: true
      }, { status: 403 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: senderId,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
