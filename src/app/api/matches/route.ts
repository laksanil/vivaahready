import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']
const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

// Check if request is from admin viewing as another user
async function getAdminViewUserId(searchParams: URLSearchParams): Promise<string | null> {
  const viewAsUserId = searchParams.get('viewAsUser')

  if (!viewAsUserId) return null

  // Verify admin access
  const adminSession = cookies().get('admin_session')
  if (adminSession?.value === ADMIN_TOKEN) {
    return viewAsUserId
  }

  const session = await getServerSession(authOptions)
  if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
    return viewAsUserId
  }

  return null
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'

    // Check if admin is viewing as another user
    const viewAsUserId = await getAdminViewUserId(searchParams)
    const targetUserId = viewAsUserId || session.user.id

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

    // Filter out matches without profile data
    matches = matches.filter((m: any) => m.gender)

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
