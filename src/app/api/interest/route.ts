import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get interests (received, sent, or check mutual with specific profile)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'
    const profileId = searchParams.get('profileId')
    const checkMutual = searchParams.get('checkMutual') === 'true'

    // Check mutual interest with specific profile
    if (checkMutual && profileId) {
      // Get the profile to find the userId
      const targetProfile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { userId: true }
      })

      if (!targetProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const sentInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: session.user.id,
            receiverId: targetProfile.userId,
          }
        }
      })

      const receivedInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: targetProfile.userId,
            receiverId: session.user.id,
          }
        }
      })

      const isMutual = (sentInterest && receivedInterest) ||
        sentInterest?.status === 'accepted' ||
        receivedInterest?.status === 'accepted'

      return NextResponse.json({
        sentByMe: !!sentInterest,
        receivedFromThem: !!receivedInterest,
        mutual: isMutual,
        sentAt: sentInterest?.createdAt,
        receivedAt: receivedInterest?.createdAt,
      })
    }

    // Get list of interests
    if (type === 'received') {
      const interests = await prisma.match.findMany({
        where: { receiverId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  id: true,
                  gender: true,
                  currentLocation: true,
                  occupation: true,
                  profileImageUrl: true,
                  photoUrls: true,
                }
              }
            }
          }
        }
      })

      return NextResponse.json({ interests })
    }

    if (type === 'sent') {
      const interests = await prisma.match.findMany({
        where: { senderId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  id: true,
                  gender: true,
                  currentLocation: true,
                  occupation: true,
                  profileImageUrl: true,
                  photoUrls: true,
                }
              }
            }
          }
        }
      })

      return NextResponse.json({ interests })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Interest GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 })
  }
}

// POST - Express interest in a profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profileId, message } = body

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    // Get current user's profile to check if approved
    const myProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!myProfile || myProfile.approvalStatus !== 'approved') {
      return NextResponse.json({
        error: 'Your profile must be approved to express interest'
      }, { status: 403 })
    }

    // Get the target profile
    const targetProfile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if interest already exists
    const existingInterest = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: session.user.id,
          receiverId: targetProfile.userId,
        }
      }
    })

    if (existingInterest) {
      return NextResponse.json({
        error: 'You have already expressed interest in this profile',
        interest: existingInterest
      }, { status: 400 })
    }

    // Check if they already sent interest to us (mutual match!)
    const reverseInterest = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: targetProfile.userId,
          receiverId: session.user.id,
        }
      }
    })

    if (reverseInterest) {
      // Mutual interest! Update both to accepted
      await prisma.match.update({
        where: { id: reverseInterest.id },
        data: { status: 'accepted' }
      })

      // Create our interest as accepted too
      const newInterest = await prisma.match.create({
        data: {
          senderId: session.user.id,
          receiverId: targetProfile.userId,
          message,
          status: 'accepted',
        }
      })

      return NextResponse.json({
        message: "It's a match! You both expressed interest.",
        mutual: true,
        interest: newInterest,
        contactInfo: {
          name: targetProfile.user.name,
          email: targetProfile.user.email,
          phone: targetProfile.user.phone,
          linkedinProfile: targetProfile.linkedinProfile,
          facebookInstagram: targetProfile.facebookInstagram,
        }
      })
    }

    // Create new interest (pending)
    const newInterest = await prisma.match.create({
      data: {
        senderId: session.user.id,
        receiverId: targetProfile.userId,
        message,
        status: 'pending',
      }
    })

    return NextResponse.json({
      message: 'Interest sent successfully',
      mutual: false,
      interest: newInterest,
    })
  } catch (error) {
    console.error('Interest POST error:', error)
    return NextResponse.json({ error: 'Failed to express interest' }, { status: 500 })
  }
}
