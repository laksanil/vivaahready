import { beforeEach, describe, expect, it, vi } from 'vitest'

const isAdminAuthenticatedMock = vi.fn()
const isMutualMatchMock = vi.fn()
const sendProfileApprovedEmailMock = vi.fn()
const sendNewMatchAvailableEmailMock = vi.fn()
const storeNotificationMock = vi.fn()

const prismaMock = {
  profile: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
}

vi.mock('@/lib/admin', () => ({
  isAdminAuthenticated: isAdminAuthenticatedMock,
}))

vi.mock('@/lib/matching', () => ({
  isMutualMatch: isMutualMatchMock,
}))

vi.mock('@/lib/email', () => ({
  sendProfileApprovedEmail: sendProfileApprovedEmailMock,
  sendNewMatchAvailableEmail: sendNewMatchAvailableEmailMock,
}))

vi.mock('@/lib/notifications', () => ({
  storeNotification: storeNotificationMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/approve', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function flushAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('POST /api/admin/approve email timing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAdminAuthenticatedMock.mockResolvedValue(true)
    isMutualMatchMock.mockReturnValue(true)
    sendProfileApprovedEmailMock.mockResolvedValue({ success: true })
    sendNewMatchAvailableEmailMock.mockResolvedValue({ success: true })
    storeNotificationMock.mockResolvedValue(undefined)
    prismaMock.profile.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.user.update.mockResolvedValue({ id: 'candidate-user-id' })
  })

  it('sends profile approval email and new-match email when profile is approved', async () => {
    const approvedProfile = {
      id: 'approved-profile-id',
      userId: 'approved-user-id',
      gender: 'female',
      user: {
        id: 'approved-user-id',
        email: 'approved@example.com',
        name: 'Approved User',
      },
    }

    prismaMock.profile.findMany
      .mockResolvedValueOnce([approvedProfile]) // verify profile exists
      .mockResolvedValueOnce([approvedProfile]) // approved profiles for notification
      .mockResolvedValueOnce([
        {
          id: 'candidate-profile-id',
          userId: 'candidate-user-id',
          gender: 'male',
          user: {
            id: 'candidate-user-id',
            email: 'candidate@example.com',
            name: 'Candidate User',
            lastLogin: new Date('2025-01-01T00:00:00.000Z'),
            lastNewMatchNotificationAt: null,
          },
        },
      ]) // potential matches

    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'approved-profile-id',
      user: {
        name: 'Approved User',
        email: 'approved@example.com',
      },
    })

    const { POST } = await import('@/app/api/admin/approve/route')
    const response = await POST(
      buildRequest({
        profileId: 'approved-profile-id',
        action: 'approve',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Profile approved successfully',
    })

    expect(sendProfileApprovedEmailMock).toHaveBeenCalledTimes(1)
    expect(sendProfileApprovedEmailMock).toHaveBeenCalledWith('approved@example.com', 'Approved User')
    expect(storeNotificationMock).toHaveBeenCalledWith(
      'profile_approved',
      'approved-user-id',
      {
        name: 'Approved User',
      },
      { deliveryModes: ['email'] }
    )

    // Background notifyMatchingUsers is fire-and-forget; allow microtasks to complete.
    await flushAsync()

    expect(sendNewMatchAvailableEmailMock).toHaveBeenCalledTimes(1)
    expect(sendNewMatchAvailableEmailMock).toHaveBeenCalledWith(
      'candidate@example.com',
      'Candidate User',
      1
    )
    expect(storeNotificationMock).toHaveBeenCalledWith(
      'match_available',
      'candidate-user-id',
      {
        name: 'Candidate User',
        matchCount: '1',
      },
      { deliveryModes: ['email'] }
    )
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'candidate-user-id' },
      data: { lastNewMatchNotificationAt: expect.any(Date) },
    })
  })

  it('does not send approval/new-match emails when profile is rejected', async () => {
    const rejectedProfile = {
      id: 'rejected-profile-id',
      userId: 'rejected-user-id',
      gender: 'male',
      user: {
        id: 'rejected-user-id',
        email: 'rejected@example.com',
        name: 'Rejected User',
      },
    }

    prismaMock.profile.findMany.mockResolvedValueOnce([rejectedProfile]) // verify profile exists
    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'rejected-profile-id',
      user: {
        name: 'Rejected User',
        email: 'rejected@example.com',
      },
    })

    const { POST } = await import('@/app/api/admin/approve/route')
    const response = await POST(
      buildRequest({
        profileId: 'rejected-profile-id',
        action: 'reject',
        rejectionReason: 'Incomplete details',
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Profile rejected successfully',
    })

    expect(sendProfileApprovedEmailMock).not.toHaveBeenCalled()
    expect(sendNewMatchAvailableEmailMock).not.toHaveBeenCalled()
    expect(storeNotificationMock).not.toHaveBeenCalled()
  })
})
