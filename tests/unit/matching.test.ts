import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  calculateAgeFromDOB,
  parseAgePreference,
  matchesSeekerPreferences,
  isMutualMatch,
  calculateMatchScore,
} from '@/lib/matching'

const baseProfile = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  userId: 'u1',
  gender: 'female',
  dateOfBirth: '1995-01-01',
  currentLocation: 'San Jose, CA',
  caste: null,
  community: 'Iyer',
  subCommunity: 'Smartha',
  dietaryPreference: 'Vegetarian',
  qualification: 'bachelors_cs',
  height: "5'6\"",
  gotra: 'Kashyap',
  smoking: 'no',
  drinking: 'no',
  motherTongue: 'Telugu',
  motherTongueOther: null,
  familyValues: 'traditional',
  familyLocation: 'USA',
  maritalStatus: 'never_married',
  hasChildren: null,
  annualIncome: '100k-150k',
  religion: 'Hindu',
  citizenship: 'USA',
  grewUpIn: 'USA',
  openToRelocation: 'no',
  pets: 'no_but_open',
  hobbies: 'Reading, Music',
  fitness: 'Yoga',
  interests: 'Movies',
  occupation: 'software engineer',
  ...overrides,
})

describe('Matching helpers', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-19T12:00:00Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('calculateAgeFromDOB', () => {
    it('handles MM/DD/YYYY', () => {
      expect(calculateAgeFromDOB('01/01/2000')).toBe(26)
    })

    it('handles MM/YYYY', () => {
      expect(calculateAgeFromDOB('01/2010')).toBe(16)
    })

    it('handles ISO date', () => {
      expect(calculateAgeFromDOB('1990-01-01')).toBe(36)
    })

    it('returns null for invalid dates', () => {
      expect(calculateAgeFromDOB('invalid')).toBeNull()
    })
  })

  describe('parseAgePreference', () => {
    it('parses absolute ranges', () => {
      expect(parseAgePreference('25-35 years', null)).toEqual({ min: 25, max: 35 })
    })

    it('parses relative ranges', () => {
      expect(parseAgePreference('between 3 to 5 years', 30)).toEqual({ min: 33, max: 35 })
    })

    it('parses less-than ranges', () => {
      expect(parseAgePreference('< 5 years', 30)).toEqual({ min: 25, max: 35 })
    })

    it('parses younger/older', () => {
      expect(parseAgePreference('3 years younger', 30)).toEqual({ min: 27, max: 30 })
      expect(parseAgePreference('3 years older', 30)).toEqual({ min: 30, max: 33 })
    })
  })
})

describe('Matching engine rules', () => {
  const seekerBase = baseProfile({ gender: 'female', userId: 'u1', id: 's1' })
  const candidateBase = baseProfile({ gender: 'male', userId: 'u2', id: 'c1' })

  it('enforces age dealbreakers (and allows soft mismatches)', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: true,
    })
    const candidate = baseProfile({
      ...candidateBase,
      dateOfBirth: '2004-01-01', // age 22
    })

    expect(matchesSeekerPreferences(seeker as any, candidate as any)).toBe(false)

    const softSeeker = baseProfile({
      ...seekerBase,
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: false,
    })
    expect(matchesSeekerPreferences(softSeeker as any, candidate as any)).toBe(true)
  })

  it('allows missing age even when age is a dealbreaker', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefAgeMin: '25',
      prefAgeMax: '30',
      prefAgeIsDealbreaker: true,
    })
    const candidate = baseProfile({
      ...candidateBase,
      dateOfBirth: null,
    })
    expect(matchesSeekerPreferences(seeker as any, candidate as any)).toBe(true)
  })

  it('does not block when candidate data is missing for deal-breakers', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefDiet: 'veg',
      prefDietIsDealbreaker: true,
      prefSmoking: 'no',
      prefSmokingIsDealbreaker: true,
      prefDrinking: 'no',
      prefDrinkingIsDealbreaker: true,
      prefLocation: 'same_state',
      prefLocationIsDealbreaker: true,
      prefCommunity: 'same_as_mine',
      prefCommunityIsDealbreaker: true,
      prefReligion: 'Hindu',
      prefReligionIsDealbreaker: true,
      prefMaritalStatus: 'never_married',
      prefMaritalStatusIsDealbreaker: true,
      prefHasChildren: 'no_children',
      prefHasChildrenIsDealbreaker: true,
      prefIncome: '75k-100k',
      prefIncomeIsDealbreaker: true,
      prefOccupationList: 'software engineer',
      prefOccupationIsDealbreaker: true,
      prefFamilyValues: 'traditional',
      prefFamilyValuesIsDealbreaker: true,
      prefFamilyLocation: 'USA',
      prefFamilyLocationIsDealbreaker: true,
      prefMotherTongue: 'same_as_mine',
      prefMotherTongueIsDealbreaker: true,
      prefCitizenship: 'same_as_mine',
      prefCitizenshipIsDealbreaker: true,
      prefGrewUpIn: 'USA',
      prefGrewUpInIsDealbreaker: true,
      prefPets: 'must_love',
      prefPetsIsDealbreaker: true,
      prefHobbies: 'same_as_mine',
      prefHobbiesIsDealbreaker: true,
      prefFitness: 'same_as_mine',
      prefFitnessIsDealbreaker: true,
      prefInterests: 'same_as_mine',
      prefInterestsIsDealbreaker: true,
    })
    const candidate = baseProfile({
      ...candidateBase,
      dietaryPreference: null,
      smoking: null,
      drinking: null,
      currentLocation: null,
      community: null,
      religion: null,
      maritalStatus: null,
      hasChildren: null,
      annualIncome: null,
      occupation: null,
      familyValues: null,
      familyLocation: null,
      motherTongue: null,
      citizenship: null,
      grewUpIn: null,
      pets: null,
      hobbies: null,
      fitness: null,
      interests: null,
    })

    expect(matchesSeekerPreferences(seeker as any, candidate as any)).toBe(true)
  })

  it('enforces height dealbreakers', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefHeightMin: "5'6\"",
      prefHeightMax: "6'0\"",
      prefHeightIsDealbreaker: true,
    })
    const candidate = baseProfile({
      ...candidateBase,
      height: "5'4\"",
    })
    expect(matchesSeekerPreferences(seeker as any, candidate as any)).toBe(false)
  })

  it('handles location lists and same_state', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefLocationList: 'california, texas',
      prefLocationIsDealbreaker: true,
      currentLocation: 'San Jose, CA',
    })
    const candidateTx = baseProfile({
      ...candidateBase,
      currentLocation: 'Austin, TX',
    })
    const candidateWa = baseProfile({
      ...candidateBase,
      currentLocation: 'Seattle, WA',
    })

    expect(matchesSeekerPreferences(seeker as any, candidateTx as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, candidateWa as any)).toBe(false)

    const seekerSameState = baseProfile({
      ...seekerBase,
      prefLocation: 'same_state',
      prefLocationIsDealbreaker: true,
      currentLocation: 'San Jose, CA',
    })
    const candidateSameState = baseProfile({
      ...candidateBase,
      currentLocation: 'Los Angeles, CA',
    })
    const candidateOtherState = baseProfile({
      ...candidateBase,
      currentLocation: 'New York, NY',
    })

    expect(matchesSeekerPreferences(seekerSameState as any, candidateSameState as any)).toBe(true)
    expect(matchesSeekerPreferences(seekerSameState as any, candidateOtherState as any)).toBe(false)
  })

  it('matches community same_as_mine', () => {
    const seeker = baseProfile({
      ...seekerBase,
      community: 'Iyer',
      prefCommunity: 'same_as_mine',
      prefCommunityIsDealbreaker: true,
    })
    const candidateMatch = baseProfile({
      ...candidateBase,
      community: 'Iyengar',
    })
    const candidateNo = baseProfile({
      ...candidateBase,
      community: 'Reddy',
    })

    expect(matchesSeekerPreferences(seeker as any, candidateMatch as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, candidateNo as any)).toBe(false)
  })

  it('enforces diet preferences', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefDiet: 'veg_eggetarian',
      prefDietIsDealbreaker: true,
    })
    const vegCandidate = baseProfile({ ...candidateBase, dietaryPreference: 'Vegetarian' })
    const eggCandidate = baseProfile({ ...candidateBase, dietaryPreference: 'Eggetarian' })
    const nonVegCandidate = baseProfile({ ...candidateBase, dietaryPreference: 'Non-Vegetarian' })
    const veganCandidate = baseProfile({ ...candidateBase, dietaryPreference: 'Vegan' })

    expect(matchesSeekerPreferences(seeker as any, vegCandidate as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, eggCandidate as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, veganCandidate as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, nonVegCandidate as any)).toBe(false)

    const vegOnlySeeker = baseProfile({
      ...seekerBase,
      prefDiet: 'veg',
      prefDietIsDealbreaker: true,
    })
    expect(matchesSeekerPreferences(vegOnlySeeker as any, eggCandidate as any)).toBe(false)
  })

  it('enforces smoking/drinking preference values from UI', () => {
    const seekerSmoking = baseProfile({
      ...seekerBase,
      prefSmoking: 'occasionally_ok',
      prefSmokingIsDealbreaker: true,
    })
    const smoker = baseProfile({ ...candidateBase, smoking: 'yes' })
    const occasional = baseProfile({ ...candidateBase, smoking: 'occasionally' })
    expect(matchesSeekerPreferences(seekerSmoking as any, smoker as any)).toBe(false)
    expect(matchesSeekerPreferences(seekerSmoking as any, occasional as any)).toBe(true)

    const seekerDrinking = baseProfile({
      ...seekerBase,
      prefDrinking: 'social_ok',
      prefDrinkingIsDealbreaker: true,
    })
    const regularDrinker = baseProfile({ ...candidateBase, drinking: 'yes' })
    const socialDrinker = baseProfile({ ...candidateBase, drinking: 'social' })
    expect(matchesSeekerPreferences(seekerDrinking as any, regularDrinker as any)).toBe(false)
    expect(matchesSeekerPreferences(seekerDrinking as any, socialDrinker as any)).toBe(true)
  })

  it('handles has-children values and never_married default', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefHasChildren: 'no_children',
      prefHasChildrenIsDealbreaker: true,
    })
    const neverMarried = baseProfile({
      ...candidateBase,
      maritalStatus: 'never_married',
      hasChildren: null,
    })
    const hasChildren = baseProfile({
      ...candidateBase,
      maritalStatus: 'divorced',
      hasChildren: 'yes_living_together',
    })
    expect(matchesSeekerPreferences(seeker as any, neverMarried as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, hasChildren as any)).toBe(false)
  })

  it('enforces education categories aligned to preferences', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefQualification: 'eng_bachelors',
      prefEducationIsDealbreaker: true,
    })
    const eng = baseProfile({ ...candidateBase, qualification: 'bachelors_eng' })
    const arts = baseProfile({ ...candidateBase, qualification: 'bachelors_arts' })
    expect(matchesSeekerPreferences(seeker as any, eng as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, arts as any)).toBe(false)

    const medicalSeeker = baseProfile({
      ...seekerBase,
      prefQualification: 'medical',
      prefEducationIsDealbreaker: true,
    })
    const md = baseProfile({ ...candidateBase, qualification: 'md' })
    const mbbs = baseProfile({ ...candidateBase, qualification: 'mbbs' })
    expect(matchesSeekerPreferences(medicalSeeker as any, md as any)).toBe(true)
    expect(matchesSeekerPreferences(medicalSeeker as any, mbbs as any)).toBe(false)
  })

  it('enforces religion, citizenship, relocation, pets, sub-community, and occupation dealbreakers', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefReligion: 'Hindu',
      prefReligionIsDealbreaker: true,
      prefCitizenship: 'same_as_mine',
      prefCitizenshipIsDealbreaker: true,
      prefRelocation: 'no',
      prefRelocationIsDealbreaker: true,
      prefPets: 'must_love',
      prefPetsIsDealbreaker: true,
      prefSubCommunityList: 'smartha, madhwa',
      prefSubCommunityIsDealbreaker: true,
      prefOccupationList: 'software engineer, data scientist',
      prefOccupationIsDealbreaker: true,
    })

    const match = baseProfile({
      ...candidateBase,
      religion: 'Hindu',
      citizenship: 'USA',
      openToRelocation: 'no',
      pets: 'have_love',
      subCommunity: 'Madhwa',
      occupation: 'Data Scientist',
    })

    const mismatch = baseProfile({
      ...candidateBase,
      religion: 'Christian',
      citizenship: 'Canada',
      openToRelocation: 'yes',
      pets: 'no_but_open',
      subCommunity: 'Gowda',
      occupation: 'Teacher',
    })

    expect(matchesSeekerPreferences(seeker as any, match as any)).toBe(true)
    expect(matchesSeekerPreferences(seeker as any, mismatch as any)).toBe(false)
  })

  it('requires mutual matches to satisfy both sides', () => {
    const profileA = baseProfile({
      ...seekerBase,
      gender: 'female',
      prefDiet: 'veg',
      prefDietIsDealbreaker: true,
      smoking: 'no',
    })
    const profileB = baseProfile({
      ...candidateBase,
      gender: 'male',
      dietaryPreference: 'Vegetarian',
      prefSmoking: 'no',
      prefSmokingIsDealbreaker: true,
      smoking: 'no',
    })

    expect(isMutualMatch(profileA as any, profileB as any)).toBe(true)

    const profileAConflict = baseProfile({
      ...profileA,
      smoking: 'yes',
    })
    expect(isMutualMatch(profileAConflict as any, profileB as any)).toBe(false)
  })

  it('calculateMatchScore ignores "doesnt_matter" and does not penalize missing data', () => {
    const seeker = baseProfile({
      ...seekerBase,
      prefDiet: 'veg',
      prefDietIsDealbreaker: false,
      prefSmoking: 'doesnt_matter',
    })
    const candidate = baseProfile({
      ...candidateBase,
      dietaryPreference: null,
      smoking: null,
    })

    const score = calculateMatchScore(seeker as any, candidate as any)
    const dietCriterion = score.criteria.find(c => c.name === 'Diet')
    const smokingCriterion = score.criteria.find(c => c.name === 'Smoking')

    expect(dietCriterion?.matched).toBe(true)
    expect(smokingCriterion?.matched).toBe(true)
    expect(score.maxScore).toBe(1)
  })
})
