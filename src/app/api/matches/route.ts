import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'
import { sendMatchNotificationSms, formatPhoneNumber } from '@/lib/sns'
import { storeNotification } from '@/lib/notifications'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'

    const targetUserId = targetUser.userId
    const myDeclinedProfiles = await prisma.declinedProfile.findMany({
      where: { userId: targetUserId },
      select: { declinedUserId: true },
    })
    const declinedUserIds = new Set(myDeclinedProfiles.map((d) => d.declinedUserId))

    let matches = []

    if (type === 'received') {
      const allReceived = await prisma.match.findMany({
        where: { receiverId: targetUserId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              emailVerified: true,
              phoneVerified: true,
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Filter out mutual matches - only show non-mutual, non-accepted received interests
      for (const m of allReceived) {
        // Skip accepted interests - they should be in mutual matches
        if (m.status === 'accepted') {
          continue
        }

        // Check if user also sent interest to this person (making it mutual)
        const mySentInterest = await prisma.match.findUnique({
          where: {
            senderId_receiverId: {
              senderId: targetUserId,
              receiverId: m.senderId,
            }
          }
        })

        // Only include if NOT mutual (I haven't sent interest back)
        if (!mySentInterest) {
          matches.push({
            id: m.id,
            matchId: m.id,
            matchStatus: m.status,
            status: m.status,
            createdAt: m.createdAt,
            ...(m.sender.profile || {}),
            userId: m.sender.id,
            approvalStatus: m.sender.profile?.approvalStatus,
            user: {
              id: m.sender.id,
              name: m.sender.name,
              email: undefined,
              phone: undefined,
              emailVerified: m.sender.emailVerified,
              phoneVerified: m.sender.phoneVerified,
            },
            interestStatus: {
              sentByMe: false,
              receivedFromThem: true,
              mutual: false,
            },
          })
        }
      }
    } else {
      const allSent = await prisma.match.findMany({
        where: { senderId: targetUserId },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              emailVerified: true,
              phoneVerified: true,
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Filter out mutual matches - only show non-mutual, non-accepted sent interests
      for (const m of allSent) {
        // Skip accepted interests - they should be in mutual matches
        if (m.status === 'accepted') {
          continue
        }

        // Check if they also sent interest to user (making it mutual)
        const theirSentInterest = await prisma.match.findUnique({
          where: {
            senderId_receiverId: {
              senderId: m.receiverId,
              receiverId: targetUserId,
            }
          }
        })

        // Only include if NOT mutual (they haven't sent interest back)
        if (!theirSentInterest) {
          matches.push({
            id: m.id,
            matchId: m.id,
            matchStatus: m.status,
            status: m.status,
            createdAt: m.createdAt,
            ...(m.receiver.profile || {}),
            userId: m.receiver.id,
            approvalStatus: m.receiver.profile?.approvalStatus,
            user: {
              id: m.receiver.id,
              name: m.receiver.name,
              email: undefined,
              phone: undefined,
              emailVerified: m.receiver.emailVerified,
              phoneVerified: m.receiver.phoneVerified,
            },
            interestStatus: {
              sentByMe: true,
              receivedFromThem: false,
              mutual: false,
            },
          })
        }
      }
    }

    // Filter out matches without profile data, non-approved/suspended/inactive profiles, and declined profiles.
    matches = matches.filter((m: any) =>
      m.gender &&
      m.approvalStatus === 'approved' &&
      m.isActive !== false &&
      m.isSuspended !== true &&
      !declinedUserIds.has(m.userId)
    )

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Matches fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch matches', matches: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = targetUser.userId

    const { receiverId, message } = await request.json()

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID required' }, { status: 400 })
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findUnique({
      where: {
        senderId_receiverId: {
          senderId: currentUserId,
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
        senderId: currentUserId,
        receiverId,
        message,
        status: 'pending',
      },
    })

    // Send SMS notification to receiver (if they have a verified phone)
    try {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: {
          phone: true,
          phoneVerified: true,
          profile: { select: { firstName: true } }
        }
      })

      const sender = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { profile: { select: { firstName: true } } }
      })
      const deliveryModes: Array<'sms'> = []

      if (receiver?.phone && receiver.phoneVerified) {
        const receiverName = receiver.profile?.firstName || 'there'
        const senderName = sender?.profile?.firstName || 'Someone'
        await sendMatchNotificationSms(
          formatPhoneNumber(receiver.phone),
          receiverName,
          senderName
        )
        deliveryModes.push('sms')
      }
      // Store in-app notification + push
      storeNotification('new_interest', receiverId, {
        senderName: sender?.profile?.firstName || 'Someone',
        recipientName: receiver?.profile?.firstName || 'there',
      }, {
        deliveryModes,
      }).catch(err => console.error('Failed to store match notification:', err))
    } catch (smsError) {
      // Log but don't fail the match creation if SMS fails
      console.error('Failed to send match notification SMS:', smsError)
    }

    return NextResponse.json({ message: 'Interest sent successfully', match }, { status: 201 })
  } catch (error) {
    console.error('Match creation error:', error)
    return NextResponse.json({ error: 'Failed to send interest' }, { status: 500 })
  }
}
