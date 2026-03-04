import { describe, expect, it } from 'vitest'
import { ENGAGEMENT_EARNING_RULES, POINTS_CONFIG } from '@/lib/engagementConfig'

describe('engagement reward configuration', () => {
  it('uses points-only economy with 100-point boost threshold', () => {
    expect(POINTS_CONFIG.DAILY_LOGIN).toBe(2)
    expect(POINTS_CONFIG.COMMUNITY_POST).toBe(5)
    expect(POINTS_CONFIG.COMMUNITY_COMMENT).toBe(1)
    expect(POINTS_CONFIG.REFERRAL_SUCCESS).toBe(30)
    expect(POINTS_CONFIG.POINTS_PER_BOOST).toBe(100)
    expect(POINTS_CONFIG.BOOST_DURATION_DAYS).toBe(7)
  })

  it('publishes all expected point-earning actions and labels', () => {
    const actions = ENGAGEMENT_EARNING_RULES.map((rule) => rule.action)
    expect(actions).toEqual([
      'daily_login',
      'community_post',
      'community_comment',
      'referral_joined',
      'express_interest',
      'respond_interest',
    ])

    expect(ENGAGEMENT_EARNING_RULES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'daily_login', label: 'Daily login', points: 2 }),
        expect.objectContaining({ action: 'community_post', label: 'Community post', points: 5 }),
        expect.objectContaining({ action: 'community_comment', label: 'Community comment', points: 1 }),
        expect.objectContaining({ action: 'referral_joined', label: 'Refer a friend', points: 30 }),
        expect.objectContaining({ action: 'express_interest', label: 'Express interest', points: 5 }),
        expect.objectContaining({ action: 'respond_interest', label: 'Respond to interest', points: 5 }),
      ])
    )
  })
})

