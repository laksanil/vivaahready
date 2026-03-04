import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()
const incrementInterestStatsMock = vi.fn()
const incrementMutualMatchesForBothMock = vi.fn()
const sendNewInterestEmailMock = vi.fn()
const sendInterestAcceptedEmailMock = vi.fn()
const awardInterestPointsMock = vi.fn()
const awardResponsePointsMock = vi.fn()

const prismaMock = {
  profile: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  match: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  declinedProfile: {
    upsert: vi.fn(),
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

vi.mock('@/lib/engagementPoints', () => ({
  awardInterestPoints: awardInterestPointsMock,
  awardResponsePoints: awardResponsePointsMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildRequest(method: 'GET' | 'POST' | 'PATCH', url: string, body?: Record<string, unknown>) {
  return new Request(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function senderWithProfile(senderId: string, name: string, status: string) {
  return {
    id: `match_${senderId}_${status}`,
    senderId,
    receiverId: 'current_user',
    status,
    createdAt: new Date('2026-03-02T12:00:00.000Z'),
    sender: {
      id: senderId,
      name,
      email: `${senderId}@example.com`,
      phone: '+14085550001',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        id: `profile_${senderId}`,
        userId: senderId,
        gender: 'male',
        currentLocation: 'San Jose, California',
        occupation: 'software_engineer',
        qualification: 'masters',
        profileImageUrl: null,
        photoUrls: null,
        linkedinProfile: null,
        facebookInstagram: null,
        odNumber: `VR-${senderId}`,
        approvalStatus: 'approved',
      },
    },
  }
}

function receiverWithProfile(receiverId: string, status: string) {
  return {
    id: `match_current_${receiverId}_${status}`,
    senderId: 'current_user',
    receiverId,
    status,
    createdAt: new Date('2026-03-02T12:00:00.000Z'),
    receiver: {
      id: receiverId,
      name: `Receiver ${receiverId}`,
      email: `${receiverId}@example.com`,
      phone: '+14085550011',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        id: `profile_${receiverId}`,
        userId: receiverId,
        gender: 'female',
        currentLocation: 'Seattle, Washington',
        occupation: 'doctor',
        qualification: 'doctorate',
        profileImageUrl: null,
        photoUrls: null,
        odNumber: `VR-${receiverId}`,
        approvalStatus: 'approved',
      },
    },
  }
}

describe('/api/interest detailed lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'session_user' } })
    getTargetUserIdMock.mockResolvedValue({ userId: 'current_user' })
    incrementInterestStatsMock.mockResolvedValue(undefined)
    incrementMutualMatchesForBothMock.mockResolvedValue(undefined)
    sendNewInterestEmailMock.mockResolvedValue({ success: true })
    sendInterestAcceptedEmailMock.mockResolvedValue({ success: true })
    awardInterestPointsMock.mockResolvedValue({ awarded: true })
    awardResponsePointsMock.mockResolvedValue({ awarded: true })
  })

  it('returns 401 for GET when target user is unavailable', async () => {
    getTargetUserIdMock.mockResolvedValueOnce(null)

    const { GET } = await import('@/app/api/interest/route')
    const response = await GET(buildRequest('GET', 'http://localhost/api/interest?type=received'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns received interests excluding pending mutual interests', async () => {
    prismaMock.match.findMany.mockResolvedValueOnce([
      senderWithProfile('sender_pending_mutual', 'Mutual Sender', 'pending'),
      senderWithProfile('sender_rejected', 'Rejected Sender', 'rejected'),
      senderWithProfile('sender_accepted', 'Accepted Sender', 'accepted'),
    ])

    // pending mutual check only runs for pending row.
    prismaMock.match.findUnique.mockResolvedValueOnce({
      id: 'reverse_match_exists',
      senderId: 'current_user',
      receiverId: 'sender_pending_mutual',
      status: 'pending',
    })

    const { GET } = await import('@/app/api/interest/route')
    const response = await GET(buildRequest('GET', 'http://localhost/api/interest?type=received'))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.interests).toHaveLength(2)
    expect(payload.interests.map((i: any) => i.status)).toEqual(['rejected', 'accepted'])
  })

  it('returns sent interests excluding accepted rows', async () => {
    prismaMock.match.findMany.mockResolvedValueOnce([
      receiverWithProfile('receiver_pending', 'pending'),
      receiverWithProfile('receiver_rejected', 'rejected'),
    ])

    const { GET } = await import('@/app/api/interest/route')
    const response = await GET(buildRequest('GET', 'http://localhost/api/interest?type=sent'))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.interests).toHaveLength(2)
    expect(payload.interests.map((i: any) => i.status)).toEqual(['pending', 'rejected'])
    expect(payload.interests[0].receiver.id).toBe('receiver_pending')
    expect(payload.interests[1].receiver.id).toBe('receiver_rejected')
  })

  it('creates non-mutual interest, awards points, and sends new-interest email', async () => {
    prismaMock.profile.findUnique
      .mockResolvedValueOnce({ id: 'my_profile', approvalStatus: 'approved' })
      .mockResolvedValueOnce({
        id: 'target_profile',
        userId: 'target_user',
        linkedinProfile: null,
        facebookInstagram: null,
        user: {
          id: 'target_user',
          name: 'Target User',
          email: 'target@example.com',
          phone: '+14085559999',
        },
      })

    prismaMock.match.findUnique
      .mockResolvedValueOnce(null) // no existing interest
      .mockResolvedValueOnce(null) // no reverse interest

    prismaMock.match.create.mockResolvedValueOnce({
      id: 'new_interest_1',
      senderId: 'current_user',
      receiverId: 'target_user',
      status: 'pending',
    })

    prismaMock.user.findUnique.mockResolvedValueOnce({
      name: 'Current User',
      profile: {
        id: 'my_profile',
        firstName: 'Current',
      },
    })

    const { POST } = await import('@/app/api/interest/route')
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/interest', { profileId: 'target_profile' })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Interest sent successfully',
      mutual: false,
    })
    expect(awardInterestPointsMock).toHaveBeenCalledWith('current_user', 'new_interest_1')
    expect(sendNewInterestEmailMock).toHaveBeenCalledWith(
      'target@example.com',
      'Target User',
      'Current',
      'my_profile'
    )
    expect(incrementInterestStatsMock).toHaveBeenCalledWith('current_user', 'target_user')
  })

  it('blocks mutual connection when current user is not approved', async () => {
    prismaMock.profile.findUnique
      .mockResolvedValueOnce({ id: 'my_profile', approvalStatus: 'pending' })
      .mockResolvedValueOnce({
        id: 'target_profile',
        userId: 'target_user',
        user: { id: 'target_user', name: 'Target User', email: 'target@example.com', phone: null },
      })

    prismaMock.match.findUnique
      .mockResolvedValueOnce(null) // no existing sent interest
      .mockResolvedValueOnce({
        id: 'reverse_interest',
        senderId: 'target_user',
        receiverId: 'current_user',
        status: 'pending',
      })

    const { POST } = await import('@/app/api/interest/route')
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/interest', { profileId: 'target_profile' })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      requiresVerification: true,
      wouldBeMutual: true,
    })
    expect(prismaMock.match.create).not.toHaveBeenCalled()
    expect(awardInterestPointsMock).not.toHaveBeenCalled()
  })

  it('rejects accept/reconsider actions when receiver is not approved', async () => {
    prismaMock.match.findUnique.mockResolvedValueOnce({
      id: 'interest_1',
      senderId: 'sender_1',
      receiverId: 'current_user',
      status: 'pending',
      sender: {
        id: 'sender_1',
        name: 'Sender',
        email: 'sender@example.com',
        phone: null,
        profile: {},
      },
      receiver: {
        id: 'current_user',
        name: 'Current User',
        email: 'current@example.com',
        phone: null,
      },
    })

    prismaMock.profile.findUnique.mockResolvedValueOnce({ approvalStatus: 'pending' })

    const { PATCH } = await import('@/app/api/interest/route')
    const response = await PATCH(
      buildRequest('PATCH', 'http://localhost/api/interest', {
        interestId: 'interest_1',
        action: 'accept',
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ requiresVerification: true })
    expect(prismaMock.match.update).not.toHaveBeenCalled()
    expect(awardResponsePointsMock).not.toHaveBeenCalled()
  })

  it('awards response points when rejecting an interest', async () => {
    prismaMock.match.findUnique.mockResolvedValueOnce({
      id: 'interest_reject_1',
      senderId: 'sender_1',
      receiverId: 'current_user',
      status: 'pending',
      sender: {
        id: 'sender_1',
        name: 'Sender',
        email: 'sender@example.com',
        phone: null,
        profile: {},
      },
      receiver: {
        id: 'current_user',
        name: 'Current User',
        email: 'current@example.com',
        phone: null,
      },
    })

    prismaMock.match.update.mockResolvedValueOnce({
      id: 'interest_reject_1',
      status: 'rejected',
    })

    const { PATCH } = await import('@/app/api/interest/route')
    const response = await PATCH(
      buildRequest('PATCH', 'http://localhost/api/interest', {
        interestId: 'interest_reject_1',
        action: 'reject',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Interest declined. You can reconsider later if you change your mind.',
    })
    expect(awardResponsePointsMock).toHaveBeenCalledWith('current_user', 'interest_reject_1')
    expect(sendInterestAcceptedEmailMock).not.toHaveBeenCalled()
  })

  it('withdraws by targetUserId and moves profile to reconsider list without awarding response points', async () => {
    prismaMock.match.findUnique
      .mockResolvedValueOnce({
        id: 'interest_withdraw_1',
        senderId: 'current_user',
        receiverId: 'target_user',
        status: 'pending',
      })
      .mockResolvedValueOnce({
        id: 'interest_withdraw_1',
        senderId: 'current_user',
        receiverId: 'target_user',
        status: 'pending',
        sender: {
          id: 'current_user',
          name: 'Current User',
          email: 'current@example.com',
          phone: null,
          profile: {},
        },
        receiver: {
          id: 'target_user',
          name: 'Target User',
          email: 'target@example.com',
          phone: null,
          profile: {},
        },
      })

    prismaMock.match.delete.mockResolvedValueOnce({ id: 'interest_withdraw_1' })
    prismaMock.declinedProfile.upsert.mockResolvedValueOnce({ id: 'declined_1' })

    const { PATCH } = await import('@/app/api/interest/route')
    const response = await PATCH(
      buildRequest('PATCH', 'http://localhost/api/interest', {
        targetUserId: 'target_user',
        action: 'withdraw',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Interest withdrawn and removed.',
      deleted: true,
    })
    expect(prismaMock.match.delete).toHaveBeenCalledWith({ where: { id: 'interest_withdraw_1' } })
    expect(prismaMock.declinedProfile.upsert).toHaveBeenCalledTimes(1)
    expect(awardResponsePointsMock).not.toHaveBeenCalled()
  })
})
