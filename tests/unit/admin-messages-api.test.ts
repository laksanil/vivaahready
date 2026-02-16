import { beforeEach, describe, expect, it, vi } from 'vitest'

const isAdminAuthenticatedMock = vi.fn()

const prismaMock = {
  supportMessage: {
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/admin', () => ({
  isAdminAuthenticated: isAdminAuthenticatedMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('/api/admin/messages routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks non-admin access to GET /api/admin/messages', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(false)

    const { GET } = await import('@/app/api/admin/messages/route')
    const response = await GET(new Request('http://localhost/api/admin/messages'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('validates filter values for GET /api/admin/messages', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(true)

    const { GET } = await import('@/app/api/admin/messages/route')

    const badStatus = await GET(new Request('http://localhost/api/admin/messages?status=bad'))
    expect(badStatus.status).toBe(400)

    const badNeeds = await GET(new Request('http://localhost/api/admin/messages?needsResponse=maybe'))
    expect(badNeeds.status).toBe(400)

    const badKind = await GET(new Request('http://localhost/api/admin/messages?responseKind=push'))
    expect(badKind.status).toBe(400)
  })

  it('applies filters and returns summary for GET /api/admin/messages', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(true)
    prismaMock.supportMessage.findMany.mockResolvedValue([
      {
        id: 'msg_1',
        userId: 'user_1',
        name: 'Test Contact',
        email: 'test@example.com',
        phone: '+14085551234',
        subject: 'Billing Question',
        message: 'Please clarify my payment.',
        context: 'contact_form',
        status: 'read',
        adminResponse: null,
        respondedAt: null,
        respondedVia: null,
        chatHistory: null,
        createdAt: new Date('2026-02-15T12:00:00.000Z'),
      },
    ])

    prismaMock.supportMessage.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2)  // new
      .mockResolvedValueOnce(5)  // needs response
      .mockResolvedValueOnce(3)  // replied
      .mockResolvedValueOnce(2)  // resolved

    const { GET } = await import('@/app/api/admin/messages/route')
    const response = await GET(
      new Request(
        'http://localhost/api/admin/messages?status=all&context=contact_form&needsResponse=yes&responseKind=none&search=billing&limit=40'
      )
    )

    expect(response.status).toBe(200)
    expect(prismaMock.supportMessage.findMany).toHaveBeenCalledTimes(1)
    const findManyArgs = prismaMock.supportMessage.findMany.mock.calls[0][0]
    expect(findManyArgs.take).toBe(40)
    expect(Array.isArray(findManyArgs.where.AND)).toBe(true)
    expect(findManyArgs.where.AND).toEqual(
      expect.arrayContaining([
        { context: 'contact_form' },
        { status: { in: ['new', 'read'] } },
        { respondedVia: null },
      ])
    )

    const payload = await response.json()
    expect(payload.total).toBe(10)
    expect(payload.summary).toMatchObject({
      newCount: 2,
      needsResponseCount: 5,
      repliedCount: 3,
      resolvedCount: 2,
    })
    expect(payload.messages).toHaveLength(1)
  })

  it('blocks non-admin access to POST /api/admin/messages/status', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(false)

    const { POST } = await import('@/app/api/admin/messages/status/route')
    const response = await POST(
      new Request('http://localhost/api/admin/messages/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messageId: 'msg_1', status: 'read' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('validates and normalizes status in POST /api/admin/messages/status', async () => {
    isAdminAuthenticatedMock.mockResolvedValue(true)
    prismaMock.supportMessage.update.mockResolvedValue({ id: 'msg_1', status: 'read' })

    const { POST } = await import('@/app/api/admin/messages/status/route')

    const invalid = await POST(
      new Request('http://localhost/api/admin/messages/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messageId: 'msg_1', status: 'INVALID' }),
      })
    )
    expect(invalid.status).toBe(400)

    const valid = await POST(
      new Request('http://localhost/api/admin/messages/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messageId: 'msg_1', status: 'READ' }),
      })
    )
    expect(valid.status).toBe(200)

    expect(prismaMock.supportMessage.update).toHaveBeenCalledWith({
      where: { id: 'msg_1' },
      data: { status: 'read' },
    })
  })
})
