import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseConversationData } from '@/lib/support-conversation'
import { generateBotResponse } from '@/lib/support-bot'

// GET - Fetch all support messages for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messages = await prisma.supportMessage.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        subject: true,
        message: true,
        context: true,
        status: true,
        adminResponse: true,
        respondedAt: true,
        respondedVia: true,
        chatHistory: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching support messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST - User replies to a support message thread
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, content } = await request.json()

    if (!messageId || !content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 })
    }

    // Verify the message belongs to this user
    const supportMessage = await prisma.supportMessage.findFirst({
      where: { id: messageId, userId: session.user.id },
    })

    if (!supportMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Parse existing conversation thread
    const conversationData = parseConversationData(supportMessage.chatHistory)

    // Append user's reply
    const userTimestamp = new Date().toISOString()
    conversationData.thread.push({
      role: 'user',
      content: content.trim(),
      timestamp: userTimestamp,
    })

    // Generate AI bot response
    const botReply = await generateBotResponse(content.trim(), conversationData.thread)
    conversationData.thread.push({
      role: 'bot',
      content: botReply,
      timestamp: new Date().toISOString(),
    })

    // Update the message: append to thread, set status to 'new' so admin sees new reply
    await prisma.supportMessage.update({
      where: { id: messageId },
      data: {
        chatHistory: JSON.stringify(conversationData),
        status: 'new',
      },
    })

    return NextResponse.json({
      success: true,
      botReply,
    })
  } catch (error) {
    console.error('Error sending support reply:', error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}
