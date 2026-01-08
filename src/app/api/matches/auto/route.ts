import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findMutualMatches } from '@/lib/matching'

export const dynamic = 'force-dynamic'

// GET - Get auto-matched profiles for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const myProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!myProfile) {
      return NextResponse.json({
        matches: [],
        message: 'Please complete your profile to see matches'
      })
    }

    // Check if profile is approved
    if (myProfile.approvalStatus !== 'approved') {
      return NextResponse.json({
        matches: [],
        status: myProfile.approvalStatus,
        message: myProfile.approvalStatus === 'pending'
          ? 'Your profile is pending approval'
          : 'Your profile was not approved'
      })
    }

    // Get all approved profiles (opposite gender)
    const candidates = await prisma.profile.findMany({
      where: {
        gender: myProfile.gender === 'male' ? 'female' : 'male',
        approvalStatus: 'approved',
        isActive: true,
        userId: { not: session.user.id },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    // Filter to mutual matches using the matching algorithm
    const mutualMatches = findMutualMatches(myProfile, candidates)

    // Get interest status for each match
    const matchesWithInterest = await Promise.all(
      mutualMatches.map(async (match) => {
        // Check if I sent interest to them
        const sentInterest = await prisma.match.findUnique({
          where: {
            senderId_receiverId: {
              senderId: session.user.id,
              receiverId: match.userId,
            }
          }
        })

        // Check if they sent interest to me
        const receivedInterest = await prisma.match.findUnique({
          where: {
            senderId_receiverId: {
              senderId: match.userId,
              receiverId: session.user.id,
            }
          }
        })

        const isMutualInterest = sentInterest?.status === 'accepted' ||
          (sentInterest && receivedInterest)

        return {
          ...match,
          interestStatus: {
            sentByMe: !!sentInterest,
            receivedFromThem: !!receivedInterest,
            mutual: isMutualInterest,
          },
          // Only include contact info if mutual interest
          user: isMutualInterest ? match.user : {
            name: match.user.name,
            email: undefined,
            phone: undefined,
          }
        }
      })
    )

    return NextResponse.json({
      matches: matchesWithInterest,
      total: matchesWithInterest.length,
    })
  } catch (error) {
    console.error('Auto-match error:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
