import { prisma } from './prisma'
import { POINTS_CONFIG } from './engagementConfig'

export { POINTS_CONFIG } from './engagementConfig'

export interface EngagementSummary {
  points: number
  activeBoost: {
    active: boolean
    expiresAt: string | null
    daysRemaining: number
  } | null
  progress: {
    pointsToNextBoost: number
    pointsPercent: number
  }
  recentActivity: {
    action: string
    points: number
    description: string | null
    createdAt: string
  }[]
  totals: {
    totalPointsEarned: number
    totalBoostsUsed: number
  }
}

function getUtcDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getUtcDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

function getBoostExpiryDate(start: Date): Date {
  return new Date(start.getTime() + POINTS_CONFIG.BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000)
}

async function autoActivateBoostFromPoints(userId: string): Promise<{ activated: boolean }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      engagementPoints: true,
      engagementBoostStart: true,
    },
  })

  if (!profile || profile.engagementPoints < POINTS_CONFIG.POINTS_PER_BOOST) {
    return { activated: false }
  }

  const now = new Date()
  let nextBoostStart = now

  if (profile.engagementBoostStart) {
    const currentExpiry = getBoostExpiryDate(profile.engagementBoostStart)
    if (currentExpiry > now) {
      // If boost is active, extend by one full boost duration.
      nextBoostStart = currentExpiry
    }
  }

  await prisma.$transaction([
    prisma.engagementPointLog.create({
      data: {
        userId,
        action: 'boost_redemption',
        points: -profile.engagementPoints,
        description: `Auto boost activated at ${POINTS_CONFIG.POINTS_PER_BOOST} points; points reset`,
      },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        engagementPoints: 0,
        engagementBoosts: { increment: 1 },
        engagementBoostStart: nextBoostStart,
      },
    }),
  ])

  return { activated: true }
}

async function normalizeTodayDailyLoginAmount(
  userId: string,
  currentPoints: number,
  date = new Date()
): Promise<number> {
  const { start, end } = getUtcDayRange(date)
  const logs = await prisma.engagementPointLog.findMany({
    where: {
      userId,
      action: 'daily_login',
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, points: true },
  })

  if (logs.length === 0) {
    return currentPoints
  }

  const actualTotal = logs.reduce((sum, log) => sum + log.points, 0)
  if (actualTotal === POINTS_CONFIG.DAILY_LOGIN) {
    return currentPoints
  }

  const delta = POINTS_CONFIG.DAILY_LOGIN - actualTotal
  const nextPoints = Math.max(0, currentPoints + delta)
  const primaryLogId = logs[0].id
  const duplicateLogIds = logs.slice(1).map((log) => log.id)

  await prisma.$transaction(async (tx) => {
    await tx.engagementPointLog.update({
      where: { id: primaryLogId },
      data: {
        points: POINTS_CONFIG.DAILY_LOGIN,
        description: 'Daily login bonus',
      },
    })

    if (duplicateLogIds.length > 0) {
      await tx.engagementPointLog.updateMany({
        where: { id: { in: duplicateLogIds } },
        data: {
          points: 0,
          description: 'Duplicate daily login entry (normalized)',
        },
      })
    }

    await tx.profile.update({
      where: { userId },
      data: { engagementPoints: nextPoints },
    })
  })

  await autoActivateBoostFromPoints(userId)

  return nextPoints
}

function parseEntityIdFromIdempotencyKey(
  idempotencyKey: string | null,
  expectedPrefix: string,
  userId: string
): string | null {
  if (!idempotencyKey) return null
  const parts = idempotencyKey.split(':')
  if (parts.length < 3) return null
  if (parts[0] !== expectedPrefix) return null
  if (parts[parts.length - 1] !== userId) return null
  const entityId = parts.slice(1, -1).join(':').trim()
  return entityId || null
}

function findMissingEntityIds(
  entityIds: string[],
  existingLogs: { idempotencyKey: string | null }[],
  prefix: string,
  userId: string
): string[] {
  const keyedIds = new Set<string>()
  let legacyCredits = 0

  for (const log of existingLogs) {
    const entityId = parseEntityIdFromIdempotencyKey(log.idempotencyKey, prefix, userId)
    if (entityId) {
      keyedIds.add(entityId)
    } else {
      legacyCredits += 1
    }
  }

  const unmatchedIds = entityIds.filter((id) => !keyedIds.has(id))
  if (legacyCredits <= 0) {
    return unmatchedIds
  }

  return unmatchedIds.slice(Math.min(legacyCredits, unmatchedIds.length))
}

async function reconcileCommunityActivityPoints(userId: string): Promise<void> {
  const [posts, comments, postLogs, commentLogs] = await Promise.all([
    prisma.communityPost.findMany({
      where: { authorId: userId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.postComment.findMany({
      where: { authorId: userId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.engagementPointLog.findMany({
      where: { userId, action: 'community_post' },
      select: { idempotencyKey: true },
    }),
    prisma.engagementPointLog.findMany({
      where: { userId, action: 'community_comment' },
      select: { idempotencyKey: true },
    }),
  ])

  const missingPostIds = findMissingEntityIds(
    posts.map((post) => post.id),
    postLogs,
    'community_post',
    userId
  )
  const missingCommentIds = findMissingEntityIds(
    comments.map((comment) => comment.id),
    commentLogs,
    'community_comment',
    userId
  )

  if (missingPostIds.length === 0 && missingCommentIds.length === 0) {
    return
  }

  const { createdPostLogs, createdCommentLogs } = await prisma.$transaction(async (tx) => {
    let createdPostLogs = 0
    let createdCommentLogs = 0

    if (missingPostIds.length > 0) {
      const result = await tx.engagementPointLog.createMany({
        data: missingPostIds.map((postId) => ({
          userId,
          action: 'community_post',
          points: POINTS_CONFIG.COMMUNITY_POST,
          description: 'Community post published',
          idempotencyKey: `community_post:${postId}:${userId}`,
        })),
        skipDuplicates: true,
      })
      createdPostLogs = result.count
    }

    if (missingCommentIds.length > 0) {
      const result = await tx.engagementPointLog.createMany({
        data: missingCommentIds.map((commentId) => ({
          userId,
          action: 'community_comment',
          points: POINTS_CONFIG.COMMUNITY_COMMENT,
          description: 'Commented on a community post',
          idempotencyKey: `community_comment:${commentId}:${userId}`,
        })),
        skipDuplicates: true,
      })
      createdCommentLogs = result.count
    }

    const pointsToAdd =
      (createdPostLogs * POINTS_CONFIG.COMMUNITY_POST) +
      (createdCommentLogs * POINTS_CONFIG.COMMUNITY_COMMENT)

    if (pointsToAdd > 0) {
      await tx.profile.update({
        where: { userId },
        data: { engagementPoints: { increment: pointsToAdd } },
      })
    }

    return { createdPostLogs, createdCommentLogs }
  })

  if (createdPostLogs > 0 || createdCommentLogs > 0) {
    await autoActivateBoostFromPoints(userId)
  }
}

/**
 * Award daily login points (idempotent — once per calendar day UTC)
 */
export async function awardDailyLoginPoints(userId: string): Promise<{ awarded: boolean; points: number; newBalance: number }> {
  const today = getUtcDateString(new Date())
  const idempotencyKey = `daily_login:${today}:${userId}`

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { lastPointAwardDate: true, engagementPoints: true },
  })

  if (!profile) return { awarded: false, points: 0, newBalance: 0 }

  if (profile.lastPointAwardDate && getUtcDateString(profile.lastPointAwardDate) === today) {
    const normalizedBalance = await normalizeTodayDailyLoginAmount(userId, profile.engagementPoints)
    return { awarded: false, points: 0, newBalance: normalizedBalance }
  }

  try {
    const [, updatedProfile] = await prisma.$transaction([
      prisma.engagementPointLog.create({
        data: {
          userId,
          action: 'daily_login',
          points: POINTS_CONFIG.DAILY_LOGIN,
          description: 'Daily login bonus',
          idempotencyKey,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: {
          engagementPoints: { increment: POINTS_CONFIG.DAILY_LOGIN },
          lastPointAwardDate: new Date(),
        },
      }),
    ])

    await autoActivateBoostFromPoints(userId)

    return { awarded: true, points: POINTS_CONFIG.DAILY_LOGIN, newBalance: updatedProfile.engagementPoints }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const latestProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { engagementPoints: true },
      })
      const normalizedBalance = await normalizeTodayDailyLoginAmount(
        userId,
        latestProfile?.engagementPoints || profile.engagementPoints
      )
      return { awarded: false, points: 0, newBalance: normalizedBalance }
    }
    throw error
  }
}

/**
 * Award points for expressing interest
 */
export async function awardInterestPoints(userId: string, matchId: string): Promise<{ awarded: boolean }> {
  const idempotencyKey = `express_interest:${matchId}:${userId}`

  try {
    await prisma.$transaction([
      prisma.engagementPointLog.create({
        data: {
          userId,
          action: 'express_interest',
          points: POINTS_CONFIG.EXPRESS_INTEREST,
          description: 'Expressed interest in a match',
          idempotencyKey,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: { engagementPoints: { increment: POINTS_CONFIG.EXPRESS_INTEREST } },
      }),
    ])

    await autoActivateBoostFromPoints(userId)

    return { awarded: true }
  } catch (error: any) {
    if (error?.code === 'P2002') return { awarded: false }
    throw error
  }
}

/**
 * Award points for responding to an interest (accept or decline)
 */
export async function awardResponsePoints(userId: string, matchId: string): Promise<{ awarded: boolean }> {
  const idempotencyKey = `respond_interest:${matchId}:${userId}`

  try {
    await prisma.$transaction([
      prisma.engagementPointLog.create({
        data: {
          userId,
          action: 'respond_interest',
          points: POINTS_CONFIG.RESPOND_TO_INTEREST,
          description: 'Responded to an interest',
          idempotencyKey,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: { engagementPoints: { increment: POINTS_CONFIG.RESPOND_TO_INTEREST } },
      }),
    ])

    await autoActivateBoostFromPoints(userId)

    return { awarded: true }
  } catch (error: any) {
    if (error?.code === 'P2002') return { awarded: false }
    throw error
  }
}

/**
 * Award points for community post (per post)
 */
export async function awardCommunityPostPoints(userId: string, postId: string): Promise<{ awarded: boolean }> {
  const idempotencyKey = `community_post:${postId}:${userId}`

  try {
    await prisma.$transaction([
      prisma.engagementPointLog.create({
        data: {
          userId,
          action: 'community_post',
          points: POINTS_CONFIG.COMMUNITY_POST,
          description: 'Community post published',
          idempotencyKey,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: { engagementPoints: { increment: POINTS_CONFIG.COMMUNITY_POST } },
      }),
    ])

    await autoActivateBoostFromPoints(userId)

    return { awarded: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return { awarded: false }
    throw error
  }
}

/**
 * Award points for community comments (1 point per comment)
 */
export async function awardCommunityCommentPoints(userId: string, commentId: string): Promise<{ awarded: boolean }> {
  const idempotencyKey = `community_comment:${commentId}:${userId}`

  try {
    await prisma.$transaction([
      prisma.engagementPointLog.create({
        data: {
          userId,
          action: 'community_comment',
          points: POINTS_CONFIG.COMMUNITY_COMMENT,
          description: 'Commented on a community post',
          idempotencyKey,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: { engagementPoints: { increment: POINTS_CONFIG.COMMUNITY_COMMENT } },
      }),
    ])

    await autoActivateBoostFromPoints(userId)

    return { awarded: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return { awarded: false }
    throw error
  }
}

/**
 * Award points to referrer when a referred user successfully creates profile
 */
export async function awardReferralPoints(referrerUserId: string, referredUserId: string): Promise<{ awarded: boolean }> {
  const idempotencyKey = `referral_joined:${referredUserId}:${referrerUserId}`

  try {
    await prisma.$transaction([
      prisma.engagementPointLog.create({
        data: {
          userId: referrerUserId,
          action: 'referral_joined',
          points: POINTS_CONFIG.REFERRAL_SUCCESS,
          description: 'Referral joined successfully',
          idempotencyKey,
        },
      }),
      prisma.profile.update({
        where: { userId: referrerUserId },
        data: { engagementPoints: { increment: POINTS_CONFIG.REFERRAL_SUCCESS } },
      }),
    ])

    await autoActivateBoostFromPoints(referrerUserId)

    return { awarded: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return { awarded: false }
    throw error
  }
}

/**
 * Get full engagement summary for a user
 */
export async function getEngagementSummary(userId: string): Promise<EngagementSummary | null> {
  let profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      engagementPoints: true,
      engagementBoosts: true,
      engagementBoostStart: true,
    },
  })

  if (!profile) return null

  // Keep legacy entries aligned with current rule set (+2 daily login, points for all posts/comments).
  await normalizeTodayDailyLoginAmount(userId, profile.engagementPoints)
  await reconcileCommunityActivityPoints(userId)

  profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      engagementPoints: true,
      engagementBoosts: true,
      engagementBoostStart: true,
    },
  })

  if (!profile) return null

  let activeBoost: EngagementSummary['activeBoost'] = null
  if (profile.engagementBoostStart) {
    const expiresAt = getBoostExpiryDate(profile.engagementBoostStart)
    const now = new Date()
    if (expiresAt > now) {
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      activeBoost = {
        active: true,
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
      }
    }
  }

  const recentLogs = await prisma.engagementPointLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const totalPointsEarned = await prisma.engagementPointLog.aggregate({
    where: { userId, points: { gt: 0 } },
    _sum: { points: true },
  })

  const pointsProgress = profile.engagementPoints % POINTS_CONFIG.POINTS_PER_BOOST

  return {
    points: profile.engagementPoints,
    activeBoost,
    progress: {
      pointsToNextBoost: POINTS_CONFIG.POINTS_PER_BOOST - pointsProgress,
      pointsPercent: pointsProgress,
    },
    recentActivity: recentLogs.map((log) => ({
      action: log.action,
      points: log.points,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
    })),
    totals: {
      totalPointsEarned: totalPointsEarned._sum.points || 0,
      totalBoostsUsed: profile.engagementBoosts,
    },
  }
}
