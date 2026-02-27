import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()
const normalizeSameAsMinePreferencesMock = vi.fn((body: unknown) => body)

const prismaMock = {
  profile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
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

vi.mock('@/lib/preferenceNormalization', () => ({
  normalizeSameAsMinePreferences: normalizeSameAsMinePreferencesMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('PUT /api/profile aboutme LinkedIn handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    getTargetUserIdMock.mockResolvedValue({ userId: 'user-1', isAdminView: false })
    normalizeSameAsMinePreferencesMock.mockImplementation((body: unknown) => body)

    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      university: 'Stanford',
      referralSource: 'google',
      prefQualification: 'bachelors',
    })

    prismaMock.profile.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'profile-1',
      userId: 'user-1',
      ...data,
    }))
  })

  it('accepts linkedinProfile=no_linkedin for aboutme edit and stores null in DB', async () => {
    const { PUT } = await import('@/app/api/profile/route')

    const response = await PUT(new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        _editSection: 'aboutme',
        aboutMe: 'anything',
        linkedinProfile: 'no_linkedin',
        referralSource: 'facebook',
      }),
    }))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.profile.linkedinProfile).toBeNull()
    expect(prismaMock.profile.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
      data: expect.objectContaining({
        linkedinProfile: null,
        referralSource: 'facebook',
      }),
    }))
  })

  it('still requires referralSource in aboutme edit', async () => {
    const { PUT } = await import('@/app/api/profile/route')

    const response = await PUT(new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        _editSection: 'aboutme',
        linkedinProfile: 'no_linkedin',
        referralSource: '',
      }),
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/referral source is required/i),
    })
    expect(prismaMock.profile.update).not.toHaveBeenCalled()
  })
})
