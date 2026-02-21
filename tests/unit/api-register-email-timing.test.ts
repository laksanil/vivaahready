import { beforeEach, describe, expect, it, vi } from 'vitest'

const hashMock = vi.fn()
const sendWelcomeEmailMock = vi.fn()
const storeNotificationMock = vi.fn()

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  subscription: {
    create: vi.fn(),
  },
}

vi.mock('bcryptjs', () => ({
  hash: hashMock,
}))

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: sendWelcomeEmailMock,
}))

vi.mock('@/lib/notifications', () => ({
  storeNotification: storeNotificationMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/register welcome email timing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hashMock.mockResolvedValue('hashed-password')
    sendWelcomeEmailMock.mockResolvedValue({ success: true })
    storeNotificationMock.mockResolvedValue(undefined)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'rachana@example.com',
      name: 'Rachana J.',
    })
    prismaMock.subscription.create.mockResolvedValue({
      id: 'sub-123',
    })
  })

  it('sends welcome email after successful registration', async () => {
    const { POST } = await import('@/app/api/register/route')
    const response = await POST(
      buildRequest({
        name: 'Rachana J.',
        email: 'RACHANA@EXAMPLE.COM',
        password: 'StrongPass123!',
        phone: '+14085550123',
      })
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Account created successfully',
      userId: 'user-123',
    })

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Rachana J.',
        email: 'rachana@example.com',
        password: 'hashed-password',
        phone: '+14085550123',
      },
    })

    expect(sendWelcomeEmailMock).toHaveBeenCalledTimes(1)
    expect(sendWelcomeEmailMock).toHaveBeenCalledWith('rachana@example.com', 'Rachana J.')
    expect(storeNotificationMock).toHaveBeenCalledWith(
      'welcome',
      'user-123',
      { name: 'Rachana J.' },
      { deliveryModes: ['email'] }
    )
  })

  it('does not send welcome email when registration is rejected as duplicate', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      password: 'already-set',
    })

    const { POST } = await import('@/app/api/register/route')
    const response = await POST(
      buildRequest({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'StrongPass123!',
      })
    )

    expect(response.status).toBe(400)
    expect(sendWelcomeEmailMock).not.toHaveBeenCalled()
    expect(storeNotificationMock).not.toHaveBeenCalled()
  })
})
