import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isMutualMatch, calculateMatchScore } from '@/lib/matching'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']
const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

// Check if request is from admin viewing as another user
async function getAdminViewUserId(request: Request): Promise<string | null> {
  const { searchParams } = new URL(request.url)
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

// GET - Get auto-matched profiles for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin is viewing as another user
    const viewAsUserId = await getAdminViewUserId(request)
    const targetUserId = viewAsUserId || session.user.id
    const isAdminView = !!viewAsUserId

    // Get target user's profile
    const myProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
    })

    if (!myProfile) {
      return NextResponse.json({
        matches: [],
        message: 'Please complete your profile to see matches'
      })
    }

    // Check user's payment/approval status
    const userSubscription = await prisma.subscription.findUnique({
      where: { userId: targetUserId }
    })

    const hasPaid = userSubscription?.profilePaid === true
    const isApproved = myProfile.approvalStatus === 'approved'

    // Get all profiles (opposite gender) that match partner preferences - show regardless of approval status
    const candidates = await prisma.profile.findMany({
      where: {
        gender: myProfile.gender === 'male' ? 'female' : 'male',
        isActive: true,
        userId: { not: targetUserId },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
          }
        }
      },
      // Include all fields including partner preferences
    })

    // Filter to profiles where BOTH parties' preferences match (mutual matching)
    const matchingProfiles = candidates.filter(candidate =>
      isMutualMatch(myProfile, candidate)
    )

    // Get all profiles this user has declined
    const myDeclinedProfiles = await prisma.declinedProfile.findMany({
      where: { userId: targetUserId },
      select: { declinedUserId: true }
    })
    const declinedUserIds = new Set(myDeclinedProfiles.map(d => d.declinedUserId))

    // Get all interests sent by this user
    const myInterestsSent = await prisma.match.findMany({
      where: { senderId: targetUserId },
      select: { receiverId: true, status: true }
    })
    const sentToUserIds = new Set(myInterestsSent.map(m => m.receiverId))

    // Get all interests received by this user
    const myInterestsReceived = await prisma.match.findMany({
      where: { receiverId: targetUserId },
      select: { senderId: true, status: true }
    })
    const receivedFromUserIds = new Set(myInterestsReceived.map(m => m.senderId))

    // Track accepted interests (either direction = mutual match)
    const acceptedSentUserIds = new Set(
      myInterestsSent.filter(m => m.status === 'accepted').map(m => m.receiverId)
    )
    const acceptedReceivedUserIds = new Set(
      myInterestsReceived.filter(m => m.status === 'accepted').map(m => m.senderId)
    )

    // Filter out profiles that have any interest relationship or have been declined
    // These should appear in their respective tabs: Mutual, Interest Sent, Interest Received, or Declined
    const freshProfiles = matchingProfiles.filter(match =>
      !sentToUserIds.has(match.userId) &&
      !receivedFromUserIds.has(match.userId) &&
      !declinedUserIds.has(match.userId)
    )

    // Get interest status for each match (for fresh profiles, all will be false)
    const matchesWithInterest = await Promise.all(
      freshProfiles.map(async (match) => {
        // Calculate BOTH match scores:
        // 1. How well THEY match YOUR preferences (yourMatchScore)
        const matchScore = calculateMatchScore(myProfile, match)
        // 2. How well YOU match THEIR preferences (theirMatchScore)
        const theirMatchScore = calculateMatchScore(match, myProfile)

        console.log(`Match ${match.user.name}: matchScore=${matchScore?.totalScore}/${matchScore?.maxScore}, theirMatchScore=${theirMatchScore?.totalScore}/${theirMatchScore?.maxScore}`)
        return {
          ...match,
          matchScore,      // How well they match your preferences
          theirMatchScore, // How well you match their preferences
          interestStatus: {
            sentByMe: false,
            receivedFromThem: false,
            mutual: false,
          },
          // Fresh profiles don't show contact info
          user: {
            id: match.user.id,
            name: match.user.name,
            email: undefined,
            phone: undefined,
            emailVerified: match.user.emailVerified,
            phoneVerified: match.user.phoneVerified,
          }
        }
      })
    )

    // Mutual matches: either both parties sent interest OR any interest was accepted
    const mutualMatches = await Promise.all(
      matchingProfiles
        .filter(match => {
          const bothSentInterest = sentToUserIds.has(match.userId) && receivedFromUserIds.has(match.userId)
          const myInterestAccepted = acceptedSentUserIds.has(match.userId)
          const theirInterestAccepted = acceptedReceivedUserIds.has(match.userId)
          return bothSentInterest || myInterestAccepted || theirInterestAccepted
        })
        .map(async (match) => {
          // Calculate BOTH match scores
          const matchScore = calculateMatchScore(myProfile, match)
          const theirMatchScore = calculateMatchScore(match, myProfile)
          return {
            ...match,
            matchScore,      // How well they match your preferences
            theirMatchScore, // How well you match their preferences
            interestStatus: {
              sentByMe: sentToUserIds.has(match.userId),
              receivedFromThem: receivedFromUserIds.has(match.userId),
              mutual: true,
            },
            // Mutual matches show contact info
            user: match.user
          }
        })
    )

    // Sort fresh profiles by match score (highest first)
    const sortedFreshMatches = matchesWithInterest.sort((a, b) =>
      (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
    )

    // Sort mutual matches by match score (highest first)
    const sortedMutualMatches = mutualMatches.sort((a, b) =>
      (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
    )

    // Combine: fresh profiles + mutual matches (for backward compatibility)
    // Frontend will separate them based on interestStatus.mutual
    const allMatches = [...sortedFreshMatches, ...sortedMutualMatches]

    // Get target user's name if admin view
    let targetUserName = session.user.name
    if (isAdminView) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { name: true }
      })
      targetUserName = targetUser?.name || 'Unknown'
    }

    // Calculate interest stats for admin visibility
    const interestsSentStats = {
      total: myInterestsSent.length,
      pending: myInterestsSent.filter(m => m.status === 'pending').length,
      accepted: myInterestsSent.filter(m => m.status === 'accepted').length,
      rejected: myInterestsSent.filter(m => m.status === 'rejected').length,
    }

    const interestsReceivedStats = {
      total: myInterestsReceived.length,
      pending: myInterestsReceived.filter(m => m.status === 'pending').length,
      accepted: myInterestsReceived.filter(m => m.status === 'accepted').length,
      rejected: myInterestsReceived.filter(m => m.status === 'rejected').length,
    }

    return NextResponse.json({
      matches: allMatches,
      freshMatches: sortedFreshMatches,
      mutualMatches: sortedMutualMatches,
      total: allMatches.length,
      isAdminView,
      viewingUserId: isAdminView ? targetUserId : undefined,
      viewingUserName: isAdminView ? targetUserName : undefined,
      // Stats for admin to see exact same counts as user
      stats: {
        potentialMatches: sortedFreshMatches.length,
        mutualMatches: sortedMutualMatches.length,
        interestsSent: interestsSentStats,
        interestsReceived: interestsReceivedStats,
        declined: declinedUserIds.size,
      },
      userStatus: {
        isApproved,
        hasPaid,
        approvalStatus: myProfile.approvalStatus,
        canExpressInterest: isAdminView ? true : isApproved, // Admin can view all actions
      },
      myProfile: {
        id: myProfile.id,
        gender: myProfile.gender,
        profileImageUrl: myProfile.profileImageUrl,
        photoUrls: myProfile.photoUrls,
        userName: targetUserName,
      }
    })
  } catch (error) {
    console.error('Auto-match error:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
