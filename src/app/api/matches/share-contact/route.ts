import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Share or unshare contact details with a connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const body = await request.json()
    const { connectionUserId, share = true } = body

    if (!connectionUserId) {
      return NextResponse.json({ error: 'Connection user ID is required' }, { status: 400 })
    }

    // Find the match where current user is either sender or receiver
    // and the other user is the connection
    const matchAsSender = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: currentUserId,
          receiverId: connectionUserId,
        },
      },
    })

    const matchAsReceiver = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: connectionUserId,
          receiverId: currentUserId,
        },
      },
    })

    // Update the appropriate match
    if (matchAsSender) {
      await prisma.match.update({
        where: { id: matchAsSender.id },
        data: { senderRevealedContact: share },
      })
    }

    if (matchAsReceiver) {
      await prisma.match.update({
        where: { id: matchAsReceiver.id },
        data: { receiverRevealedContact: share },
      })
    }

    if (!matchAsSender && !matchAsReceiver) {
      return NextResponse.json({ error: 'No connection found with this user' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: share ? 'Contact details shared successfully' : 'Contact details hidden',
      shared: share,
    })
  } catch (error) {
    console.error('Share contact error:', error)
    return NextResponse.json({ error: 'Failed to update contact sharing' }, { status: 500 })
  }
}

// GET - Check if contact is shared with a specific connection
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const { searchParams } = new URL(request.url)
    const connectionUserId = searchParams.get('connectionUserId')

    if (!connectionUserId) {
      return NextResponse.json({ error: 'Connection user ID is required' }, { status: 400 })
    }

    // Find matches in both directions
    const matchAsSender = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: currentUserId,
          receiverId: connectionUserId,
        },
      },
      select: { senderRevealedContact: true },
    })

    const matchAsReceiver = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: connectionUserId,
          receiverId: currentUserId,
        },
      },
      select: { receiverRevealedContact: true },
    })

    // Current user's sharing status
    const iShared = matchAsSender?.senderRevealedContact ?? matchAsReceiver?.receiverRevealedContact ?? false

    // Other user's sharing status
    const theyShared = matchAsReceiver?.senderRevealedContact ?? matchAsSender?.receiverRevealedContact ?? false

    return NextResponse.json({
      iSharedContact: iShared,
      theySharedContact: theyShared,
    })
  } catch (error) {
    console.error('Get contact sharing status error:', error)
    return NextResponse.json({ error: 'Failed to get contact sharing status' }, { status: 500 })
  }
}
