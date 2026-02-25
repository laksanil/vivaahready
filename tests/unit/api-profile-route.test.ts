import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const getTargetUserIdMock = vi.fn()
const normalizeSameAsMinePreferencesMock = vi.fn()
const validateAboutMeStepMock = vi.fn()
const validateLocationEducationStepMock = vi.fn()
const validatePartnerPreferencesAdditionalMock = vi.fn()
const validatePartnerPreferencesMustHavesMock = vi.fn()
const getEffectiveUniversityMock = vi.fn()
const generateVrIdMock = vi.fn()

const prismaMock = {
  profile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    update: vi.fn(),
    findUnique: vi.fn(),
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

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/vrId', () => ({
  generateVrId: generateVrIdMock,
}))

vi.mock('@/lib/preferenceNormalization', () => ({
  normalizeSameAsMinePreferences: normalizeSameAsMinePreferencesMock,
}))

vi.mock('@/lib/profileFlowValidation', () => ({
  validateAboutMeStep: validateAboutMeStepMock,
  getEffectiveUniversity: getEffectiveUniversityMock,
  validateLocationEducationStep: validateLocationEducationStepMock,
  validatePartnerPreferencesAdditional: validatePartnerPreferencesAdditionalMock,
  validatePartnerPreferencesMustHaves: validatePartnerPreferencesMustHavesMock,
}))

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/profile', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', email: 'user@example.com' } })
    getTargetUserIdMock.mockResolvedValue({ userId: 'user-1' })
    normalizeSameAsMinePreferencesMock.mockImplementation((body) => body)
    getEffectiveUniversityMock.mockImplementation((value) => value)
    generateVrIdMock.mockResolvedValue('VR-123')

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
      university: null,
      referralSource: 'friend',
      prefQualification: null,
    })
    prismaMock.profile.update.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      anyDisability: 'mobility',
      disabilityDetails: 'Uses a wheelchair',
      allergiesOrMedical: 'Peanut allergy',
    })
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' })
    prismaMock.user.findUnique.mockResolvedValue(null)
  })

  it('persists allergies and disability fields from Edit About Me', async () => {
    const { PUT } = await import('@/app/api/profile/route')

    const response = await PUT(
      buildRequest({
        _editSection: 'aboutme',
        aboutMe: 'This is a sufficiently long about me text for validation purposes in the route test.',
        linkedinProfile: 'https://www.linkedin.com/in/test-user',
        referralSource: 'friend',
        anyDisability: 'mobility',
        disabilityDetails: 'Uses a wheelchair',
        allergiesOrMedical: 'Peanut allergy',
      }) as any
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Profile updated successfully',
    })

    expect(prismaMock.profile.update).toHaveBeenCalledTimes(1)
    expect(prismaMock.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          anyDisability: 'mobility',
          disabilityDetails: 'Uses a wheelchair',
          allergiesOrMedical: 'Peanut allergy',
        }),
      })
    )
  })
})
