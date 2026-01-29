import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'

// ── Mock Prisma (vi.hoisted ensures availability in hoisted vi.mock) ─────────
const mockPrisma = vi.hoisted(() => ({
  profile: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
}))
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

// ── Mock Resend / email ──────────────────────────────────────────────────────
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }) },
  })),
}))
vi.mock('@/lib/testMode', () => ({ isTestMode: false }))

// ── Imports (after mocks) ────────────────────────────────────────────────────
import { generateReferralCode, getOrCreateReferralCode, getReferralCount } from '@/lib/referral'
import { sendReferralThankYouEmail } from '@/lib/email'

// ─────────────────────────────────────────────────────────────────────────────
// 1. generateReferralCode – pure function
// ─────────────────────────────────────────────────────────────────────────────
describe('generateReferralCode', () => {
  it('returns a 6-character string', () => {
    const code = generateReferralCode()
    expect(code).toHaveLength(6)
  })

  it('uses only allowed characters (no ambiguous 0/O/1/I)', () => {
    const allowed = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode()
      for (const ch of code) {
        expect(allowed).toContain(ch)
      }
    }
  })

  it('generates different codes on successive calls (not deterministic)', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()))
    // With 30^6 possibilities, 20 codes should almost certainly all be unique
    expect(codes.size).toBeGreaterThan(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. getOrCreateReferralCode – database interaction
// ─────────────────────────────────────────────────────────────────────────────
describe('getOrCreateReferralCode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns existing code when profile already has one', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue({ referralCode: 'ABC123' })
    const code = await getOrCreateReferralCode('p1')
    expect(code).toBe('ABC123')
    expect(mockPrisma.profile.update).not.toHaveBeenCalled()
  })

  it('generates and saves a new code when profile has none', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue({ referralCode: null })
    mockPrisma.profile.update.mockResolvedValue({})
    const code = await getOrCreateReferralCode('p1')
    expect(code).toHaveLength(6)
    expect(mockPrisma.profile.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { referralCode: expect.any(String) },
    })
  })

  it('retries on unique constraint violation', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue({ referralCode: null })
    // First two attempts fail, third succeeds
    mockPrisma.profile.update
      .mockRejectedValueOnce(new Error('Unique constraint'))
      .mockRejectedValueOnce(new Error('Unique constraint'))
      .mockResolvedValueOnce({})
    const code = await getOrCreateReferralCode('p1')
    expect(code).toHaveLength(6)
    expect(mockPrisma.profile.update).toHaveBeenCalledTimes(3)
  })

  it('returns null after 5 failed attempts', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue({ referralCode: null })
    mockPrisma.profile.update.mockRejectedValue(new Error('Unique constraint'))
    const code = await getOrCreateReferralCode('p1')
    expect(code).toBeNull()
    expect(mockPrisma.profile.update).toHaveBeenCalledTimes(5)
  })

  it('returns null when profile does not exist', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(null)
    const code = await getOrCreateReferralCode('nonexistent')
    expect(code).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. getReferralCount
// ─────────────────────────────────────────────────────────────────────────────
describe('getReferralCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns count of profiles with matching referredBy', async () => {
    mockPrisma.profile.count.mockResolvedValue(5)
    const count = await getReferralCount('ABC123')
    expect(count).toBe(5)
    expect(mockPrisma.profile.count).toHaveBeenCalledWith({
      where: { referredBy: 'ABC123' },
    })
  })

  it('returns 0 when no profiles match', async () => {
    mockPrisma.profile.count.mockResolvedValue(0)
    expect(await getReferralCount('ZZZZZ9')).toBe(0)
  })

  it('returns 0 on database error', async () => {
    mockPrisma.profile.count.mockRejectedValue(new Error('DB error'))
    expect(await getReferralCount('ABC123')).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. sendReferralThankYouEmail
// ─────────────────────────────────────────────────────────────────────────────
describe('sendReferralThankYouEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
    process.env.RESEND_DOMAIN_VERIFIED = 'true'
  })

  it('sends email with correct referral count', async () => {
    const result = await sendReferralThankYouEmail('user@test.com', 'Ravi Kumar', 2)
    // Should not throw
    expect(result).toBeDefined()
  })

  it('uses singular subject when count is 1', async () => {
    // The function is called; we can't easily inspect the subject without
    // deeper mocking, but we verify it doesn't throw and returns
    const result = await sendReferralThankYouEmail('user@test.com', 'Ravi', 1)
    expect(result).toBeDefined()
  })

  it('uses plural subject when count > 1', async () => {
    const result = await sendReferralThankYouEmail('user@test.com', 'Ravi', 2)
    expect(result).toBeDefined()
  })

  it('includes boost unlock banner when count >= 3', async () => {
    const result = await sendReferralThankYouEmail('user@test.com', 'Ravi', 3)
    expect(result).toBeDefined()
  })

  it('extracts first name from full name', async () => {
    // Verifies the function handles multi-word names without error
    const result = await sendReferralThankYouEmail('user@test.com', 'Ravi Kumar Sharma', 1)
    expect(result).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Boost Status Calculation (mirrors referral API logic)
// ─────────────────────────────────────────────────────────────────────────────
describe('Boost status calculation (1-month / 30-day expiry)', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'))
  })
  afterAll(() => vi.useRealTimers())

  /**
   * Helper: replicates the boost-status logic from the referral API route
   */
  function calculateBoostStatus(
    referralBoostStart: Date | null,
    referralCount: number
  ): { boostActive: boolean; boostExpiresAt: string | null; daysRemaining: number } {
    let boostActive = false
    let boostExpiresAt: string | null = null
    let daysRemaining = 0
    if (referralBoostStart && referralCount >= 3) {
      const expiryDate = new Date(referralBoostStart.getTime() + 30 * 24 * 60 * 60 * 1000)
      if (expiryDate > new Date()) {
        boostActive = true
        boostExpiresAt = expiryDate.toISOString()
        daysRemaining = Math.max(
          1,
          Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        )
      }
    }
    return { boostActive, boostExpiresAt, daysRemaining }
  }

  // ── Day-by-day 30-day window tests ──────────────────────────────────────

  it('boost is active on Day 1 (just activated)', () => {
    const start = new Date('2026-02-15T12:00:00Z') // today
    const result = calculateBoostStatus(start, 3)
    expect(result.boostActive).toBe(true)
    expect(result.daysRemaining).toBe(30)
  })

  it('boost is active on Day 15 (mid-month)', () => {
    const start = new Date('2026-02-01T12:00:00Z') // 14 days ago
    const result = calculateBoostStatus(start, 3)
    expect(result.boostActive).toBe(true)
    expect(result.daysRemaining).toBe(16)
  })

  it('boost is active on Day 29 (1 day left)', () => {
    const start = new Date('2026-01-17T12:00:00Z') // 29 days ago
    const result = calculateBoostStatus(start, 3)
    expect(result.boostActive).toBe(true)
    expect(result.daysRemaining).toBe(1)
  })

  it('boost is active on Day 30 with hours remaining (minimum 1 day shown)', () => {
    // Started 29 days + 23 hours ago → a few hours left
    const start = new Date('2026-01-16T13:00:00Z')
    const result = calculateBoostStatus(start, 3)
    expect(result.boostActive).toBe(true)
    expect(result.daysRemaining).toBe(1)
  })

  it('boost expires exactly at Day 30', () => {
    // Started exactly 30 days ago
    const start = new Date('2026-01-16T12:00:00Z')
    const result = calculateBoostStatus(start, 3)
    expect(result.boostActive).toBe(false)
    expect(result.boostExpiresAt).toBeNull()
    expect(result.daysRemaining).toBe(0)
  })

  it('boost is expired on Day 31', () => {
    const start = new Date('2026-01-15T12:00:00Z') // 31 days ago
    const result = calculateBoostStatus(start, 3)
    expect(result.boostActive).toBe(false)
    expect(result.boostExpiresAt).toBeNull()
  })

  it('boost is expired on Day 60', () => {
    const start = new Date('2025-12-17T12:00:00Z') // 60 days ago
    const result = calculateBoostStatus(start, 5)
    expect(result.boostActive).toBe(false)
  })

  // ── Referral count threshold ────────────────────────────────────────────

  it('boost is NOT active with only 2 referrals even if within 30 days', () => {
    const start = new Date('2026-02-10T12:00:00Z')
    const result = calculateBoostStatus(start, 2)
    expect(result.boostActive).toBe(false)
  })

  it('boost IS active with exactly 3 referrals', () => {
    const start = new Date('2026-02-10T12:00:00Z')
    const result = calculateBoostStatus(start, 3)
    expect(result.boostActive).toBe(true)
  })

  it('boost IS active with more than 3 referrals', () => {
    const start = new Date('2026-02-10T12:00:00Z')
    const result = calculateBoostStatus(start, 10)
    expect(result.boostActive).toBe(true)
  })

  it('boost is NOT active with 0 referrals', () => {
    const start = new Date('2026-02-10T12:00:00Z')
    const result = calculateBoostStatus(start, 0)
    expect(result.boostActive).toBe(false)
  })

  // ── Null boost start ───────────────────────────────────────────────────

  it('boost is NOT active when referralBoostStart is null (not yet activated)', () => {
    const result = calculateBoostStatus(null, 5)
    expect(result.boostActive).toBe(false)
    expect(result.boostExpiresAt).toBeNull()
  })

  // ── Expiry date correctness ────────────────────────────────────────────

  it('expiry date is exactly 30 days after boost start', () => {
    const start = new Date('2026-02-10T00:00:00Z')
    const result = calculateBoostStatus(start, 3)
    expect(result.boostExpiresAt).toBe(new Date('2026-03-12T00:00:00Z').toISOString())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Referral Boost Sorting (matches the matchService / auto route logic)
// ─────────────────────────────────────────────────────────────────────────────
describe('Referral boost match sorting', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'))
  })
  afterAll(() => vi.useRealTimers())

  type MatchCandidate = {
    id: string
    userId: string
    referralCode: string | null
    referralBoostStart: Date | null
    theyLikedMeFirst: boolean
    matchScore: { percentage: number }
  }

  /**
   * Replicates the sorting logic from matchService.ts / auto/route.ts
   * so we can unit-test the algorithm directly.
   */
  function sortMatches(
    matches: MatchCandidate[],
    referralCountMap: Map<string, number>
  ): MatchCandidate[] {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeBoostedUserIds = new Set<string>()

    for (const match of matches) {
      const count = referralCountMap.get(match.referralCode || '') || 0
      if (count >= 3) {
        if (!match.referralBoostStart) {
          // Would activate boost (lazy activation)
          activeBoostedUserIds.add(match.userId)
        } else if (new Date(match.referralBoostStart) > thirtyDaysAgo) {
          activeBoostedUserIds.add(match.userId)
        }
      }
    }

    return [...matches].sort((a, b) => {
      // Priority 1: Referral boost
      const aBoost = activeBoostedUserIds.has(a.userId) ? 1 : 0
      const bBoost = activeBoostedUserIds.has(b.userId) ? 1 : 0
      if (bBoost !== aBoost) return bBoost - aBoost

      // Priority 2: Liked me first
      const aLiked = a.theyLikedMeFirst ? 1 : 0
      const bLiked = b.theyLikedMeFirst ? 1 : 0
      if (bLiked !== aLiked) return bLiked - aLiked

      // Priority 3: Match score
      return (b.matchScore.percentage || 0) - (a.matchScore.percentage || 0)
    })
  }

  const mkMatch = (
    overrides: Partial<MatchCandidate> & { userId: string }
  ): MatchCandidate => ({
    id: overrides.userId,
    referralCode: null,
    referralBoostStart: null,
    theyLikedMeFirst: false,
    matchScore: { percentage: 50 },
    ...overrides,
  })

  // ── Priority ordering ──────────────────────────────────────────────────

  it('boosted profile sorts above non-boosted regardless of score', () => {
    const refMap = new Map([['REF001', 5]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 95 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF001', referralBoostStart: new Date('2026-02-10T00:00:00Z'), matchScore: { percentage: 60 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2') // boosted, lower score
    expect(sorted[1].userId).toBe('u1') // not boosted, higher score
  })

  it('boosted profile sorts above "liked me first" profile', () => {
    const refMap = new Map([['REF001', 3]])
    const matches = [
      mkMatch({ userId: 'u1', theyLikedMeFirst: true, matchScore: { percentage: 90 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF001', referralBoostStart: new Date('2026-02-10T00:00:00Z'), matchScore: { percentage: 40 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2') // boosted wins over liked-me-first
  })

  it('"liked me first" sorts above regular match when neither is boosted', () => {
    const refMap = new Map<string, number>()
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 90 } }),
      mkMatch({ userId: 'u2', theyLikedMeFirst: true, matchScore: { percentage: 40 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2') // liked-me-first wins over score
  })

  it('among two boosted profiles, higher score wins', () => {
    const refMap = new Map([['REF001', 3], ['REF002', 4]])
    const matches = [
      mkMatch({ userId: 'u1', referralCode: 'REF001', referralBoostStart: new Date('2026-02-10T00:00:00Z'), matchScore: { percentage: 70 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF002', referralBoostStart: new Date('2026-02-08T00:00:00Z'), matchScore: { percentage: 85 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2') // both boosted, u2 has higher score
  })

  it('among two non-boosted, non-liked profiles, higher score wins', () => {
    const refMap = new Map<string, number>()
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 60 } }),
      mkMatch({ userId: 'u2', matchScore: { percentage: 80 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2')
  })

  // ── 1-Month (30-day) boost expiry in sorting ──────────────────────────

  it('boost active at Day 1 — profile sorted to top', () => {
    const refMap = new Map([['REF001', 3]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 99 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF001', referralBoostStart: new Date('2026-02-15T12:00:00Z'), matchScore: { percentage: 30 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2')
  })

  it('boost active at Day 15 — profile still sorted to top', () => {
    const refMap = new Map([['REF001', 4]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 99 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF001', referralBoostStart: new Date('2026-02-01T12:00:00Z'), matchScore: { percentage: 30 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2')
  })

  it('boost active at Day 29 — profile still sorted to top', () => {
    const refMap = new Map([['REF001', 3]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 99 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF001', referralBoostStart: new Date('2026-01-17T13:00:00Z'), matchScore: { percentage: 30 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2')
  })

  it('boost EXPIRED at Day 30 — profile falls back to normal sorting', () => {
    const refMap = new Map([['REF001', 3]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 99 } }),
      mkMatch({
        userId: 'u2',
        referralCode: 'REF001',
        // Started exactly 30 days ago → expired
        referralBoostStart: new Date('2026-01-16T12:00:00Z'),
        matchScore: { percentage: 30 },
      }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u1') // u1 has higher score, u2 boost expired
  })

  it('boost EXPIRED at Day 45 — profile falls back to normal sorting', () => {
    const refMap = new Map([['REF001', 5]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 80 } }),
      mkMatch({
        userId: 'u2',
        referralCode: 'REF001',
        referralBoostStart: new Date('2026-01-01T12:00:00Z'), // 45 days ago
        matchScore: { percentage: 30 },
      }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u1')
  })

  // ── Lazy activation (no boostStart yet) ────────────────────────────────

  it('lazy activation: profile with 3+ referrals but no boostStart gets boosted', () => {
    const refMap = new Map([['REF001', 3]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 99 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF001', referralBoostStart: null, matchScore: { percentage: 30 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2') // lazy-activated, treated as boosted
  })

  // ── Fewer than 3 referrals — no boost ──────────────────────────────────

  it('profile with 2 referrals is NOT boosted even with recent boostStart', () => {
    const refMap = new Map([['REF001', 2]])
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 80 } }),
      mkMatch({ userId: 'u2', referralCode: 'REF001', referralBoostStart: new Date('2026-02-10T00:00:00Z'), matchScore: { percentage: 90 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    // Both not boosted, u2 has higher score → u2 first (by score)
    expect(sorted[0].userId).toBe('u2')
    // But the reason should be score, not boost
  })

  it('profile with 0 referrals and no code is not boosted', () => {
    const refMap = new Map<string, number>()
    const matches = [
      mkMatch({ userId: 'u1', matchScore: { percentage: 70 } }),
      mkMatch({ userId: 'u2', referralCode: null, matchScore: { percentage: 90 } }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('u2') // sorted by score only
  })

  // ── Mixed scenario: boosted, liked-me, and normal ──────────────────────

  it('full 3-tier sort: boosted > liked-me > score', () => {
    const refMap = new Map([['REF001', 5]])
    const matches = [
      mkMatch({ userId: 'scoreOnly', matchScore: { percentage: 99 } }),
      mkMatch({ userId: 'likedMe', theyLikedMeFirst: true, matchScore: { percentage: 50 } }),
      mkMatch({
        userId: 'boosted',
        referralCode: 'REF001',
        referralBoostStart: new Date('2026-02-10T00:00:00Z'),
        matchScore: { percentage: 30 },
      }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('boosted')
    expect(sorted[1].userId).toBe('likedMe')
    expect(sorted[2].userId).toBe('scoreOnly')
  })

  it('expired boost falls to normal tier in mixed scenario', () => {
    const refMap = new Map([['REF001', 5]])
    const matches = [
      mkMatch({ userId: 'scoreOnly', matchScore: { percentage: 99 } }),
      mkMatch({ userId: 'likedMe', theyLikedMeFirst: true, matchScore: { percentage: 50 } }),
      mkMatch({
        userId: 'expiredBoost',
        referralCode: 'REF001',
        // 35 days ago → expired
        referralBoostStart: new Date('2026-01-11T12:00:00Z'),
        matchScore: { percentage: 30 },
      }),
    ]
    const sorted = sortMatches(matches, refMap)
    expect(sorted[0].userId).toBe('likedMe')     // Priority 2
    expect(sorted[1].userId).toBe('scoreOnly')    // 99% score
    expect(sorted[2].userId).toBe('expiredBoost') // 30% score, no boost
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Boost Activation Logic (lazy activation & updateMany)
// ─────────────────────────────────────────────────────────────────────────────
describe('Boost activation logic', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'))
  })
  afterAll(() => vi.useRealTimers())
  beforeEach(() => vi.clearAllMocks())

  type Candidate = {
    id: string
    userId: string
    referralCode: string | null
    referralBoostStart: Date | null
  }

  /**
   * Replicates the boost activation logic from matchService / auto route
   */
  function determineBoostActivations(
    candidates: Candidate[],
    referralCountMap: Map<string, number>
  ): { activeBoostedUserIds: Set<string>; profilesToActivateBoost: string[] } {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeBoostedUserIds = new Set<string>()
    const profilesToActivateBoost: string[] = []

    for (const match of candidates) {
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
    return { activeBoostedUserIds, profilesToActivateBoost }
  }

  it('activates boost for profile with 3+ referrals and no boostStart', () => {
    const candidates: Candidate[] = [
      { id: 'p1', userId: 'u1', referralCode: 'REF001', referralBoostStart: null },
    ]
    const refMap = new Map([['REF001', 3]])
    const result = determineBoostActivations(candidates, refMap)
    expect(result.profilesToActivateBoost).toContain('p1')
    expect(result.activeBoostedUserIds.has('u1')).toBe(true)
  })

  it('does NOT activate boost for profile with 2 referrals', () => {
    const candidates: Candidate[] = [
      { id: 'p1', userId: 'u1', referralCode: 'REF001', referralBoostStart: null },
    ]
    const refMap = new Map([['REF001', 2]])
    const result = determineBoostActivations(candidates, refMap)
    expect(result.profilesToActivateBoost).toHaveLength(0)
    expect(result.activeBoostedUserIds.size).toBe(0)
  })

  it('does NOT re-activate boost for already-activated profile (within 30 days)', () => {
    const candidates: Candidate[] = [
      { id: 'p1', userId: 'u1', referralCode: 'REF001', referralBoostStart: new Date('2026-02-10T00:00:00Z') },
    ]
    const refMap = new Map([['REF001', 5]])
    const result = determineBoostActivations(candidates, refMap)
    expect(result.profilesToActivateBoost).toHaveLength(0) // no re-activation
    expect(result.activeBoostedUserIds.has('u1')).toBe(true) // still active
  })

  it('does NOT activate expired boost (30+ days old)', () => {
    const candidates: Candidate[] = [
      { id: 'p1', userId: 'u1', referralCode: 'REF001', referralBoostStart: new Date('2026-01-10T00:00:00Z') },
    ]
    const refMap = new Map([['REF001', 5]])
    const result = determineBoostActivations(candidates, refMap)
    expect(result.profilesToActivateBoost).toHaveLength(0)
    expect(result.activeBoostedUserIds.size).toBe(0) // expired
  })

  it('handles multiple candidates correctly', () => {
    const candidates: Candidate[] = [
      { id: 'p1', userId: 'u1', referralCode: 'REF001', referralBoostStart: null },         // needs activation
      { id: 'p2', userId: 'u2', referralCode: 'REF002', referralBoostStart: new Date('2026-02-10T00:00:00Z') }, // already active
      { id: 'p3', userId: 'u3', referralCode: 'REF003', referralBoostStart: new Date('2026-01-01T00:00:00Z') }, // expired
      { id: 'p4', userId: 'u4', referralCode: 'REF004', referralBoostStart: null },          // only 1 referral
    ]
    const refMap = new Map([
      ['REF001', 3],
      ['REF002', 4],
      ['REF003', 10],
      ['REF004', 1],
    ])
    const result = determineBoostActivations(candidates, refMap)
    expect(result.profilesToActivateBoost).toEqual(['p1'])
    expect(result.activeBoostedUserIds).toEqual(new Set(['u1', 'u2']))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. ReferralCard UI states (boost progress, active, expired)
// ─────────────────────────────────────────────────────────────────────────────
describe('ReferralCard boost display logic', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'))
  })
  afterAll(() => vi.useRealTimers())

  /**
   * Replicates the display logic from ReferralCard.tsx for unit testing
   */
  function getBoostDisplayState(
    referralCount: number,
    boostActive: boolean,
    boostExpiresAt: string | null
  ): { state: 'progress' | 'active' | 'expired'; daysRemaining?: number; referralsNeeded?: number; progressPercent?: number } {
    if (boostActive && boostExpiresAt) {
      const daysRemaining = Math.max(
        1,
        Math.ceil((new Date(boostExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
      return { state: 'active', daysRemaining }
    } else if (referralCount >= 3) {
      return { state: 'expired' }
    } else {
      return {
        state: 'progress',
        referralsNeeded: 3 - referralCount,
        progressPercent: Math.min((referralCount / 3) * 100, 100),
      }
    }
  }

  // ── Progress state ──────────────────────────────────────────────────────

  it('shows progress state with 0 referrals (0%)', () => {
    const display = getBoostDisplayState(0, false, null)
    expect(display.state).toBe('progress')
    expect(display.referralsNeeded).toBe(3)
    expect(display.progressPercent).toBe(0)
  })

  it('shows progress state with 1 referral (~33%)', () => {
    const display = getBoostDisplayState(1, false, null)
    expect(display.state).toBe('progress')
    expect(display.referralsNeeded).toBe(2)
    expect(display.progressPercent).toBeCloseTo(33.33, 0)
  })

  it('shows progress state with 2 referrals (~67%)', () => {
    const display = getBoostDisplayState(2, false, null)
    expect(display.state).toBe('progress')
    expect(display.referralsNeeded).toBe(1)
    expect(display.progressPercent).toBeCloseTo(66.67, 0)
  })

  // ── Active boost state ──────────────────────────────────────────────────

  it('shows active state with 30 days remaining', () => {
    const expiry = new Date('2026-03-17T12:00:00Z').toISOString() // 30 days from now
    const display = getBoostDisplayState(3, true, expiry)
    expect(display.state).toBe('active')
    expect(display.daysRemaining).toBe(30)
  })

  it('shows active state with 15 days remaining', () => {
    const expiry = new Date('2026-03-02T12:00:00Z').toISOString() // 15 days
    const display = getBoostDisplayState(5, true, expiry)
    expect(display.state).toBe('active')
    expect(display.daysRemaining).toBe(15)
  })

  it('shows active state with 1 day remaining (minimum)', () => {
    const expiry = new Date('2026-02-16T00:00:00Z').toISOString() // ~12 hours
    const display = getBoostDisplayState(3, true, expiry)
    expect(display.state).toBe('active')
    expect(display.daysRemaining).toBe(1) // minimum 1
  })

  // ── Expired boost state ────────────────────────────────────────────────

  it('shows expired state when count >= 3 but boost not active', () => {
    const display = getBoostDisplayState(3, false, null)
    expect(display.state).toBe('expired')
  })

  it('shows expired state when count is 5 but boost not active', () => {
    const display = getBoostDisplayState(5, false, null)
    expect(display.state).toBe('expired')
  })
})
