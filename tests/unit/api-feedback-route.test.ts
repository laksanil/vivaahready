import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  match: {
    count: vi.fn(),
  },
  feedback: {
    create: vi.fn(),
  },
}

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildRequest(body: Record<string, unknown>, ip: string, extraHeaders: Record<string, string> = {}) {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  })
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    overallStars: 4,
    primaryIssue: 'technical',
    summaryText: 'Page feels slow',
    stepBData: { techTags: ['Slow loading'] },
    fromUrl: '/matches',
    submitUrl: '/feedback',
    userAgent: 'vitest',
    ...overrides,
  }
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TEST_AUTH_MODE = ''
  })

  it('returns 401 AUTH_REQUIRED when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const { POST } = await import('@/app/api/feedback/route')
    const response = await POST(buildRequest(validPayload(), '10.0.0.1'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'AUTH_REQUIRED' })
  })

  it('returns 400 PHONE_REQUIRED when logged in user has no phone', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-no-phone' } })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-no-phone',
      phone: null,
      name: 'No Phone',
      profile: { id: 'profile-1', isVerified: false },
      _count: { sentMatches: 0, receivedMatches: 0 },
    })

    const { POST } = await import('@/app/api/feedback/route')
    const response = await POST(buildRequest(validPayload(), '10.0.0.2'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'PHONE_REQUIRED' })
    expect(prismaMock.feedback.create).not.toHaveBeenCalled()
  })

  it('stores server-derived user identity/phone and ignores spoofed payload values', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'server-user-123' } })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'server-user-123',
      phone: '+1 (408) 555-1234',
      name: 'Server User',
      profile: { id: 'profile-123', isVerified: true },
      _count: { sentMatches: 5, receivedMatches: 7 },
    })
    prismaMock.match.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3)
    prismaMock.feedback.create.mockResolvedValue({ id: 'fb_123' })

    const payload = validPayload({
      userId: 'spoofed-user-id',
      userPhone: '+19999999999',
      stepBData: { techTags: ['Button not working'], tryingToDo: 'Send interest' },
    })

    const { POST } = await import('@/app/api/feedback/route')
    const response = await POST(buildRequest(payload, '10.0.0.3'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true, id: 'fb_123' })

    expect(prismaMock.feedback.create).toHaveBeenCalledTimes(1)
    const createArgs = prismaMock.feedback.create.mock.calls[0][0]
    expect(createArgs.data.userId).toBe('server-user-123')
    expect(createArgs.data.userPhone).toBe('+14085551234')
    expect(createArgs.data.userPhoneLast4).toBe('1234')
    expect(createArgs.data.overallStars).toBe(4)
    expect(createArgs.data.primaryIssue).toBe('technical')
    expect(createArgs.data.stepBData).toBe(JSON.stringify(payload.stepBData))
  })

  it('supports test-only auth override users when TEST_AUTH_MODE=1', async () => {
    process.env.TEST_AUTH_MODE = '1'
    getServerSessionMock.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.feedback.create.mockResolvedValue({ id: 'fb_test_override' })

    const { POST } = await import('@/app/api/feedback/route')
    const response = await POST(
      buildRequest(validPayload(), '10.0.0.4', {
        'x-test-auth-user': 'user_with_phone',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true, id: 'fb_test_override' })
    const createArgs = prismaMock.feedback.create.mock.calls[0][0]
    expect(createArgs.data.userId).toBe('test-user-with-phone')
    expect(createArgs.data.userPhone).toBe('+14085550001')
    expect(prismaMock.match.count).not.toHaveBeenCalled()
  })
})
