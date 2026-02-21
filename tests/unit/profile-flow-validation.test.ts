import { describe, expect, it } from 'vitest'
import {
  normalizeLifestyleOtherSelections,
  validateAboutMeStep,
  validateBasicsStep,
  validateFamilyStep,
  getEffectiveOccupation,
  getEffectiveUniversity,
  isNonWorkingOccupation,
  validateLifestyleStep,
  validateLocationEducationStep,
  validatePartnerPreferencesAdditional,
  validatePartnerPreferencesMustHaves,
  validateReligionStep,
} from '@/lib/profileFlowValidation'

describe('profileFlowValidation', () => {
  describe('isNonWorkingOccupation', () => {
    it('detects non-working occupations', () => {
      expect(isNonWorkingOccupation('student')).toBe(true)
      expect(isNonWorkingOccupation('not_working')).toBe(true)
      expect(isNonWorkingOccupation('homemaker')).toBe(true)
    })

    it('detects working occupations', () => {
      expect(isNonWorkingOccupation('software_engineer')).toBe(false)
      expect(isNonWorkingOccupation('doctor')).toBe(false)
    })
  })

  describe('getEffectiveUniversity', () => {
    it('uses manual university when "other" is selected', () => {
      expect(getEffectiveUniversity('other', 'IIT Bombay')).toBe('IIT Bombay')
    })

    it('uses selected university for normal values', () => {
      expect(getEffectiveUniversity('Stanford University', 'Ignored Value')).toBe('Stanford University')
    })

    it('accepts typed custom university values directly', () => {
      expect(getEffectiveUniversity('Northern School of Behavioral Sciences', '')).toBe(
        'Northern School of Behavioral Sciences'
      )
    })

    it('returns empty when "other" is selected without manual value', () => {
      expect(getEffectiveUniversity('other', '')).toBe('')
    })
  })

  describe('getEffectiveOccupation', () => {
    it('uses manual occupation when "other" is selected', () => {
      expect(getEffectiveOccupation('other', 'school_psychologist')).toBe('school_psychologist')
    })

    it('uses selected occupation for normal values', () => {
      expect(getEffectiveOccupation('software_engineer', 'Ignored Value')).toBe('software_engineer')
    })

    it('returns empty when "other" is selected without manual value', () => {
      expect(getEffectiveOccupation('other', '')).toBe('')
    })
  })

  describe('validateLocationEducationStep', () => {
    const basePayload = {
      country: 'USA',
      grewUpIn: 'USA',
      citizenship: 'USA',
      zipCode: '95112',
      qualification: 'bachelors_cs',
      occupation: 'software_engineer',
      annualIncome: '100k-150k',
      openToRelocation: 'yes',
    }

    it('fails when university is missing', () => {
      const result = validateLocationEducationStep({
        ...basePayload,
        employerName: 'Example Corp',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('College/University is required.')
    })

    it('fails when working occupation has no employer', () => {
      const result = validateLocationEducationStep({
        ...basePayload,
        university: 'Stanford University',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Company/Organization is required for working occupations.')
    })

    it('passes for non-working occupation without employer', () => {
      const result = validateLocationEducationStep({
        ...basePayload,
        occupation: 'student',
        university: 'University of California, Berkeley',
      })
      expect(result.isValid).toBe(true)
    })

    it('fails when occupation is "other" but no custom value is provided', () => {
      const result = validateLocationEducationStep({
        ...basePayload,
        occupation: 'other',
        occupationOther: '',
        university: 'University of California, Berkeley',
        employerName: 'Example Corp',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Occupation is required.')
    })

    it('passes when occupation is "other" and custom value is provided', () => {
      const result = validateLocationEducationStep({
        ...basePayload,
        occupation: 'other',
        occupationOther: 'school_psychologist',
        university: 'University of California, Berkeley',
        employerName: 'Example Corp',
      })
      expect(result.isValid).toBe(true)
    })
  })

  describe('section required-field validators', () => {
    it('fails basics when required fields are missing', () => {
      const result = validateBasicsStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('First name is required.')
      expect(result.errors).toContain('Last name is required.')
      expect(result.errors).toContain('Profile created by is required.')
      expect(result.errors).toContain('Gender is required.')
      expect(result.errors).toContain('Date of birth or age is required.')
      expect(result.errors).toContain('Height is required.')
      expect(result.errors).toContain('Marital status is required.')
      expect(result.errors).toContain('Mother tongue is required.')
    })

    it('passes basics when required fields are present', () => {
      const result = validateBasicsStep({
        firstName: 'Test',
        lastName: 'User',
        createdBy: 'self',
        gender: 'male',
        dateOfBirth: '01/01/1992',
        height: `5'10"`,
        maritalStatus: 'never_married',
        motherTongue: 'English',
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('fails religion when required fields are missing', () => {
      const result = validateReligionStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Religion is required.')
      expect(result.errors).toContain('Community is required.')
    })

    it('fails family when required fields are missing', () => {
      const result = validateFamilyStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Family location is required.')
      expect(result.errors).toContain('Family values are required.')
    })

    it('fails lifestyle when required fields are missing', () => {
      const result = validateLifestyleStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Diet is required.')
      expect(result.errors).toContain('Smoking preference is required.')
      expect(result.errors).toContain('Drinking preference is required.')
      expect(result.errors).toContain('Pets preference is required.')
    })

    it('fails lifestyle when "Other" hobby is selected without details', () => {
      const result = validateLifestyleStep({
        dietaryPreference: 'Vegetarian',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
        hobbies: 'Reading, Other',
        hobbiesOther: '',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Please specify your other hobbies.')
    })

    it('fails lifestyle when "Other" interest is selected without details', () => {
      const result = validateLifestyleStep({
        dietaryPreference: 'Vegetarian',
        smoking: 'No',
        drinking: 'No',
        pets: 'no_but_love',
        interests: 'Travel, Other',
        interestsOther: '',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Please specify your other interests.')
    })
  })

  describe('normalizeLifestyleOtherSelections', () => {
    it('replaces "Other" checkbox value with custom entries', () => {
      const result = normalizeLifestyleOtherSelections({
        hobbies: 'Reading, Other',
        hobbiesOther: 'Chess, Pottery',
        fitness: 'Gym, Other',
        fitnessOther: 'Cycling',
        interests: 'Music, Other',
        interestsOther: 'Board Games',
      })

      expect(result.errors).toHaveLength(0)
      expect(result.normalizedValues.hobbies).toBe('Reading, Chess, Pottery')
      expect(result.normalizedValues.fitness).toBe('Gym, Cycling')
      expect(result.normalizedValues.interests).toBe('Music, Board Games')
    })
  })

  describe('validatePartnerPreferencesMustHaves', () => {
    const validPayload = {
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

    it('treats core deal-breakers as true by default when absent', () => {
      const result = validatePartnerPreferencesMustHaves({
        ...validPayload,
        prefAgeIsDealbreaker: undefined,
        prefHeightIsDealbreaker: undefined,
        prefMaritalStatusIsDealbreaker: undefined,
        prefReligionIsDealbreaker: undefined,
      })

      expect(result.normalizedDealbreakers.prefAgeIsDealbreaker).toBe(true)
      expect(result.normalizedDealbreakers.prefHeightIsDealbreaker).toBe(true)
      expect(result.normalizedDealbreakers.prefMaritalStatusIsDealbreaker).toBe(true)
      expect(result.normalizedDealbreakers.prefReligionIsDealbreaker).toBe(true)
    })

    it('fails when required fields are missing', () => {
      const result = validatePartnerPreferencesMustHaves({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Partner preference age range is required.')
      expect(result.errors).toContain('Partner preference height range is required.')
      expect(result.errors).toContain('Partner preference marital status is required.')
      expect(result.errors).toContain('Partner preference religion is required.')
    })

    it('fails when deal-breaker is on but marital status is only doesnt_matter', () => {
      const result = validatePartnerPreferencesMustHaves({
        ...validPayload,
        prefMaritalStatus: 'doesnt_matter',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('A specific marital status is required when marital-status deal-breaker is enabled.')
    })

    it('fails when deal-breaker is on but religion is doesnt_matter', () => {
      const result = validatePartnerPreferencesMustHaves({
        ...validPayload,
        prefReligions: [],
        prefReligion: 'doesnt_matter',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('A specific religion is required when religion deal-breaker is enabled.')
    })

    it('passes for valid must-have preferences', () => {
      const result = validatePartnerPreferencesMustHaves(validPayload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateAboutMeStep', () => {
    it('fails when required about me fields are missing', () => {
      const result = validateAboutMeStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('About Me is required.')
      expect(result.errors).toContain('LinkedIn profile is required.')
      expect(result.errors).toContain('Referral source is required.')
    })

    it('fails when linkedin URL is invalid', () => {
      const result = validateAboutMeStep({
        aboutMe: 'Test profile summary',
        linkedinProfile: 'invalid-url',
        referralSource: 'google',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Please enter a valid LinkedIn profile URL or select "I don\'t have LinkedIn".')
    })

    it('passes when no_linkedin is selected', () => {
      const result = validateAboutMeStep({
        aboutMe: 'Test profile summary',
        linkedinProfile: 'no_linkedin',
        referralSource: 'google',
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('passes when referral source and linkedin are provided', () => {
      const result = validateAboutMeStep({
        aboutMe: 'Test profile summary',
        linkedinProfile: 'https://linkedin.com/in/test-user',
        referralSource: 'google',
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validatePartnerPreferencesAdditional', () => {
    it('fails when minimum education is missing', () => {
      const result = validatePartnerPreferencesAdditional({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Partner preference minimum education is required.')
    })

    it('passes when minimum education is provided', () => {
      const result = validatePartnerPreferencesAdditional({ prefQualification: 'bachelors_cs' })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
