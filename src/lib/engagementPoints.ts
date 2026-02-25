import { prisma } from './prisma'
import { POINTS_CONFIG } from './engagementConfig'

export { POINTS_CONFIG } from './engagementConfig'

export interface EngagementSummary {
  points: number
  coins: number
  boostsAvailable: number
  activeBoost: {
    active: boolean
    expiresAt: string | null
    daysRemaining: number
  } | null
  progress: {
    pointsToNextCoin: number
    coinsToNextBoost: number
    pointsPercent: number
    coinsPercent: number
  }
  recentActivity: {
    action: string
    points: number
    description: string | null
    createdAt: string
  }[]
  totals: {
    totalPointsEarned: number
    totalCoinsEarned: number
    totalBoostsUsed: number
  }
}

function getUtcDateString(date: Date): string {
  return date.toISOString().split('T')[0]
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

  // Quick check: if last award was today, skip
  if (profile.lastPointAwardDate && getUtcDateString(profile.lastPointAwardDate) === today) {
    return { awarded: false, points: 0, newBalance: profile.engagementPoints }
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

    await autoConvertPointsToCoins(userId)

    return { awarded: true, points: POINTS_CONFIG.DAILY_LOGIN, newBalance: updatedProfile.engagementPoints }
  } catch (error: any) {
    // Unique constraint violation = already awarded (race condition guard)
    if (error?.code === 'P2002') {
      return { awarded: false, points: 0, newBalance: profile.engagementPoints }
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

    await autoConvertPointsToCoins(userId)

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

    await autoConvertPointsToCoins(userId)

    return { awarded: true }
  } catch (error: any) {
    if (error?.code === 'P2002') return { awarded: false }
    throw error
  }
}

/**
 * Award points for community post (max once per day)
 */
export async function awardCommunityPostPoints(userId: string): Promise<{ awarded: boolean }> {
  const today = getUtcDateString(new Date())
  const idempotencyKey = `community_post:${today}:${userId}`

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

    await autoConvertPointsToCoins(userId)

    return { awarded: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return { awarded: false }
    throw error
  }
}

/**
 * Auto-convert points to coins when balance >= 100
 */
export async function autoConvertPointsToCoins(userId: string): Promise<{ converted: boolean; coinsEarned: number }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { engagementPoints: true },
  })

  if (!profile || profile.engagementPoints < POINTS_CONFIG.POINTS_PER_COIN) {
    return { converted: false, coinsEarned: 0 }
  }

  const coinsEarned = Math.floor(profile.engagementPoints / POINTS_CONFIG.POINTS_PER_COIN)
  const pointsSpent = coinsEarned * POINTS_CONFIG.POINTS_PER_COIN

  await prisma.$transaction([
    prisma.engagementPointLog.create({
      data: {
        userId,
        action: 'coin_conversion',
        points: -pointsSpent,
        description: `Converted ${pointsSpent} points to ${coinsEarned} coin${coinsEarned > 1 ? 's' : ''}`,
      },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        engagementPoints: { decrement: pointsSpent },
        engagementCoins: { increment: coinsEarned },
      },
    }),
  ])

  return { converted: true, coinsEarned }
}

/**
 * Redeem a boost (costs 5 coins, lasts 7 days)
 */
export async function redeemBoost(userId: string): Promise<{ success: boolean; expiresAt: Date | null; error?: string }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { engagementCoins: true, engagementBoostStart: true },
  })

  if (!profile) return { success: false, expiresAt: null, error: 'Profile not found' }

  // Check for active boost
  if (profile.engagementBoostStart) {
    const boostExpiry = new Date(profile.engagementBoostStart.getTime() + POINTS_CONFIG.BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000)
    if (boostExpiry > new Date()) {
      return { success: false, expiresAt: boostExpiry, error: 'Boost already active' }
    }
  }

  if (profile.engagementCoins < POINTS_CONFIG.COINS_PER_BOOST) {
    return { success: false, expiresAt: null, error: `Need ${POINTS_CONFIG.COINS_PER_BOOST} coins, have ${profile.engagementCoins}` }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + POINTS_CONFIG.BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.engagementPointLog.create({
      data: {
        userId,
        action: 'boost_redemption',
        points: 0,
        description: `Redeemed boost (${POINTS_CONFIG.COINS_PER_BOOST} coins) — active for ${POINTS_CONFIG.BOOST_DURATION_DAYS} days`,
      },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        engagementCoins: { decrement: POINTS_CONFIG.COINS_PER_BOOST },
        engagementBoosts: { increment: 1 },
        engagementBoostStart: now,
      },
    }),
  ])

  return { success: true, expiresAt }
}

/**
 * Get full engagement summary for a user
 */
export async function getEngagementSummary(userId: string): Promise<EngagementSummary | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      engagementPoints: true,
      engagementCoins: true,
      engagementBoosts: true,
      engagementBoostStart: true,
    },
  })

  if (!profile) return null

  // Check active boost
  let activeBoost: EngagementSummary['activeBoost'] = null
  if (profile.engagementBoostStart) {
    const expiresAt = new Date(profile.engagementBoostStart.getTime() + POINTS_CONFIG.BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000)
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

  // Recent activity
  const recentLogs = await prisma.engagementPointLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Totals
  const totalPointsEarned = await prisma.engagementPointLog.aggregate({
    where: { userId, points: { gt: 0 } },
    _sum: { points: true },
  })

  const coinConversionLogs = await prisma.engagementPointLog.aggregate({
    where: { userId, action: 'coin_conversion' },
    _sum: { points: true },
  })
  const totalCoinsEarned = Math.abs(coinConversionLogs._sum.points || 0) / POINTS_CONFIG.POINTS_PER_COIN

  return {
    points: profile.engagementPoints,
    coins: profile.engagementCoins,
    boostsAvailable: Math.floor(profile.engagementCoins / POINTS_CONFIG.COINS_PER_BOOST),
    activeBoost,
    progress: {
      pointsToNextCoin: POINTS_CONFIG.POINTS_PER_COIN - (profile.engagementPoints % POINTS_CONFIG.POINTS_PER_COIN),
      coinsToNextBoost: POINTS_CONFIG.COINS_PER_BOOST - (profile.engagementCoins % POINTS_CONFIG.COINS_PER_BOOST),
      pointsPercent: (profile.engagementPoints % POINTS_CONFIG.POINTS_PER_COIN),
      coinsPercent: Math.round((profile.engagementCoins % POINTS_CONFIG.COINS_PER_BOOST) / POINTS_CONFIG.COINS_PER_BOOST * 100),
    },
    recentActivity: recentLogs.map((log) => ({
      action: log.action,
      points: log.points,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
    })),
    totals: {
      totalPointsEarned: totalPointsEarned._sum.points || 0,
      totalCoinsEarned: Math.round(totalCoinsEarned),
      totalBoostsUsed: profile.engagementBoosts,
    },
  }
}
