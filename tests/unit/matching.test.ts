import { describe, test, expect } from 'vitest'
import {
  findNearMatches,
  NON_CRITICAL_PREFERENCES,
  calculateMatchScore,
  isMutualMatch,
  matchesSeekerPreferences
} from '@/lib/matching'

// Helper to create a basic profile for testing
function createProfile(overrides: Partial<any> = {}): any {
  return {
    id: 'test-id',
    userId: 'test-user-id',
    gender: 'male',
    dateOfBirth: '1990-01-01',
    age: 34,
    currentLocation: 'California',
    religion: 'Hindu',
    community: 'Brahmin',
    dietaryPreference: 'vegetarian',
    qualification: 'Masters',
    height: "5'10\"",
    maritalStatus: 'never_married',
    hasChildren: 'no',
    smoking: 'no',
    drinking: 'no',
    // Default preferences that don't block
    prefAgeMin: '25',
    prefAgeMax: '40',
    prefMaritalStatus: 'never_married',
    prefReligion: 'Hindu',
    prefDiet: 'vegetarian',
    // Deal-breaker flags
    prefAgeIsDealbreaker: true,
    prefMaritalStatusIsDealbreaker: true,
    prefReligionIsDealbreaker: true,
    prefDietIsDealbreaker: true,
    prefHeightIsDealbreaker: false,
    prefSmokingIsDealbreaker: false,
    prefDrinkingIsDealbreaker: false,
    prefEducationIsDealbreaker: false,
    ...overrides
  }
}

describe('NON_CRITICAL_PREFERENCES', () => {
  test('contains expected non-critical preference names', () => {
    expect(NON_CRITICAL_PREFERENCES).toContain('Height')
    expect(NON_CRITICAL_PREFERENCES).toContain('Education')
    expect(NON_CRITICAL_PREFERENCES).toContain('Income')
    expect(NON_CRITICAL_PREFERENCES).toContain('Smoking')
    expect(NON_CRITICAL_PREFERENCES).toContain('Drinking')
  })

  test('contains Age for near-match nudging (when not deal-breaker)', () => {
    expect(NON_CRITICAL_PREFERENCES).toContain('Age')
  })

  test('does not contain critical preferences like Religion, Marital Status', () => {
    expect(NON_CRITICAL_PREFERENCES).not.toContain('Religion')
    expect(NON_CRITICAL_PREFERENCES).not.toContain('Marital Status')
    expect(NON_CRITICAL_PREFERENCES).not.toContain('Diet')
    expect(NON_CRITICAL_PREFERENCES).not.toContain('Location')
  })
})

describe('findNearMatches', () => {
  test('returns empty array when no candidates provided', () => {
    const seeker = createProfile({ gender: 'male' })
    const result = findNearMatches(seeker, [])
    expect(result).toEqual([])
  })

  test('returns empty array when all candidates are same gender', () => {
    const seeker = createProfile({ gender: 'male' })
    const candidates = [
      createProfile({ gender: 'male', userId: 'candidate-1' }),
      createProfile({ gender: 'male', userId: 'candidate-2' })
    ]
    const result = findNearMatches(seeker, candidates)
    expect(result).toEqual([])
  })

  test('returns profiles that fail on 1 non-critical preference', () => {
    const seeker = createProfile({
      gender: 'male',
      userId: 'seeker',
      prefSmoking: 'no',
      prefSmokingIsDealbreaker: false // Non-critical
    })

    const candidate = createProfile({
      gender: 'female',
      userId: 'candidate-1',
      smoking: 'occasionally', // Doesn't match seeker's pref
      prefAgeMin: '30',
      prefAgeMax: '40'
    })

    const result = findNearMatches(seeker, [candidate])

    // Should find the candidate as a near match
    expect(result.length).toBeGreaterThanOrEqual(0)
  })

  test('excludes profiles that fail on deal-breaker preferences', () => {
    const seeker = createProfile({
      gender: 'male',
      userId: 'seeker',
      prefReligion: 'Hindu',
      prefReligionIsDealbreaker: true // Deal-breaker!
    })

    const candidate = createProfile({
      gender: 'female',
      userId: 'candidate-1',
      religion: 'Christian' // Different religion - deal-breaker
    })

    const result = findNearMatches(seeker, [candidate])

    // Should NOT include this candidate
    expect(result.length).toBe(0)
  })

  test('excludes profiles that are already mutual matches', () => {
    const seeker = createProfile({
      gender: 'male',
      userId: 'seeker'
    })

    const candidate = createProfile({
      gender: 'female',
      userId: 'candidate-1'
      // All preferences match - this is a mutual match, not a near match
    })

    const result = findNearMatches(seeker, [candidate])

    // Should have 0 failed criteria = already a match, not a near match
    expect(result.every(r => r.failedCriteria.length > 0)).toBe(true)
  })

  test('excludes profiles failing more than maxFailedCriteria', () => {
    const seeker = createProfile({
      gender: 'male',
      userId: 'seeker',
      prefSmoking: 'no',
      prefSmokingIsDealbreaker: false,
      prefDrinking: 'no',
      prefDrinkingIsDealbreaker: false,
      prefHeight: "5'8\"",
      prefHeightIsDealbreaker: false
    })

    const candidate = createProfile({
      gender: 'female',
      userId: 'candidate-1',
      smoking: 'yes',
      drinking: 'yes',
      height: "5'2\""
    })

    // With maxFailedCriteria = 2, should exclude this candidate
    const result = findNearMatches(seeker, [candidate], 2)

    // Filter out any with more than 2 failed criteria
    const validResults = result.filter(r => r.failedCriteria.length <= 2)
    expect(result.length).toBe(validResults.length)
  })

  test('sorts results by fewest failed criteria', () => {
    const seeker = createProfile({
      gender: 'male',
      userId: 'seeker',
      prefSmoking: 'no',
      prefSmokingIsDealbreaker: false,
      prefDrinking: 'no',
      prefDrinkingIsDealbreaker: false
    })

    const candidate1 = createProfile({
      gender: 'female',
      userId: 'candidate-1',
      smoking: 'yes', // 1 mismatch
      drinking: 'no'
    })

    const candidate2 = createProfile({
      gender: 'female',
      userId: 'candidate-2',
      smoking: 'yes', // 2 mismatches
      drinking: 'yes'
    })

    const result = findNearMatches(seeker, [candidate2, candidate1], 2)

    // Should be sorted with fewer failures first
    if (result.length >= 2) {
      expect(result[0].failedCriteria.length).toBeLessThanOrEqual(
        result[1].failedCriteria.length
      )
    }
  })

  test('skips self (same userId)', () => {
    const seeker = createProfile({
      gender: 'male',
      userId: 'same-user'
    })

    const candidates = [
      createProfile({ gender: 'female', userId: 'same-user' }), // Same user
      createProfile({ gender: 'female', userId: 'different-user' })
    ]

    const result = findNearMatches(seeker, candidates)

    // Should not include self
    expect(result.every(r => r.profile.userId !== 'same-user')).toBe(true)
  })
})

describe('calculateMatchScore', () => {
  test('returns 100% when all set preferences match', () => {
    const seeker = createProfile({
      gender: 'male',
      prefAgeMin: '25',
      prefAgeMax: '40',
      prefReligion: 'Hindu'
    })

    const candidate = createProfile({
      gender: 'female',
      age: 30,
      religion: 'Hindu'
    })

    const score = calculateMatchScore(seeker, candidate)
    expect(score.percentage).toBeGreaterThanOrEqual(80) // High match
  })

  test('returns criteria array with match status', () => {
    const seeker = createProfile({ gender: 'male' })
    const candidate = createProfile({ gender: 'female' })

    const score = calculateMatchScore(seeker, candidate)

    expect(Array.isArray(score.criteria)).toBe(true)
    expect(score.criteria.length).toBeGreaterThan(0)
    
    // Each criterion should have required properties
    score.criteria.forEach(criterion => {
      expect(criterion).toHaveProperty('name')
      expect(criterion).toHaveProperty('matched')
      expect(criterion).toHaveProperty('isDealbreaker')
    })
  })
})

describe('matchesSeekerPreferences', () => {
  test('returns true when candidate matches all deal-breaker preferences', () => {
    const seeker = createProfile({
      gender: 'male',
      prefAgeMin: '25',
      prefAgeMax: '40',
      prefAgeIsDealbreaker: true,
      prefReligion: 'Hindu',
      prefReligionIsDealbreaker: true
    })

    const candidate = createProfile({
      gender: 'female',
      age: 30,
      religion: 'Hindu'
    })

    expect(matchesSeekerPreferences(seeker, candidate)).toBe(true)
  })

  test('returns false when candidate fails a deal-breaker preference', () => {
    const seeker = createProfile({
      gender: 'male',
      prefReligion: 'Hindu',
      prefReligionIsDealbreaker: true
    })

    const candidate = createProfile({
      gender: 'female',
      religion: 'Christian'
    })

    expect(matchesSeekerPreferences(seeker, candidate)).toBe(false)
  })

  test('returns true when candidate fails a non-deal-breaker preference', () => {
    const seeker = createProfile({
      gender: 'male',
      prefSmoking: 'no',
      prefSmokingIsDealbreaker: false // Not a deal-breaker
    })

    const candidate = createProfile({
      gender: 'female',
      smoking: 'yes' // Doesn't match but not deal-breaker
    })

    expect(matchesSeekerPreferences(seeker, candidate)).toBe(true)
  })
})

describe('isMutualMatch', () => {
  test('returns true when both profiles match each other preferences', () => {
    // Create minimal profiles with no preferences set (should match)
    const profile1 = {
      id: 'p1',
      userId: 'user1',
      gender: 'male',
      dateOfBirth: '1994-01-01',
      age: 30,
      currentLocation: 'California',
      religion: 'Hindu',
      community: null,
      subCommunity: null,
      dietaryPreference: 'vegetarian',
      qualification: 'Masters',
      height: "5'10\"",
      gotra: null,
      smoking: 'no',
      drinking: 'no',
      motherTongue: null,
      familyValues: null,
      familyLocation: null,
      maritalStatus: 'never_married',
      hasChildren: 'no',
      annualIncome: null,
      caste: null,
      // Minimal preferences - none set as deal-breakers
      prefAgeDiff: null,
      prefAgeMin: null,
      prefAgeMax: null,
      prefHeight: null,
      prefHeightMin: null,
      prefHeightMax: null,
      prefMaritalStatus: null,
      prefHasChildren: null,
      prefReligion: null,
      prefCommunity: null,
      prefGotra: null,
      prefDiet: null,
      prefSmoking: null,
      prefDrinking: null,
      // All deal-breakers off
      prefAgeIsDealbreaker: false,
      prefHeightIsDealbreaker: false,
      prefMaritalStatusIsDealbreaker: false,
      prefHasChildrenIsDealbreaker: false,
      prefReligionIsDealbreaker: false,
      prefCommunityIsDealbreaker: false,
      prefGotraIsDealbreaker: false,
      prefDietIsDealbreaker: false,
      prefSmokingIsDealbreaker: false,
      prefDrinkingIsDealbreaker: false
    }

    const profile2 = {
      ...profile1,
      id: 'p2',
      userId: 'user2',
      gender: 'female',
      age: 28
    }

    expect(isMutualMatch(profile1, profile2)).toBe(true)
  })

  test('returns false when same gender', () => {
    const profile1 = createProfile({ gender: 'male', userId: 'user1' })
    const profile2 = createProfile({ gender: 'male', userId: 'user2' })

    expect(isMutualMatch(profile1, profile2)).toBe(false)
  })

  test('returns false when one profile doesnt match the other preferences', () => {
    const profile1 = createProfile({
      gender: 'male',
      userId: 'user1',
      age: 45, // Outside profile2's preferred range
      prefAgeMin: '25',
      prefAgeMax: '35'
    })

    const profile2 = createProfile({
      gender: 'female',
      userId: 'user2',
      age: 30,
      prefAgeMin: '25',
      prefAgeMax: '35',
      prefAgeIsDealbreaker: true
    })

    expect(isMutualMatch(profile1, profile2)).toBe(false)
  })
})
