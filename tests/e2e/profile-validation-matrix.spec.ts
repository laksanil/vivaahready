import { test, expect, request as apiRequest, type APIRequestContext } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  adminLogin,
  DEFAULT_PASSWORD,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

test.describe.serial('Profile validation matrix (API)', () => {
  let adminRequest: APIRequestContext
  let userId = ''
  let profileId = ''

  test.beforeAll(async ({ request }) => {
    adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)
    const user = buildTestUser(`${suffix}-matrix`, 'male')
    const created = await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD, {
      firstName: `Matrix${suffix}`,
      religion: 'Hindu',
      community: 'Iyer',
      maritalStatus: 'never_married',
      height: `5'10"`,
      dateOfBirth: '01/01/1992',
      qualification: 'bachelors_cs',
      university: 'San Jose State University',
      occupation: 'software_engineer',
      employerName: 'Matrix Labs',
      annualIncome: '100k-150k',
      openToRelocation: 'yes',
      prefAgeMin: '25',
      prefAgeMax: '35',
      prefHeightMin: `5'2"`,
      prefHeightMax: `6'0"`,
      prefMaritalStatus: 'never_married',
      prefReligions: ['Hindu'],
      prefReligion: 'Hindu',
      prefAgeIsDealbreaker: true,
      prefHeightIsDealbreaker: true,
      prefMaritalStatusIsDealbreaker: true,
      prefReligionIsDealbreaker: true,
    })

    userId = created.userId
    profileId = created.profileId
  })

  test.afterAll(async () => {
    await adminRequest?.dispose()
  })

  test('location_education required-field matrix', async () => {
    const basePayload = {
      _editSection: 'location_education',
      country: 'USA',
      grewUpIn: 'USA',
      citizenship: 'USA',
      zipCode: '95112',
      qualification: 'bachelors_cs',
      university: 'San Jose State University',
      occupation: 'software_engineer',
      employerName: 'Matrix Labs',
      annualIncome: '100k-150k',
      openToRelocation: 'yes',
    }

    const failingCases: Array<{ name: string; patch: Record<string, unknown>; expected: RegExp }> = [
      { name: 'missing country', patch: { country: '' }, expected: /Country is required/i },
      { name: 'missing grew up in', patch: { grewUpIn: '' }, expected: /Grew Up In is required/i },
      { name: 'missing citizenship', patch: { citizenship: '' }, expected: /Citizenship is required/i },
      { name: 'missing zip for USA', patch: { zipCode: '' }, expected: /ZIP code is required/i },
      { name: 'missing qualification', patch: { qualification: '' }, expected: /Highest qualification is required/i },
      { name: 'missing university', patch: { university: '' }, expected: /College\/University is required/i },
      { name: 'missing occupation', patch: { occupation: '' }, expected: /Occupation is required/i },
      { name: 'missing annual income', patch: { annualIncome: '' }, expected: /Annual income is required/i },
      { name: 'missing relocation', patch: { openToRelocation: '' }, expected: /Open to relocation is required/i },
      {
        name: 'working occupation with empty employer',
        patch: { occupation: 'software_engineer', employerName: '' },
        expected: /Company\/Organization is required/i,
      },
    ]

    for (const testCase of failingCases) {
      const response = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
        data: {
          ...basePayload,
          ...testCase.patch,
        },
      })
      expect(response.status(), testCase.name).toBe(400)
      const payload = await response.json()
      expect(String(payload.error || ''), testCase.name).toMatch(testCase.expected)
    }

    const nonWorkingResponse = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        ...basePayload,
        occupation: 'student',
        employerName: '',
        annualIncome: 'student',
      },
    })
    expect(nonWorkingResponse.ok()).toBeTruthy()
  })

  test('preferences_1 required-field and deal-breaker matrix', async () => {
    const basePayload = {
      _editSection: 'preferences_1',
      prefAgeMin: '25',
      prefAgeMax: '35',
      prefHeightMin: `5'2"`,
      prefHeightMax: `6'0"`,
      prefMaritalStatus: 'never_married',
      prefReligions: ['Hindu'],
      prefReligion: 'Hindu',
      prefAgeIsDealbreaker: true,
      prefHeightIsDealbreaker: true,
      prefMaritalStatusIsDealbreaker: true,
      prefReligionIsDealbreaker: true,
    }

    const failingCases: Array<{ name: string; patch: Record<string, unknown>; expected: RegExp }> = [
      {
        name: 'missing age range',
        patch: { prefAgeMin: '', prefAgeMax: '' },
        expected: /age range is required/i,
      },
      {
        name: 'invalid age range',
        patch: { prefAgeMin: '40', prefAgeMax: '25' },
        expected: /age range is invalid/i,
      },
      {
        name: 'missing height range',
        patch: { prefHeightMin: '', prefHeightMax: '' },
        expected: /height range is required/i,
      },
      {
        name: 'invalid height range',
        patch: { prefHeightMin: `6'2"`, prefHeightMax: `5'2"` },
        expected: /height range is invalid/i,
      },
      {
        name: 'missing marital status',
        patch: { prefMaritalStatus: '' },
        expected: /marital status is required/i,
      },
      {
        name: 'marital deal-breaker with only doesnt_matter',
        patch: { prefMaritalStatus: 'doesnt_matter', prefMaritalStatusIsDealbreaker: true },
        expected: /specific marital status is required/i,
      },
      {
        name: 'missing religion',
        patch: { prefReligions: [], prefReligion: '' },
        expected: /religion is required/i,
      },
      {
        name: 'religion deal-breaker with doesnt_matter',
        patch: { prefReligions: [], prefReligion: 'doesnt_matter', prefReligionIsDealbreaker: true },
        expected: /specific religion is required/i,
      },
    ]

    for (const testCase of failingCases) {
      const response = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
        data: {
          ...basePayload,
          ...testCase.patch,
        },
      })
      expect(response.status(), testCase.name).toBe(400)
      const payload = await response.json()
      expect(String(payload.error || ''), testCase.name).toMatch(testCase.expected)
    }

    const validDoesntMatterResponse = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        ...basePayload,
        prefMaritalStatus: 'doesnt_matter',
        prefMaritalStatusIsDealbreaker: false,
        prefReligions: [],
        prefReligion: 'doesnt_matter',
        prefReligionIsDealbreaker: false,
      },
    })
    expect(validDoesntMatterResponse.ok()).toBeTruthy()

    const validSpecificResponse = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: basePayload,
    })
    expect(validSpecificResponse.ok()).toBeTruthy()

    const updatedProfileResponse = await adminRequest.get(`/api/profile?viewAsUser=${userId}`)
    expect(updatedProfileResponse.ok()).toBeTruthy()
    const updated = await updatedProfileResponse.json()
    expect(updated.prefAgeIsDealbreaker).toBe(true)
    expect(updated.prefHeightIsDealbreaker).toBe(true)
    expect(updated.prefMaritalStatusIsDealbreaker).toBe(true)
    expect(updated.prefReligionIsDealbreaker).toBe(true)
    expect(updated.prefMaritalStatus).toContain('never_married')
    expect(updated.prefReligions).toContain('Hindu')
  })

  test('profile/[id] persists about/career fields correctly', async () => {
    const updateResponse = await adminRequest.put(`/api/profile/${profileId}?viewAsUser=${userId}`, {
      data: {
        signupStep: 6,
        employerName: 'Matrix QA Works',
        linkedinProfile: 'no_linkedin',
        referralSource: 'google',
      },
    })
    expect(updateResponse.ok()).toBeTruthy()

    const readResponse = await adminRequest.get(`/api/profile/${profileId}?viewAsUser=${userId}`)
    expect(readResponse.ok()).toBeTruthy()
    const profile = await readResponse.json()

    expect(profile.employerName).toBe('Matrix QA Works')
    expect(profile.linkedinProfile).toBeNull()
    expect(profile.referralSource).toBe('google')
  })
})
