export const POINTS_CONFIG = {
  DAILY_LOGIN: 10,
  EXPRESS_INTEREST: 5,
  RESPOND_TO_INTEREST: 5,
  COMMUNITY_POST: 5,
  POINTS_PER_COIN: 100,
  COINS_PER_BOOST: 5,
  BOOST_DURATION_DAYS: 7,
} as const

export const ENGAGEMENT_EARNING_RULES = [
  { action: 'daily_login', label: 'Daily login', points: POINTS_CONFIG.DAILY_LOGIN, limit: '1x/day' },
  { action: 'community_post', label: 'Community post', points: POINTS_CONFIG.COMMUNITY_POST, limit: '1x/day' },
  { action: 'express_interest', label: 'Express interest', points: POINTS_CONFIG.EXPRESS_INTEREST, limit: 'No limit' },
  { action: 'respond_interest', label: 'Respond to interest', points: POINTS_CONFIG.RESPOND_TO_INTEREST, limit: 'No limit' },
] as const
