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

    const customUniversity = `Matrix Custom Institute ${Date.now().toString(36)}`
    const customUniversityResponse = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        ...basePayload,
        university: customUniversity,
        occupation: 'software_engineer',
        employerName: 'Matrix Labs',
        annualIncome: '100k-150k',
      },
    })
    expect(customUniversityResponse.ok()).toBeTruthy()

    const customUniversityRead = await adminRequest.get(`/api/profile?viewAsUser=${userId}`)
    expect(customUniversityRead.ok()).toBeTruthy()
    const customUniversityProfile = await customUniversityRead.json()
    expect(customUniversityProfile.university).toBe(customUniversity)
  })

  test('basics/religion/family/lifestyle required-field matrix', async () => {
    const basicsBasePayload = {
      _editSection: 'basics',
      firstName: `Matrix${Date.now().toString(36)}`,
      lastName: 'User',
      createdBy: 'self',
      gender: 'male',
      dateOfBirth: '01/01/1992',
      height: `5'10"`,
      maritalStatus: 'never_married',
      motherTongue: 'English',
    }

    const basicsFailingCases: Array<{ name: string; patch: Record<string, unknown>; expected: RegExp }> = [
      { name: 'missing first name', patch: { firstName: '' }, expected: /first name is required/i },
      { name: 'missing last name', patch: { lastName: '' }, expected: /last name is required/i },
      { name: 'missing created by', patch: { createdBy: '' }, expected: /profile created by is required/i },
      { name: 'missing gender', patch: { gender: '' }, expected: /gender is required/i },
      { name: 'missing dob and age', patch: { dateOfBirth: '', age: '' }, expected: /date of birth or age is required/i },
      { name: 'missing height', patch: { height: '' }, expected: /height is required/i },
      { name: 'missing marital status', patch: { maritalStatus: '' }, expected: /marital status is required/i },
      { name: 'missing mother tongue', patch: { motherTongue: '' }, expected: /mother tongue is required/i },
    ]

    for (const testCase of basicsFailingCases) {
      const response = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
        data: {
          ...basicsBasePayload,
          ...testCase.patch,
        },
      })
      expect(response.status(), testCase.name).toBe(400)
      const payload = await response.json()
      expect(String(payload.error || ''), testCase.name).toMatch(testCase.expected)
    }

    const religionMissing = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'religion',
        religion: '',
        community: 'Iyer',
      },
    })
    expect(religionMissing.status()).toBe(400)
    expect(String((await religionMissing.json()).error || '')).toMatch(/religion is required/i)

    const religionValid = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'religion',
        religion: 'Hindu',
        community: 'Iyer',
      },
    })
    expect(religionValid.ok()).toBeTruthy()

    const familyMissing = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'family',
        familyLocation: '',
        familyValues: 'moderate',
      },
    })
    expect(familyMissing.status()).toBe(400)
    expect(String((await familyMissing.json()).error || '')).toMatch(/family location is required/i)

    const familyValid = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'family',
        familyLocation: 'USA',
        familyValues: 'moderate',
      },
    })
    expect(familyValid.ok()).toBeTruthy()

    const lifestyleMissing = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'lifestyle',
        dietaryPreference: '',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
      },
    })
    expect(lifestyleMissing.status()).toBe(400)
    expect(String((await lifestyleMissing.json()).error || '')).toMatch(/diet is required/i)

    const hobbiesOtherMissing = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'lifestyle',
        dietaryPreference: 'Vegetarian',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
        hobbies: 'Reading, Other',
        hobbiesOther: '',
      },
    })
    expect(hobbiesOtherMissing.status()).toBe(400)
    expect(String((await hobbiesOtherMissing.json()).error || '')).toMatch(/other hobbies/i)

    const fitnessOtherMissing = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'lifestyle',
        dietaryPreference: 'Vegetarian',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
        fitness: 'Gym, Other',
        fitnessOther: '',
      },
    })
    expect(fitnessOtherMissing.status()).toBe(400)
    expect(String((await fitnessOtherMissing.json()).error || '')).toMatch(/other fitness activities/i)

    const interestsOtherMissing = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'lifestyle',
        dietaryPreference: 'Vegetarian',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
        interests: 'Travel, Other',
        interestsOther: '',
      },
    })
    expect(interestsOtherMissing.status()).toBe(400)
    expect(String((await interestsOtherMissing.json()).error || '')).toMatch(/other interests/i)

    const lifestyleWithCustomOtherValues = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'lifestyle',
        dietaryPreference: 'Vegetarian',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
        hobbies: 'Reading, Other',
        hobbiesOther: 'Chess, Pottery',
        fitness: 'Gym, Other',
        fitnessOther: 'Cycling',
        interests: 'Music, Other',
        interestsOther: 'Board Games',
      },
    })
    expect(lifestyleWithCustomOtherValues.ok()).toBeTruthy()

    const lifestyleReadResponse = await adminRequest.get(`/api/profile?viewAsUser=${userId}`)
    expect(lifestyleReadResponse.ok()).toBeTruthy()
    const lifestyleProfile = await lifestyleReadResponse.json()
    expect(String(lifestyleProfile.hobbies || '')).toContain('Chess')
    expect(String(lifestyleProfile.fitness || '')).toContain('Cycling')
    expect(String(lifestyleProfile.interests || '')).toContain('Board Games')
    expect(String(lifestyleProfile.hobbies || '')).not.toMatch(/\bOther\b/i)
    expect(String(lifestyleProfile.fitness || '')).not.toMatch(/\bOther\b/i)
    expect(String(lifestyleProfile.interests || '')).not.toMatch(/\bOther\b/i)

    const lifestyleValid = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'lifestyle',
        dietaryPreference: 'Vegetarian',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
      },
    })
    expect(lifestyleValid.ok()).toBeTruthy()
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
    expect(profile.linkedinProfile).toBe('no_linkedin')
    expect(profile.referralSource).toBe('google')
  })

  test('enforces required referral source and partner education preference', async () => {
    const missingReferralEdit = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'aboutme',
        aboutMe: 'I value family and long-term commitment.',
        linkedinProfile: 'no_linkedin',
        referralSource: '',
      },
    })
    expect(missingReferralEdit.status()).toBe(400)
    const missingReferralEditPayload = await missingReferralEdit.json()
    expect(String(missingReferralEditPayload.error || '')).toMatch(/referral source is required/i)

    const validReferralEdit = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'aboutme',
        aboutMe: 'I value family and long-term commitment.',
        linkedinProfile: 'no_linkedin',
        referralSource: 'google',
      },
    })
    expect(validReferralEdit.ok()).toBeTruthy()

    const missingAboutMeEdit = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'aboutme',
        aboutMe: '',
        linkedinProfile: 'no_linkedin',
        referralSource: 'google',
      },
    })
    expect(missingAboutMeEdit.status()).toBe(400)
    expect(String((await missingAboutMeEdit.json()).error || '')).toMatch(/about me is required/i)

    const missingLinkedInEdit = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'aboutme',
        aboutMe: 'I value family and long-term commitment.',
        linkedinProfile: '',
        referralSource: 'google',
      },
    })
    expect(missingLinkedInEdit.status()).toBe(400)
    expect(String((await missingLinkedInEdit.json()).error || '')).toMatch(/linkedin profile is required/i)

    const missingEducationEdit = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'preferences_2',
        prefQualification: '',
      },
    })
    expect(missingEducationEdit.status()).toBe(400)
    const missingEducationEditPayload = await missingEducationEdit.json()
    expect(String(missingEducationEditPayload.error || '')).toMatch(/minimum education is required/i)

    const validEducationEdit = await adminRequest.put(`/api/profile?viewAsUser=${userId}`, {
      data: {
        _editSection: 'preferences_2',
        prefQualification: 'bachelors',
      },
    })
    expect(validEducationEdit.ok()).toBeTruthy()

    const missingReferralSignup = await adminRequest.put(`/api/profile/${profileId}?viewAsUser=${userId}`, {
      data: {
        signupStep: 7,
        aboutMe: 'I value family and long-term commitment.',
        linkedinProfile: 'no_linkedin',
        referralSource: '',
      },
    })
    expect(missingReferralSignup.status()).toBe(400)
    const missingReferralSignupPayload = await missingReferralSignup.json()
    expect(String(missingReferralSignupPayload.error || '')).toMatch(/referral source is required/i)

    const validReferralSignup = await adminRequest.put(`/api/profile/${profileId}?viewAsUser=${userId}`, {
      data: {
        signupStep: 7,
        aboutMe: 'I value family and long-term commitment.',
        linkedinProfile: 'no_linkedin',
        referralSource: 'google',
      },
    })
    expect(validReferralSignup.ok()).toBeTruthy()

    const missingEducationSignup = await adminRequest.put(`/api/profile/${profileId}?viewAsUser=${userId}`, {
      data: {
        signupStep: 9,
        prefQualification: '',
      },
    })
    expect(missingEducationSignup.status()).toBe(400)
    const missingEducationSignupPayload = await missingEducationSignup.json()
    expect(String(missingEducationSignupPayload.error || '')).toMatch(/minimum education is required/i)

    const validEducationSignup = await adminRequest.put(`/api/profile/${profileId}?viewAsUser=${userId}`, {
      data: {
        signupStep: 9,
        prefQualification: 'bachelors',
      },
    })
    expect(validEducationSignup.ok()).toBeTruthy()
  })
})
