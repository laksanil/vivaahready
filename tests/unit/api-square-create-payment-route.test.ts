import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getLocationIdMock = vi.fn()
const paymentsCreateMock = vi.fn()

const prismaMock = {
  settings: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  subscription: {
    update: vi.fn(),
    create: vi.fn(),
  },
  profile: {
    update: vi.fn(),
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

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/square/create-payment', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/square/create-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.settings.findUnique.mockResolvedValue({
      id: 'default',
      verificationPrice: 50,
      promoPrice: null,
      promoEndDate: null,
    })
  })

  it('returns 401 when not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({ sourceId: 'cnon:card-nonce-ok' }) as any)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 400 when sourceId is missing', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({}) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Payment source ID is required',
    })
  })

  it('returns 404 when profile is missing', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.user.findUnique.mockResolvedValue(null)

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({ sourceId: 'cnon:card-nonce-ok' }) as any)

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Profile not found',
    })
  })

  it('returns 400 when user has already paid', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'paid@example.com',
      profile: { id: 'profile-1', odNumber: 'OD-1001' },
      subscription: { id: 'sub-1', profilePaid: true },
    })

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({ sourceId: 'cnon:card-nonce-ok' }) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'Already paid' })
  })

  it('creates payment and updates existing subscription on success', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.settings.findUnique.mockResolvedValue({
      id: 'default',
      verificationPrice: 75,
      promoPrice: null,
      promoEndDate: null,
    })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user1@example.com',
      profile: { id: 'profile-1', odNumber: 'OD-2002' },
      subscription: { id: 'sub-1', profilePaid: false },
    })
    getLocationIdMock.mockResolvedValue('LOC-123')
    paymentsCreateMock.mockResolvedValue({
      payment: {
        id: 'PAY-1',
        status: 'COMPLETED',
        receiptUrl: 'https://squareup.com/receipt/PAY-1',
      },
    })

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(
      buildRequest({
        sourceId: 'cnon:card-nonce-ok',
        verificationToken: 'verify-token-1',
      }) as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      paymentId: 'PAY-1',
    })

    expect(paymentsCreateMock).toHaveBeenCalledTimes(1)
    const paymentArgs = paymentsCreateMock.mock.calls[0][0]
    expect(paymentArgs).toMatchObject({
      sourceId: 'cnon:card-nonce-ok',
      locationId: 'LOC-123',
      verificationToken: 'verify-token-1',
      note: 'VivaahReady Verification - OD-2002',
      buyerEmailAddress: 'user1@example.com',
      referenceId: 'profile-1',
    })
    expect(paymentArgs.idempotencyKey).toEqual(expect.any(String))
    expect(paymentArgs.amountMoney.currency).toBe('USD')
    expect(paymentArgs.amountMoney.amount).toBe(BigInt(7500))

    expect(prismaMock.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        profilePaid: true,
        profilePaymentId: 'PAY-1',
      },
    })
    expect(prismaMock.profile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: { isVerified: true },
    })
  })

  it('creates a subscription if one does not exist', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-2' } })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'user2@example.com',
      profile: { id: 'profile-2', odNumber: null },
      subscription: null,
    })
    getLocationIdMock.mockResolvedValue('LOC-456')
    paymentsCreateMock.mockResolvedValue({
      payment: {
        id: 'PAY-2',
        status: 'COMPLETED',
        receiptUrl: null,
      },
    })

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({ sourceId: 'cnon:card-nonce-ok' }) as any)

    expect(response.status).toBe(200)
    expect(prismaMock.subscription.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        plan: 'free',
        status: 'active',
        profilePaid: true,
        profilePaymentId: 'PAY-2',
      },
    })
  })

  it('returns 400 when Square returns non-completed payment status', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-3' } })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-3',
      email: 'user3@example.com',
      profile: { id: 'profile-3', odNumber: null },
      subscription: null,
    })
    getLocationIdMock.mockResolvedValue('LOC-789')
    paymentsCreateMock.mockResolvedValue({
      payment: {
        id: 'PAY-3',
        status: 'PENDING',
        receiptUrl: null,
      },
    })

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({ sourceId: 'cnon:card-nonce-ok' }) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Payment was not completed. Please try again.',
    })
    expect(prismaMock.subscription.create).not.toHaveBeenCalled()
    expect(prismaMock.subscription.update).not.toHaveBeenCalled()
    expect(prismaMock.profile.update).not.toHaveBeenCalled()
  })

  it('returns 500 when Square throws', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-4' } })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-4',
      email: 'user4@example.com',
      profile: { id: 'profile-4', odNumber: null },
      subscription: null,
    })
    getLocationIdMock.mockResolvedValue('LOC-999')
    paymentsCreateMock.mockRejectedValue(new Error('Square API unavailable'))

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({ sourceId: 'cnon:card-nonce-ok' }) as any)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Square API unavailable',
    })
  })

  it('returns 400 with Square detail when Square returns validation errors', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-5' } })
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-5',
      email: 'user5@example.com',
      profile: { id: 'profile-5', odNumber: null },
      subscription: null,
    })
    getLocationIdMock.mockResolvedValue('LOC-1000')
    paymentsCreateMock.mockRejectedValue({
      errors: [
        {
          category: 'PAYMENT_METHOD_ERROR',
          code: 'CARD_DECLINED',
          detail: 'Card was declined. Verify card details and try again.',
        },
      ],
    })

    const { POST } = await import('@/app/api/square/create-payment/route')
    const response = await POST(buildRequest({ sourceId: 'cnon:card-nonce-ok' }) as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Card was declined. Verify card details and try again.',
      details: [
        expect.objectContaining({
          code: 'CARD_DECLINED',
        }),
      ],
    })
  })
})
