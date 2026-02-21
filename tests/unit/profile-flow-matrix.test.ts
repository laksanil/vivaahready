import { describe, expect, it } from 'vitest'
import {
  validateAboutMeStep,
  validateBasicsStep,
  validateFamilyStep,
  validateLifestyleStep,
  validateLocationEducationStep,
  validatePartnerPreferencesAdditional,
  validatePartnerPreferencesMustHaves,
  validateReligionStep,
} from '@/lib/profileFlowValidation'

describe('profile flow validation matrix', () => {
  describe('section-level required-field matrix', () => {
    const validBasics = {
      firstName: 'Matrix',
      lastName: 'User',
      createdBy: 'self',
      gender: 'male',
      dateOfBirth: '01/01/1992',
      height: `5'10"`,
      maritalStatus: 'never_married',
      motherTongue: 'English',
    }

    const missingBasicsCases: Array<{ field: string; payload: Record<string, unknown>; expected: string }> = [
      { field: 'firstName', payload: { ...validBasics, firstName: '' }, expected: 'First name is required.' },
      { field: 'lastName', payload: { ...validBasics, lastName: '' }, expected: 'Last name is required.' },
      { field: 'createdBy', payload: { ...validBasics, createdBy: '' }, expected: 'Profile created by is required.' },
      { field: 'gender', payload: { ...validBasics, gender: '' }, expected: 'Gender is required.' },
      {
        field: 'dateOfBirth/age',
        payload: { ...validBasics, dateOfBirth: '', age: '' },
        expected: 'Date of birth or age is required.',
      },
      { field: 'height', payload: { ...validBasics, height: '' }, expected: 'Height is required.' },
      { field: 'maritalStatus', payload: { ...validBasics, maritalStatus: '' }, expected: 'Marital status is required.' },
      { field: 'motherTongue', payload: { ...validBasics, motherTongue: '' }, expected: 'Mother tongue is required.' },
    ]

    for (const testCase of missingBasicsCases) {
      it(`fails basics when ${testCase.field} is missing`, () => {
        const result = validateBasicsStep(testCase.payload)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain(testCase.expected)
      })
    }

    it('fails religion when religion/community is missing', () => {
      const result = validateReligionStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Religion is required.')
      expect(result.errors).toContain('Community is required.')
    })

    it('fails family when family location/values are missing', () => {
      const result = validateFamilyStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Family location is required.')
      expect(result.errors).toContain('Family values are required.')
    })

    it('fails lifestyle when diet/smoking/drinking/pets are missing', () => {
      const result = validateLifestyleStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Diet is required.')
      expect(result.errors).toContain('Smoking preference is required.')
      expect(result.errors).toContain('Drinking preference is required.')
      expect(result.errors).toContain('Pets preference is required.')
    })
  })

  describe('location_education required-field matrix', () => {
    const validBase = {
      country: 'USA',
      grewUpIn: 'USA',
      citizenship: 'USA',
      zipCode: '95112',
      qualification: 'bachelors_cs',
      educationLevel: 'bachelors',
      fieldOfStudy: 'cs_it',
      university: 'San Jose State University',
      occupation: 'software_engineer',
      employerName: 'QA Systems',
      annualIncome: '100k-150k',
      openToRelocation: 'yes',
    }

    const failingCases: Array<{ name: string; payload: Record<string, unknown>; expected: string }> = [
      { name: 'missing country', payload: { ...validBase, country: '' }, expected: 'Country is required.' },
      { name: 'missing grew up in', payload: { ...validBase, grewUpIn: '' }, expected: 'Grew Up In is required.' },
      { name: 'missing citizenship', payload: { ...validBase, citizenship: '' }, expected: 'Citizenship is required.' },
      { name: 'missing USA zip code', payload: { ...validBase, zipCode: '' }, expected: 'ZIP code is required for USA profiles.' },
      { name: 'missing education level', payload: { ...validBase, qualification: '', educationLevel: '' }, expected: 'Education level is required.' },
      { name: 'missing university', payload: { ...validBase, university: '' }, expected: 'College/University is required.' },
      { name: 'missing occupation', payload: { ...validBase, occupation: '' }, expected: 'Occupation is required.' },
      { name: 'missing annual income', payload: { ...validBase, annualIncome: '' }, expected: 'Annual income is required.' },
      { name: 'missing relocation preference', payload: { ...validBase, openToRelocation: '' }, expected: 'Open to relocation is required.' },
      {
        name: 'missing employer for working occupation',
        payload: { ...validBase, occupation: 'software_engineer', employerName: '' },
        expected: 'Company/Organization is required for working occupations.',
      },
    ]

    for (const testCase of failingCases) {
      it(`fails when ${testCase.name}`, () => {
        const result = validateLocationEducationStep(testCase.payload)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain(testCase.expected)
      })
    }

    it('passes for non-working occupation without employer', () => {
      const result = validateLocationEducationStep({
        ...validBase,
        occupation: 'student',
        employerName: '',
        annualIncome: 'student',
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes when university uses Other + manual value', () => {
      const result = validateLocationEducationStep({
        ...validBase,
        university: 'other',
        universityOther: 'IIT Bombay',
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('preferences_1 deal-breaker matrix', () => {
    const validBase = {
      prefAgeMin: '25',
      prefAgeMax: '32',
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

    const failingCases: Array<{ name: string; payload: Record<string, unknown>; expected: string }> = [
      {
        name: 'missing age range',
        payload: { ...validBase, prefAgeMin: '', prefAgeMax: '' },
        expected: 'Partner preference age range is required.',
      },
      {
        name: 'invalid age order',
        payload: { ...validBase, prefAgeMin: '40', prefAgeMax: '25' },
        expected: 'Partner preference age range is invalid.',
      },
      {
        name: 'missing height range',
        payload: { ...validBase, prefHeightMin: '', prefHeightMax: '' },
        expected: 'Partner preference height range is required.',
      },
      {
        name: 'invalid height order',
        payload: { ...validBase, prefHeightMin: `6'2"`, prefHeightMax: `5'2"` },
        expected: 'Partner preference height range is invalid.',
      },
      {
        name: 'missing marital status',
        payload: { ...validBase, prefMaritalStatus: '' },
        expected: 'Partner preference marital status is required.',
      },
      {
        name: 'marital deal-breaker with only doesnt_matter',
        payload: { ...validBase, prefMaritalStatus: 'doesnt_matter' },
        expected: 'A specific marital status is required when marital-status deal-breaker is enabled.',
      },
      {
        name: 'missing religion',
        payload: { ...validBase, prefReligions: [], prefReligion: '' },
        expected: 'Partner preference religion is required.',
      },
      {
        name: 'religion deal-breaker with doesnt_matter',
        payload: { ...validBase, prefReligions: [], prefReligion: 'doesnt_matter' },
        expected: 'A specific religion is required when religion deal-breaker is enabled.',
      },
    ]

    for (const testCase of failingCases) {
      it(`fails when ${testCase.name}`, () => {
        const result = validatePartnerPreferencesMustHaves(testCase.payload)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain(testCase.expected)
      })
    }

    it('passes when core deal-breakers are omitted (defaults to true)', () => {
      const result = validatePartnerPreferencesMustHaves({
        ...validBase,
        prefAgeIsDealbreaker: undefined,
        prefHeightIsDealbreaker: undefined,
        prefMaritalStatusIsDealbreaker: undefined,
        prefReligionIsDealbreaker: undefined,
      })

      expect(result.isValid).toBe(true)
      expect(result.normalizedDealbreakers.prefAgeIsDealbreaker).toBe(true)
      expect(result.normalizedDealbreakers.prefHeightIsDealbreaker).toBe(true)
      expect(result.normalizedDealbreakers.prefMaritalStatusIsDealbreaker).toBe(true)
      expect(result.normalizedDealbreakers.prefReligionIsDealbreaker).toBe(true)
    })

    it('passes with doesnt_matter when marital/religion deal-breakers are OFF', () => {
      const result = validatePartnerPreferencesMustHaves({
        ...validBase,
        prefMaritalStatus: 'doesnt_matter',
        prefMaritalStatusIsDealbreaker: false,
        prefReligions: [],
        prefReligion: 'doesnt_matter',
        prefReligionIsDealbreaker: false,
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('aboutme + preferences_2 required fields', () => {
    it('fails aboutme validation when linkedin and referral source are missing', () => {
      const result = validateAboutMeStep({ aboutMe: 'Test about me' })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('LinkedIn profile is required.')
      expect(result.errors).toContain('Referral source is required.')
    })

    it('passes aboutme validation when required fields are present', () => {
      const result = validateAboutMeStep({
        aboutMe: 'Test about me',
        linkedinProfile: 'no_linkedin',
        referralSource: 'google',
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('fails preferences_2 validation when minimum education is missing', () => {
      const result = validatePartnerPreferencesAdditional({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Partner preference minimum education is required.')
    })

    it('passes preferences_2 validation when minimum education is present', () => {
      const result = validatePartnerPreferencesAdditional({ prefQualification: 'masters_cs' })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
