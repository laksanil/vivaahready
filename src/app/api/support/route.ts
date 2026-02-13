import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    const { name, email, phone, subject, message, context, chatHistory } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Create support message
    const supportMessage = await prisma.supportMessage.create({
      data: {
        userId: session?.user?.id || null,
        name: name || session?.user?.name || null,
        email: email || session?.user?.email || null,
        phone: phone || null,
        subject: subject || null,
        message,
        context: context || 'general',
        chatHistory: chatHistory ? JSON.stringify(chatHistory) : null,
        status: 'new',
      },
    })

    return NextResponse.json({
      success: true,
      ticketId: supportMessage.id.substring(0, 8).toUpperCase(),
      message: 'Your message has been received. Our team will get back to you soon!',
    })
  } catch (error) {
    console.error('Support message error:', error)
    return NextResponse.json(
      { error: 'Failed to submit message. Please try again.' },
      { status: 500 }
    )
  }
}

// Get support messages for admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    const where = status === 'all' ? {} : { status }

    const messages = await prisma.supportMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching support messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
