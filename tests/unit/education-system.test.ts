/**
 * Hard test cases for the education system:
 * - Constants helpers (labels, badges)
 * - Filter logic (legacy fallback, combo filters)
 * - Matching algorithm (level hierarchy, weight-based)
 * - Validation
 */
import { describe, expect, it } from 'vitest'
import {
  getEducationLevelLabel,
  getFieldOfStudyLabel,
  EDUCATION_BADGES,
  QUALIFICATION_TO_NEW_FIELDS,
  EDUCATION_LEVEL_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
} from '@/lib/constants'
import { validateLocationEducationStep } from '@/lib/profileFlowValidation'

// ─── Helper label functions ───────────────────────────────────────────────────

describe('getEducationLevelLabel', () => {
  it('returns label for known education level values', () => {
    expect(getEducationLevelLabel('bachelors')).toContain("Bachelor")
    expect(getEducationLevelLabel('masters')).toContain("Master")
    expect(getEducationLevelLabel('doctorate')).toContain("Doctorate")
    expect(getEducationLevelLabel('high_school')).toContain("High School")
    expect(getEducationLevelLabel('associates')).toContain("Associate")
    expect(getEducationLevelLabel('vocational')).toContain("Vocational")
    expect(getEducationLevelLabel('postdoc')).toContain("Post-Doctoral")
  })

  it('title-cases unknown values gracefully', () => {
    expect(getEducationLevelLabel('some_random_value')).toBe('Some Random Value')
  })

  it('returns empty string for null/undefined', () => {
    expect(getEducationLevelLabel(null)).toBe('')
    expect(getEducationLevelLabel(undefined)).toBe('')
    expect(getEducationLevelLabel('')).toBe('')
  })
})

describe('getFieldOfStudyLabel', () => {
  it('returns label for known degree values', () => {
    expect(getFieldOfStudyLabel('ba')).toContain('BA')
    expect(getFieldOfStudyLabel('bs')).toContain('BS')
    expect(getFieldOfStudyLabel('be')).toContain('BE')
    expect(getFieldOfStudyLabel('mba')).toContain('MBA')
    expect(getFieldOfStudyLabel('md')).toContain('MD')
    expect(getFieldOfStudyLabel('jd')).toContain('JD')
    expect(getFieldOfStudyLabel('phd')).toContain('PhD')
  })

  it('title-cases unknown values', () => {
    expect(getFieldOfStudyLabel('weird_field')).toBe('Weird Field')
  })

  it('returns empty string for null/undefined', () => {
    expect(getFieldOfStudyLabel(null)).toBe('')
    expect(getFieldOfStudyLabel(undefined)).toBe('')
  })
})

// ─── Education Badges ─────────────────────────────────────────────────────────

describe('EDUCATION_BADGES', () => {
  it('has badge for masters', () => {
    const badge = EDUCATION_BADGES['masters']
    expect(badge).toBeDefined()
    expect(badge.label).toBe("Master's")
  })

  it('has badge for doctorate', () => {
    const badge = EDUCATION_BADGES['doctorate']
    expect(badge).toBeDefined()
    expect(badge.label).toBe('PhD')
    expect(badge.bg).toContain('purple')
  })

  it('has badge for postdoc', () => {
    const badge = EDUCATION_BADGES['postdoc']
    expect(badge).toBeDefined()
    expect(badge.label).toBe('PostDoc')
  })

  it('has badge for post_masters', () => {
    const badge = EDUCATION_BADGES['post_masters']
    expect(badge).toBeDefined()
  })

  it('does NOT have badge for bachelors (too common)', () => {
    expect(EDUCATION_BADGES['bachelors']).toBeUndefined()
  })

  it('does NOT have badge for high school', () => {
    expect(EDUCATION_BADGES['high_school']).toBeUndefined()
  })
})

// ─── Legacy qualification mapping ─────────────────────────────────────────────

describe('QUALIFICATION_TO_NEW_FIELDS mapping', () => {
  it('maps masters_cs to masters + cs_it', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['masters_cs']
    expect(mapped.educationLevel).toBe('masters')
    expect(mapped.fieldOfStudy).toBe('cs_it')
  })

  it('maps bachelors_eng to bachelors + engineering', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['bachelors_eng']
    expect(mapped.educationLevel).toBe('bachelors')
    expect(mapped.fieldOfStudy).toBe('engineering')
  })

  it('maps md to professional + medical_health', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['md']
    expect(mapped.educationLevel).toBe('professional')
    expect(mapped.fieldOfStudy).toBe('medical_health')
  })

  it('maps jd to professional + law_legal', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['jd']
    expect(mapped.educationLevel).toBe('professional')
    expect(mapped.fieldOfStudy).toBe('law_legal')
  })

  it('maps phd to doctorate with NO field (unknown)', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['phd']
    expect(mapped.educationLevel).toBe('doctorate')
    expect(mapped.fieldOfStudy).toBeUndefined()
  })

  it('maps mba to masters + business', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['mba']
    expect(mapped.educationLevel).toBe('masters')
    expect(mapped.fieldOfStudy).toBe('business')
  })

  it('maps pharmd to professional + medical_health', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['pharmd']
    expect(mapped.educationLevel).toBe('professional')
    expect(mapped.fieldOfStudy).toBe('medical_health')
  })

  it('returns undefined for unknown qualification values', () => {
    expect(QUALIFICATION_TO_NEW_FIELDS['some_random_value']).toBeUndefined()
  })

  it('maps edd to doctorate + education_field', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['edd']
    expect(mapped.educationLevel).toBe('doctorate')
    expect(mapped.fieldOfStudy).toBe('education_field')
  })

  it('maps psyd to doctorate + social_sciences', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['psyd']
    expect(mapped.educationLevel).toBe('doctorate')
    expect(mapped.fieldOfStudy).toBe('social_sciences')
  })
})

// ─── Client-side filter logic (simulates matches page filtering) ──────────────

describe('education filter logic', () => {
  // Simulate the getResolvedEducation + matchesFilters functions from matches page
  function getResolvedEducation(profile: { educationLevel?: string | null; fieldOfStudy?: string | null; qualification?: string | null }) {
    if (profile.educationLevel) {
      return { educationLevel: profile.educationLevel, fieldOfStudy: profile.fieldOfStudy || null }
    }
    if (profile.qualification) {
      const mapped = QUALIFICATION_TO_NEW_FIELDS[profile.qualification]
      if (mapped) return { educationLevel: mapped.educationLevel, fieldOfStudy: mapped.fieldOfStudy || null }
    }
    return { educationLevel: null, fieldOfStudy: null }
  }

  function matchesFilter(
    profile: { educationLevel?: string | null; fieldOfStudy?: string | null; qualification?: string | null },
    educationLevelFilter: string,
    fieldOfStudyFilter: string
  ): boolean {
    if (!educationLevelFilter && !fieldOfStudyFilter) return true
    const resolved = getResolvedEducation(profile)
    if (educationLevelFilter && resolved.educationLevel !== educationLevelFilter) return false
    if (fieldOfStudyFilter && resolved.fieldOfStudy !== fieldOfStudyFilter) return false
    return true
  }

  it('shows all profiles when no filter is selected', () => {
    expect(matchesFilter({ educationLevel: 'bachelors' }, '', '')).toBe(true)
    expect(matchesFilter({ qualification: 'md' }, '', '')).toBe(true)
    expect(matchesFilter({}, '', '')).toBe(true)
  })

  it('filters by education level (new system)', () => {
    expect(matchesFilter({ educationLevel: 'masters', fieldOfStudy: 'ms' }, 'masters', '')).toBe(true)
    expect(matchesFilter({ educationLevel: 'bachelors', fieldOfStudy: 'bs' }, 'masters', '')).toBe(false)
  })

  it('filters by field of study (new system)', () => {
    expect(matchesFilter({ educationLevel: 'masters', fieldOfStudy: 'ms' }, '', 'ms')).toBe(true)
    expect(matchesFilter({ educationLevel: 'masters', fieldOfStudy: 'be' }, '', 'ms')).toBe(false)
  })

  it('combo filter: education level + field of study', () => {
    expect(matchesFilter({ educationLevel: 'doctorate', fieldOfStudy: 'phd' }, 'doctorate', 'phd')).toBe(true)
    expect(matchesFilter({ educationLevel: 'doctorate', fieldOfStudy: 'edd' }, 'doctorate', 'phd')).toBe(false)
    expect(matchesFilter({ educationLevel: 'masters', fieldOfStudy: 'ms' }, 'doctorate', 'phd')).toBe(false)
  })

  // HARD: Legacy profile with only old qualification
  it('filters legacy profile (qualification only) via mapping', () => {
    expect(matchesFilter({ qualification: 'masters_cs' }, 'masters', '')).toBe(true)
    expect(matchesFilter({ qualification: 'masters_cs' }, '', 'cs_it')).toBe(true)
    expect(matchesFilter({ qualification: 'masters_cs' }, 'doctorate', '')).toBe(false)
  })

  it('filters legacy medical degree via mapping', () => {
    expect(matchesFilter({ qualification: 'md' }, 'professional', '')).toBe(true)
    expect(matchesFilter({ qualification: 'md' }, '', 'medical_health')).toBe(true)
    expect(matchesFilter({ qualification: 'md' }, 'masters', '')).toBe(false)
  })

  it('filters legacy law degree via mapping', () => {
    expect(matchesFilter({ qualification: 'jd' }, 'professional', '')).toBe(true)
    expect(matchesFilter({ qualification: 'jd' }, '', 'law_legal')).toBe(true)
    expect(matchesFilter({ qualification: 'jd' }, 'masters', '')).toBe(false)
  })

  // HARD: Unknown legacy qualification not in mapping
  it('excludes profile with unknown legacy qualification when filter is active', () => {
    expect(matchesFilter({ qualification: 'some_random_value' }, 'masters', '')).toBe(false)
    expect(matchesFilter({ qualification: 'some_random_value' }, '', 'be')).toBe(false)
  })

  // HARD: Profile with no education at all
  it('excludes profile with no education data when filter is active', () => {
    expect(matchesFilter({}, 'masters', '')).toBe(false)
    expect(matchesFilter({}, '', 'bs')).toBe(false)
  })

  // HARD: New system takes precedence over legacy
  it('prefers educationLevel over qualification when both exist', () => {
    expect(matchesFilter({ educationLevel: 'masters', qualification: 'phd' }, 'doctorate', '')).toBe(false)
    expect(matchesFilter({ educationLevel: 'masters', qualification: 'phd' }, 'masters', '')).toBe(true)
  })

  // HARD: PhD with no field of study (common for migrated profiles)
  it('handles PhD with no field of study', () => {
    expect(matchesFilter({ qualification: 'phd' }, 'doctorate', '')).toBe(true)
    expect(matchesFilter({ qualification: 'phd' }, '', 'bs')).toBe(false)
  })
})

// ─── Matching algorithm: weight-based education matching ─────────────────────

describe('education matching algorithm', () => {
  // Weight-based matching: candidateWeight >= prefWeight
  const weightMap: Record<string, number> = {
    'below_high_school': 1,
    'high_school': 2,
    'vocational': 3,
    'associates': 4,
    'bachelors': 5,
    'masters': 7,
    'post_masters': 7.5,
    'doctorate': 8,
    'postdoc': 9,
  }

  function simulateEducationMatch(seekerPref: string, candidateEdLevel: string): boolean {
    const prefNormalized = seekerPref.toLowerCase().trim()
    if (prefNormalized === 'doesnt_matter' || prefNormalized === 'any') return true
    const candidateWeight = weightMap[candidateEdLevel] || 0
    const prefWeight = weightMap[prefNormalized] || 0
    return candidateWeight >= prefWeight
  }

  describe("'masters or higher' preference", () => {
    it('matches masters', () => expect(simulateEducationMatch('masters', 'masters')).toBe(true))
    it('matches doctorate (weight 8)', () => expect(simulateEducationMatch('masters', 'doctorate')).toBe(true))
    it('matches postdoc (weight 9)', () => expect(simulateEducationMatch('masters', 'postdoc')).toBe(true))
    it('does NOT match bachelors (weight 5)', () => expect(simulateEducationMatch('masters', 'bachelors')).toBe(false))
    it('does NOT match high school (weight 2)', () => expect(simulateEducationMatch('masters', 'high_school')).toBe(false))
  })

  describe("'bachelors or higher' preference", () => {
    it('matches bachelors', () => expect(simulateEducationMatch('bachelors', 'bachelors')).toBe(true))
    it('matches masters', () => expect(simulateEducationMatch('bachelors', 'masters')).toBe(true))
    it('matches doctorate', () => expect(simulateEducationMatch('bachelors', 'doctorate')).toBe(true))
    it('does NOT match high school', () => expect(simulateEducationMatch('bachelors', 'high_school')).toBe(false))
    it('does NOT match associates', () => expect(simulateEducationMatch('bachelors', 'associates')).toBe(false))
  })

  describe("doesnt_matter preference", () => {
    it('matches everything', () => {
      expect(simulateEducationMatch('doesnt_matter', 'high_school')).toBe(true)
      expect(simulateEducationMatch('doesnt_matter', 'doctorate')).toBe(true)
      expect(simulateEducationMatch('any', 'masters')).toBe(true)
    })
  })
})

// ─── Real-world scenarios ─────────────────────────────────────────────────────

describe('real-world education scenarios', () => {
  it("profile with Master's degree", () => {
    const profile = { educationLevel: 'masters', fieldOfStudy: 'ms' }
    expect(getEducationLevelLabel(profile.educationLevel)).toContain("Master")
    expect(getFieldOfStudyLabel(profile.fieldOfStudy)).toContain('MS')
  })

  it("Mom B's case: wants PhD in IT only", () => {
    const phdInCS = { educationLevel: 'doctorate', fieldOfStudy: 'phd' }
    const phdInBio = { educationLevel: 'doctorate', fieldOfStudy: 'edd' }
    const mastersInCS = { educationLevel: 'masters', fieldOfStudy: 'ms' }

    expect(phdInCS.educationLevel === 'doctorate' && phdInCS.fieldOfStudy === 'phd').toBe(true)
    expect(phdInBio.educationLevel === 'doctorate' && phdInBio.fieldOfStudy === 'phd').toBe(false)
    expect(mastersInCS.educationLevel === 'doctorate' && mastersInCS.fieldOfStudy === 'phd').toBe(false)
  })

  it('person with bachelor engineering degree', () => {
    const profile = { educationLevel: 'bachelors', fieldOfStudy: 'be' }
    expect(getEducationLevelLabel(profile.educationLevel)).toContain("Bachelor")
    expect(getFieldOfStudyLabel(profile.fieldOfStudy)).toContain('BE')
  })
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe('education validation', () => {
  const validLocation = {
    currentLocation: 'San Francisco, CA',
    country: 'USA',
    grewUpIn: 'USA',
    citizenship: 'USA',
    zipCode: '94105',
    educationLevel: 'masters',
    fieldOfStudy: 'ms',
    university: 'Stanford University',
    occupation: 'software_engineer',
    employerName: 'Example Corp',
    annualIncome: '100k-150k',
    openToRelocation: 'yes',
  }

  it('passes with new education fields', () => {
    const result = validateLocationEducationStep(validLocation)
    expect(result.isValid).toBe(true)
  })

  it('passes with legacy qualification (backward compat)', () => {
    const result = validateLocationEducationStep({
      ...validLocation,
      educationLevel: '',
      fieldOfStudy: '',
      qualification: 'masters_cs',
    })
    expect(result.isValid).toBe(true)
  })

  it('fails when both educationLevel and qualification are missing', () => {
    const result = validateLocationEducationStep({
      ...validLocation,
      educationLevel: '',
      fieldOfStudy: '',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Education level is required.')
  })

  it('fails when occupation is missing', () => {
    const result = validateLocationEducationStep({
      ...validLocation,
      occupation: '',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Occupation is required.')
  })

  it('validates additional education entries - requires degree+college when level set', () => {
    const result = validateLocationEducationStep({
      ...validLocation,
      educationEntries: [
        { educationLevel: 'masters', fieldOfStudy: 'ms', university: 'Stanford' },
        { educationLevel: 'bachelors', fieldOfStudy: '', university: '' },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('Education 2'))).toBe(true)
  })

  it('passes when additional entries are empty (optional)', () => {
    const result = validateLocationEducationStep({
      ...validLocation,
      educationEntries: [
        { educationLevel: 'masters', fieldOfStudy: 'ms', university: 'Stanford' },
        { educationLevel: '', fieldOfStudy: '', university: '' },
      ],
    })
    expect(result.isValid).toBe(true)
  })

  it('validates "other" degree requires custom text', () => {
    const result = validateLocationEducationStep({
      ...validLocation,
      fieldOfStudy: 'other',
      educationEntries: [
        { educationLevel: 'masters', fieldOfStudy: 'other', fieldOfStudyOther: '', university: 'Stanford' },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('specify your degree'))).toBe(true)
  })

  it('passes when "other" degree has custom text', () => {
    const result = validateLocationEducationStep({
      ...validLocation,
      fieldOfStudy: 'other',
      educationEntries: [
        { educationLevel: 'masters', fieldOfStudy: 'other', fieldOfStudyOther: 'M.Arch', university: 'Stanford' },
      ],
    })
    expect(result.isValid).toBe(true)
  })
})

// ─── Constants completeness ───────────────────────────────────────────────────

describe('constants completeness', () => {
  it('EDUCATION_LEVEL_OPTIONS has 10 options (new taxonomy)', () => {
    expect(EDUCATION_LEVEL_OPTIONS).toHaveLength(10)
  })

  it('FIELD_OF_STUDY_OPTIONS has 25 degree options', () => {
    expect(FIELD_OF_STUDY_OPTIONS).toHaveLength(25)
  })

  it('every EDUCATION_LEVEL_OPTIONS entry has value, label, and weight', () => {
    for (const opt of EDUCATION_LEVEL_OPTIONS) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
      expect(opt.weight).toBeGreaterThanOrEqual(0)
    }
  })

  it('every FIELD_OF_STUDY_OPTIONS entry has value and label', () => {
    for (const opt of FIELD_OF_STUDY_OPTIONS) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
    }
  })

  it('QUALIFICATION_TO_NEW_FIELDS covers all legacy qualification types', () => {
    const expectedKeys = [
      'high_school', 'associates',
      'bachelors_arts', 'bachelors_science', 'bachelors_eng', 'bachelors_cs', 'bba', 'bfa', 'bsn',
      'masters_arts', 'masters_science', 'masters_eng', 'masters_cs', 'mba', 'mfa', 'mph', 'msw',
      'md', 'do', 'dds', 'pharmd',
      'jd', 'cpa',
      'phd', 'edd', 'psyd',
    ]
    for (const key of expectedKeys) {
      expect(QUALIFICATION_TO_NEW_FIELDS[key]).toBeDefined()
    }
  })
})
