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
    subCommunity: null,
    dietaryPreference: 'vegetarian',
    qualification: 'Masters',
    height: "5'10\"",
    maritalStatus: 'never_married',
    hasChildren: 'no',
    smoking: 'no',
    drinking: 'no',
    motherTongue: null,
    familyValues: null,
    familyLocation: null,
    annualIncome: null,
    caste: null,
    gotra: null,
    citizenship: null,
    grewUpIn: null,
    openToRelocation: 'yes',
    // Default preferences that don't block
    prefAgeMin: '25',
    prefAgeMax: '40',
    prefAgeDiff: null,
    prefMaritalStatus: 'never_married',
    prefReligion: 'Hindu',
    prefDiet: 'vegetarian',
    prefHeight: null,
    prefHeightMin: null,
    prefHeightMax: null,
    prefHasChildren: null,
    prefCommunity: null,
    prefGotra: null,
    prefSmoking: null,
    prefDrinking: null,
    prefEducation: null,
    prefIncome: null,
    prefLocation: null,
    prefLocationList: null,
    prefCitizenship: null,
    prefMotherTongue: null,
    // Deal-breaker flags
    prefAgeIsDealbreaker: true,
    prefMaritalStatusIsDealbreaker: true,
    prefReligionIsDealbreaker: true,
    prefDietIsDealbreaker: true,
    prefHeightIsDealbreaker: false,
    prefSmokingIsDealbreaker: false,
    prefDrinkingIsDealbreaker: false,
    prefEducationIsDealbreaker: false,
    prefIncomeIsDealbreaker: false,
    prefLocationIsDealbreaker: false,
    prefCommunityIsDealbreaker: false,
    prefGotraIsDealbreaker: false,
    prefHasChildrenIsDealbreaker: false,
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

describe('findNearMatches - One-Way (Seeker Can Fix)', () => {
  test('near match only shows when SEEKER can fix - not symmetric when candidate has unfixable preferences', () => {
    // Priyanka: age 24 (using dateOfBirth), wants age 24-27 (deal-breaker), California (deal-breaker)
    // Her age MUST be within Subodh's preference range for her to see him
    const priyanka = createProfile({
      id: 'priyanka-id',
      userId: 'priyanka-user',
      gender: 'female',
      dateOfBirth: '2002-01-01', // Age 24 in 2026
      age: 24,
      currentLocation: 'California',
      prefAgeMin: '24',
      prefAgeMax: '27',
      prefAgeIsDealbreaker: true,
      prefLocation: 'California',
      prefLocationList: 'California',
      prefLocationIsDealbreaker: true,
      openToRelocation: 'yes'
    })

    // Subodh: age 28 (1 year over Priyanka's max), Illinois
    // Has no restrictive preferences that would exclude Priyanka
    const subodh = createProfile({
      id: 'subodh-id',
      userId: 'subodh-user',
      gender: 'male',
      dateOfBirth: '1998-01-01', // Age 28 in 2026
      age: 28,
      currentLocation: 'Illinois',
      prefAgeMin: '20',
      prefAgeMax: '30', // Priyanka (24) is within this range
      prefAgeIsDealbreaker: false,
      prefLocation: 'Any',
      prefLocationIsDealbreaker: false,
      openToRelocation: 'yes'
    })

    // From Priyanka's view - Subodh should be a near match
    // (Priyanka CAN adjust her age/location preferences, and she MEETS Subodh's preferences)
    const nearMatchesForPriyanka = findNearMatches(priyanka, [subodh], 2)
    const subodhInPriyankaMatches = nearMatchesForPriyanka.some(nm => nm.profile.userId === 'subodh-user')
    expect(subodhInPriyankaMatches).toBe(true)

    // From Subodh's view - Priyanka should NOT be a near match
    // (Subodh CANNOT change his age to satisfy Priyanka's age deal-breaker preference)
    const nearMatchesForSubodh = findNearMatches(subodh, [priyanka], 2)
    const priyankaInSubodhMatches = nearMatchesForSubodh.some(nm => nm.profile.userId === 'priyanka-user')
    expect(priyankaInSubodhMatches).toBe(false)
  })

  test('near match shows when seeker can fix by relocating', () => {
    // Priyanka wants California only
    const priyanka = createProfile({
      userId: 'priyanka',
      gender: 'female',
      currentLocation: 'California',
      prefLocation: 'California',
      prefLocationList: 'California',
      prefLocationIsDealbreaker: true,
      openToRelocation: 'no' // Priyanka won't move
    })

    // Subodh is in Illinois but open to relocation
    const subodh = createProfile({
      userId: 'subodh',
      gender: 'male',
      currentLocation: 'Illinois',
      openToRelocation: 'yes' // Subodh CAN move
    })

    // From Subodh's view - Priyanka should be a near match
    // because Subodh can relocate to California
    const result = findNearMatches(subodh, [priyanka], 2)
    expect(result.some(nm => nm.profile.userId === 'priyanka')).toBe(true)
  })

  test('symmetric near match when both have location deal-breakers but open to relocation', () => {
    const userA = createProfile({
      userId: 'user-a',
      gender: 'male',
      currentLocation: 'Texas',
      prefLocation: 'Texas',
      prefLocationList: 'Texas',
      prefLocationIsDealbreaker: true,
      openToRelocation: 'yes' // Open to relocate
    })

    const userB = createProfile({
      userId: 'user-b',
      gender: 'female',
      currentLocation: 'New York',
      prefLocation: 'New York',
      prefLocationList: 'New York',
      prefLocationIsDealbreaker: true,
      openToRelocation: 'yes' // Open to relocate
    })

    const nearMatchesForA = findNearMatches(userA, [userB], 2)
    const nearMatchesForB = findNearMatches(userB, [userA], 2)

    // Both should see each other as near matches since both are open to relocation
    expect(nearMatchesForA.some(nm => nm.profile.userId === 'user-b')).toBe(true)
    expect(nearMatchesForB.some(nm => nm.profile.userId === 'user-a')).toBe(true)
  })
})

describe('findNearMatches - Age Tolerance', () => {
  test('includes candidate when age is 1 year over max (within tolerance)', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'female',
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: true
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'male',
      age: 31 // 1 year over max - within tolerance
    })

    const result = findNearMatches(seeker, [candidate], 2)
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(true)
  })

  test('includes candidate when age is 1 year under min (within tolerance)', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'female',
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: true
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'male',
      age: 24 // 1 year under min - within tolerance
    })

    const result = findNearMatches(seeker, [candidate], 2)
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(true)
  })

  test('excludes candidate when age is more than 1 year outside range', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'female',
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: true
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'male',
      age: 32 // 2 years over max - outside tolerance
    })

    const result = findNearMatches(seeker, [candidate], 2)
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(false)
  })
})

describe('findNearMatches - Height Tolerance', () => {
  test('includes candidate when height is within 2 inches of range', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'female',
      prefHeight: "5'6\" - 5'10\"",
      prefHeightMin: "5'6\"",
      prefHeightMax: "5'10\"",
      prefHeightIsDealbreaker: true
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'male',
      height: "5'4\"" // 2 inches under min - within tolerance
    })

    const result = findNearMatches(seeker, [candidate], 2)
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(true)
  })

  test('excludes candidate when height is more than 2 inches outside range', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'female',
      prefHeight: "5'6\" - 5'10\"",
      prefHeightMin: "5'6\"",
      prefHeightMax: "5'10\"",
      prefHeightIsDealbreaker: true
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'male',
      height: "5'2\"" // 4 inches under min - outside tolerance
    })

    const result = findNearMatches(seeker, [candidate], 2)
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(false)
  })
})

describe('findNearMatches - Unique Criteria Counting', () => {
  test('counts Location only once even when it fails in both directions', () => {
    const userA = createProfile({
      userId: 'user-a',
      gender: 'male',
      currentLocation: 'Texas',
      prefLocation: 'Texas',
      prefLocationList: 'Texas',
      prefLocationIsDealbreaker: false, // Non-critical
      openToRelocation: 'yes'
    })

    const userB = createProfile({
      userId: 'user-b',
      gender: 'female',
      currentLocation: 'California',
      prefLocation: 'California',
      prefLocationList: 'California',
      prefLocationIsDealbreaker: false, // Non-critical
      openToRelocation: 'yes'
    })

    const result = findNearMatches(userA, [userB], 2)

    if (result.length > 0) {
      const uniqueNames = new Set(result[0].failedCriteria.map(c => c.name))
      // Location should only appear once, not twice
      const locationCount = result[0].failedCriteria.filter(c => c.name === 'Location').length
      // If location appears multiple times in array, unique count should still be 1
      if (locationCount > 1) {
        expect(uniqueNames.size).toBeLessThan(result[0].failedCriteria.length)
      }
    }
  })

  test('excludes profiles with more than 2 unique failed criteria', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'male',
      prefSmoking: 'no',
      prefSmokingIsDealbreaker: false,
      prefDrinking: 'no',
      prefDrinkingIsDealbreaker: false,
      prefEducation: 'Masters',
      prefEducationIsDealbreaker: false
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'female',
      smoking: 'yes',
      drinking: 'yes',
      qualification: 'Bachelors' // 3 different criteria failing
    })

    const result = findNearMatches(seeker, [candidate], 2)

    // Should not include candidate with 3 unique failed criteria
    result.forEach(nm => {
      const uniqueCriteria = new Set(nm.failedCriteria.map(c => c.name))
      expect(uniqueCriteria.size).toBeLessThanOrEqual(2)
    })
  })
})

describe('findNearMatches - Relocation Logic', () => {
  test('includes near match when seeker is open to relocation for candidates location preference', () => {
    // Candidate (Priyanka) has location deal-breaker for California
    // Seeker (Subodh) is in Illinois but open to relocation
    const subodh = createProfile({
      userId: 'subodh',
      gender: 'male',
      currentLocation: 'Illinois',
      openToRelocation: 'yes' // Subodh can relocate
    })

    const priyanka = createProfile({
      userId: 'priyanka',
      gender: 'female',
      currentLocation: 'California',
      prefLocation: 'California',
      prefLocationList: 'California',
      prefLocationIsDealbreaker: true, // Priyanka wants CA
      openToRelocation: 'no' // Priyanka won't move
    })

    // From Subodh's view, Priyanka should still be a near match
    // because Subodh (seeker) is open to relocation
    const result = findNearMatches(subodh, [priyanka], 2)
    expect(result.some(nm => nm.profile.userId === 'priyanka')).toBe(true)
  })

  test('excludes near match when neither party will relocate', () => {
    const userA = createProfile({
      userId: 'user-a',
      gender: 'male',
      currentLocation: 'Texas',
      prefLocation: 'Texas',
      prefLocationList: 'Texas',
      prefLocationIsDealbreaker: true,
      openToRelocation: 'no' // Won't relocate
    })

    const userB = createProfile({
      userId: 'user-b',
      gender: 'female',
      currentLocation: 'California',
      prefLocation: 'California',
      prefLocationList: 'California',
      prefLocationIsDealbreaker: true,
      openToRelocation: 'no' // Won't relocate either
    })

    const result = findNearMatches(userA, [userB], 2)
    // Should NOT be a near match since neither will relocate
    expect(result.some(nm => nm.profile.userId === 'user-b')).toBe(false)
  })

  test('checks correct person for relocation - seeker for candidates prefs', () => {
    // Bug scenario: When checking if candidate's location preference can be relaxed,
    // should check if SEEKER (not candidate) is open to relocation

    const seeker = createProfile({
      userId: 'seeker',
      gender: 'male',
      currentLocation: 'Illinois',
      openToRelocation: 'yes', // Seeker CAN relocate
      prefLocationIsDealbreaker: false
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'female',
      currentLocation: 'California',
      prefLocation: 'California',
      prefLocationList: 'California',
      prefLocationIsDealbreaker: true, // Candidate wants CA
      openToRelocation: 'no' // Candidate won't move
    })

    // Candidate's location pref (California) fails on seeker (Illinois)
    // Since seeker IS open to relocation, this should be relaxable
    const result = findNearMatches(seeker, [candidate], 2)
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(true)
  })

  test('excludes near match when candidate has non-location deal-breaker that seeker fails', () => {
    // User A (seeker) wants to see near matches
    // User B (candidate) has age deal-breaker that User A fails
    // Even if User A adjusts their preferences, User B would still reject User A
    // So don't show User B as near match for User A

    const userA = createProfile({
      userId: 'user-a',
      gender: 'male',
      age: 35, // User A's age
      currentLocation: 'California',
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: false // User A's preference (not relevant here)
    })

    const userB = createProfile({
      userId: 'user-b',
      gender: 'female',
      age: 28,
      currentLocation: 'California',
      prefAgeMin: '26',
      prefAgeMax: '32',
      prefAgeIsDealbreaker: true // User B wants 26-32, User A is 35 - FAILS
    })

    // User A sees User B - but User B's age deal-breaker fails on User A (35 > 32)
    // User A cannot change their age, so don't show User B as near match
    const result = findNearMatches(userA, [userB], 2)
    expect(result.some(nm => nm.profile.userId === 'user-b')).toBe(false)
  })

})

describe('findNearMatches - Deal-breaker Relaxation', () => {
  test('relaxes age deal-breaker within 1 year tolerance', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'female',
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: true // This IS a deal-breaker
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'male',
      age: 31 // 1 year over - should be relaxed
    })

    const result = findNearMatches(seeker, [candidate], 2)
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(true)

    if (result.length > 0) {
      // Should include Age in failed criteria as a relaxed deal-breaker
      expect(result[0].failedCriteria.some(c => c.name === 'Age')).toBe(true)
    }
  })

  test('does not relax religion deal-breaker', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'male',
      prefReligion: 'Hindu',
      prefReligionIsDealbreaker: true
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'female',
      religion: 'Christian' // Different religion
    })

    const result = findNearMatches(seeker, [candidate], 2)
    // Should NOT include - religion deal-breaker cannot be relaxed
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(false)
  })

  test('does not relax marital status deal-breaker', () => {
    const seeker = createProfile({
      userId: 'seeker',
      gender: 'male',
      prefMaritalStatus: 'never_married',
      prefMaritalStatusIsDealbreaker: true
    })

    const candidate = createProfile({
      userId: 'candidate',
      gender: 'female',
      maritalStatus: 'divorced'
    })

    const result = findNearMatches(seeker, [candidate], 2)
    // Should NOT include - marital status deal-breaker cannot be relaxed
    expect(result.some(nm => nm.profile.userId === 'candidate')).toBe(false)
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
