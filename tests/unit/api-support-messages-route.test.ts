import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const parseConversationDataMock = vi.fn()
const generateBotResponseMock = vi.fn()

const prismaMock = {
  supportMessage: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
}

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/support-conversation', () => ({
  parseConversationData: parseConversationDataMock,
}))

vi.mock('@/lib/support-bot', () => ({
  generateBotResponse: generateBotResponseMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildGetRequest() {
  return new Request('http://localhost/api/support-messages', { method: 'GET' })
}

function buildPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/support-messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/support-messages route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user_123' } })
    prismaMock.supportMessage.findMany.mockResolvedValue([
      {
        id: 'msg_1',
        subject: 'Need help',
        message: 'Please help me',
        context: 'general',
        status: 'read',
        adminResponse: null,
        respondedAt: null,
        respondedVia: null,
        chatHistory: null,
        createdAt: new Date('2026-03-01T12:00:00.000Z'),
      },
    ])
    prismaMock.supportMessage.findFirst.mockResolvedValue({
      id: 'msg_1',
      userId: 'user_123',
      context: 'general',
      chatHistory: JSON.stringify({ thread: [] }),
    })
    prismaMock.supportMessage.update.mockResolvedValue({ id: 'msg_1' })
    prismaMock.notification.create.mockResolvedValue({ id: 'notif_1' })
    parseConversationDataMock.mockReturnValue({ thread: [] })
    generateBotResponseMock.mockResolvedValue('Thanks for your message. We will review this shortly.')
  })

  it('returns 401 for support-messages GET when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null)

    const { GET } = await import('@/app/api/support-messages/route')
    const response = await GET(buildGetRequest() as any)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns user support messages in GET', async () => {
    const { GET } = await import('@/app/api/support-messages/route')
    const response = await GET(buildGetRequest() as any)

    expect(response.status).toBe(200)
    expect(prismaMock.supportMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
      })
    )
    await expect(response.json()).resolves.toMatchObject({
      messages: [
        expect.objectContaining({ id: 'msg_1' }),
      ],
    })
  })

  it('returns 500 for support-messages GET database failure', async () => {
    prismaMock.supportMessage.findMany.mockRejectedValueOnce(new Error('db error'))

    const { GET } = await import('@/app/api/support-messages/route')
    const response = await GET(buildGetRequest() as any)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ error: 'Failed to fetch messages' })
  })

  it('returns 401 for support-messages POST when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null)

    const { POST } = await import('@/app/api/support-messages/route')
    const response = await POST(buildPostRequest({ messageId: 'msg_1', content: 'hello' }) as any)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 400 for support-messages POST when payload is invalid', async () => {
    const { POST } = await import('@/app/api/support-messages/route')
    const response = await POST(buildPostRequest({ messageId: '', content: '   ' }) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Message ID and content are required' })
  })

  it('returns 404 for support-messages POST when message thread is not owned by user', async () => {
    prismaMock.supportMessage.findFirst.mockResolvedValueOnce(null)

    const { POST } = await import('@/app/api/support-messages/route')
    const response = await POST(buildPostRequest({ messageId: 'msg_missing', content: 'Need help' }) as any)

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ error: 'Message not found' })
  })

  it('appends user + bot messages to chat history and marks thread as new', async () => {
    parseConversationDataMock.mockReturnValueOnce({
      thread: [{ role: 'bot', content: 'Hi there', timestamp: '2026-03-01T00:00:00.000Z' }],
    })

    const { POST } = await import('@/app/api/support-messages/route')
    const response = await POST(
      buildPostRequest({ messageId: 'msg_1', content: 'Can I update my phone number?' }) as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      botReply: 'Thanks for your message. We will review this shortly.',
    })

    expect(parseConversationDataMock).toHaveBeenCalledWith(JSON.stringify({ thread: [] }))
    expect(generateBotResponseMock).toHaveBeenCalledWith(
      'Can I update my phone number?',
      expect.arrayContaining([
        expect.objectContaining({ role: 'bot' }),
        expect.objectContaining({ role: 'user', content: 'Can I update my phone number?' }),
      ])
    )

    expect(prismaMock.supportMessage.update).toHaveBeenCalledTimes(1)
    const updateArg = prismaMock.supportMessage.update.mock.calls[0][0]
    expect(updateArg.where).toEqual({ id: 'msg_1' })
    expect(updateArg.data.status).toBe('new')
    const savedThread = JSON.parse(updateArg.data.chatHistory as string).thread
    expect(savedThread[savedThread.length - 2]).toMatchObject({
      role: 'user',
      content: 'Can I update my phone number?',
    })
    expect(savedThread[savedThread.length - 1]).toMatchObject({
      role: 'bot',
      content: 'Thanks for your message. We will review this shortly.',
    })
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1)
  })

  it('returns success even when support reply notification creation fails', async () => {
    prismaMock.notification.create.mockRejectedValueOnce(new Error('notification failure'))

    const { POST } = await import('@/app/api/support-messages/route')
    const response = await POST(
      buildPostRequest({ messageId: 'msg_1', content: 'Please check this issue again' }) as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      botReply: 'Thanks for your message. We will review this shortly.',
    })
  })

  it('returns 500 when bot generation fails', async () => {
    generateBotResponseMock.mockRejectedValueOnce(new Error('bot unavailable'))

    const { POST } = await import('@/app/api/support-messages/route')
    const response = await POST(buildPostRequest({ messageId: 'msg_1', content: 'Hello' }) as any)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ error: 'Failed to send reply' })
  })
})

