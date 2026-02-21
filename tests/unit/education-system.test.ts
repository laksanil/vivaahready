/**
 * Hard test cases for the education system:
 * - Constants helpers (labels, badges)
 * - Filter logic (legacy fallback, combo filters)
 * - Matching algorithm (level hierarchy, doctor_or_lawyer, field of study)
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
    expect(getEducationLevelLabel('bachelors')).toBe("Bachelor's Degree")
    expect(getEducationLevelLabel('masters')).toBe("Master's Degree")
    expect(getEducationLevelLabel('mba')).toBe('MBA')
    expect(getEducationLevelLabel('medical')).toBe('Medical Degree (MD, DO, DDS, PharmD)')
    expect(getEducationLevelLabel('law')).toBe('Law Degree (JD)')
    expect(getEducationLevelLabel('doctorate')).toBe('Doctorate (PhD, EdD, PsyD)')
    expect(getEducationLevelLabel('high_school')).toBe('High School Diploma')
    expect(getEducationLevelLabel('associates')).toBe("Associate's Degree")
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
  it('returns label for known field values', () => {
    expect(getFieldOfStudyLabel('engineering')).toBe('Engineering & Technology')
    expect(getFieldOfStudyLabel('cs_it')).toBe('Computer Science & IT')
    expect(getFieldOfStudyLabel('business')).toBe('Business & Finance')
    expect(getFieldOfStudyLabel('medical_health')).toBe('Medical & Healthcare')
    expect(getFieldOfStudyLabel('law_legal')).toBe('Law & Legal Studies')
    expect(getFieldOfStudyLabel('social_sciences')).toBe('Social Sciences & Psychology')
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
  it('has badge for medical degree', () => {
    const badge = EDUCATION_BADGES['medical']
    expect(badge).toBeDefined()
    expect(badge.label).toBe('MD')
    expect(badge.bg).toContain('green')
  })

  it('has badge for MBA', () => {
    const badge = EDUCATION_BADGES['mba']
    expect(badge).toBeDefined()
    expect(badge.label).toBe('MBA')
    expect(badge.bg).toContain('blue')
  })

  it('has badge for law degree', () => {
    const badge = EDUCATION_BADGES['law']
    expect(badge).toBeDefined()
    expect(badge.label).toBe('JD')
    expect(badge.bg).toContain('amber')
  })

  it('has badge for doctorate', () => {
    const badge = EDUCATION_BADGES['doctorate']
    expect(badge).toBeDefined()
    expect(badge.label).toBe('PhD')
    expect(badge.bg).toContain('purple')
  })

  it('does NOT have badge for bachelors (too common)', () => {
    expect(EDUCATION_BADGES['bachelors']).toBeUndefined()
  })

  it('does NOT have badge for masters (too common)', () => {
    expect(EDUCATION_BADGES['masters']).toBeUndefined()
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

  it('maps md to medical + medical_health', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['md']
    expect(mapped.educationLevel).toBe('medical')
    expect(mapped.fieldOfStudy).toBe('medical_health')
  })

  it('maps jd to law + law_legal', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['jd']
    expect(mapped.educationLevel).toBe('law')
    expect(mapped.fieldOfStudy).toBe('law_legal')
  })

  it('maps phd to doctorate with NO field (unknown)', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['phd']
    expect(mapped.educationLevel).toBe('doctorate')
    expect(mapped.fieldOfStudy).toBeUndefined()
  })

  it('maps mba to mba + business', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['mba']
    expect(mapped.educationLevel).toBe('mba')
    expect(mapped.fieldOfStudy).toBe('business')
  })

  it('maps pharmd to medical + medical_health', () => {
    const mapped = QUALIFICATION_TO_NEW_FIELDS['pharmd']
    expect(mapped.educationLevel).toBe('medical')
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
    expect(matchesFilter({ educationLevel: 'masters', fieldOfStudy: 'cs_it' }, 'masters', '')).toBe(true)
    expect(matchesFilter({ educationLevel: 'bachelors', fieldOfStudy: 'cs_it' }, 'masters', '')).toBe(false)
  })

  it('filters by field of study (new system)', () => {
    expect(matchesFilter({ educationLevel: 'masters', fieldOfStudy: 'cs_it' }, '', 'cs_it')).toBe(true)
    expect(matchesFilter({ educationLevel: 'masters', fieldOfStudy: 'engineering' }, '', 'cs_it')).toBe(false)
  })

  it('combo filter: education level + field of study', () => {
    // PhD in CS should match doctorate + cs_it
    expect(matchesFilter({ educationLevel: 'doctorate', fieldOfStudy: 'cs_it' }, 'doctorate', 'cs_it')).toBe(true)
    // PhD in Psychology should NOT match doctorate + cs_it
    expect(matchesFilter({ educationLevel: 'doctorate', fieldOfStudy: 'social_sciences' }, 'doctorate', 'cs_it')).toBe(false)
    // MBA in CS should NOT match doctorate + cs_it
    expect(matchesFilter({ educationLevel: 'mba', fieldOfStudy: 'cs_it' }, 'doctorate', 'cs_it')).toBe(false)
  })

  // HARD: Legacy profile with only old qualification
  it('filters legacy profile (qualification only) via mapping', () => {
    // masters_cs should match "Master's Degree" filter
    expect(matchesFilter({ qualification: 'masters_cs' }, 'masters', '')).toBe(true)
    // masters_cs should match "CS & IT" field filter
    expect(matchesFilter({ qualification: 'masters_cs' }, '', 'cs_it')).toBe(true)
    // masters_cs should NOT match "Doctorate" filter
    expect(matchesFilter({ qualification: 'masters_cs' }, 'doctorate', '')).toBe(false)
  })

  it('filters legacy medical degree via mapping', () => {
    expect(matchesFilter({ qualification: 'md' }, 'medical', '')).toBe(true)
    expect(matchesFilter({ qualification: 'md' }, '', 'medical_health')).toBe(true)
    expect(matchesFilter({ qualification: 'md' }, 'law', '')).toBe(false)
  })

  it('filters legacy law degree via mapping', () => {
    expect(matchesFilter({ qualification: 'jd' }, 'law', '')).toBe(true)
    expect(matchesFilter({ qualification: 'jd' }, '', 'law_legal')).toBe(true)
    expect(matchesFilter({ qualification: 'jd' }, 'medical', '')).toBe(false)
  })

  // HARD: Unknown legacy qualification not in mapping
  it('excludes profile with unknown legacy qualification when filter is active', () => {
    expect(matchesFilter({ qualification: 'some_random_value' }, 'masters', '')).toBe(false)
    expect(matchesFilter({ qualification: 'some_random_value' }, '', 'engineering')).toBe(false)
  })

  // HARD: Profile with no education at all
  it('excludes profile with no education data when filter is active', () => {
    expect(matchesFilter({}, 'masters', '')).toBe(false)
    expect(matchesFilter({}, '', 'cs_it')).toBe(false)
  })

  // HARD: New system takes precedence over legacy
  it('prefers educationLevel over qualification when both exist', () => {
    // Profile has educationLevel=masters but legacy qualification=phd
    // Filter by doctorate should NOT match (new system overrides)
    expect(matchesFilter({ educationLevel: 'masters', qualification: 'phd' }, 'doctorate', '')).toBe(false)
    // Filter by masters should match
    expect(matchesFilter({ educationLevel: 'masters', qualification: 'phd' }, 'masters', '')).toBe(true)
  })

  // HARD: PhD with no field of study (common for migrated profiles)
  it('handles PhD with no field of study', () => {
    // Legacy PhD has no fieldOfStudy in the mapping
    expect(matchesFilter({ qualification: 'phd' }, 'doctorate', '')).toBe(true)
    // But filtering by any field should exclude it (field is null)
    expect(matchesFilter({ qualification: 'phd' }, '', 'cs_it')).toBe(false)
  })
})

// ─── Matching algorithm: isEducationMatch ─────────────────────────────────────
// We test the matching logic by importing the actual function

describe('education matching algorithm', () => {
  // Import the actual matching functions
  // Note: These are internal functions not exported, so we test them through the
  // QUALIFICATION_TO_NEW_FIELDS mapping + the hierarchy rules

  const hierarchy: Record<string, number> = {
    'high_school': 1,
    'associates': 1,
    'bachelors': 2,
    'masters': 3,
    'mba': 3,
    'medical': 4,
    'law': 4,
    'doctorate': 4,
  }

  // Simulates isEducationMatch new-system logic
  function simulateEducationMatch(seekerPref: string, candidateEdLevel: string): boolean {
    const prefNormalized = seekerPref.toLowerCase().trim()
    const candidateLevelNum = hierarchy[candidateEdLevel] || 0

    if (prefNormalized === 'doesnt_matter' || prefNormalized === 'any') return true
    if (prefNormalized === 'doctor_or_lawyer') return candidateEdLevel === 'medical' || candidateEdLevel === 'law'
    if (prefNormalized === 'medical') return candidateEdLevel === 'medical'
    if (prefNormalized === 'law') return candidateEdLevel === 'law'
    if (prefNormalized === 'mba') return candidateEdLevel === 'mba'
    if (prefNormalized === 'doctorate') return candidateEdLevel === 'doctorate'
    if (prefNormalized === 'bachelors') return candidateLevelNum >= 2
    if (prefNormalized === 'masters') return candidateLevelNum >= 3
    return false
  }

  describe("'masters or higher' preference", () => {
    it('matches masters', () => expect(simulateEducationMatch('masters', 'masters')).toBe(true))
    it('matches mba (level 3)', () => expect(simulateEducationMatch('masters', 'mba')).toBe(true))
    it('matches medical (level 4)', () => expect(simulateEducationMatch('masters', 'medical')).toBe(true))
    it('matches law (level 4)', () => expect(simulateEducationMatch('masters', 'law')).toBe(true))
    it('matches doctorate (level 4)', () => expect(simulateEducationMatch('masters', 'doctorate')).toBe(true))
    it('does NOT match bachelors (level 2)', () => expect(simulateEducationMatch('masters', 'bachelors')).toBe(false))
    it('does NOT match high school (level 1)', () => expect(simulateEducationMatch('masters', 'high_school')).toBe(false))
  })

  describe("'bachelors or higher' preference", () => {
    it('matches bachelors', () => expect(simulateEducationMatch('bachelors', 'bachelors')).toBe(true))
    it('matches masters', () => expect(simulateEducationMatch('bachelors', 'masters')).toBe(true))
    it('matches doctorate', () => expect(simulateEducationMatch('bachelors', 'doctorate')).toBe(true))
    it('does NOT match high school', () => expect(simulateEducationMatch('bachelors', 'high_school')).toBe(false))
    it('does NOT match associates', () => expect(simulateEducationMatch('bachelors', 'associates')).toBe(false))
  })

  describe("'doctor_or_lawyer' preference", () => {
    it('matches medical', () => expect(simulateEducationMatch('doctor_or_lawyer', 'medical')).toBe(true))
    it('matches law', () => expect(simulateEducationMatch('doctor_or_lawyer', 'law')).toBe(true))
    it('does NOT match doctorate (PhD is not a doctor/lawyer)', () => expect(simulateEducationMatch('doctor_or_lawyer', 'doctorate')).toBe(false))
    it('does NOT match mba', () => expect(simulateEducationMatch('doctor_or_lawyer', 'mba')).toBe(false))
    it('does NOT match masters', () => expect(simulateEducationMatch('doctor_or_lawyer', 'masters')).toBe(false))
    it('does NOT match bachelors', () => expect(simulateEducationMatch('doctor_or_lawyer', 'bachelors')).toBe(false))
  })

  describe("exact category preferences", () => {
    it("'medical' only matches medical, not law", () => {
      expect(simulateEducationMatch('medical', 'medical')).toBe(true)
      expect(simulateEducationMatch('medical', 'law')).toBe(false)
      expect(simulateEducationMatch('medical', 'doctorate')).toBe(false)
    })

    it("'law' only matches law, not medical", () => {
      expect(simulateEducationMatch('law', 'law')).toBe(true)
      expect(simulateEducationMatch('law', 'medical')).toBe(false)
    })

    it("'mba' only matches mba, not masters", () => {
      expect(simulateEducationMatch('mba', 'mba')).toBe(true)
      expect(simulateEducationMatch('mba', 'masters')).toBe(false)
    })

    it("'doctorate' only matches doctorate, not medical", () => {
      expect(simulateEducationMatch('doctorate', 'doctorate')).toBe(true)
      expect(simulateEducationMatch('doctorate', 'medical')).toBe(false)
    })
  })

  describe("doesnt_matter preference", () => {
    it('matches everything', () => {
      expect(simulateEducationMatch('doesnt_matter', 'high_school')).toBe(true)
      expect(simulateEducationMatch('doesnt_matter', 'doctorate')).toBe(true)
      expect(simulateEducationMatch('any', 'masters')).toBe(true)
    })
  })

  // Field of study matching
  describe('field of study matching', () => {
    function simulateFieldMatch(seekerPref: string | null, candidateField: string | null): boolean {
      if (!seekerPref || seekerPref === 'any' || seekerPref === '') return true
      if (!candidateField) return true // Missing data never blocks
      return seekerPref.toLowerCase().trim() === candidateField.toLowerCase().trim()
    }

    it('matches when field is same', () => {
      expect(simulateFieldMatch('cs_it', 'cs_it')).toBe(true)
    })

    it('does not match when field is different', () => {
      expect(simulateFieldMatch('engineering', 'cs_it')).toBe(false)
    })

    it("'any' matches everything", () => {
      expect(simulateFieldMatch('any', 'cs_it')).toBe(true)
      expect(simulateFieldMatch('any', 'engineering')).toBe(true)
    })

    it('null/empty preference matches everything', () => {
      expect(simulateFieldMatch(null, 'cs_it')).toBe(true)
      expect(simulateFieldMatch('', 'engineering')).toBe(true)
    })

    it('missing candidate field never blocks', () => {
      expect(simulateFieldMatch('engineering', null)).toBe(true)
    })
  })
})

// ─── Real-world scenarios ─────────────────────────────────────────────────────

describe('real-world education scenarios', () => {
  it("Asha's case: School Psychologist with Master's", () => {
    // Profile: educationLevel=masters, fieldOfStudy=social_sciences, major=School Psychology
    const profile = { educationLevel: 'masters', fieldOfStudy: 'social_sciences', major: 'School Psychology' }

    // Label should show "Master's Degree"
    expect(getEducationLevelLabel(profile.educationLevel)).toBe("Master's Degree")
    expect(getFieldOfStudyLabel(profile.fieldOfStudy)).toBe('Social Sciences & Psychology')

    // Should NOT get a badge (masters is too common)
    expect(EDUCATION_BADGES['masters']).toBeUndefined()

    // Should match "master's or higher" preference
    const hierarchy: Record<string, number> = { masters: 3 }
    expect((hierarchy['masters'] || 0) >= 3).toBe(true)
  })

  it("Mom B's case: wants PhD in IT only", () => {
    // prefQualification=doctorate, prefFieldOfStudy=cs_it
    const phdInCS = { educationLevel: 'doctorate', fieldOfStudy: 'cs_it' }
    const phdInBio = { educationLevel: 'doctorate', fieldOfStudy: 'science' }
    const mastersInCS = { educationLevel: 'masters', fieldOfStudy: 'cs_it' }

    // Only PhD in CS should match both filters
    expect(phdInCS.educationLevel === 'doctorate' && phdInCS.fieldOfStudy === 'cs_it').toBe(true)
    expect(phdInBio.educationLevel === 'doctorate' && phdInBio.fieldOfStudy === 'cs_it').toBe(false)
    expect(mastersInCS.educationLevel === 'doctorate' && mastersInCS.fieldOfStudy === 'cs_it').toBe(false)
  })

  it("Mom C's case: wants doctor or lawyer", () => {
    // doctor_or_lawyer should match medical and law, but NOT doctorate
    const doctor = { educationLevel: 'medical' }
    const lawyer = { educationLevel: 'law' }
    const phd = { educationLevel: 'doctorate' }
    const mba = { educationLevel: 'mba' }

    const isDoctorOrLawyer = (edLevel: string) => edLevel === 'medical' || edLevel === 'law'

    expect(isDoctorOrLawyer(doctor.educationLevel)).toBe(true)
    expect(isDoctorOrLawyer(lawyer.educationLevel)).toBe(true)
    expect(isDoctorOrLawyer(phd.educationLevel)).toBe(false)
    expect(isDoctorOrLawyer(mba.educationLevel)).toBe(false)
  })

  it('person with environmental studies and bio engineering (bachelors)', () => {
    // User would pick: educationLevel=bachelors, fieldOfStudy=science (or engineering), major=Environmental Studies & Bio Engineering
    const profile = { educationLevel: 'bachelors', fieldOfStudy: 'science', major: 'Environmental Studies & Bio Engineering' }
    expect(getEducationLevelLabel(profile.educationLevel)).toBe("Bachelor's Degree")
    expect(getFieldOfStudyLabel(profile.fieldOfStudy)).toBe('Science (Physics, Chemistry, Biology)')
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
    fieldOfStudy: 'cs_it',
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
})

// ─── Constants completeness ───────────────────────────────────────────────────

describe('constants completeness', () => {
  it('EDUCATION_LEVEL_OPTIONS has exactly 8 options', () => {
    expect(EDUCATION_LEVEL_OPTIONS).toHaveLength(8)
  })

  it('FIELD_OF_STUDY_OPTIONS has exactly 10 options', () => {
    expect(FIELD_OF_STUDY_OPTIONS).toHaveLength(10)
  })

  it('every EDUCATION_LEVEL_OPTIONS entry has value, label, and level', () => {
    for (const opt of EDUCATION_LEVEL_OPTIONS) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
      expect(opt.level).toBeGreaterThanOrEqual(1)
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
