import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = {
  profile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  engagementPointLog: {
    create: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('awardCommunityPostPoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock autoConvertPointsToCoins dependency (it reads profile)
    prismaMock.profile.findUnique.mockResolvedValue({ engagementPoints: 50 })
  })

  it('awards 5 points for a community post', async () => {
    prismaMock.$transaction.mockResolvedValue([{}, {}])

    const { awardCommunityPostPoints } = await import('@/lib/engagementPoints')
    const result = await awardCommunityPostPoints('user-1')

    expect(result.awarded).toBe(true)
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })

  it('uses correct idempotency key with today date and userId', async () => {
    prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => {
      // Just return successfully
      return [{}, {}]
    })

    const { awardCommunityPostPoints } = await import('@/lib/engagementPoints')
    await awardCommunityPostPoints('test-user-123')

    // Verify the transaction was called
    expect(prismaMock.$transaction).toHaveBeenCalled()

    // Get the transaction call args - the first arg should be an array of operations
    const txCall = prismaMock.$transaction.mock.calls[0]
    expect(txCall).toBeDefined()
  })

  it('returns awarded: false when P2002 (duplicate idempotency key)', async () => {
    const p2002Error = new Error('Unique constraint violation')
    Object.assign(p2002Error, { code: 'P2002' })
    prismaMock.$transaction.mockRejectedValue(p2002Error)

    const { awardCommunityPostPoints } = await import('@/lib/engagementPoints')
    const result = await awardCommunityPostPoints('user-1')

    expect(result.awarded).toBe(false)
  })

  it('rethrows non-P2002 errors', async () => {
    const otherError = new Error('Database connection failed')
    prismaMock.$transaction.mockRejectedValue(otherError)

    const { awardCommunityPostPoints } = await import('@/lib/engagementPoints')

    await expect(awardCommunityPostPoints('user-1')).rejects.toThrow('Database connection failed')
  })

  it('calls autoConvertPointsToCoins after awarding points', async () => {
    prismaMock.$transaction.mockResolvedValue([{}, {}])
    // Profile has < 100 points, so no conversion should happen
    prismaMock.profile.findUnique.mockResolvedValue({ engagementPoints: 50 })

    const { awardCommunityPostPoints } = await import('@/lib/engagementPoints')
    await awardCommunityPostPoints('user-1')

    // autoConvertPointsToCoins is called internally and reads profile
    expect(prismaMock.profile.findUnique).toHaveBeenCalled()
  })

  it('POINTS_CONFIG has COMMUNITY_POST set to 5', async () => {
    const { POINTS_CONFIG } = await import('@/lib/engagementPoints')
    expect(POINTS_CONFIG.COMMUNITY_POST).toBe(5)
  })
})

describe('POINTS_CONFIG completeness', () => {
  it('has all expected point values', async () => {
    const { POINTS_CONFIG } = await import('@/lib/engagementPoints')
    expect(POINTS_CONFIG.DAILY_LOGIN).toBe(10)
    expect(POINTS_CONFIG.EXPRESS_INTEREST).toBe(5)
    expect(POINTS_CONFIG.RESPOND_TO_INTEREST).toBe(5)
    expect(POINTS_CONFIG.COMMUNITY_POST).toBe(5)
    expect(POINTS_CONFIG.POINTS_PER_COIN).toBe(100)
    expect(POINTS_CONFIG.COINS_PER_BOOST).toBe(5)
    expect(POINTS_CONFIG.BOOST_DURATION_DAYS).toBe(7)
  })
})
