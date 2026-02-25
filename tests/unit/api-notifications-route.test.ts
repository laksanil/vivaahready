import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()

const prismaMock = {
  notification: {
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  match: {
    findMany: vi.fn(),
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

function makeNotification(id: string, userId: string, read = false) {
  return {
    id,
    userId,
    type: 'new_interest',
    title: `Title ${id}`,
    body: `Body ${id}`,
    url: '/matches?tab=received',
    data: null,
    read,
    readAt: null,
    createdAt: new Date('2026-02-18T00:00:00.000Z'),
  }
}

describe('/api/notifications routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.match.findMany.mockResolvedValue([])
  })

  it('GET /api/notifications blocks unauthenticated users', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(new Request('http://localhost/api/notifications'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('GET /api/notifications returns paginated notifications for the current user', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })

    const notifications = Array.from({ length: 21 }, (_, idx) =>
      makeNotification(`notif-${idx + 1}`, 'user-1', idx > 2)
    )
    prismaMock.notification.findMany.mockResolvedValue(notifications)
    prismaMock.notification.count.mockResolvedValue(3)

    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(new Request('http://localhost/api/notifications?limit=20'))

    expect(response.status).toBe(200)
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 21,
    })
    expect(prismaMock.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
    })

    const payload = await response.json()
    expect(payload.notifications).toHaveLength(20)
    expect(payload.hasMore).toBe(true)
    expect(payload.nextCursor).toBe('notif-20')
    expect(payload.unreadCount).toBe(3)
  })

  it('GET /api/notifications with all=true returns full history for the current user', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })

    const notifications = [
      makeNotification('notif-1', 'user-1', false),
      makeNotification('notif-2', 'user-1', true),
      makeNotification('notif-3', 'user-1', true),
    ]

    prismaMock.notification.findMany.mockResolvedValue(notifications)
    prismaMock.notification.count.mockResolvedValue(1)

    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(new Request('http://localhost/api/notifications?all=true'))

    expect(response.status).toBe(200)
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    })

    const payload = await response.json()
    expect(payload.notifications).toHaveLength(3)
    expect(payload.hasMore).toBe(false)
    expect(payload.nextCursor).toBe(null)
    expect(payload.unreadCount).toBe(1)
  })

  it('GET /api/notifications with all=true includes legacy sent history for older customer messages', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })

    prismaMock.notification.findMany.mockResolvedValue([])
    prismaMock.notification.count.mockResolvedValue(0)
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Priyanka N',
      email: 'priyanka@example.com',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      profile: {
        id: 'profile-1',
        firstName: 'Priyanka',
        isImported: false,
        approvalStatus: 'approved',
        approvalDate: new Date('2025-01-05T00:00:00.000Z'),
      },
    })
    prismaMock.match.findMany.mockResolvedValue([
      {
        id: 'match-1',
        status: 'pending',
        senderId: 'user-2',
        receiverId: 'user-1',
        createdAt: new Date('2025-01-10T00:00:00.000Z'),
        updatedAt: new Date('2025-01-10T00:00:00.000Z'),
        sender: { name: 'Lakshmi N', profile: { firstName: 'Lakshmi' } },
        receiver: { name: 'Priyanka N', profile: { firstName: 'Priyanka' } },
      },
    ])

    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(new Request('http://localhost/api/notifications?all=true'))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.notifications.length).toBeGreaterThanOrEqual(3)

    const types = payload.notifications.map((n: { type: string }) => n.type)
    expect(types).toContain('welcome')
    expect(types).toContain('profile_approved')
    expect(types).toContain('new_interest')

    const legacy = payload.notifications.find((n: { id: string }) => String(n.id).startsWith('legacy-'))
    expect(legacy).toBeTruthy()
    expect(legacy.data).toContain('__deliveryModes')
    expect(legacy.data).toContain('email')
  })

  it('GET /api/notifications supports unreadOnly and cursor params for loading all notifications', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })

    prismaMock.notification.findMany.mockResolvedValue([
      makeNotification('notif-101', 'user-1', false),
      makeNotification('notif-102', 'user-1', false),
    ])
    prismaMock.notification.count.mockResolvedValue(2)

    const { GET } = await import('@/app/api/notifications/route')
    const response = await GET(
      new Request('http://localhost/api/notifications?unreadOnly=true&limit=999&cursor=notif-100')
    )

    expect(response.status).toBe(200)
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      orderBy: { createdAt: 'desc' },
      take: 51,
      cursor: { id: 'notif-100' },
      skip: 1,
    })

    const payload = await response.json()
    expect(payload.notifications).toHaveLength(2)
    expect(payload.hasMore).toBe(false)
    expect(payload.nextCursor).toBe(null)
  })

  it('POST /api/notifications/read blocks unauthenticated users', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(
      new Request('http://localhost/api/notifications/read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'notif-1' }),
      })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('POST /api/notifications/read marks one notification as read for the current user', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.notification.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.notification.count.mockResolvedValue(4)

    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(
      new Request('http://localhost/api/notifications/read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'notif-1' }),
      })
    )

    expect(response.status).toBe(200)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
      data: { read: true, readAt: expect.any(Date) },
    })
    await expect(response.json()).resolves.toMatchObject({ success: true, unreadCount: 4 })
  })

  it('POST /api/notifications/read marks all unread notifications as read', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.notification.updateMany.mockResolvedValue({ count: 7 })
    prismaMock.notification.count.mockResolvedValue(0)

    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(
      new Request('http://localhost/api/notifications/read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    )

    expect(response.status).toBe(200)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: { read: true, readAt: expect.any(Date) },
    })
    await expect(response.json()).resolves.toMatchObject({ success: true, unreadCount: 0 })
  })

  it('POST /api/notifications/read validates request body', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })

    const { POST } = await import('@/app/api/notifications/read/route')
    const response = await POST(
      new Request('http://localhost/api/notifications/read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Provide id or all: true' })
  })
})
