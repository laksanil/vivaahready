import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()
const normalizeSameAsMinePreferencesMock = vi.fn()
const validateAboutMeStepMock = vi.fn()
const validateLocationEducationStepMock = vi.fn()
const validatePartnerPreferencesAdditionalMock = vi.fn()
const validatePartnerPreferencesMustHavesMock = vi.fn()
const getEffectiveUniversityMock = vi.fn()

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

vi.mock('@/lib/profileFlowValidation', () => ({
  validateAboutMeStep: validateAboutMeStepMock,
  validateLocationEducationStep: validateLocationEducationStepMock,
  validatePartnerPreferencesAdditional: validatePartnerPreferencesAdditionalMock,
  validatePartnerPreferencesMustHaves: validatePartnerPreferencesMustHavesMock,
  getEffectiveUniversity: getEffectiveUniversityMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/profile/profile-1', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/profile/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', email: 'user@example.com' } })
    getTargetUserIdMock.mockResolvedValue({ userId: 'user-1' })
    normalizeSameAsMinePreferencesMock.mockImplementation((body) => body)
    getEffectiveUniversityMock.mockImplementation((value) => value)

    validateAboutMeStepMock.mockReturnValue({ isValid: true, errors: [] })
    validateLocationEducationStepMock.mockReturnValue({ isValid: true, errors: [] })
    validatePartnerPreferencesAdditionalMock.mockReturnValue({ isValid: true, errors: [] })
    validatePartnerPreferencesMustHavesMock.mockReturnValue({
      isValid: true,
      errors: [],
      normalizedDealbreakers: {
        prefAgeIsDealbreaker: true,
        prefHeightIsDealbreaker: true,
        prefMaritalStatusIsDealbreaker: true,
        prefReligionIsDealbreaker: true,
      },
      sanitizedPrefMaritalStatus: 'never_married',
      selectedReligions: ['hindu'],
    })

    prismaMock.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      university: null,
      referralSource: null,
      prefQualification: null,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        phone: null,
      },
    })
    prismaMock.profile.update.mockResolvedValue({ id: 'profile-1' })
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' })
  })

  it('persists health and disability fields from the request body', async () => {
    const { PUT } = await import('@/app/api/profile/[id]/route')

    const response = await PUT(
      buildRequest({
        healthInfo: 'Mild asthma',
        anyDisability: 'mobility',
        disabilityDetails: 'Uses a wheelchair',
        allergiesOrMedical: 'Peanut allergy',
      }) as any,
      { params: { id: 'profile-1' } } as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Profile updated successfully',
      profileId: 'profile-1',
    })

    expect(prismaMock.profile.update).toHaveBeenCalledTimes(1)
    expect(prismaMock.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profile-1' },
        data: expect.objectContaining({
          healthInfo: 'Mild asthma',
          anyDisability: 'mobility',
          disabilityDetails: 'Uses a wheelchair',
          allergiesOrMedical: 'Peanut allergy',
        }),
      })
    )
  })
})
