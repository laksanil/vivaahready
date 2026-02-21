import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'
import { incrementInterestStats, incrementMutualMatchesForBoth } from '@/lib/lifetimeStats'
import { sendNewInterestEmail, sendInterestAcceptedEmail } from '@/lib/email'
import { storeNotification } from '@/lib/notifications'
import { awardInterestPoints, awardResponsePoints } from '@/lib/engagementPoints'

export const dynamic = 'force-dynamic'

async function addWithdrawnInterestToDeclined(userId: string, declinedUserId: string) {
  try {
    await prisma.declinedProfile.upsert({
      where: {
        userId_declinedUserId: {
          userId,
          declinedUserId,
        },
      },
      update: {
        hiddenFromReconsider: false,
        source: 'interest_withdrawn',
      },
      create: {
        userId,
        declinedUserId,
        hiddenFromReconsider: false,
        source: 'interest_withdrawn',
      },
    })
  } catch (error) {
    // Backward-compatible fallback if local DB/client doesn't support `source` yet.
    console.warn('Declined source write failed for withdrawn interest, retrying without source:', error)
    try {
      await prisma.declinedProfile.upsert({
        where: {
          userId_declinedUserId: {
            userId,
            declinedUserId,
          },
        },
        update: {
          hiddenFromReconsider: false,
        },
        create: {
          userId,
          declinedUserId,
          hiddenFromReconsider: false,
        },
      })
    } catch (fallbackError) {
      // Final fallback when local DB is behind schema (e.g., no hiddenFromReconsider yet).
      console.warn('Declined hidden flag write failed, retrying minimal upsert:', fallbackError)
      await prisma.declinedProfile.upsert({
        where: {
          userId_declinedUserId: {
            userId,
            declinedUserId,
          },
        },
        update: {},
        create: {
          userId,
          declinedUserId,
        },
      })
    }
  }
}

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
      // Get sent interests excluding accepted ones (those appear in Connections tab)
      // Status can be: pending, rejected
      const allSentInterests = await prisma.match.findMany({
        where: {
          senderId: currentUserId,
          status: { not: 'accepted' },
        },
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

    // Get current user's profile - expressing interest is free, no approval required
    const myProfile = await prisma.profile.findUnique({
      where: { userId: currentUserId },
    })

    if (!myProfile) {
      return NextResponse.json({
        error: 'You must complete your profile to express interest'
      }, { status: 403 })
    }

    // Get the target profile (must be currently visible/eligible in matching)
    const targetProfile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        isActive: true,
        isSuspended: false,
        approvalStatus: 'approved',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not available' }, { status: 404 })
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
      // Mutual interest scenario - but current user must be approved to create a connection
      // Check if the current user's profile is approved
      if (!myProfile || myProfile.approvalStatus !== 'approved') {
        return NextResponse.json({
          error: 'Your profile must be verified to connect with matches. Please complete verification first.',
          requiresVerification: true,
          wouldBeMutual: true
        }, { status: 403 })
      }

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

      // Increment lifetime mutual matches for both users
      await incrementMutualMatchesForBoth(currentUserId, targetProfile.userId)

      // Award engagement points for expressing interest
      awardInterestPoints(currentUserId, newInterest.id).catch(err =>
        console.error('Failed to award interest points:', err)
      )

      // Send mutual match email to the other person (who expressed interest first)
      // Get current user's profile info
      const currentUserProfile = await prisma.profile.findUnique({
        where: { userId: currentUserId },
        select: { id: true, firstName: true }
      })
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { name: true }
      })

      const currentUserFirstName = currentUserProfile?.firstName || currentUser?.name?.split(' ')[0] || 'Someone'

      if (targetProfile.user.email && currentUserProfile) {
        // Await email to ensure it completes before serverless function ends
        try {
          const emailResult = await sendInterestAcceptedEmail(
            targetProfile.user.email,
            targetProfile.user.name || 'there',
            currentUserFirstName,
            currentUserProfile.id
          )
          console.log('Mutual match email result:', emailResult)
        } catch (emailError) {
          console.error('Failed to send mutual match email:', emailError)
        }
      }

      // Always store in-app notification for the other user (regardless of email)
      storeNotification('interest_accepted', targetProfile.userId, {
        matchName: currentUserFirstName,
        recipientName: targetProfile.user.name || 'there',
      }).catch(err => console.error('Failed to store mutual match notification:', err))

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

    // Award engagement points for expressing interest
    awardInterestPoints(currentUserId, newInterest.id).catch(err =>
      console.error('Failed to award interest points:', err)
    )

    // Send email notification to the receiver about the new interest
    // Get sender's profile info for the email
    const senderUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true, profile: { select: { id: true, firstName: true } } }
    })

    const senderFirstName = senderUser?.profile?.firstName || senderUser?.name?.split(' ')[0] || 'Someone'
    const senderProfileId = senderUser?.profile?.id || ''

    if (senderUser && targetProfile.user.email) {
      console.log('Sending new interest email to:', targetProfile.user.email, 'from:', senderFirstName)

      // Await email to ensure it completes before serverless function ends
      try {
        const emailResult = await sendNewInterestEmail(
          targetProfile.user.email,
          targetProfile.user.name || 'there',
          senderFirstName,
          senderProfileId
        )
        console.log('New interest email result:', emailResult)
      } catch (emailError) {
        // Log but don't fail the interest creation
        console.error('Failed to send new interest email:', emailError)
      }
    } else {
      console.warn('Skipping interest email - senderUser:', !!senderUser, 'targetEmail:', targetProfile.user.email)
    }

    // Always store in-app notification for the receiver (regardless of email)
    storeNotification('new_interest', targetProfile.userId, {
      senderName: senderFirstName,
      recipientName: targetProfile.user.name || 'there',
    }).catch(err => console.error('Failed to store new interest notification:', err))

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

      // Accepting interest requires profile to be verified/approved
      if (action === 'accept' || action === 'reconsider') {
        const myProfile = await prisma.profile.findUnique({
          where: { userId: currentUserId },
          select: { approvalStatus: true }
        })

        if (!myProfile || myProfile.approvalStatus !== 'approved') {
          return NextResponse.json({
            error: 'Your profile must be verified to accept interest. Please complete verification first.',
            requiresVerification: true
          }, { status: 403 })
        }
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

        // Notify the sender that their interest was declined
        storeNotification('interest_rejected', interest.senderId, {
          rejectedByName: interest.receiver.name?.split(' ')[0] || 'Someone',
          recipientName: interest.sender.name || 'there',
        }).catch(err => console.error('Failed to store interest rejected notification:', err))
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
          await addWithdrawnInterestToDeclined(currentUserId, interest.receiverId)
          newStatus = 'withdrawn'
          responseMessage = 'Interest withdrawn.'

          // Notify receiver that sender withdrew from an accepted connection
          storeNotification('connection_withdrawn', interest.receiverId, {
            withdrawnByName: interest.sender.name?.split(' ')[0] || 'Someone',
            recipientName: interest.receiver.name || 'there',
          }).catch(err => console.error('Failed to store connection withdrawn notification:', err))
        } else {
          // Ensure declined entry is added before deleting so profile doesn't reappear in feed.
          await addWithdrawnInterestToDeclined(currentUserId, interest.receiverId)

          // Notify receiver that sender withdrew their pending interest
          storeNotification('interest_withdrawn', interest.receiverId, {
            withdrawnByName: interest.sender.name?.split(' ')[0] || 'Someone',
            recipientName: interest.receiver.name || 'there',
          }).catch(err => console.error('Failed to store interest withdrawn notification:', err))

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

    // Award engagement points for responding to an interest (accept or reject)
    if (action === 'accept' || action === 'reject') {
      awardResponsePoints(currentUserId, interestId).catch(err =>
        console.error('Failed to award response points:', err)
      )
    }

    // Increment lifetime mutual matches when a connection is created (accept or reconsider)
    if (action === 'accept' || action === 'reconsider') {
      await incrementMutualMatchesForBoth(interest.senderId, interest.receiverId)

      // Send email to the original sender that their interest was accepted
      // Get receiver's profile info (the one who accepted)
      const receiverProfile = await prisma.profile.findUnique({
        where: { userId: interest.receiverId },
        select: { id: true, firstName: true }
      })

      const receiverFirstName = receiverProfile?.firstName || interest.receiver.name?.split(' ')[0] || 'Someone'

      if (interest.sender.email && receiverProfile) {
        // Await email to ensure it completes before serverless function ends
        try {
          const emailResult = await sendInterestAcceptedEmail(
            interest.sender.email,
            interest.sender.name || 'there',
            receiverFirstName,
            receiverProfile.id
          )
          console.log('Interest accepted email result:', emailResult)
        } catch (emailError) {
          console.error('Failed to send interest accepted email:', emailError)
        }
      }

      // Always store in-app notification for the sender (regardless of email)
      storeNotification('interest_accepted', interest.senderId, {
        matchName: receiverFirstName,
        recipientName: interest.sender.name || 'there',
      }).catch(err => console.error('Failed to store interest accepted notification:', err))
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
