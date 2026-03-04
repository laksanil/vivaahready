import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const awardDailyLoginPointsMock = vi.fn()
const getEngagementSummaryMock = vi.fn()

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/engagementPoints', () => ({
  awardDailyLoginPoints: awardDailyLoginPointsMock,
  getEngagementSummary: getEngagementSummaryMock,
}))

function buildPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/engagement', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/engagement route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user_123' } })
    awardDailyLoginPointsMock.mockResolvedValue({ awarded: true, points: 2, newBalance: 12 })
    getEngagementSummaryMock.mockResolvedValue({
      points: 12,
      activeBoost: null,
      progress: { pointsToNextBoost: 88, pointsPercent: 12 },
      recentActivity: [],
      totals: { totalPointsEarned: 12, totalBoostsUsed: 0 },
    })
  })

  it('returns 401 for GET when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const { GET } = await import('@/app/api/engagement/route')
    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
    expect(awardDailyLoginPointsMock).not.toHaveBeenCalled()
    expect(getEngagementSummaryMock).not.toHaveBeenCalled()
  })

  it('returns summary and awards daily login points for authenticated GET', async () => {
    const { GET } = await import('@/app/api/engagement/route')
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      points: 12,
      progress: { pointsToNextBoost: 88, pointsPercent: 12 },
    })
    expect(awardDailyLoginPointsMock).toHaveBeenCalledWith('user_123')
    expect(getEngagementSummaryMock).toHaveBeenCalledWith('user_123')
  })

  it('continues GET summary response even if daily-login award throws', async () => {
    awardDailyLoginPointsMock.mockRejectedValueOnce(new Error('Transient DB failure'))

    const { GET } = await import('@/app/api/engagement/route')
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ points: 12 })
    expect(getEngagementSummaryMock).toHaveBeenCalledWith('user_123')
  })

  it('returns 404 for GET when profile summary is missing', async () => {
    getEngagementSummaryMock.mockResolvedValueOnce(null)

    const { GET } = await import('@/app/api/engagement/route')
    const response = await GET()

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ error: 'Profile not found' })
  })

  it('returns 401 for POST when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const { POST } = await import('@/app/api/engagement/route')
    const response = await POST(buildPostRequest({ action: 'redeem_boost' }) as any)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns auto-boost message for redeem_boost POST', async () => {
    const { POST } = await import('@/app/api/engagement/route')
    const response = await POST(buildPostRequest({ action: 'redeem_boost' }) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Boost activates automatically when you reach 100 points.',
      points: 12,
    })
    expect(getEngagementSummaryMock).toHaveBeenCalledWith('user_123')
  })

  it('returns 400 for invalid POST action', async () => {
    const { POST } = await import('@/app/api/engagement/route')
    const response = await POST(buildPostRequest({ action: 'unknown_action' }) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Invalid action' })
  })
})

