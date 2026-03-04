import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()

const prismaMock = {
  declinedProfile: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn(),
  },
  match: {
    updateMany: vi.fn(),
  },
  profile: {
    findMany: vi.fn(),
  },
}

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/admin', () => ({
  getTargetUserId: getTargetUserIdMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildRequest(method: 'GET' | 'POST' | 'DELETE', url: string, body?: Record<string, unknown>) {
  return new Request(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('/api/matches/decline route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'session_user' } })
    getTargetUserIdMock.mockResolvedValue({ userId: 'current_user' })
    prismaMock.declinedProfile.upsert.mockResolvedValue({ id: 'declined_1' })
    prismaMock.declinedProfile.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.declinedProfile.findMany.mockResolvedValue([
      {
        id: 'd_1',
        userId: 'current_user',
        declinedUserId: 'other_1',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    ])
    prismaMock.match.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.profile.findMany.mockResolvedValue([
      {
        id: 'profile_1',
        userId: 'other_1',
        isActive: true,
        isSuspended: false,
        approvalStatus: 'approved',
        user: { id: 'other_1', name: 'Other User', email: 'other@example.com' },
      },
    ])
  })

  it('returns 401 when POST decline is unauthorized', async () => {
    getTargetUserIdMock.mockResolvedValueOnce(null)

    const { POST } = await import('@/app/api/matches/decline/route')
    const response = await POST(buildRequest('POST', 'http://localhost/api/matches/decline', { declinedUserId: 'u2' }) as any)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('validates missing declinedUserId in POST', async () => {
    const { POST } = await import('@/app/api/matches/decline/route')
    const response = await POST(buildRequest('POST', 'http://localhost/api/matches/decline', {}) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'declinedUserId is required' })
  })

  it('blocks self-decline in POST', async () => {
    const { POST } = await import('@/app/api/matches/decline/route')
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/matches/decline', { declinedUserId: 'current_user' }) as any
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Cannot decline yourself' })
  })

  it('creates/keeps declined record and rejects pending incoming interests in POST', async () => {
    const { POST } = await import('@/app/api/matches/decline/route')
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/matches/decline', { declinedUserId: 'other_1' }) as any
    )

    expect(response.status).toBe(200)
    expect(prismaMock.declinedProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_declinedUserId: {
            userId: 'current_user',
            declinedUserId: 'other_1',
          },
        },
      })
    )
    expect(prismaMock.match.updateMany).toHaveBeenCalledWith({
      where: {
        senderId: 'other_1',
        receiverId: 'current_user',
        status: 'pending',
      },
      data: {
        status: 'rejected',
      },
    })
    await expect(response.json()).resolves.toMatchObject({ success: true })
  })

  it('returns 400 for DELETE reconsider when declinedUserId query is missing', async () => {
    const { DELETE } = await import('@/app/api/matches/decline/route')
    const response = await DELETE(buildRequest('DELETE', 'http://localhost/api/matches/decline') as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'declinedUserId is required' })
  })

  it('removes declined profile in DELETE reconsider', async () => {
    const { DELETE } = await import('@/app/api/matches/decline/route')
    const response = await DELETE(
      buildRequest('DELETE', 'http://localhost/api/matches/decline?declinedUserId=other_1') as any
    )

    expect(response.status).toBe(200)
    expect(prismaMock.declinedProfile.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'current_user',
        declinedUserId: 'other_1',
      },
    })
    await expect(response.json()).resolves.toMatchObject({ success: true })
  })

  it('returns declined profiles with declinedAt in GET', async () => {
    const { GET } = await import('@/app/api/matches/decline/route')
    const response = await GET(buildRequest('GET', 'http://localhost/api/matches/decline') as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.profiles).toHaveLength(1)
    expect(payload.profiles[0]).toMatchObject({
      userId: 'other_1',
      declinedAt: expect.any(String),
    })
    expect(prismaMock.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { in: ['other_1'] },
          approvalStatus: 'approved',
        }),
      })
    )
  })

  it('returns 500 when GET declined profiles fails', async () => {
    prismaMock.declinedProfile.findMany.mockRejectedValueOnce(new Error('query failed'))

    const { GET } = await import('@/app/api/matches/decline/route')
    const response = await GET(buildRequest('GET', 'http://localhost/api/matches/decline') as any)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ error: 'Failed to fetch declined profiles' })
  })
})

