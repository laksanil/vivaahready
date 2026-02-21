import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()
const incrementInterestStatsMock = vi.fn()
const incrementMutualMatchesForBothMock = vi.fn()
const sendNewInterestEmailMock = vi.fn()
const sendInterestAcceptedEmailMock = vi.fn()

const prismaMock = {
  profile: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  match: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

vi.mock('@/lib/lifetimeStats', () => ({
  incrementInterestStats: incrementInterestStatsMock,
  incrementMutualMatchesForBoth: incrementMutualMatchesForBothMock,
}))

vi.mock('@/lib/email', () => ({
  sendNewInterestEmail: sendNewInterestEmailMock,
  sendInterestAcceptedEmail: sendInterestAcceptedEmailMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/engagementPoints', () => ({
  awardInterestPoints: vi.fn().mockResolvedValue({ awarded: true }),
  awardResponsePoints: vi.fn().mockResolvedValue({ awarded: true }),
}))

function buildRequest(method: 'POST' | 'PATCH', body: Record<string, unknown>) {
  return new Request('http://localhost/api/interest', {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('/api/interest email timing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'session-user' } })
    getTargetUserIdMock.mockResolvedValue({ userId: 'sender-user-id' })
    incrementInterestStatsMock.mockResolvedValue(undefined)
    incrementMutualMatchesForBothMock.mockResolvedValue(undefined)
    sendNewInterestEmailMock.mockResolvedValue({ success: true })
    sendInterestAcceptedEmailMock.mockResolvedValue({ success: true })
  })

  it('sends "new interest" email when expressing a non-mutual interest', async () => {
    prismaMock.profile.findUnique
      .mockResolvedValueOnce({ id: 'sender-profile-id', approvalStatus: 'approved' }) // sender profile
      .mockResolvedValueOnce({
        id: 'receiver-profile-id',
        userId: 'receiver-user-id',
        linkedinProfile: null,
        facebookInstagram: null,
        user: {
          id: 'receiver-user-id',
          name: 'Gautam S.',
          email: 'asonti@gmail.com',
          phone: '+14085550099',
        },
      }) // target profile

    prismaMock.match.findUnique
      .mockResolvedValueOnce(null) // no existing sent interest
      .mockResolvedValueOnce(null) // no reverse (mutual) interest

    prismaMock.match.create.mockResolvedValue({
      id: 'interest-1',
      senderId: 'sender-user-id',
      receiverId: 'receiver-user-id',
      status: 'pending',
    })

    prismaMock.user.findUnique.mockResolvedValue({
      name: 'Rachana J.',
      profile: {
        id: 'sender-profile-id',
        firstName: 'Rachana',
      },
    })

    const { POST } = await import('@/app/api/interest/route')
    const response = await POST(buildRequest('POST', { profileId: 'receiver-profile-id' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Interest sent successfully',
      mutual: false,
    })

    expect(sendNewInterestEmailMock).toHaveBeenCalledTimes(1)
    expect(sendNewInterestEmailMock).toHaveBeenCalledWith(
      'asonti@gmail.com',
      'Gautam S.',
      'Rachana',
      'sender-profile-id'
    )
    expect(sendInterestAcceptedEmailMock).not.toHaveBeenCalled()
  })

  it('sends "interest accepted" email only when an interest is accepted', async () => {
    getTargetUserIdMock.mockResolvedValue({ userId: 'receiver-user-id' })

    prismaMock.match.findUnique.mockResolvedValue({
      id: 'interest-accept-1',
      senderId: 'sender-user-id',
      receiverId: 'receiver-user-id',
      status: 'pending',
      sender: {
        id: 'sender-user-id',
        name: 'Rachana J.',
        email: 'rachana@example.com',
        phone: '+14085550012',
        profile: {
          linkedinProfile: null,
          facebookInstagram: null,
        },
      },
      receiver: {
        id: 'receiver-user-id',
        name: 'Gautam S.',
        email: 'asonti@gmail.com',
        phone: '+14085550099',
      },
    })

    prismaMock.profile.findUnique
      .mockResolvedValueOnce({ approvalStatus: 'approved' }) // receiver approval check
      .mockResolvedValueOnce({ id: 'receiver-profile-id', firstName: 'Gautam' }) // receiver profile for email payload

    prismaMock.match.update.mockResolvedValue({
      id: 'interest-accept-1',
      status: 'accepted',
    })

    const { PATCH } = await import('@/app/api/interest/route')
    const response = await PATCH(
      buildRequest('PATCH', {
        interestId: 'interest-accept-1',
        action: 'accept',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Interest accepted! You can now view their contact details.',
    })

    expect(sendInterestAcceptedEmailMock).toHaveBeenCalledTimes(1)
    expect(sendInterestAcceptedEmailMock).toHaveBeenCalledWith(
      'rachana@example.com',
      'Rachana J.',
      'Gautam',
      'receiver-profile-id'
    )
    expect(sendNewInterestEmailMock).not.toHaveBeenCalled()
  })

  it('does not send acceptance email when interest is rejected', async () => {
    getTargetUserIdMock.mockResolvedValue({ userId: 'receiver-user-id' })

    prismaMock.match.findUnique.mockResolvedValue({
      id: 'interest-reject-1',
      senderId: 'sender-user-id',
      receiverId: 'receiver-user-id',
      status: 'pending',
      sender: {
        id: 'sender-user-id',
        name: 'Rachana J.',
        email: 'rachana@example.com',
        phone: '+14085550012',
        profile: {
          linkedinProfile: null,
          facebookInstagram: null,
        },
      },
      receiver: {
        id: 'receiver-user-id',
        name: 'Gautam S.',
        email: 'asonti@gmail.com',
        phone: '+14085550099',
      },
    })

    prismaMock.match.update.mockResolvedValue({
      id: 'interest-reject-1',
      status: 'rejected',
    })

    const { PATCH } = await import('@/app/api/interest/route')
    const response = await PATCH(
      buildRequest('PATCH', {
        interestId: 'interest-reject-1',
        action: 'reject',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Interest declined. You can reconsider later if you change your mind.',
    })
    expect(sendInterestAcceptedEmailMock).not.toHaveBeenCalled()
  })
})
