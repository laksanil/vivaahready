import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getLocationIdMock = vi.fn()
const paymentsCreateMock = vi.fn()
const sendEmailMock = vi.fn()
const sendSmsMock = vi.fn()

const prismaMock = {
  eventRegistration: {
    findUnique: vi.fn(),
    update: vi.fn(),
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

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/square', () => ({
  getLocationId: getLocationIdMock,
  dollarsToCents: (dollars: number) => BigInt(Math.round(dollars * 100)),
  squareClient: {
    payments: {
      create: paymentsCreateMock,
    },
  },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: sendEmailMock,
}))

vi.mock('@/lib/twilio', () => ({
  sendSms: sendSmsMock,
}))

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/events/march-2025/payment', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockRegistration(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reg-1',
    profileId: 'profile-1',
    paymentStatus: 'pending',
    smsOptIn: true,
    whatsappOptIn: false,
    event: {
      id: 'event-1',
      title: 'Singles Zoom Meetup',
      eventDate: new Date('2026-03-15T17:00:00.000Z'),
      price: 25,
    },
    ...overrides,
  }
}

describe('POST /api/events/march-2025/payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(buildRequest({ registrationId: 'reg-1', sourceId: 'source-1' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 400 when required fields are missing', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(buildRequest({ registrationId: 'reg-1' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Missing required fields' })
  })

  it('returns 404 when registration is missing', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.eventRegistration.findUnique.mockResolvedValue(null)

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(buildRequest({ registrationId: 'reg-1', sourceId: 'source-1' }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ error: 'Registration not found' })
  })

  it('returns 403 when registration does not belong to user profile', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration())
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile-other',
      user: { email: 'owner@example.com', name: 'Owner User', phone: null },
    })

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(buildRequest({ registrationId: 'reg-1', sourceId: 'source-1' }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 400 when event pricing is invalid', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.eventRegistration.findUnique.mockResolvedValue(
      mockRegistration({ event: { id: 'event-1', title: 'Singles Zoom Meetup', eventDate: new Date(), price: 0 } })
    )
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      user: { email: 'owner@example.com', name: 'Owner User', phone: null },
    })

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(buildRequest({ registrationId: 'reg-1', sourceId: 'source-1' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid event pricing configuration',
    })
  })

  it('returns 400 when registration is already paid', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.eventRegistration.findUnique.mockResolvedValue(
      mockRegistration({ paymentStatus: 'paid' })
    )
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      user: { email: 'owner@example.com', name: 'Owner User', phone: null },
    })

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(buildRequest({ registrationId: 'reg-1', sourceId: 'source-1' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Already paid' })
  })

  it('returns 400 when Square does not complete the payment', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration())
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      firstName: 'Owner',
      user: { email: 'owner@example.com', name: 'Owner User', phone: null },
    })
    getLocationIdMock.mockResolvedValue('LOC-EVENT-1')
    paymentsCreateMock.mockResolvedValue({
      payment: { id: 'PAY-EVENT-1', status: 'PENDING' },
    })

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(
      buildRequest({
        registrationId: 'reg-1',
        sourceId: 'source-1',
        verificationToken: 'verify-1',
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Payment processing failed. Please try again.',
    })
    expect(prismaMock.eventRegistration.update).not.toHaveBeenCalled()
  })

  it('completes payment and sends notifications when Square payment succeeds', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration())
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      firstName: 'Owner',
      user: { email: 'owner@example.com', name: 'Owner User', phone: '+14085551234' },
    })
    getLocationIdMock.mockResolvedValue('LOC-EVENT-2')
    paymentsCreateMock.mockResolvedValue({
      payment: { id: 'PAY-EVENT-2', status: 'COMPLETED' },
    })

    const { POST } = await import('@/app/api/events/march-2025/payment/route')
    const response = await POST(
      buildRequest({
        registrationId: 'reg-1',
        sourceId: 'source-1',
        verificationToken: 'verify-2',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      message: 'Payment successful! You are registered.',
    })

    expect(paymentsCreateMock).toHaveBeenCalledTimes(1)
    expect(paymentsCreateMock.mock.calls[0][0]).toMatchObject({
      sourceId: 'source-1',
      verificationToken: 'verify-2',
      locationId: 'LOC-EVENT-2',
      note: 'VivaahReady Event Registration - Singles Zoom Meetup',
      buyerEmailAddress: 'owner@example.com',
    })

    expect(prismaMock.eventRegistration.update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: {
        paymentStatus: 'paid',
        paymentId: 'PAY-EVENT-2',
        amountPaid: 2500,
        registeredAt: expect.any(Date),
      },
    })
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendSmsMock).toHaveBeenCalledTimes(1)
  })
})
