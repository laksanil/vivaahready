import { test, expect, request as apiRequest, type APIRequestContext } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  adminLogin,
  adminApproveProfile,
  DEFAULT_PASSWORD,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

type SeededProfile = {
  userId: string
  profileId: string
  email: string
}

async function readError(response: import('@playwright/test').APIResponse): Promise<string> {
  return await response.text().catch(() => '')
}

test.describe.serial('Dev scenarios: custom education + strict preference filters', () => {
  test.describe.configure({ timeout: 240000 })

  let adminRequest: APIRequestContext

  const seedProfile = async (
    request: APIRequestContext,
    suffix: string,
    gender: 'male' | 'female',
    overrides: Record<string, unknown> = {}
  ): Promise<SeededProfile> => {
    const user = buildTestUser(suffix, gender)
    const created = await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD, overrides)
    await adminApproveProfile(adminRequest, baseURL, created.profileId)
    return {
      userId: created.userId,
      profileId: created.profileId,
      email: user.email,
    }
  }

  const updateAsAdmin = async (userId: string, data: Record<string, unknown>) => {
    const response = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, { data })
    expect(
      response.ok(),
      `profile update failed for ${userId}: ${await readError(response)}`
    ).toBeTruthy()
  }

  const readProfileAsAdmin = async (userId: string) => {
    const response = await adminRequest.get(`/api/profile?viewAsUser=${userId}`)
    expect(
      response.ok(),
      `profile read failed for ${userId}: ${await readError(response)}`
    ).toBeTruthy()
    return await response.json()
  }

  const autoMatchUserIds = async (userId: string): Promise<Set<string>> => {
    const response = await adminRequest.get(`/api/matches/auto?viewAsUser=${userId}`)
    expect(
      response.ok(),
      `auto-match fetch failed for ${userId}: ${await readError(response)}`
    ).toBeTruthy()
    const payload = await response.json()
    const allIds = [
      ...((payload.matches || []) as Array<{ userId?: string }>),
      ...((payload.mutualMatches || []) as Array<{ userId?: string }>),
      ...((payload.nearMatches || []) as Array<{ userId?: string }>),
    ]
      .map(match => match.userId)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)

    return new Set(allIds)
  }

  const autoMatchProfiles = async (userId: string) => {
    const response = await adminRequest.get(`/api/matches/auto?viewAsUser=${userId}`)
    expect(
      response.ok(),
      `auto-match fetch failed for ${userId}: ${await readError(response)}`
    ).toBeTruthy()
    const payload = await response.json()
    const allProfiles = [
      ...((payload.matches || []) as Array<Record<string, unknown>>),
      ...((payload.freshMatches || []) as Array<Record<string, unknown>>),
      ...((payload.mutualMatches || []) as Array<Record<string, unknown>>),
      ...((payload.nearMatches || []) as Array<Record<string, unknown>>),
    ]

    const byUserId = new Map<string, Record<string, unknown>>()
    for (const profile of allProfiles) {
      const candidateUserId = profile.userId
      if (typeof candidateUserId === 'string' && candidateUserId.length > 0 && !byUserId.has(candidateUserId)) {
        byUserId.set(candidateUserId, profile)
      }
    }

    return { payload, byUserId }
  }

  test.beforeAll(async ({ request }) => {
    adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    // Keep this request context for seeding helper usage.
    // No-op call to ensure request context is initialized in beforeAll.
    await request.get(`${baseURL}/api/health`).catch(() => null)
  })

  test.afterAll(async () => {
    await adminRequest?.dispose()
  })

  test('Mom A can save custom masters-psychology profile with custom school and custom occupation', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-mom-a`
    const customUniversity = `California Behavioral Sciences Institute ${suffix}`
    const customOccupation = `school_psychologist_${suffix}`

    const momA = await seedProfile(request, suffix, 'female', {
      firstName: `MomA${suffix}`,
      qualification: 'masters_arts',
      educationLevel: 'masters',
      fieldOfStudy: 'social_sciences',
      major: 'School Psychology',
      university: customUniversity,
      occupation: customOccupation,
      employerName: 'William Hart School',
      annualIncome: '75k-100k',
      openToRelocation: 'depends_on_opportunity',
      religion: 'Hindu',
      community: 'Iyer',
      maritalStatus: 'never_married',
      dateOfBirth: '01/01/1993',
      height: `5'4"`,
      aboutMe: 'Experienced school psychologist looking for a kind and family-oriented match.',
    })

    await updateAsAdmin(momA.userId, {
      _editSection: 'location_education',
      country: 'USA',
      grewUpIn: 'USA',
      citizenship: 'USA',
      zipCode: '91355',
      educationLevel: 'masters',
      fieldOfStudy: 'social_sciences',
      major: 'School Psychology',
      university: customUniversity,
      occupation: 'other',
      occupationOther: customOccupation,
      employerName: 'William Hart School',
      annualIncome: '75k-100k',
      openToRelocation: 'depends_on_opportunity',
    })

    const profile = await readProfileAsAdmin(momA.userId)
    expect(profile.educationLevel).toBe('masters')
    expect(profile.fieldOfStudy).toBe('social_sciences')
    expect(profile.major).toBe('School Psychology')
    expect(profile.university).toBe(customUniversity)
    expect(profile.occupation).toBe(customOccupation)
    expect(profile.employerName).toBe('William Hart School')
  })

  test('Mom B strict custom preference ("masters + aeronautics engineering only") matches only exact candidates', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-mom-b`

    const momB = await seedProfile(request, `${suffix}-seeker`, 'female', {
      firstName: `MomB${suffix}`,
      qualification: 'masters_eng',
      educationLevel: 'masters',
      fieldOfStudy: 'engineering',
      major: 'Mechanical Engineering',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1992',
      height: `5'5"`,
    })

    const exactCandidate = await seedProfile(request, `${suffix}-exact`, 'male', {
      qualification: 'masters_eng',
      educationLevel: 'masters',
      fieldOfStudy: 'aeronautics_engineering',
      major: 'Aeronautics Engineering',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
      height: `5'10"`,
    })

    const wrongFieldCandidate = await seedProfile(request, `${suffix}-wrong-field`, 'male', {
      qualification: 'masters_eng',
      educationLevel: 'masters',
      fieldOfStudy: 'engineering',
      major: 'Civil Engineering',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
      height: `5'10"`,
    })

    const wrongDegreeCandidate = await seedProfile(request, `${suffix}-wrong-degree`, 'male', {
      qualification: 'bachelors_eng',
      educationLevel: 'bachelors',
      fieldOfStudy: 'aeronautics_engineering',
      major: 'Aeronautics Engineering',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
      height: `5'10"`,
    })

    await updateAsAdmin(momB.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'masters',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'aeronautics_engineering',
      prefFieldOfStudyIsDealbreaker: true,
    })

    const matchIds = await autoMatchUserIds(momB.userId)
    expect(matchIds.has(exactCandidate.userId)).toBeTruthy()
    expect(matchIds.has(wrongFieldCandidate.userId)).toBeFalsy()
    expect(matchIds.has(wrongDegreeCandidate.userId)).toBeFalsy()
  })

  test('Mom C strict preference ("PhD in computer science only") matches only PhD CS candidates', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-mom-c`

    const momC = await seedProfile(request, `${suffix}-seeker`, 'female', {
      firstName: `MomC${suffix}`,
      qualification: 'masters_cs',
      educationLevel: 'masters',
      fieldOfStudy: 'cs_it',
      major: 'Computer Science',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1992',
      height: `5'4"`,
    })

    const phdCsCandidate = await seedProfile(request, `${suffix}-phd-cs`, 'male', {
      qualification: 'phd',
      educationLevel: 'doctorate',
      fieldOfStudy: 'cs_it',
      major: 'Computer Science',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
      height: `5'10"`,
    })

    const phdNonCsCandidate = await seedProfile(request, `${suffix}-phd-eng`, 'male', {
      qualification: 'phd',
      educationLevel: 'doctorate',
      fieldOfStudy: 'engineering',
      major: 'Aerospace Engineering',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
      height: `5'10"`,
    })

    const mastersCsCandidate = await seedProfile(request, `${suffix}-masters-cs`, 'male', {
      qualification: 'masters_cs',
      educationLevel: 'masters',
      fieldOfStudy: 'cs_it',
      major: 'Computer Science',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
      height: `5'10"`,
    })

    await updateAsAdmin(momC.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'doctorate',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'cs_it',
      prefFieldOfStudyIsDealbreaker: true,
    })

    const matchIds = await autoMatchUserIds(momC.userId)
    expect(matchIds.has(phdCsCandidate.userId)).toBeTruthy()
    expect(matchIds.has(phdNonCsCandidate.userId)).toBeFalsy()
    expect(matchIds.has(mastersCsCandidate.userId)).toBeFalsy()
  })

  test('Extra negative check: field-of-study dealbreaker currently does not block candidates with missing field data', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-mom-extra`

    const seeker = await seedProfile(request, `${suffix}-seeker`, 'female', {
      qualification: 'masters_cs',
      educationLevel: 'masters',
      fieldOfStudy: 'cs_it',
      religion: 'Hindu',
      community: 'Iyer',
    })

    const candidateMissingField = await seedProfile(request, `${suffix}-missing-field`, 'male', {
      qualification: 'masters_cs',
      educationLevel: 'masters',
      fieldOfStudy: '',
      major: '',
      religion: 'Hindu',
      community: 'Iyer',
    })

    await updateAsAdmin(seeker.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'masters',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'cs_it',
      prefFieldOfStudyIsDealbreaker: true,
    })

    const matchIds = await autoMatchUserIds(seeker.userId)
    // Current behavior in matching.ts: missing candidate fieldOfStudy is treated as non-blocking.
    expect(matchIds.has(candidateMissingField.userId)).toBeTruthy()
  })

  test('"Master\'s or higher" preference matches masters/mba/medical/law/doctorate but not bachelors', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-masters-higher`

    const seeker = await seedProfile(request, `${suffix}-seeker`, 'female', {
      qualification: 'masters_cs',
      educationLevel: 'masters',
      fieldOfStudy: 'cs_it',
      religion: 'Hindu',
      community: 'Iyer',
    })

    const mastersCandidate = await seedProfile(request, `${suffix}-masters`, 'male', {
      educationLevel: 'masters',
      fieldOfStudy: 'engineering',
      qualification: 'masters_eng',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const mbaCandidate = await seedProfile(request, `${suffix}-mba`, 'male', {
      educationLevel: 'mba',
      fieldOfStudy: 'business',
      qualification: 'mba',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const medicalCandidate = await seedProfile(request, `${suffix}-medical`, 'male', {
      educationLevel: 'medical',
      fieldOfStudy: 'medical_health',
      qualification: 'md',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const lawCandidate = await seedProfile(request, `${suffix}-law`, 'male', {
      educationLevel: 'law',
      fieldOfStudy: 'law_legal',
      qualification: 'jd',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const doctorateCandidate = await seedProfile(request, `${suffix}-doctorate`, 'male', {
      educationLevel: 'doctorate',
      fieldOfStudy: 'cs_it',
      qualification: 'phd',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const bachelorsCandidate = await seedProfile(request, `${suffix}-bachelors`, 'male', {
      educationLevel: 'bachelors',
      fieldOfStudy: 'cs_it',
      qualification: 'bachelors_cs',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })

    await updateAsAdmin(seeker.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'masters',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'any',
      prefFieldOfStudyIsDealbreaker: false,
    })

    const matchIds = await autoMatchUserIds(seeker.userId)
    expect(matchIds.has(mastersCandidate.userId)).toBeTruthy()
    expect(matchIds.has(mbaCandidate.userId)).toBeTruthy()
    expect(matchIds.has(medicalCandidate.userId)).toBeTruthy()
    expect(matchIds.has(lawCandidate.userId)).toBeTruthy()
    expect(matchIds.has(doctorateCandidate.userId)).toBeTruthy()
    expect(matchIds.has(bachelorsCandidate.userId)).toBeFalsy()
  })

  test('doctor_or_lawyer preference matches medical + law but not doctorate', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-doctor-or-lawyer`

    const seeker = await seedProfile(request, `${suffix}-seeker`, 'female', {
      qualification: 'masters_cs',
      educationLevel: 'masters',
      fieldOfStudy: 'cs_it',
      religion: 'Hindu',
      community: 'Iyer',
    })

    const medicalCandidate = await seedProfile(request, `${suffix}-medical`, 'male', {
      educationLevel: 'medical',
      fieldOfStudy: 'medical_health',
      qualification: 'md',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const lawCandidate = await seedProfile(request, `${suffix}-law`, 'male', {
      educationLevel: 'law',
      fieldOfStudy: 'law_legal',
      qualification: 'jd',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const doctorateCandidate = await seedProfile(request, `${suffix}-doctorate`, 'male', {
      educationLevel: 'doctorate',
      fieldOfStudy: 'cs_it',
      qualification: 'phd',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })

    await updateAsAdmin(seeker.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'doctor_or_lawyer',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'any',
      prefFieldOfStudyIsDealbreaker: false,
    })

    const matchIds = await autoMatchUserIds(seeker.userId)
    expect(matchIds.has(medicalCandidate.userId)).toBeTruthy()
    expect(matchIds.has(lawCandidate.userId)).toBeTruthy()
    expect(matchIds.has(doctorateCandidate.userId)).toBeFalsy()
  })

  test('field-of-study dealbreaker excludes mismatched fields; non-dealbreaker keeps them with lower match score', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-field-dealbreaker`

    const seeker = await seedProfile(request, `${suffix}-seeker`, 'female', {
      qualification: 'masters_eng',
      educationLevel: 'masters',
      fieldOfStudy: 'engineering',
      religion: 'Hindu',
      community: 'Iyer',
    })

    const engineeringCandidate = await seedProfile(request, `${suffix}-engineering`, 'male', {
      educationLevel: 'masters',
      fieldOfStudy: 'engineering',
      qualification: 'masters_eng',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })
    const csCandidate = await seedProfile(request, `${suffix}-cs`, 'male', {
      educationLevel: 'masters',
      fieldOfStudy: 'cs_it',
      qualification: 'masters_cs',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })

    await updateAsAdmin(seeker.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'masters',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'engineering',
      prefFieldOfStudyIsDealbreaker: true,
    })

    const strictMatches = await autoMatchUserIds(seeker.userId)
    expect(strictMatches.has(engineeringCandidate.userId)).toBeTruthy()
    expect(strictMatches.has(csCandidate.userId)).toBeFalsy()

    await updateAsAdmin(seeker.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'masters',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'engineering',
      prefFieldOfStudyIsDealbreaker: false,
    })

    const relaxed = await autoMatchProfiles(seeker.userId)
    const engineeringProfile = relaxed.byUserId.get(engineeringCandidate.userId)
    const csProfile = relaxed.byUserId.get(csCandidate.userId)

    expect(engineeringProfile).toBeTruthy()
    expect(csProfile).toBeTruthy()

    const engineeringScore = Number((engineeringProfile?.matchScore as { percentage?: number } | undefined)?.percentage || 0)
    const csScore = Number((csProfile?.matchScore as { percentage?: number } | undefined)?.percentage || 0)
    expect(engineeringScore).toBeGreaterThan(csScore)
  })

  test('Asha scenario: School Psychology profile matches masters/social_sciences and not engineering preference', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-asha`

    const ashaProfile = await seedProfile(request, `${suffix}-candidate`, 'female', {
      educationLevel: 'masters',
      fieldOfStudy: 'social_sciences',
      major: 'School Psychology',
      qualification: 'masters_arts',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1993',
    })

    const socialSeeker = await seedProfile(request, `${suffix}-social-seeker`, 'male', {
      educationLevel: 'masters',
      fieldOfStudy: 'engineering',
      qualification: 'masters_eng',
      religion: 'Hindu',
      community: 'Iyer',
      dateOfBirth: '01/01/1991',
    })

    await updateAsAdmin(socialSeeker.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'masters',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'social_sciences',
      prefFieldOfStudyIsDealbreaker: true,
    })

    const socialMatches = await autoMatchUserIds(socialSeeker.userId)
    expect(socialMatches.has(ashaProfile.userId)).toBeTruthy()

    await updateAsAdmin(socialSeeker.userId, {
      _editSection: 'preferences_2',
      prefQualification: 'masters',
      prefEducationIsDealbreaker: true,
      prefFieldOfStudy: 'engineering',
      prefFieldOfStudyIsDealbreaker: true,
    })

    const engineeringMatches = await autoMatchUserIds(socialSeeker.userId)
    expect(engineeringMatches.has(ashaProfile.userId)).toBeFalsy()
  })

  test('dual-write consistency: saving educationLevel also populates legacy qualification', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-dual-write`
    const user = await seedProfile(request, suffix, 'female', {
      qualification: 'bachelors_cs',
      educationLevel: 'bachelors',
      fieldOfStudy: 'cs_it',
      religion: 'Hindu',
      community: 'Iyer',
    })

    await updateAsAdmin(user.userId, {
      _editSection: 'location_education',
      country: 'USA',
      grewUpIn: 'USA',
      citizenship: 'USA',
      zipCode: '95112',
      educationLevel: 'medical',
      qualification: '',
      fieldOfStudy: 'medical_health',
      major: 'Internal Medicine',
      university: 'Stanford University',
      occupation: 'doctor',
      employerName: 'Stanford Health',
      annualIncome: '150k-200k',
      openToRelocation: 'yes',
    })

    const updated = await readProfileAsAdmin(user.userId)
    expect(updated.educationLevel).toBe('medical')
    expect(updated.qualification).toBe('medical')
  })
})
