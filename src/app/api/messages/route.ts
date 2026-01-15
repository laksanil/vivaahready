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
        // Count unread messages from this partner
        const unreadCount = messages.filter(
          m => m.senderId === partnerId && m.receiverId === userId && !m.read
        ).length

        conversationsMap.set(partnerId, {
          partnerId,
          partnerName: partner.name,
          partnerPhoto: partner.profile?.profileImageUrl || null,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount,
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
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 })
    }
    const senderId = targetUser.userId

    const body = await request.json()
    const { receiverId, content } = body

    console.log('POST /api/messages - senderId:', senderId, 'receiverId:', receiverId, 'content length:', content?.length)

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    })

    if (!receiver) {
      return NextResponse.json({ error: `Receiver not found with ID: ${receiverId}` }, { status: 404 })
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
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json({
      error: `Failed to send message: ${error?.message || 'Unknown error'}`
    }, { status: 500 })
  }
}
