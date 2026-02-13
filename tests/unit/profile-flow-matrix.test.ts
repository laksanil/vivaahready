import { describe, expect, it } from 'vitest'
import {
  validateLocationEducationStep,
  validatePartnerPreferencesMustHaves,
} from '@/lib/profileFlowValidation'

describe('profile flow validation matrix', () => {
  describe('location_education required-field matrix', () => {
    const validBase = {
      country: 'USA',
      grewUpIn: 'USA',
      citizenship: 'USA',
      zipCode: '95112',
      qualification: 'bachelors_cs',
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
      { name: 'missing qualification', payload: { ...validBase, qualification: '' }, expected: 'Highest qualification is required.' },
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
})
