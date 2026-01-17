import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'
import { incrementInterestStats, incrementMatchesForBoth } from '@/lib/lifetimeStats'

export const dynamic = 'force-dynamic'

// GET - Get interests (received, sent, or check mutual with specific profile)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId: currentUserId } = targetUser

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
            senderId: currentUserId,
            receiverId: targetProfile.userId,
          }
        }
      })

      const receivedInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: targetProfile.userId,
            receiverId: currentUserId,
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
      // Get all interests received (pending only by default)
      const statusFilter = searchParams.get('status') // 'pending', 'rejected', 'accepted', or 'all'

      const whereClause: any = { receiverId: currentUserId }
      if (statusFilter && statusFilter !== 'all') {
        whereClause.status = statusFilter
      }

      const allReceivedInterests = await prisma.match.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profile: {
                select: {
                  id: true,
                  gender: true,
                  currentLocation: true,
                  occupation: true,
                  profileImageUrl: true,
                  photoUrls: true,
                  linkedinProfile: true,
                  facebookInstagram: true,
                }
              }
            }
          }
        }
      })

      // For pending interests, filter out those where I already sent interest (would be mutual)
      // For rejected/accepted, show all
      const interests = []
      for (const interest of allReceivedInterests) {
        if (interest.status === 'pending') {
          // Check if I also sent interest to this person
          const mySentInterest = await prisma.match.findUnique({
            where: {
              senderId_receiverId: {
                senderId: currentUserId,
                receiverId: interest.senderId,
              }
            }
          })
          // Only include if NOT mutual
          if (!mySentInterest) {
            interests.push(interest)
          }
        } else {
          // For rejected/accepted, always include
          interests.push(interest)
        }
      }

      return NextResponse.json({ interests })
    }

    if (type === 'sent') {
      // Get all interests sent - show ALL with their status
      // Status can be: pending, accepted, rejected
      const allSentInterests = await prisma.match.findMany({
        where: { senderId: currentUserId },
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

      // Return all sent interests - the status field tells the story:
      // - 'pending': Waiting for their response
      // - 'accepted': They accepted (mutual match - also in connections)
      // - 'rejected': They declined your interest
      return NextResponse.json({ interests: allSentInterests })
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

    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId: currentUserId } = targetUser

    const body = await request.json()
    const { profileId, message } = body

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    // Get current user's profile to check if approved
    const myProfile = await prisma.profile.findUnique({
      where: { userId: currentUserId },
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
          senderId: currentUserId,
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
          receiverId: currentUserId,
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
          senderId: currentUserId,
          receiverId: targetProfile.userId,
          message,
          status: 'accepted',
        }
      })

      // Increment lifetime stats for both sender and receiver
      await incrementInterestStats(currentUserId, targetProfile.userId)

      // Increment lifetime matches for both users (mutual connection created)
      await incrementMatchesForBoth(currentUserId, targetProfile.userId)

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
        senderId: currentUserId,
        receiverId: targetProfile.userId,
        message,
        status: 'pending',
      }
    })

    // Increment lifetime stats for both sender and receiver
    await incrementInterestStats(currentUserId, targetProfile.userId)

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

// PATCH - Accept, Reject, or Reconsider an interest
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId: currentUserId } = targetUser

    const body = await request.json()
    const { interestId, action } = body // action: 'accept' | 'reject' | 'reconsider' | 'withdraw'

    if (!interestId || !action) {
      return NextResponse.json({ error: 'Interest ID and action are required' }, { status: 400 })
    }

    if (!['accept', 'reject', 'reconsider', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the interest
    const interest = await prisma.match.findUnique({
      where: { id: interestId },
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
            profile: {
              select: {
                linkedinProfile: true,
                facebookInstagram: true,
              }
            }
          }
        }
      }
    })

    if (!interest) {
      return NextResponse.json({ error: 'Interest not found' }, { status: 404 })
    }

    // Validate user can perform this action
    const isReceiver = interest.receiverId === currentUserId
    const isSender = interest.senderId === currentUserId

    if (action === 'accept' || action === 'reject' || action === 'reconsider') {
      // Only receiver can accept/reject/reconsider
      if (!isReceiver) {
        return NextResponse.json({ error: 'Only the recipient can perform this action' }, { status: 403 })
      }
    }

    if (action === 'withdraw') {
      // Only sender can withdraw their interest
      if (!isSender) {
        return NextResponse.json({ error: 'Only the sender can withdraw interest' }, { status: 403 })
      }
    }

    let newStatus: string
    let responseMessage: string
    let contactInfo = null

    switch (action) {
      case 'accept':
        if (interest.status !== 'pending' && interest.status !== 'rejected') {
          return NextResponse.json({ error: 'Can only accept pending or rejected interests' }, { status: 400 })
        }
        newStatus = 'accepted'
        responseMessage = 'Interest accepted! You can now view their contact details.'
        // Return sender's contact info
        contactInfo = {
          name: interest.sender.name,
          email: interest.sender.email,
          phone: interest.sender.phone,
          linkedinProfile: interest.sender.profile?.linkedinProfile,
          facebookInstagram: interest.sender.profile?.facebookInstagram,
        }
        break

      case 'reject':
        if (interest.status !== 'pending') {
          return NextResponse.json({ error: 'Can only reject pending interests' }, { status: 400 })
        }
        newStatus = 'rejected'
        responseMessage = 'Interest declined. You can reconsider later if you change your mind.'
        break

      case 'reconsider':
        if (interest.status !== 'rejected') {
          return NextResponse.json({ error: 'Can only reconsider rejected interests' }, { status: 400 })
        }
        newStatus = 'accepted'
        responseMessage = 'Interest reconsidered and accepted! You can now view their contact details.'
        contactInfo = {
          name: interest.sender.name,
          email: interest.sender.email,
          phone: interest.sender.phone,
          linkedinProfile: interest.sender.profile?.linkedinProfile,
          facebookInstagram: interest.sender.profile?.facebookInstagram,
        }
        break

      case 'withdraw':
        if (interest.status === 'accepted') {
          // Can withdraw even accepted interest (but receiver keeps their accepted status)
          newStatus = 'withdrawn'
          responseMessage = 'Interest withdrawn.'
        } else {
          // Delete the interest entirely if it was pending/rejected
          await prisma.match.delete({
            where: { id: interestId }
          })
          return NextResponse.json({
            message: 'Interest withdrawn and removed.',
            deleted: true,
          })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the interest status
    const updatedInterest = await prisma.match.update({
      where: { id: interestId },
      data: { status: newStatus }
    })

    // Increment lifetime matches when a mutual connection is created (accept or reconsider)
    if (action === 'accept' || action === 'reconsider') {
      await incrementMatchesForBoth(interest.senderId, interest.receiverId)
    }

    return NextResponse.json({
      message: responseMessage,
      interest: updatedInterest,
      contactInfo,
    })
  } catch (error) {
    console.error('Interest PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update interest' }, { status: 500 })
  }
}
