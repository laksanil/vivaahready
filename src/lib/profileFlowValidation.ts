import { heightToInches } from '@/lib/constants'

type UnknownRecord = Record<string, unknown>

const NON_WORKING_OCCUPATION_KEYWORDS = [
  'student',
  'homemaker',
  'home maker',
  'retired',
  'not working',
  'unemployed',
]

const normalizeString = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const toSearchable = (value: string): string => {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

const parseBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

const parseCsvList = (value: unknown): string[] => {
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

const dedupeCaseInsensitive = (values: string[]): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(value)
    }
  }
  return out
}

const NO_PREFERENCE_VALUES = new Set([
  '',
  'doesnt matter',
  "doesn't matter",
  'any',
  'no preference',
])

const isNoPreference = (value: unknown): boolean => {
  const normalized = normalizeString(value)
  if (!normalized) return true
  return NO_PREFERENCE_VALUES.has(toSearchable(normalized))
}

const getSelectedReligions = (data: UnknownRecord): string[] => {
  const prefReligions = Array.isArray(data.prefReligions)
    ? data.prefReligions.map(v => normalizeString(v)).filter(Boolean)
    : []

  if (prefReligions.length > 0) {
    return dedupeCaseInsensitive(prefReligions)
  }

  const prefReligion = normalizeString(data.prefReligion)
  if (!prefReligion || prefReligion.toLowerCase() === 'doesnt_matter') {
    return []
  }

  return [prefReligion]
}

export function isNonWorkingOccupation(occupation: unknown): boolean {
  const normalized = toSearchable(normalizeString(occupation))
  if (!normalized) return false
  return NON_WORKING_OCCUPATION_KEYWORDS.some(keyword => normalized.includes(keyword))
}

export function getEffectiveUniversity(university: unknown, universityOther?: unknown): string {
  const primary = normalizeString(university)
  const manual = normalizeString(universityOther)

  if (toSearchable(primary) === 'other') {
    return manual
  }

  return primary || manual
}

export function validateLocationEducationStep(data: UnknownRecord): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const country = normalizeString(data.country)
  const grewUpIn = normalizeString(data.grewUpIn)
  const citizenship = normalizeString(data.citizenship)
  const zipCode = normalizeString(data.zipCode)
  const qualification = normalizeString(data.qualification)
  const university = getEffectiveUniversity(data.university, data.universityOther)
  const occupation = normalizeString(data.occupation)
  const employerName = normalizeString(data.employerName)
  const annualIncome = normalizeString(data.annualIncome)
  const openToRelocation = normalizeString(data.openToRelocation)

  if (!country) errors.push('Country is required.')
  if (!grewUpIn) errors.push('Grew Up In is required.')
  if (!citizenship) errors.push('Citizenship is required.')

  if ((country || 'USA').toUpperCase() === 'USA' && !zipCode) {
    errors.push('ZIP code is required for USA profiles.')
  }

  if (!qualification) errors.push('Highest qualification is required.')
  if (!university) errors.push('College/University is required.')
  if (!occupation) errors.push('Occupation is required.')
  if (!annualIncome) errors.push('Annual income is required.')
  if (!openToRelocation) errors.push('Open to relocation is required.')

  if (occupation && !isNonWorkingOccupation(occupation) && !employerName) {
    errors.push('Company/Organization is required for working occupations.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateAboutMeStep(data: UnknownRecord): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const referralSource = normalizeString(data.referralSource)

  if (!referralSource) {
    errors.push('Referral source is required.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePartnerPreferencesAdditional(
  data: UnknownRecord
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const prefQualification = normalizeString(data.prefQualification)

  if (isNoPreference(prefQualification)) {
    errors.push('Partner preference minimum education is required.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export interface PartnerPreferencesValidationResult {
  isValid: boolean
  errors: string[]
  normalizedDealbreakers: {
    prefAgeIsDealbreaker: boolean
    prefHeightIsDealbreaker: boolean
    prefMaritalStatusIsDealbreaker: boolean
    prefReligionIsDealbreaker: boolean
  }
  sanitizedPrefMaritalStatus: string
  selectedReligions: string[]
}

export function validatePartnerPreferencesMustHaves(
  data: UnknownRecord
): PartnerPreferencesValidationResult {
  const errors: string[] = []
  const prefAgeIsDealbreaker = parseBoolean(data.prefAgeIsDealbreaker, true)
  const prefHeightIsDealbreaker = parseBoolean(data.prefHeightIsDealbreaker, true)
  const prefMaritalStatusIsDealbreaker = parseBoolean(data.prefMaritalStatusIsDealbreaker, true)
  const prefReligionIsDealbreaker = parseBoolean(data.prefReligionIsDealbreaker, true)

  const prefAgeMin = normalizeString(data.prefAgeMin)
  const prefAgeMax = normalizeString(data.prefAgeMax)
  const prefHeightMin = normalizeString(data.prefHeightMin)
  const prefHeightMax = normalizeString(data.prefHeightMax)

  if (!prefAgeMin || !prefAgeMax) {
    errors.push('Partner preference age range is required.')
  } else {
    const minAge = Number(prefAgeMin)
    const maxAge = Number(prefAgeMax)
    if (!Number.isFinite(minAge) || !Number.isFinite(maxAge) || minAge > maxAge) {
      errors.push('Partner preference age range is invalid.')
    }
  }

  if (!prefHeightMin || !prefHeightMax) {
    errors.push('Partner preference height range is required.')
  } else {
    const minHeight = heightToInches(prefHeightMin)
    const maxHeight = heightToInches(prefHeightMax)
    if (minHeight === 0 || maxHeight === 0 || minHeight > maxHeight) {
      errors.push('Partner preference height range is invalid.')
    }
  }

  const maritalValues = dedupeCaseInsensitive(parseCsvList(data.prefMaritalStatus))
  const specificMaritalValues = maritalValues.filter(v => toSearchable(v) !== 'doesnt matter')
  const sanitizedPrefMaritalStatus = specificMaritalValues.join(', ')

  if (maritalValues.length === 0) {
    errors.push('Partner preference marital status is required.')
  } else if (prefMaritalStatusIsDealbreaker && specificMaritalValues.length === 0) {
    errors.push('A specific marital status is required when marital-status deal-breaker is enabled.')
  }

  const selectedReligions = getSelectedReligions(data)
  const prefReligionValue = normalizeString(data.prefReligion)
  const hasReligionValue = selectedReligions.length > 0 || toSearchable(prefReligionValue) === 'doesnt matter'

  if (!hasReligionValue) {
    errors.push('Partner preference religion is required.')
  } else if (prefReligionIsDealbreaker && selectedReligions.length === 0) {
    errors.push('A specific religion is required when religion deal-breaker is enabled.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedDealbreakers: {
      prefAgeIsDealbreaker,
      prefHeightIsDealbreaker,
      prefMaritalStatusIsDealbreaker,
      prefReligionIsDealbreaker,
    },
    sanitizedPrefMaritalStatus,
    selectedReligions,
  }
}
