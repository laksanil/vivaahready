import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isMutualMatch, calculateMatchScore, matchesSeekerPreferences } from '@/lib/matching'
import { getTargetUserId } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// GET - Get auto-matched profiles for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId, isAdminView } = targetUser

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
    console.log(`[MATCH DEBUG] User ${targetUserId} (${myProfile.gender}) checking ${candidates.length} candidates`)
    console.log(`[MATCH DEBUG] My profile prefs: location=${myProfile.prefLocation}, qual=${myProfile.prefQualification}, caste=${myProfile.prefCaste}, diet=${myProfile.prefDiet}`)

    const matchingProfiles = candidates.filter(candidate => {
      const isMatch = isMutualMatch(myProfile, candidate)
      if (!isMatch) {
        // Log why the match failed
        const myMatchesTheirPrefs = matchesSeekerPreferences(candidate, myProfile)
        const theyMatchMyPrefs = matchesSeekerPreferences(myProfile, candidate)
        console.log(`[MATCH DEBUG] ${candidate.user?.name || candidate.userId}: myMatchesTheir=${myMatchesTheirPrefs}, theyMatchMine=${theyMatchMyPrefs}`)
        if (!theyMatchMyPrefs) {
          console.log(`[MATCH DEBUG]   - Their profile doesn't match my prefs`)
          console.log(`[MATCH DEBUG]     Their location: ${candidate.currentLocation}, My pref: ${myProfile.prefLocation}`)
          console.log(`[MATCH DEBUG]     Their qual: ${candidate.qualification}, My pref: ${myProfile.prefQualification}`)
          console.log(`[MATCH DEBUG]     Their caste: ${candidate.caste}, My pref: ${myProfile.prefCaste}`)
          console.log(`[MATCH DEBUG]     Their diet: ${candidate.dietaryPreference}, My pref: ${myProfile.prefDiet}`)
        }
        if (!myMatchesTheirPrefs) {
          console.log(`[MATCH DEBUG]   - My profile doesn't match their prefs`)
          console.log(`[MATCH DEBUG]     My location: ${myProfile.currentLocation}, Their pref: ${candidate.prefLocation}`)
          console.log(`[MATCH DEBUG]     My qual: ${myProfile.qualification}, Their pref: ${candidate.prefQualification}`)
          console.log(`[MATCH DEBUG]     My caste: ${myProfile.caste}, Their pref: ${candidate.prefCaste}`)
          console.log(`[MATCH DEBUG]     My diet: ${myProfile.dietaryPreference}, Their pref: ${candidate.prefDiet}`)
        }
      }
      return isMatch
    })

    console.log(`[MATCH DEBUG] Found ${matchingProfiles.length} matching profiles after filtering`)

    // Get all profiles this user has declined
    const myDeclinedProfiles = await prisma.declinedProfile.findMany({
      where: { userId: targetUserId },
      select: { declinedUserId: true }
    })
    const declinedUserIds = new Set(myDeclinedProfiles.map(d => d.declinedUserId))

    // Get all profiles that have declined this user (two-way filtering)
    // If someone declined me, I shouldn't see them either
    const declinedByOthers = await prisma.declinedProfile.findMany({
      where: { declinedUserId: targetUserId },
      select: { userId: true }
    })
    const declinedByOthersIds = new Set(declinedByOthers.map(d => d.userId))

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

    // Track pending received interests (they liked me, I haven't responded)
    const pendingReceivedUserIds = new Set(
      myInterestsReceived.filter(m => m.status === 'pending').map(m => m.senderId)
    )

    // Filter profiles for the Feed:
    // - Include profiles with NO relationship (fresh)
    // - Include profiles that liked me (pending received) - they go to top of feed
    // - Exclude profiles I've already liked/acted on (sent interests)
    // - Exclude profiles I've declined
    // - Exclude profiles that have declined me (two-way filtering)
    // - Exclude mutual matches (accepted interests)
    const freshProfiles = matchingProfiles.filter(match =>
      !sentToUserIds.has(match.userId) &&
      !declinedUserIds.has(match.userId) &&
      !declinedByOthersIds.has(match.userId) &&
      !acceptedSentUserIds.has(match.userId) &&
      !acceptedReceivedUserIds.has(match.userId)
    )

    // Get interest status for each match and mark if they liked user first
    const matchesWithInterest = await Promise.all(
      freshProfiles.map(async (match) => {
        // Calculate BOTH match scores:
        // 1. How well THEY match YOUR preferences (yourMatchScore)
        const matchScore = calculateMatchScore(myProfile, match)
        // 2. How well YOU match THEIR preferences (theirMatchScore)
        const theirMatchScore = calculateMatchScore(match, myProfile)

        // Check if this profile has already liked the user
        const theyLikedMeFirst = pendingReceivedUserIds.has(match.userId)

        console.log(`Match ${match.user.name}: matchScore=${matchScore?.totalScore}/${matchScore?.maxScore}, theyLikedMeFirst=${theyLikedMeFirst}`)
        return {
          ...match,
          matchScore,      // How well they match your preferences
          theirMatchScore, // How well you match their preferences
          theyLikedMeFirst, // True if they already liked the user (show at top)
          interestStatus: {
            sentByMe: false,
            receivedFromThem: theyLikedMeFirst,
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

    // Sort fresh profiles: prioritize those who liked user first, then by match score
    const sortedFreshMatches = matchesWithInterest.sort((a, b) => {
      // Priority 1: Profiles that liked me first appear at top
      const aLikedMe = a.theyLikedMeFirst ? 1 : 0
      const bLikedMe = b.theyLikedMeFirst ? 1 : 0
      if (bLikedMe !== aLikedMe) return bLikedMe - aLikedMe

      // Priority 2: Match score (highest first)
      return (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
    })

    // Sort mutual matches by match score (highest first)
    const sortedMutualMatches = mutualMatches.sort((a, b) =>
      (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
    )

    // Combine: fresh profiles + mutual matches (for backward compatibility)
    // Frontend will separate them based on interestStatus.mutual
    const allMatches = [...sortedFreshMatches, ...sortedMutualMatches]

    // Get target user's name if admin view
    let targetUserName = session?.user?.name || 'User'
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
        likedYouCount: sortedFreshMatches.filter(m => m.theyLikedMeFirst).length,
        interestsSent: interestsSentStats,
        interestsReceived: interestsReceivedStats,
        declined: declinedUserIds.size,
      },
      userStatus: {
        isApproved,
        hasPaid,
        approvalStatus: myProfile.approvalStatus,
        canExpressInterest: isApproved,
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
