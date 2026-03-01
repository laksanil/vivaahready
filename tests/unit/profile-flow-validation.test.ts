import { describe, expect, it } from 'vitest'
import {
  validateAboutMeStep,
  getEffectiveUniversity,
  isNonWorkingOccupation,
  validateLocationEducationStep,
  validatePartnerPreferencesAdditional,
  validatePartnerPreferencesMustHaves,
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
    it('fails when referral source is missing', () => {
      const result = validateAboutMeStep({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Referral source is required.')
    })

    it('passes when referral source is provided', () => {
      const result = validateAboutMeStep({ referralSource: 'google' })
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
