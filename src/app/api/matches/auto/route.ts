import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isMutualMatch, calculateMatchScore, matchesSeekerPreferences, findNearMatches } from '@/lib/matching'
import { getTargetUserId } from '@/lib/admin'
import { getLifetimeStats, updateLifetimeMatches } from '@/lib/lifetimeStats'

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

    // Batch-fetch referral counts for all candidate profiles (single query)
    const allCandidates = [...matchesWithInterest, ...mutualMatches]
    const allReferralCodes = allCandidates
      .map((m) => m.referralCode)
      .filter((code): code is string => !!code)
    const referralCountMap = new Map<string, number>()
    if (allReferralCodes.length > 0) {
      const counts = await prisma.profile.groupBy({
        by: ['referredBy'],
        where: { referredBy: { in: allReferralCodes } },
        _count: true,
      })
      for (const row of counts) {
        if (row.referredBy) referralCountMap.set(row.referredBy, row._count)
      }
    }

    // Determine active referral boosts (3+ referrals, within 30 days of activation)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeBoostedUserIds = new Set<string>()
    const profilesToActivateBoost: string[] = []

    for (const match of allCandidates) {
      const count = referralCountMap.get(match.referralCode || '') || 0
      if (count >= 3) {
        if (!match.referralBoostStart) {
          profilesToActivateBoost.push(match.id)
          activeBoostedUserIds.add(match.userId)
        } else if (new Date(match.referralBoostStart) > thirtyDaysAgo) {
          activeBoostedUserIds.add(match.userId)
        }
      }
    }

    if (profilesToActivateBoost.length > 0) {
      await prisma.profile.updateMany({
        where: { id: { in: profilesToActivateBoost } },
        data: { referralBoostStart: now },
      })
    }

    // Sort fresh profiles: active referral boost first, then liked-me-first, then match score
    const sortedFreshMatches = matchesWithInterest.sort((a, b) => {
      // Priority 1: Profiles with active referral boost (3+ referrals, within 30 days)
      const aReferralBoost = activeBoostedUserIds.has(a.userId) ? 1 : 0
      const bReferralBoost = activeBoostedUserIds.has(b.userId) ? 1 : 0
      if (bReferralBoost !== aReferralBoost) return bReferralBoost - aReferralBoost

      // Priority 2: Profiles that liked me first
      const aLikedMe = a.theyLikedMeFirst ? 1 : 0
      const bLikedMe = b.theyLikedMeFirst ? 1 : 0
      if (bLikedMe !== aLikedMe) return bLikedMe - aLikedMe

      // Priority 3: Match score (highest first)
      return (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
    })

    // Sort mutual matches by active referral boost, then match score (highest first)
    const sortedMutualMatches = mutualMatches.sort((a, b) => {
      const aReferralBoost = activeBoostedUserIds.has(a.userId) ? 1 : 0
      const bReferralBoost = activeBoostedUserIds.has(b.userId) ? 1 : 0
      if (bReferralBoost !== aReferralBoost) return bReferralBoost - aReferralBoost
      return (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
    })

    // Combine: fresh profiles + mutual matches (for backward compatibility)
    // Frontend will separate them based on interestStatus.mutual
    const allMatches = [...sortedFreshMatches, ...sortedMutualMatches]

    // Find "near matches" when user has few exact matches (< 3)
    // These are profiles that fail on 1-2 non-critical preferences
    let nearMatchResults: {
      profile: typeof candidates[0]
      failedCriteria: { name: string; seekerPref: string | null; candidateValue: string | null; isDealbreaker: boolean }[]
      matchScore: { percentage: number; totalScore: number; maxScore: number }
      failedDirection: 'seeker' | 'candidate' | 'both'
    }[] = []

    const showNearMatches = sortedFreshMatches.length < 3
    console.log(`[NEAR MATCH DEBUG] showNearMatches=${showNearMatches}, freshMatches=${sortedFreshMatches.length}`)

    if (showNearMatches) {
      // Get near matches from candidates that aren't already matches
      const nearMatches = findNearMatches(myProfile as any, candidates as any[], 2)
      console.log(`[NEAR MATCH DEBUG] findNearMatches returned ${nearMatches.length} profiles`)

      // Filter out declined profiles and existing matches
      nearMatchResults = nearMatches
        .filter(nm =>
          !declinedUserIds.has(nm.profile.userId) &&
          !declinedByOthersIds.has(nm.profile.userId) &&
          !sentToUserIds.has(nm.profile.userId) &&
          !acceptedSentUserIds.has(nm.profile.userId) &&
          !acceptedReceivedUserIds.has(nm.profile.userId)
        )
        .slice(0, 10) // Limit to 10 near matches
        .map(nm => {
          // Find the full candidate data
          const fullProfile = candidates.find(c => c.userId === nm.profile.userId)
          return {
            profile: fullProfile || nm.profile as any,
            failedCriteria: nm.failedCriteria,
            matchScore: nm.matchScore,
            failedDirection: nm.failedDirection
          }
        })
    }

    // Get target user's name if admin view
    let targetUserName = session?.user?.name || 'User'
    if (isAdminView) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { name: true }
      })
      targetUserName = targetUser?.name || 'Unknown'
    }

    // Calculate interest stats for admin visibility (active/current stats)
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

    // Get lifetime stats (never decrease, show platform value)
    const lifetimeStats = await getLifetimeStats(targetUserId)

    // Update lifetime matches if current potential matches is higher (high-water mark)
    const currentPotentialMatches = sortedFreshMatches.length
    await updateLifetimeMatches(targetUserId, currentPotentialMatches)

    // Sync lifetime stats with real-time if lifetime is lower (backfill for pre-existing data)
    const needsSync = lifetimeStats && (
      lifetimeStats.lifetimeInterestsSent < interestsSentStats.total ||
      lifetimeStats.lifetimeInterestsReceived < interestsReceivedStats.total ||
      lifetimeStats.lifetimeMutualMatches < sortedMutualMatches.length
    )
    if (needsSync) {
      await prisma.profile.update({
        where: { userId: targetUserId },
        data: {
          lifetimeInterestsSent: Math.max(lifetimeStats.lifetimeInterestsSent, interestsSentStats.total),
          lifetimeInterestsReceived: Math.max(lifetimeStats.lifetimeInterestsReceived, interestsReceivedStats.total),
          lifetimeMutualMatches: Math.max(lifetimeStats.lifetimeMutualMatches, sortedMutualMatches.length),
        }
      })
    }

    // Re-fetch lifetime stats to get updated values
    const updatedLifetimeStats = await getLifetimeStats(targetUserId)

    return NextResponse.json({
      matches: allMatches,
      freshMatches: sortedFreshMatches,
      mutualMatches: sortedMutualMatches,
      nearMatches: nearMatchResults,
      showNearMatches,
      total: allMatches.length,
      isAdminView,
      viewingUserId: isAdminView ? targetUserId : undefined,
      viewingUserName: isAdminView ? targetUserName : undefined,
      // Stats for admin to see exact same counts as user
      stats: {
        // Active stats (current/dynamic - can change based on profile updates)
        potentialMatches: currentPotentialMatches,
        mutualMatches: sortedMutualMatches.length,
        likedYouCount: sortedFreshMatches.filter(m => m.theyLikedMeFirst).length,
        interestsSent: interestsSentStats,
        interestsReceived: interestsReceivedStats,
        declined: declinedUserIds.size,
        // Lifetime stats (never decrease - show platform value)
        lifetime: {
          interestsReceived: updatedLifetimeStats?.lifetimeInterestsReceived || 0,
          interestsSent: updatedLifetimeStats?.lifetimeInterestsSent || 0,
          profileViews: updatedLifetimeStats?.lifetimeProfileViews || 0,
          matches: updatedLifetimeStats?.lifetimeMatches || 0,
          mutualMatches: updatedLifetimeStats?.lifetimeMutualMatches || 0,
        },
      },
      userStatus: {
        isApproved,
        hasPaid,
        approvalStatus: myProfile.approvalStatus,
        canExpressInterest: true, // Express interest is free for all users with a profile
        canAcceptInterest: isApproved, // Accepting interest requires verification/approval
      },
      myProfile: {
        id: myProfile.id,
        gender: myProfile.gender,
        profileImageUrl: myProfile.profileImageUrl,
        photoUrls: myProfile.photoUrls,
        userName: targetUserName,
        firstName: myProfile.firstName,
        odNumber: myProfile.odNumber,
        // Include preferences for generating tips
        prefLocation: myProfile.prefLocation,
        prefLocationList: myProfile.prefLocationList,
        prefAgeMin: myProfile.prefAgeMin,
        prefAgeMax: myProfile.prefAgeMax,
        prefAgeIsDealbreaker: myProfile.prefAgeIsDealbreaker,
        prefLocationIsDealbreaker: myProfile.prefLocationIsDealbreaker,
        prefMaritalStatusIsDealbreaker: myProfile.prefMaritalStatusIsDealbreaker,
        prefReligionIsDealbreaker: myProfile.prefReligionIsDealbreaker,
        prefDietIsDealbreaker: myProfile.prefDietIsDealbreaker,
        prefHeightIsDealbreaker: myProfile.prefHeightIsDealbreaker,
        prefSmokingIsDealbreaker: myProfile.prefSmokingIsDealbreaker,
        prefDrinkingIsDealbreaker: myProfile.prefDrinkingIsDealbreaker,
        prefEducationIsDealbreaker: myProfile.prefEducationIsDealbreaker,
        prefIncomeIsDealbreaker: myProfile.prefIncomeIsDealbreaker,
      }
    })
  } catch (error) {
    console.error('Auto-match error:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
