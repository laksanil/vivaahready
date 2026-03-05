import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()

const prismaMock = {
  notification: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  profile: {
    findUnique: vi.fn(),
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

function buildGetRequest(url = 'http://localhost/api/notifications') {
  return new Request(url, { method: 'GET' })
}

function buildPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/notifications/read', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/notifications and /api/notifications/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'session_user' } })
    getTargetUserIdMock.mockResolvedValue({ userId: 'user_123' })
    prismaMock.notification.findFirst.mockResolvedValue(null)
    prismaMock.notification.findMany.mockResolvedValue([
      { id: 'n1', userId: 'user_123', read: false, createdAt: new Date('2026-03-01T10:00:00.000Z') },
    ])
    prismaMock.notification.count.mockResolvedValue(3)
    prismaMock.notification.create.mockResolvedValue({ id: 'welcome_1' })
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile_1',
      createdAt: new Date(),
    })
    prismaMock.notification.updateMany.mockResolvedValue({ count: 1 })
  })

  it('returns 401 when notifications GET is unauthorized', async () => {
    getTargetUserIdMock.mockResolvedValueOnce(null)

    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(buildGetRequest() as any)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('uses default limit=20 for notifications GET', async () => {
    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(buildGetRequest() as any)

    expect(response.status).toBe(200)
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    )
    expect(prismaMock.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user_123', read: false },
    })
    await expect(response.json()).resolves.toMatchObject({ unreadCount: 3 })
  })

  it('respects explicit limit query param for notifications GET', async () => {
    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(buildGetRequest('http://localhost/api/notifications?limit=7') as any)

    expect(response.status).toBe(200)
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 7 })
    )
  })

  it('returns all notifications without take when all=true', async () => {
    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(buildGetRequest('http://localhost/api/notifications?all=true&limit=5') as any)

    expect(response.status).toBe(200)
    const call = prismaMock.notification.findMany.mock.calls[0][0]
    expect(call.take).toBeUndefined()
  })

  it('backfills a welcome notification for a newly created profile when missing', async () => {
    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(buildGetRequest() as any)

    expect(response.status).toBe(200)
    expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user_123', type: 'welcome' },
      select: { id: true },
    })
    expect(prismaMock.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      select: { id: true, createdAt: true },
    })
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_123',
          type: 'welcome',
          url: '/dashboard',
        }),
      })
    )
  })

  it('returns 500 when notifications GET throws', async () => {
    prismaMock.notification.findMany.mockRejectedValueOnce(new Error('db down'))

    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(buildGetRequest() as any)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ error: 'Failed to fetch notifications' })
  })

  it('returns 401 when mark-read POST is unauthorized', async () => {
    getTargetUserIdMock.mockResolvedValueOnce(null)

    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(buildPostRequest({ all: true }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('marks all notifications as read when body.all=true', async () => {
    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(buildPostRequest({ all: true }))

    expect(response.status).toBe(200)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_123', read: false },
        data: expect.objectContaining({ read: true }),
      })
    )
    await expect(response.json()).resolves.toMatchObject({ success: true })
  })

  it('marks a single notification read when id is provided', async () => {
    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(buildPostRequest({ id: 'notif_789' }))

    expect(response.status).toBe(200)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notif_789', userId: 'user_123' },
        data: expect.objectContaining({ read: true }),
      })
    )
    await expect(response.json()).resolves.toMatchObject({ success: true })
  })

  it('returns 400 when mark-read body has neither id nor all', async () => {
    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(buildPostRequest({}))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Missing id or all parameter' })
  })

  it('returns 500 when mark-read update fails', async () => {
    prismaMock.notification.updateMany.mockRejectedValueOnce(new Error('write failed'))

    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(buildPostRequest({ id: 'notif_123' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ error: 'Failed to update notifications' })
  })
})
