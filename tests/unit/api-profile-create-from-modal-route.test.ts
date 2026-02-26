import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSessionMock = vi.fn()
const generateVrIdMock = vi.fn()
const normalizeSameAsMinePreferencesMock = vi.fn()
const sendReferralThankYouEmailMock = vi.fn()
const getReferralCountMock = vi.fn()
const normalizeLifestyleOtherSelectionsMock = vi.fn()
const validateAboutMeStepMock = vi.fn()
const validateBasicsStepMock = vi.fn()
const getEffectiveUniversityMock = vi.fn()
const getEffectiveOccupationMock = vi.fn()
const isNonWorkingOccupationMock = vi.fn()

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  profile: {
    findFirst: vi.fn(),
    create: vi.fn(),
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

vi.mock('@/lib/vrId', () => ({
  generateVrId: generateVrIdMock,
}))

vi.mock('@/lib/preferenceNormalization', () => ({
  normalizeSameAsMinePreferences: normalizeSameAsMinePreferencesMock,
}))

vi.mock('@/lib/email', () => ({
  sendReferralThankYouEmail: sendReferralThankYouEmailMock,
}))

vi.mock('@/lib/referral', () => ({
  getReferralCount: getReferralCountMock,
}))

vi.mock('@/lib/profileFlowValidation', () => ({
  getEffectiveOccupation: getEffectiveOccupationMock,
  getEffectiveUniversity: getEffectiveUniversityMock,
  isNonWorkingOccupation: isNonWorkingOccupationMock,
  normalizeLifestyleOtherSelections: normalizeLifestyleOtherSelectionsMock,
  validateAboutMeStep: validateAboutMeStepMock,
  validateBasicsStep: validateBasicsStepMock,
}))

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/profile/create-from-modal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/profile/create-from-modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    getServerSessionMock.mockResolvedValue({ user: { email: 'test@example.com', name: 'Test User' } })
    generateVrIdMock.mockResolvedValue('VR-999')
    normalizeSameAsMinePreferencesMock.mockImplementation((body) => body)
    normalizeLifestyleOtherSelectionsMock.mockReturnValue({
      normalizedValues: { hobbies: '', fitness: '', interests: '' },
      errors: [],
    })
    validateAboutMeStepMock.mockReturnValue({ isValid: true, errors: [] })
    validateBasicsStepMock.mockReturnValue({
      isValid: false,
      errors: ['Profile created by is required.'],
    })
    getEffectiveUniversityMock.mockReturnValue('')
    getEffectiveOccupationMock.mockReturnValue('')
    isNonWorkingOccupationMock.mockReturnValue(false)
    getReferralCountMock.mockResolvedValue(0)
    sendReferralThankYouEmailMock.mockResolvedValue(undefined)

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: null,
      profile: null,
    })
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: null,
      profile: null,
    })
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' })
    prismaMock.profile.findFirst.mockResolvedValue(null)
    prismaMock.profile.create.mockResolvedValue({ id: 'profile-1' })
  })

  it('allows partial bootstrap profile creation when _isPartialSave is true', async () => {
    const { POST } = await import('@/app/api/profile/create-from-modal/route')

    const response = await POST(
      buildRequest({
        email: 'test@example.com',
        firstName: 'Lakshmi',
        lastName: 'N',
        gender: 'female',
        dateOfBirth: '1990-01-01',
        _isPartialSave: true,
      }) as any
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Profile created successfully',
      profileId: 'profile-1',
    })
    expect(validateBasicsStepMock).not.toHaveBeenCalled()
    expect(prismaMock.profile.create).toHaveBeenCalledTimes(1)
  })

  it('still validates basics fields for non-partial basics submissions', async () => {
    const { POST } = await import('@/app/api/profile/create-from-modal/route')

    const response = await POST(
      buildRequest({
        email: 'test@example.com',
        firstName: 'Lakshmi',
        lastName: 'N',
        gender: 'female',
      }) as any
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Profile created by is required.',
    })
    expect(validateBasicsStepMock).toHaveBeenCalledTimes(1)
    expect(prismaMock.profile.create).not.toHaveBeenCalled()
  })

  it('returns success if profile is created but user sync update fails', async () => {
    const { POST } = await import('@/app/api/profile/create-from-modal/route')
    prismaMock.user.update.mockRejectedValueOnce(new Error('transient user update failure'))

    const response = await POST(
      buildRequest({
        email: 'test@example.com',
        firstName: 'Lakshmi',
        lastName: 'N',
        _isPartialSave: true,
      }) as any
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      message: 'Profile created successfully',
      profileId: 'profile-1',
    })
    expect(prismaMock.profile.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.user.update).toHaveBeenCalled()
  })
})
