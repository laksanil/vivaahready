import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)

    // Fetch the profile with user info
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check interest status if user is logged in
    let interestStatus = { sentByMe: false, receivedFromThem: false, mutual: false }

    const viewerUserId = targetUser?.userId
    if (viewerUserId && viewerUserId !== profile.userId) {
      const sentInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: viewerUserId,
            receiverId: profile.userId,
          }
        }
      })

      const receivedInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: profile.userId,
            receiverId: viewerUserId,
          }
        }
      })

      const isMutual = (sentInterest && receivedInterest) ||
        sentInterest?.status === 'accepted' ||
        receivedInterest?.status === 'accepted'

      interestStatus = {
        sentByMe: !!sentInterest,
        receivedFromThem: !!receivedInterest,
        mutual: !!isMutual,
      }
    }

    // Show contact info if: viewing own profile OR mutual interest
    const isOwnProfile = viewerUserId === profile.userId
    const canSeeContact = isOwnProfile || interestStatus.mutual

    const responseData = {
      ...profile,
      user: {
        id: profile.user.id,
        name: profile.user.name,
        email: canSeeContact ? profile.user.email : undefined,
        phone: canSeeContact ? profile.user.phone : undefined,
        emailVerified: profile.user.emailVerified,
        phoneVerified: profile.user.phoneVerified,
      },
      interestStatus,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
