import { prisma } from '@/lib/prisma'
import { calculateMatchScore, isMutualMatch, matchesSeekerPreferences } from '@/lib/matching'
import { getLifetimeStats, updateLifetimeMatches } from '@/lib/lifetimeStats'

interface MatchStats {
  potentialMatches: number
  mutualMatches: number
  likedYouCount: number
  interestsSent: { total: number; pending: number; accepted: number; rejected: number }
  interestsReceived: { total: number; pending: number; accepted: number; rejected: number }
  declined: number
  lifetime: {
    interestsReceived: number
    interestsSent: number
    profileViews: number
    matches: number
    mutualMatches: number
  }
}

interface MatchResults {
  matches: any[]
  freshMatches: any[]
  mutualMatches: any[]
  total: number
  stats: MatchStats
  userStatus: {
    isApproved: boolean
    hasPaid: boolean
    approvalStatus: string
    canExpressInterest: boolean
  }
  myProfile: {
    id: string
    gender: string | null
    profileImageUrl: string | null
    photoUrls: string | null
  }
}

interface MatchServiceOptions {
  debug?: boolean
}

export async function getMatchResultsForUser(
  userId: string,
  options: MatchServiceOptions = {}
): Promise<MatchResults | null> {
  const debug = options.debug === true

  const myProfile = await prisma.profile.findUnique({
    where: { userId },
  })

  if (!myProfile) {
    return null
  }

  const userSubscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const hasPaid = userSubscription?.profilePaid === true
  const isApproved = myProfile.approvalStatus === 'approved'

  const candidates = await prisma.profile.findMany({
    where: {
      gender: myProfile.gender === 'male' ? 'female' : 'male',
      isActive: true,
      isSuspended: false,
      approvalStatus: 'approved',
      userId: { not: userId },
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
        },
      },
    },
  })

  if (debug) {
    console.log(`[MATCH DEBUG] User ${userId} (${myProfile.gender}) checking ${candidates.length} candidates`)
    console.log(`[MATCH DEBUG] My profile prefs: location=${myProfile.prefLocation}, qual=${myProfile.prefQualification}, caste=${myProfile.prefCaste}, diet=${myProfile.prefDiet}`)
  }

  const matchingProfiles = candidates.filter(candidate => {
    const isMatch = isMutualMatch(myProfile, candidate)
    if (!isMatch && debug) {
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

  if (debug) {
    console.log(`[MATCH DEBUG] Found ${matchingProfiles.length} matching profiles after filtering`)
  }

  const myDeclinedProfiles = await prisma.declinedProfile.findMany({
    where: { userId },
    select: { declinedUserId: true },
  })
  const declinedUserIds = new Set(myDeclinedProfiles.map(d => d.declinedUserId))

  const declinedByOthers = await prisma.declinedProfile.findMany({
    where: { declinedUserId: userId },
    select: { userId: true },
  })
  const declinedByOthersIds = new Set(declinedByOthers.map(d => d.userId))

  const myInterestsSent = await prisma.match.findMany({
    where: { senderId: userId },
    select: { receiverId: true, status: true },
  })
  const sentToUserIds = new Set(myInterestsSent.map(m => m.receiverId))

  const myInterestsReceived = await prisma.match.findMany({
    where: { receiverId: userId },
    select: { senderId: true, status: true },
  })
  const receivedFromUserIds = new Set(myInterestsReceived.map(m => m.senderId))

  const acceptedSentUserIds = new Set(
    myInterestsSent.filter(m => m.status === 'accepted').map(m => m.receiverId)
  )
  const acceptedReceivedUserIds = new Set(
    myInterestsReceived.filter(m => m.status === 'accepted').map(m => m.senderId)
  )

  const pendingReceivedUserIds = new Set(
    myInterestsReceived.filter(m => m.status === 'pending').map(m => m.senderId)
  )

  const freshProfiles = matchingProfiles.filter(match =>
    !sentToUserIds.has(match.userId) &&
    !declinedUserIds.has(match.userId) &&
    !declinedByOthersIds.has(match.userId) &&
    !acceptedSentUserIds.has(match.userId) &&
    !acceptedReceivedUserIds.has(match.userId)
  )

  const matchesWithInterest = await Promise.all(
    freshProfiles.map(async (match) => {
      const matchScore = calculateMatchScore(myProfile, match)
      const theirMatchScore = calculateMatchScore(match, myProfile)
      const theyLikedMeFirst = pendingReceivedUserIds.has(match.userId)

      return {
        ...match,
        matchScore,
        theirMatchScore,
        theyLikedMeFirst,
        interestStatus: {
          sentByMe: false,
          receivedFromThem: theyLikedMeFirst,
          mutual: false,
        },
        user: {
          id: match.user.id,
          name: match.user.name,
          email: undefined,
          phone: undefined,
          emailVerified: match.user.emailVerified,
          phoneVerified: match.user.phoneVerified,
        },
      }
    })
  )

  const mutualMatches = await Promise.all(
    matchingProfiles
      .filter(match => {
        const bothSentInterest = sentToUserIds.has(match.userId) && receivedFromUserIds.has(match.userId)
        const myInterestAccepted = acceptedSentUserIds.has(match.userId)
        const theirInterestAccepted = acceptedReceivedUserIds.has(match.userId)
        return bothSentInterest || myInterestAccepted || theirInterestAccepted
      })
      .map(async (match) => {
        const matchScore = calculateMatchScore(myProfile, match)
        const theirMatchScore = calculateMatchScore(match, myProfile)
        return {
          ...match,
          matchScore,
          theirMatchScore,
          interestStatus: {
            sentByMe: sentToUserIds.has(match.userId),
            receivedFromThem: receivedFromUserIds.has(match.userId),
            mutual: true,
          },
          user: match.user,
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
  // and engagement boosts (redeemed via coins, within 7 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const activeBoostedUserIds = new Set<string>()
  const profilesToActivateBoost: string[] = []

  for (const match of allCandidates) {
    // Referral boost (30-day window)
    const count = referralCountMap.get(match.referralCode || '') || 0
    if (count >= 3) {
      if (!match.referralBoostStart) {
        profilesToActivateBoost.push(match.id)
        activeBoostedUserIds.add(match.userId)
      } else if (new Date(match.referralBoostStart) > thirtyDaysAgo) {
        activeBoostedUserIds.add(match.userId)
      }
    }

    // Engagement boost (7-day window)
    if (match.engagementBoostStart && new Date(match.engagementBoostStart) > sevenDaysAgo) {
      activeBoostedUserIds.add(match.userId)
    }
  }

  if (profilesToActivateBoost.length > 0) {
    await prisma.profile.updateMany({
      where: { id: { in: profilesToActivateBoost } },
      data: { referralBoostStart: now },
    })
  }

  const sortedFreshMatches = matchesWithInterest.sort((a, b) => {
    // Priority 1: Profiles with active referral boost (3+ referrals, within 30 days)
    const aReferralBoost = activeBoostedUserIds.has(a.userId) ? 1 : 0
    const bReferralBoost = activeBoostedUserIds.has(b.userId) ? 1 : 0
    if (bReferralBoost !== aReferralBoost) return bReferralBoost - aReferralBoost

    // Priority 2: Profiles that liked me first
    const aLikedMe = a.theyLikedMeFirst ? 1 : 0
    const bLikedMe = b.theyLikedMeFirst ? 1 : 0
    if (bLikedMe !== aLikedMe) return bLikedMe - aLikedMe

    return (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
  })

  const sortedMutualMatches = mutualMatches.sort((a, b) => {
    const aReferralBoost = activeBoostedUserIds.has(a.userId) ? 1 : 0
    const bReferralBoost = activeBoostedUserIds.has(b.userId) ? 1 : 0
    if (bReferralBoost !== aReferralBoost) return bReferralBoost - aReferralBoost
    return (b.matchScore?.percentage || 0) - (a.matchScore?.percentage || 0)
  })

  const allMatches = [...sortedFreshMatches, ...sortedMutualMatches]

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

  const currentPotentialMatches = sortedFreshMatches.length
  await updateLifetimeMatches(userId, currentPotentialMatches)
  const updatedLifetimeStats = await getLifetimeStats(userId)

  return {
    matches: allMatches,
    freshMatches: sortedFreshMatches,
    mutualMatches: sortedMutualMatches,
    total: allMatches.length,
    stats: {
      potentialMatches: currentPotentialMatches,
      mutualMatches: sortedMutualMatches.length,
      likedYouCount: sortedFreshMatches.filter(m => m.theyLikedMeFirst).length,
      interestsSent: interestsSentStats,
      interestsReceived: interestsReceivedStats,
      declined: declinedUserIds.size,
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
      canExpressInterest: isApproved,
    },
    myProfile: {
      id: myProfile.id,
      gender: myProfile.gender,
      profileImageUrl: myProfile.profileImageUrl,
      photoUrls: myProfile.photoUrls,
    },
  }
}
