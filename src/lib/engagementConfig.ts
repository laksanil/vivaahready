export const POINTS_CONFIG = {
  DAILY_LOGIN: 5,
  DAILY_LOGIN_TIMEZONE: 'America/Los_Angeles',
  EXPRESS_INTEREST: 5,
  RESPOND_TO_INTEREST: 5,
  COMMUNITY_POST: 5,
  COMMUNITY_COMMENT: 1,
  REFERRAL_SUCCESS: 30,
  POINTS_PER_BOOST: 100,
  BOOST_DURATION_DAYS: 7,
} as const

export const ENGAGEMENT_EARNING_RULES = [
  { action: 'daily_login', label: 'Daily login', points: POINTS_CONFIG.DAILY_LOGIN, limit: '1x/day' },
  { action: 'community_post', label: 'Community post', points: POINTS_CONFIG.COMMUNITY_POST, limit: 'No limit' },
  { action: 'community_comment', label: 'Community comment', points: POINTS_CONFIG.COMMUNITY_COMMENT, limit: 'No limit' },
  { action: 'referral_joined', label: 'Refer a friend', points: POINTS_CONFIG.REFERRAL_SUCCESS, limit: 'Per successful signup' },
  { action: 'express_interest', label: 'Express interest', points: POINTS_CONFIG.EXPRESS_INTEREST, limit: 'No limit' },
  { action: 'respond_interest', label: 'Respond to interest', points: POINTS_CONFIG.RESPOND_TO_INTEREST, limit: 'No limit' },
] as const
