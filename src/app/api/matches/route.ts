import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'

    let matches

    if (type === 'received') {
      matches = await prisma.match.findMany({
        where: { receiverId: session.user.id },
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Transform data
      matches = matches.map((m) => ({
        id: m.id,
        status: m.status,
        createdAt: m.createdAt,
        profile: m.sender.profile
          ? {
              id: m.sender.profile.id,
              gender: m.sender.profile.gender,
              dateOfBirth: m.sender.profile.dateOfBirth,
              height: m.sender.profile.height,
              currentLocation: m.sender.profile.currentLocation,
              occupation: m.sender.profile.occupation,
              user: { name: m.sender.name },
            }
          : null,
      }))
    } else {
      matches = await prisma.match.findMany({
        where: { senderId: session.user.id },
        include: {
          receiver: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Transform data
      matches = matches.map((m) => ({
        id: m.id,
        status: m.status,
        createdAt: m.createdAt,
        profile: m.receiver.profile
          ? {
              id: m.receiver.profile.id,
              gender: m.receiver.profile.gender,
              dateOfBirth: m.receiver.profile.dateOfBirth,
              height: m.receiver.profile.height,
              currentLocation: m.receiver.profile.currentLocation,
              occupation: m.receiver.profile.occupation,
              user: { name: m.receiver.name },
            }
          : null,
      }))
    }

    // Filter out null profiles
    matches = matches.filter((m) => m.profile !== null)

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Matches fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch matches', matches: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, message } = await request.json()

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID required' }, { status: 400 })
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: session.user.id,
          receiverId,
        },
      },
    })

    if (existingMatch) {
      return NextResponse.json({ error: 'Interest already sent' }, { status: 400 })
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        senderId: session.user.id,
        receiverId,
        message,
        status: 'pending',
      },
    })

    return NextResponse.json({ message: 'Interest sent successfully', match }, { status: 201 })
  } catch (error) {
    console.error('Match creation error:', error)
    return NextResponse.json({ error: 'Failed to send interest' }, { status: 500 })
  }
}
