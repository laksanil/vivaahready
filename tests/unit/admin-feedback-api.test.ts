import { beforeEach, describe, expect, it, vi } from 'vitest'

const isAdminAuthenticatedMock = vi.fn()
const isTestAdminRequestMock = vi.fn(() => false)

const prismaMock = {
  feedback: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
}

vi.mock('@/lib/admin', () => ({
  isAdminAuthenticated: isAdminAuthenticatedMock,
}))

vi.mock('@/lib/testAuth', () => ({
  isTestAdminRequest: isTestAdminRequestMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function makeFeedbackRow(id: string) {
  return {
    id,
    userId: 'user-1',
    userPhone: '+14085551234',
    userPhoneLast4: '1234',
    userName: 'Test User',
    isVerified: false,
    profileId: 'profile-1',
    matchesCount: 10,
    interestsSentCount: 4,
    interestsReceivedCount: 6,
    fromUrl: '/matches',
    submitUrl: '/feedback',
    userAgent: 'vitest',
    overallStars: 4,
    primaryIssue: 'technical',
    summaryText: 'Matches page was slow',
    stepBData: '{"techTags":["Slow loading"]}',
    nps: 8,
    referralSource: 'friend',
    wantsFollowup: false,
    followupContact: null,
    followupTimeWindow: null,
    severity: 'major',
    issueTags: '["Slow loading"]',
    screenshotUrl: null,
    createdAt: new Date('2026-01-10T12:00:00.000Z'),
  }
}

describe('/api/admin/feedback routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isTestAdminRequestMock.mockReturnValue(false)
  })

  it('blocks non-admin access to GET /api/admin/feedback', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(false)

    const { GET } = await import('@/app/api/admin/feedback/route')
    const response = await GET(new Request('http://localhost/api/admin/feedback'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('applies filters and returns required fields for admin GET /api/admin/feedback', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(true)
    prismaMock.feedback.findMany.mockResolvedValue([makeFeedbackRow('fb-1')])
    prismaMock.feedback.count.mockResolvedValue(1)
    prismaMock.feedback.groupBy.mockImplementation((args: any) => {
      if (Array.isArray(args.by) && args.by.length === 1) {
        return Promise.resolve([{ userPhone: '+14085551234', _count: 1 }])
      }
      return Promise.resolve([{
        userPhone: '+14085551234',
        userName: 'Test User',
        _count: { id: 1 },
        _avg: { overallStars: 4 },
      }])
    })
    prismaMock.feedback.aggregate.mockResolvedValue({ _avg: { overallStars: 4 } })

    const { GET } = await import('@/app/api/admin/feedback/route')
    const response = await GET(
      new Request(
        'http://localhost/api/admin/feedback?phone=1234&verified=false&minStars=3&issue=technical&startDate=2026-01-01&endDate=2026-01-15&search=slow'
      )
    )

    expect(response.status).toBe(200)

    const findManyArgs = prismaMock.feedback.findMany.mock.calls[0][0]
    expect(findManyArgs.where.primaryIssue).toBe('technical')
    expect(findManyArgs.where.isVerified).toEqual({ not: true })
    expect(findManyArgs.where.overallStars).toEqual({ gte: 3 })
    expect(findManyArgs.where.OR).toEqual([
      { userPhone: '1234' },
      { userPhoneLast4: { contains: '1234' } },
      { userPhone: { contains: '1234' } },
    ])
    expect(findManyArgs.where.createdAt.gte).toEqual(new Date('2026-01-01'))
    expect(findManyArgs.where.createdAt.lte).toEqual(new Date('2026-01-15T23:59:59.999Z'))
    expect(Array.isArray(findManyArgs.where.AND)).toBe(true)

    const payload = await response.json()
    expect(payload.feedbacks).toHaveLength(1)
    expect(payload.feedbacks[0]).toMatchObject({
      userPhone: '+14085551234',
      userId: 'user-1',
      isVerified: false,
      primaryIssue: 'technical',
      summaryText: 'Matches page was slow',
      issueTags: '["Slow loading"]',
    })
    expect(typeof payload.feedbacks[0].createdAt).toBe('string')
    expect(payload.summary).toMatchObject({
      totalFeedbackCount: 1,
      uniquePhonesCount: 1,
      verifiedUsersPct: 100,
      avgStars: 4,
    })
  })

  it('blocks non-admin access to GET /api/admin/feedback/summary', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(false)

    const { GET } = await import('@/app/api/admin/feedback/summary/route')
    const response = await GET(new Request('http://localhost/api/admin/feedback/summary'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('allows admin access to GET /api/admin/feedback/summary and applies filters', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(true)
    prismaMock.feedback.count.mockResolvedValue(2)
    prismaMock.feedback.groupBy.mockImplementation((args: any) => {
      if (Array.isArray(args.by) && args.by.length === 1) {
        return Promise.resolve([{ userPhone: '+14085550001', _count: 1 }])
      }
      return Promise.resolve([{
        userPhone: '+14085550001',
        userName: 'Top User',
        _count: { id: 2 },
        _avg: { overallStars: 4.5 },
      }])
    })
    prismaMock.feedback.aggregate.mockResolvedValue({ _avg: { overallStars: 4.5 } })

    const { GET } = await import('@/app/api/admin/feedback/summary/route')
    const response = await GET(
      new Request('http://localhost/api/admin/feedback/summary?phone=0001&verified=true&minStars=4&issue=technical')
    )

    expect(response.status).toBe(200)
    const countWhereArg = prismaMock.feedback.count.mock.calls[0][0].where
    expect(countWhereArg.primaryIssue).toBe('technical')
    expect(countWhereArg.isVerified).toBe(true)
    expect(countWhereArg.overallStars).toEqual({ gte: 4 })

    const payload = await response.json()
    expect(payload).toMatchObject({
      totalFeedbackCount: 2,
      uniquePhonesCount: 1,
      avgStars: 4.5,
    })
    expect(payload.topPhonesByFeedbackCount).toHaveLength(1)
  })

  it('returns feedback detail for admins via /api/admin/feedback/[id]', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(true)
    prismaMock.feedback.findUnique.mockResolvedValue(makeFeedbackRow('fb-detail'))

    const { GET } = await import('@/app/api/admin/feedback/[id]/route')
    const response = await GET(
      new Request('http://localhost/api/admin/feedback/fb-detail'),
      { params: { id: 'fb-detail' } }
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.feedback.id).toBe('fb-detail')
    expect(payload.feedback.userPhone).toBe('+14085551234')
  })
})
