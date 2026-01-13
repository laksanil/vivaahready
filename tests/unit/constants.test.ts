import { describe, it, expect } from 'vitest'
import {
  HEIGHT_OPTIONS,
  QUALIFICATION_OPTIONS,
  OCCUPATION_OPTIONS,
  HOBBIES_OPTIONS,
  FITNESS_OPTIONS,
  INTERESTS_OPTIONS,
  PREF_AGE_OPTIONS,
  PREF_INCOME_OPTIONS,
  PREF_LOCATION_OPTIONS,
  PREF_EDUCATION_OPTIONS
} from '@/lib/constants'

/**
 * Constants Validation Tests
 * Ensures all option arrays are properly configured
 */

describe('Height Options', () => {
  it('has height options defined', () => {
    expect(HEIGHT_OPTIONS).toBeDefined()
    expect(Array.isArray(HEIGHT_OPTIONS)).toBeTruthy()
    expect(HEIGHT_OPTIONS.length).toBeGreaterThan(0)
  })

  it('height options have value and label', () => {
    HEIGHT_OPTIONS.forEach(option => {
      expect(option).toHaveProperty('value')
      expect(option).toHaveProperty('label')
      expect(typeof option.value).toBe('string')
      expect(typeof option.label).toBe('string')
    })
  })

  it('height values are in correct format', () => {
    HEIGHT_OPTIONS.forEach(option => {
      // Should be like 5'8" or similar
      expect(option.value).toMatch(/\d'(\d{1,2}")?/)
    })
  })
})

describe('Qualification Options', () => {
  it('has qualification options defined', () => {
    expect(QUALIFICATION_OPTIONS).toBeDefined()
    expect(Array.isArray(QUALIFICATION_OPTIONS)).toBeTruthy()
    expect(QUALIFICATION_OPTIONS.length).toBeGreaterThan(0)
  })

  it('includes common qualifications', () => {
    const values = QUALIFICATION_OPTIONS.map(o => o.value.toLowerCase())
    // Should have some of these common values
    const commonQualifications = ['bachelor', 'master', 'phd', 'mba', 'md']
    const hasCommon = commonQualifications.some(q =>
      values.some(v => v.includes(q))
    )
    expect(hasCommon).toBeTruthy()
  })
})

describe('Occupation Options', () => {
  it('has occupation options defined', () => {
    expect(OCCUPATION_OPTIONS).toBeDefined()
    expect(Array.isArray(OCCUPATION_OPTIONS)).toBeTruthy()
    expect(OCCUPATION_OPTIONS.length).toBeGreaterThan(0)
  })

  it('includes common occupations', () => {
    const values = OCCUPATION_OPTIONS.map(o => o.value.toLowerCase())
    const commonOccupations = ['engineer', 'doctor', 'business', 'other']
    const hasCommon = commonOccupations.some(o =>
      values.some(v => v.includes(o))
    )
    expect(hasCommon).toBeTruthy()
  })
})

describe('Hobbies Options', () => {
  it('has hobbies options defined', () => {
    expect(HOBBIES_OPTIONS).toBeDefined()
    expect(Array.isArray(HOBBIES_OPTIONS)).toBeTruthy()
    expect(HOBBIES_OPTIONS.length).toBeGreaterThan(10)
  })

  it('hobbies are strings', () => {
    HOBBIES_OPTIONS.forEach(hobby => {
      expect(typeof hobby).toBe('string')
      expect(hobby.length).toBeGreaterThan(0)
    })
  })

  it('includes diverse hobbies', () => {
    const hobbies = HOBBIES_OPTIONS.map(h => h.toLowerCase())
    expect(hobbies.some(h => h.includes('read') || h.includes('book'))).toBeTruthy()
    expect(hobbies.some(h => h.includes('travel'))).toBeTruthy()
    expect(hobbies.some(h => h.includes('music') || h.includes('cook'))).toBeTruthy()
  })
})

describe('Fitness Options', () => {
  it('has fitness options defined', () => {
    expect(FITNESS_OPTIONS).toBeDefined()
    expect(Array.isArray(FITNESS_OPTIONS)).toBeTruthy()
    expect(FITNESS_OPTIONS.length).toBeGreaterThan(5)
  })

  it('includes common fitness activities', () => {
    const fitness = FITNESS_OPTIONS.map(f => f.toLowerCase())
    expect(fitness.some(f => f.includes('gym') || f.includes('yoga') || f.includes('run'))).toBeTruthy()
  })
})

describe('Interests Options', () => {
  it('has interests options defined', () => {
    expect(INTERESTS_OPTIONS).toBeDefined()
    expect(Array.isArray(INTERESTS_OPTIONS)).toBeTruthy()
    expect(INTERESTS_OPTIONS.length).toBeGreaterThan(10)
  })

  it('interests are strings', () => {
    INTERESTS_OPTIONS.forEach(interest => {
      expect(typeof interest).toBe('string')
      expect(interest.length).toBeGreaterThan(0)
    })
  })
})

describe('Preference Options', () => {
  it('has age preference options', () => {
    expect(PREF_AGE_OPTIONS).toBeDefined()
    expect(Array.isArray(PREF_AGE_OPTIONS)).toBeTruthy()
    expect(PREF_AGE_OPTIONS.length).toBeGreaterThan(0)
  })

  it('has income preference options', () => {
    expect(PREF_INCOME_OPTIONS).toBeDefined()
    expect(Array.isArray(PREF_INCOME_OPTIONS)).toBeTruthy()
    expect(PREF_INCOME_OPTIONS.length).toBeGreaterThan(0)
  })

  it('has location preference options', () => {
    expect(PREF_LOCATION_OPTIONS).toBeDefined()
    expect(Array.isArray(PREF_LOCATION_OPTIONS)).toBeTruthy()
    expect(PREF_LOCATION_OPTIONS.length).toBeGreaterThan(0)
  })

  it('has education preference options', () => {
    expect(PREF_EDUCATION_OPTIONS).toBeDefined()
    expect(Array.isArray(PREF_EDUCATION_OPTIONS)).toBeTruthy()
    expect(PREF_EDUCATION_OPTIONS.length).toBeGreaterThan(0)
  })

  it('preference options have value and label', () => {
    ;[PREF_AGE_OPTIONS, PREF_INCOME_OPTIONS, PREF_LOCATION_OPTIONS, PREF_EDUCATION_OPTIONS].forEach(options => {
      options.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
      })
    })
  })
})

describe('No Duplicate Values', () => {
  it('hobbies have no duplicates', () => {
    const uniqueHobbies = new Set(HOBBIES_OPTIONS)
    expect(uniqueHobbies.size).toBe(HOBBIES_OPTIONS.length)
  })

  it('fitness options have no duplicates', () => {
    const uniqueFitness = new Set(FITNESS_OPTIONS)
    expect(uniqueFitness.size).toBe(FITNESS_OPTIONS.length)
  })

  it('interests have no duplicates', () => {
    const uniqueInterests = new Set(INTERESTS_OPTIONS)
    expect(uniqueInterests.size).toBe(INTERESTS_OPTIONS.length)
  })
})
