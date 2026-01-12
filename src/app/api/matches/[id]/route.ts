import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update match status (accept/reject)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['accepted', 'rejected', 'reconsider'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Handle reconsider - change rejected to accepted
    const finalStatus = status === 'reconsider' ? 'accepted' : status

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profile: {
              select: {
                linkedinProfile: true,
                facebookInstagram: true,
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify the current user is the receiver
    if (match.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // For reconsider, verify the match is currently rejected
    if (status === 'reconsider' && match.status !== 'rejected') {
      return NextResponse.json({ error: 'Can only reconsider rejected interests' }, { status: 400 })
    }

    // Update the match status
    const updatedMatch = await prisma.match.update({
      where: { id },
      data: { status: finalStatus },
    })

    // If accepted (or reconsidered), check if there's a reverse interest
    if (finalStatus === 'accepted') {
      const reverseInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: session.user.id,
            receiverId: match.senderId,
          }
        }
      })

      // If mutual, update reverse interest to accepted as well
      if (reverseInterest) {
        await prisma.match.update({
          where: { id: reverseInterest.id },
          data: { status: 'accepted' }
        })

        return NextResponse.json({
          message: "It's a mutual match!",
          match: updatedMatch,
          mutual: true,
          contactInfo: {
            name: match.sender.name,
            email: match.sender.email,
            phone: match.sender.phone,
            linkedinProfile: match.sender.profile?.linkedinProfile,
            facebookInstagram: match.sender.profile?.facebookInstagram,
          }
        })
      }

      return NextResponse.json({
        message: 'Interest accepted',
        match: updatedMatch,
        mutual: false,
      })
    }

    return NextResponse.json({
      message: 'Interest rejected',
      match: updatedMatch,
    })
  } catch (error) {
    console.error('Match update error:', error)
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}

// GET - Get a specific match
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        sender: {
          include: {
            profile: true,
          }
        },
        receiver: {
          include: {
            profile: true,
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify the current user is either sender or receiver
    if (match.senderId !== session.user.id && match.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Match fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}
