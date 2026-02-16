import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const sendEmailMock = vi.fn()

const prismaMock = {
  supportMessage: {
    create: vi.fn(),
  },
}

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/email', () => ({
  sendEmail: sendEmailMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue(null)
    sendEmailMock.mockResolvedValue({ success: true })
    prismaMock.supportMessage.create.mockResolvedValue({ id: 'contactmsg1234' })
  })

  it('silently accepts honeypot bot submissions without creating records', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      buildRequest({
        name: 'Bot',
        email: 'bot@example.com',
        subject: 'Spam',
        message: 'Spam message',
        website: 'https://spam.example.com',
      }) as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ success: true })
    expect(prismaMock.supportMessage.create).not.toHaveBeenCalled()
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      buildRequest({
        name: 'Test User',
        email: 'test@example.com',
        subject: '',
        message: 'hello',
      }) as any
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'All fields are required',
    })
  })

  it('returns 400 when email is invalid', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      buildRequest({
        name: 'Test User',
        email: 'invalid-email',
        subject: 'Question',
        message: 'hello',
      }) as any
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Please enter a valid email address',
    })
  })

  it('stores contact message in SupportMessage and sends confirmation email', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-123' } })
    prismaMock.supportMessage.create.mockResolvedValue({ id: 'abc12345xyz' })

    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      buildRequest({
        name: '  Jane Doe  ',
        email: '  Jane@Example.com ',
        subject: ' Technical Support ',
        message: '  I need help with profile verification.  ',
      }) as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      ticketId: 'ABC12345',
    })

    expect(prismaMock.supportMessage.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Technical Support',
        message: 'I need help with profile verification.',
        context: 'contact_form',
        status: 'new',
      },
    })

    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock.mock.calls[0][0]).toMatchObject({
      to: 'jane@example.com',
      subject: 'We received your message - VivaahReady',
    })
  })

  it('still returns success when confirmation email fails', async () => {
    sendEmailMock.mockResolvedValue({ success: false, error: 'SMTP timeout' })
    prismaMock.supportMessage.create.mockResolvedValue({ id: 'xyz12345ab' })

    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      buildRequest({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'General Inquiry',
        message: 'Hi there',
      }) as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      ticketId: 'XYZ12345',
    })
    expect(prismaMock.supportMessage.create).toHaveBeenCalledTimes(1)
  })
})
