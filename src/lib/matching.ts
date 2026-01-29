/**
 * Matching Algorithm for VivaahReady
 *
 * STRICT MATCHING: Respects exact user preferences with no buffers or tolerances.
 * - Deal-breaker preferences are strictly enforced when data is present
 *   (missing candidate data never blocks a match)
 * - Soft preferences are also respected exactly as specified
 * - Two-way/mutual matching: BOTH parties' preferences must be satisfied
 * - Professional approach: What user requests is exactly what they get
 *
 * Matching Criteria:
 * - Gender (required): Opposite gender
 * - Age: STRICT - Within exact preferred age range (no buffer)
 * - Location: Matches preferred location exactly
 * - Community: Intelligent community matching with sub-community awareness
 * - Diet: Matches preferred diet exactly
 * - Qualification: Meets minimum preferred education
 * - Gotra: Different gotra if required (always strict)
 * - All other preferences: Matched exactly as specified
 */

interface ProfileForMatching {
  id: string
  userId: string
  gender: string
  dateOfBirth: string | null
  currentLocation: string | null
  caste: string | null
  community: string | null
  subCommunity: string | null
  dietaryPreference: string | null
  qualification: string | null
  height: string | null
  gotra: string | null
  aboutMe?: string | null  // Used to check for ongoing education
  smoking: string | null
  drinking: string | null
  motherTongue: string | null
  familyValues: string | null
  familyLocation: string | null
  maritalStatus: string | null
  hasChildren: string | null
  annualIncome: string | null

  // Preferences - Core (Page 1)
  prefAgeDiff?: string | null
  prefAgeMin?: string | null
  prefAgeMax?: string | null
  prefHeight?: string | null
  prefHeightMin?: string | null
  prefHeightMax?: string | null
  prefMaritalStatus?: string | null
  prefHasChildren?: string | null
  prefReligion?: string | null
  prefCommunity?: string | null
  prefGotra?: string | null
  prefDiet?: string | null
  prefSmoking?: string | null
  prefDrinking?: string | null

  // Preferences - Additional (Page 2)
  prefLocation?: string | null
  prefLocationList?: string | null
  prefCitizenship?: string | null
  prefGrewUpIn?: string | null
  prefRelocation?: string | null
  prefQualification?: string | null
  prefWorkArea?: string | null
  prefIncome?: string | null
  prefOccupationList?: string | null
  prefOccupation?: string | null
  prefFamilyValues?: string | null
  prefFamilyLocation?: string | null
  prefFamilyLocationCountry?: string | null
  prefMotherTongue?: string | null
  prefMotherTongueList?: string | null
  prefMotherTongueOther?: string | null
  motherTongueOther?: string | null
  prefSubCommunity?: string | null
  prefSubCommunityList?: string | null
  prefPets?: string | null
  prefCaste?: string | null
  prefHobbies?: string | null
  prefFitness?: string | null
  prefInterests?: string | null

  // Deal-breaker flags
  prefAgeIsDealbreaker?: boolean | string
  prefHeightIsDealbreaker?: boolean | string
  prefMaritalStatusIsDealbreaker?: boolean | string
  prefHasChildrenIsDealbreaker?: boolean | string
  prefReligionIsDealbreaker?: boolean | string
  prefCommunityIsDealbreaker?: boolean | string
  prefGotraIsDealbreaker?: boolean | string
  prefDietIsDealbreaker?: boolean | string
  prefSmokingIsDealbreaker?: boolean | string
  prefDrinkingIsDealbreaker?: boolean | string
  prefLocationIsDealbreaker?: boolean | string
  prefCitizenshipIsDealbreaker?: boolean | string
  prefGrewUpInIsDealbreaker?: boolean | string
  prefRelocationIsDealbreaker?: boolean | string
  prefEducationIsDealbreaker?: boolean | string
  prefWorkAreaIsDealbreaker?: boolean | string
  prefIncomeIsDealbreaker?: boolean | string
  prefOccupationIsDealbreaker?: boolean | string
  prefFamilyValuesIsDealbreaker?: boolean | string
  prefFamilyLocationIsDealbreaker?: boolean | string
  prefFamilyLocationCountryIsDealbreaker?: boolean | string
  prefMotherTongueIsDealbreaker?: boolean | string
  prefSubCommunityIsDealbreaker?: boolean | string
  prefPetsIsDealbreaker?: boolean | string
  prefHobbiesIsDealbreaker?: boolean | string
  prefFitnessIsDealbreaker?: boolean | string
  prefInterestsIsDealbreaker?: boolean | string

  // Additional candidate profile fields
  religion?: string | null
  citizenship?: string | null
  grewUpIn?: string | null
  country?: string | null
  openToRelocation?: string | null
  pets?: string | null
  hobbies?: string | null
  fitness?: string | null
  interests?: string | null
  occupation?: string | null
}

/**
 * Calculate age from date of birth
 * Handles both ISO date format and MM/DD/YYYY or MM/YYYY format
 */
export function calculateAgeFromDOB(dob: string | null): number | null {
  if (!dob) return null

  // Handle MM/DD/YYYY format
  const mmddyyyy = dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mmddyyyy) {
    const year = parseInt(mmddyyyy[3])
    const month = parseInt(mmddyyyy[1]) - 1
    const day = parseInt(mmddyyyy[2])
    const date = new Date(year, month, day)
    const today = new Date()
    let age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--
    }
    return age
  }

  // Handle MM/YYYY format
  const mmyyyy = dob.match(/^(\d{1,2})\/(\d{4})$/)
  if (mmyyyy) {
    const year = parseInt(mmyyyy[2])
    if (year > 1900 && year < 2020) {
      return new Date().getFullYear() - year
    }
  }

  // Handle ISO date format (YYYY-MM-DD)
  const date = new Date(dob)
  if (!isNaN(date.getTime())) {
    const today = new Date()
    let age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--
    }
    return age
  }

  return null
}

const NO_PREFERENCE_VALUES = new Set([
  '',
  'doesnt_matter',
  "doesn't matter",
  'doesnt matter',
  'any',
  'no preference',
])

function isNoPreferenceValue(value: string | null | undefined): boolean {
  if (!value) return true
  const normalized = value.toLowerCase().trim()
  return NO_PREFERENCE_VALUES.has(normalized)
}

/**
 * Parse age range/difference from preference string
 * Handles various formats:
 * - "25-35 years" -> absolute range
 * - "between 3 to 5 years" -> relative difference
 * - "< 5 years" -> less than
 * - "3-5 years older" -> relative
 */
export function parseAgePreference(prefAgeDiff: string | null | undefined, seekerAge: number | null): { min: number; max: number } | null {
  if (!prefAgeDiff) return null

  const pref = prefAgeDiff.toLowerCase().trim()

  // If "doesn't matter" or empty
  if (isNoPreferenceValue(pref)) return null

  // Pattern: "25-35" or "25 to 35" or "between 25 and 35" (absolute age range)
  const absoluteMatch = pref.match(/(\d{2,})\s*[-–to]+\s*(\d{2,})/)
  if (absoluteMatch) {
    return { min: parseInt(absoluteMatch[1]), max: parseInt(absoluteMatch[2]) }
  }

  // Pattern: "between X to Y years" or "X to Y years" (relative - age difference)
  const relativeMatch = pref.match(/(?:between\s+)?(\d+)\s*(?:to|-|–)\s*(\d+)\s*years?/)
  if (relativeMatch && seekerAge !== null) {
    const diffMin = parseInt(relativeMatch[1])
    const diffMax = parseInt(relativeMatch[2])
    // STRICT: Assuming they want someone older by this many years - no buffer
    return { min: seekerAge + diffMin, max: seekerAge + diffMax }
  }

  // Pattern: "< X years" or "less than X years" (relative)
  const lessThanMatch = pref.match(/(?:<|less\s*than)\s*(\d+)\s*years?/)
  if (lessThanMatch && seekerAge !== null) {
    const diff = parseInt(lessThanMatch[1])
    // Partner should be within this age difference (either direction)
    return { min: seekerAge - diff, max: seekerAge + diff }
  }

  // Pattern: "X years younger/older"
  const youngerOlderMatch = pref.match(/(\d+)\s*years?\s*(younger|older)/)
  if (youngerOlderMatch && seekerAge !== null) {
    const diff = parseInt(youngerOlderMatch[1])
    // STRICT: No buffer
    if (youngerOlderMatch[2] === 'younger') {
      return { min: seekerAge - diff, max: seekerAge }
    } else {
      return { min: seekerAge, max: seekerAge + diff }
    }
  }

  // Pattern: just a number like "5" (assume years difference)
  const justNumber = pref.match(/^(\d+)$/)
  if (justNumber && seekerAge !== null) {
    const diff = parseInt(justNumber[1])
    return { min: seekerAge - diff, max: seekerAge + diff }
  }

  return null
}

// Legacy function for backward compatibility
export function parseAgeRange(prefAgeDiff: string | null): { min: number; max: number } | null {
  return parseAgePreference(prefAgeDiff, null)
}

/**
 * Education level hierarchy for comparison
 * Level: 1=High School, 2=Bachelor's, 3=Master's, 4=Doctorate/Super-specialty
 *
 * Medical degrees:
 * - MBBS/BDS = Bachelor's level (undergraduate medical degree)
 * - MD/DO = Doctorate level (professional degree)
 * - DM/MCh = Super-specialty (doctorate level)
 */
const EDUCATION_LEVELS: Record<string, number> = {
  // Level 1: High School / Diploma
  'high_school': 1,
  'high school': 1,
  'diploma': 1,
  '12th': 1,
  'associates': 1,
  'associate': 1,
  'aa': 1,
  'as': 1,

  // Level 2: Undergrad (including MBBS - medical undergrad)
  'undergrad': 2,
  'undergrad_eng': 2,
  'undergrad_cs': 2,
  'bachelors': 2,  // Legacy
  'bachelors_eng': 2,  // Legacy
  'bachelors_cs': 2,  // Legacy
  'bachelors_arts': 2,
  'bachelors_science': 2,
  "bachelor's": 2,
  'bachelor': 2,
  'undergraduate': 2,
  'be': 2,
  'btech': 2,
  'bsc': 2,
  'bcom': 2,
  'ba': 2,
  'bca': 2,
  'bba': 2,
  'bfa': 2,
  'bsn': 2,
  'mbbs': 2,  // Medical Undergrad
  'bds': 2,   // Dental Undergrad
  'llb': 2,   // Law Undergrad

  // Level 3: Master's / Professional
  'masters': 3,
  'masters_eng': 3,
  'masters_cs': 3,
  'masters_arts': 3,
  'masters_science': 3,
  "master's": 3,
  'master': 3,
  'graduate': 3,
  'post graduate': 3,
  'postgraduate': 3,
  'post_graduate': 3,
  'mba': 3,
  'me': 3,
  'mtech': 3,
  'msc': 3,
  'mcom': 3,
  'ma': 3,
  'mca': 3,
  'mfa': 3,
  'mph': 3,
  'msw': 3,
  'ms_medical': 3,
  'llm': 3,   // Law Master's
  'ca_cpa': 3,
  'ca': 3,
  'cpa': 3,
  'cs': 3,

  // Level 4: Doctorate / Super-specialty
  'md': 4,    // Medical Doctorate (professional degree)
  'do': 4,
  'dds': 4,
  'pharmd': 4,
  'jd': 4,
  'phd': 4,
  'ph.d': 4,
  'doctorate': 4,
  'edd': 4,
  'psyd': 4,
  'dm_mch': 4,
  'dm': 4,
  'mch': 4,
}

/**
 * Categories for specific education matching (e.g., "Medical Professional")
 */
const EDUCATION_CATEGORIES: Record<string, string[]> = {
  // Medical
  'medical_undergrad': ['mbbs', 'bds'],
  'medical_masters': ['md', 'ms_medical'],
  'medical': ['mbbs', 'bds', 'md', 'ms_medical', 'dm_mch'],  // All medical
  // Engineering (includes CS since CS is a branch of engineering)
  'eng_undergrad': ['undergrad_eng', 'bachelors_eng', 'be', 'btech', 'undergrad_cs', 'bachelors_cs', 'bca'],
  'eng_masters': ['masters_eng', 'me', 'mtech', 'masters_cs', 'mca'],
  'engineering': ['undergrad_eng', 'bachelors_eng', 'masters_eng', 'be', 'btech', 'me', 'mtech', 'undergrad_cs', 'bachelors_cs', 'masters_cs', 'bca', 'mca'],
  // Computer Science (includes engineering since CS is a branch of engineering)
  'cs_undergrad': ['undergrad_cs', 'bachelors_cs', 'bca', 'bsc cs', 'undergrad_eng', 'bachelors_eng', 'be', 'btech'],
  'cs_masters': ['masters_cs', 'mca', 'msc cs', 'masters_eng', 'me', 'mtech'],
  'computer_science': ['undergrad_cs', 'bachelors_cs', 'masters_cs', 'bca', 'mca', 'undergrad_eng', 'bachelors_eng', 'masters_eng', 'be', 'btech', 'me', 'mtech'],
  // Other Professional
  'ca_professional': ['ca_cpa', 'ca', 'cpa', 'cs'],
  'mba': ['mba'],
  'law': ['llb', 'llm'],
  'doctorate': ['phd', 'dm_mch'],  // Only PhD and super-specialty
}

/**
 * Preference type mapping
 */
const PREF_EDUCATION_CONFIG: Record<string, { type: string; minLevel?: number; categories?: string[] }> = {
  'doesnt_matter': { type: 'any' },
  'any': { type: 'any' },
  // Level-based
  'undergrad': { type: 'level', minLevel: 2 },
  'masters': { type: 'level', minLevel: 3 },
  'bachelors': { type: 'level', minLevel: 2 },
  // Engineering (includes CS since CS is a branch of engineering)
  'eng_undergrad': { type: 'category', categories: ['undergrad_eng', 'bachelors_eng', 'be', 'btech', 'undergrad_cs', 'bachelors_cs', 'bca'] },
  'eng_masters': { type: 'category', categories: ['masters_eng', 'me', 'mtech', 'masters_cs', 'mca'] },
  'eng_bachelors': { type: 'category', categories: ['bachelors_eng', 'be', 'btech', 'bachelors_cs', 'bca'] },
  // Computer Science (includes engineering since CS is a branch of engineering)
  'cs_undergrad': { type: 'category', categories: ['undergrad_cs', 'bachelors_cs', 'bca', 'undergrad_eng', 'bachelors_eng', 'be', 'btech'] },
  'cs_masters': { type: 'category', categories: ['masters_cs', 'mca', 'masters_eng', 'me', 'mtech'] },
  'cs_bachelors': { type: 'category', categories: ['bachelors_cs', 'bca', 'bachelors_eng', 'be', 'btech'] },
  // Medical
  'medical_undergrad': { type: 'category', categories: ['mbbs', 'bds'] },
  'medical_masters': { type: 'category', categories: ['md', 'ms_medical'] },
  'medical': { type: 'category', categories: ['md', 'do'] },
  'healthcare': { type: 'category', categories: ['bsn', 'pharmd', 'dds'] },
  // Other Professional
  'mba': { type: 'category', categories: ['mba'] },
  'ca_professional': { type: 'category', categories: ['ca_cpa', 'cs'] },
  'cpa': { type: 'category', categories: ['cpa'] },
  'law': { type: 'category', categories: ['llb', 'llm', 'jd'] },
  'doctorate': { type: 'category', categories: ['phd', 'edd', 'psyd', 'dm_mch'] },
  // Legacy values support
  'graduate': { type: 'level', minLevel: 2 },  // Legacy
  'post_graduate': { type: 'level', minLevel: 3 },  // Legacy
  'phd': { type: 'category', categories: ['phd'] },
  'eng_bachelor': { type: 'category', categories: ['undergrad_eng', 'bachelors_eng', 'be', 'btech', 'bachelors_cs', 'bca'] },  // Legacy
  'eng_master': { type: 'category', categories: ['masters_eng', 'me', 'mtech', 'masters_cs', 'mca'] },  // Legacy
  'cs_bachelor': { type: 'category', categories: ['undergrad_cs', 'bachelors_cs', 'bca', 'undergrad_eng', 'bachelors_eng', 'be', 'btech'] },  // Legacy
  'cs_master': { type: 'category', categories: ['masters_cs', 'mca', 'masters_eng', 'me', 'mtech'] },  // Legacy
  'medical_bachelor': { type: 'category', categories: ['mbbs', 'bds'] },  // Legacy
  'medical_master': { type: 'category', categories: ['md', 'ms_medical'] },  // Legacy
  'engineering': { type: 'category', categories: ['undergrad_eng', 'bachelors_eng', 'masters_eng', 'undergrad_cs', 'bachelors_cs', 'masters_cs', 'bca', 'mca'] },  // Legacy
  'medical_legacy': { type: 'category', categories: ['mbbs', 'bds', 'md', 'dm_mch'] },  // Legacy
  'md': { type: 'category', categories: ['md', 'ms_medical'] },  // Legacy
}

function getEducationLevel(qualification: string | null | undefined): number {
  if (!qualification) return 0
  const normalized = qualification.toLowerCase().trim()

  // Check exact match first (for dropdown values like "bachelors_eng")
  if (EDUCATION_LEVELS[normalized] !== undefined) {
    return EDUCATION_LEVELS[normalized]
  }

  // Check partial matches
  for (const [key, level] of Object.entries(EDUCATION_LEVELS)) {
    if (key.length < 3) continue
    if (normalized.includes(key)) {
      return level
    }
  }

  return 0
}

/**
 * Check if candidate's qualification matches a specific category
 */
function matchesEducationCategory(candidateQual: string | null | undefined, categories: string[]): boolean {
  if (!candidateQual) return false
  const normalized = candidateQual.toLowerCase().trim()

  // Check if candidate qualification is in the specified categories
  for (const category of categories) {
    if (normalized === category || (category.length > 2 && normalized.includes(category))) {
      return true
    }
    // Also check if the category keywords are in the qualification
    const categoryKeywords = EDUCATION_CATEGORIES[category] || [category]
    for (const keyword of categoryKeywords) {
      if (normalized === keyword || (keyword.length > 2 && normalized.includes(keyword))) {
        return true
      }
    }
  }

  return false
}

/**
 * Known Brahmin communities and their variations
 * This list helps identify that "Iyengar" and "Niyogi" are both Brahmin communities
 */
const BRAHMIN_COMMUNITIES = [
  // General
  'brahmin', 'brahman', 'bramin',
  // South Indian
  'iyengar', 'iyer', 'iyyengar', 'aiyengar', 'aiyer',
  'smartha', 'smarta', 'madhwa', 'madhva', 'vaishnava', 'sri vaishnava',
  'niyogi', 'aruvela', 'dravida', 'vaidiki', 'namboodiri', 'namboothiri', 'nambuthiri',
  'deshastha', 'chitpavan', 'karhade', 'saraswat', 'gaud', 'gaur', 'goud',
  'havyaka', 'hoysala', 'shivalli', 'sthanika', 'koteshwara', 'kandavara',
  'hebbar', 'mandyam', 'badaganadu', 'sholayur',
  // Telugu
  'niyogi', 'aruvela niyogi', 'vaidiki', 'telaganya', 'velanadu', 'mulukanadu',
  'veginadu', 'kammanadu', 'kokanastha',
  // North Indian
  'maithil', 'tyagi', 'bhumihar', 'mohyal', 'kashmiri', 'pandit',
  'saryupareen', 'kanyakubja', 'gauda', 'utkala', 'dravida', 'karnataka',
  'jijhotia', 'sakaldwipi', 'sankethi', 'pushkarna', 'pareek', 'dadhich',
  'modh', 'shrimali', 'srimali', 'nagar', 'audichya',
  // Regional identifiers
  'telugu', 'tamil', 'kannada', 'malayali', 'marathi', 'gujarati',
  'bengali', 'oriya', 'konkani', 'tulu', 'andhra', 'karnataka'
]

/**
 * Check if a community string indicates Brahmin
 */
function isBrahmin(community: string): boolean {
  const lower = community.toLowerCase()
  return BRAHMIN_COMMUNITIES.some((bc: string) => lower.includes(bc))
}

/**
 * Intelligent community matching
 * - "Same Community only" -> Match at broad level (e.g., both Brahmins)
 * - Specific community -> Match if communities are compatible
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isCommunityMatch(seekerCommunity: string | null | undefined, seekerPref: string | null | undefined, candidateCommunity: string | null | undefined, strict: boolean = false): boolean {
  // No preference or "doesn't matter"
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }

  // No candidate community info - can't verify
  if (!candidateCommunity) {
    return true // Missing data never blocks a match
  }

  const prefList = parsePreferenceList(seekerPref)
  if (prefList.length > 1) {
    return prefList.some(pref => isCommunityMatch(seekerCommunity, pref, candidateCommunity, strict))
  }

  const prefLower = (prefList[0] ?? seekerPref).toLowerCase()
  const candidateLower = candidateCommunity.toLowerCase()

  // "Same Community only" or legacy "Same Caste only" logic
  if (prefLower.includes('same_as_mine') || prefLower.includes('same as mine') ||
      prefLower.includes('same community') || prefLower.includes('same_community') ||
      prefLower.includes('same caste') || prefLower.includes('same_caste')) {
    if (!seekerCommunity) return true // Can't compare

    const seekerLower = seekerCommunity.toLowerCase()

    // Both are Brahmins - consider them compatible at broad level
    if (isBrahmin(seekerLower) && isBrahmin(candidateLower)) {
      return true
    }

    // Check for word overlap
    const seekerWords = seekerLower.split(/[\s,\-\/]+/).filter(w => w.length > 2)
    const candidateWords = candidateLower.split(/[\s,\-\/]+/).filter(w => w.length > 2)

    const hasMatch = seekerWords.some(sw =>
      candidateWords.some(cw => sw.includes(cw) || cw.includes(sw))
    )

    return hasMatch
  }

  // Direct community comparison
  if (candidateLower.includes(prefLower) || prefLower.includes(candidateLower)) {
    return true
  }

  // Check if both are from same broad category
  if (isBrahmin(prefLower) && isBrahmin(candidateLower)) {
    return true
  }

  return false
}

/**
 * US State abbreviations and names for location matching
 */
const US_STATES = [
  'alabama', 'al', 'alaska', 'ak', 'arizona', 'az', 'arkansas', 'ar', 'california', 'ca',
  'colorado', 'co', 'connecticut', 'ct', 'delaware', 'de', 'district of columbia', 'dc', 'florida', 'fl', 'georgia', 'ga',
  'hawaii', 'hi', 'idaho', 'id', 'illinois', 'il', 'indiana', 'in', 'iowa', 'ia',
  'kansas', 'ks', 'kentucky', 'ky', 'louisiana', 'la', 'maine', 'me', 'maryland', 'md',
  'massachusetts', 'ma', 'michigan', 'mi', 'minnesota', 'mn', 'mississippi', 'ms', 'missouri', 'mo',
  'montana', 'mt', 'nebraska', 'ne', 'nevada', 'nv', 'new hampshire', 'nh', 'new jersey', 'nj',
  'new mexico', 'nm', 'new york', 'ny', 'north carolina', 'nc', 'north dakota', 'nd', 'ohio', 'oh',
  'oklahoma', 'ok', 'oregon', 'or', 'pennsylvania', 'pa', 'rhode island', 'ri', 'south carolina', 'sc',
  'south dakota', 'sd', 'tennessee', 'tn', 'texas', 'tx', 'utah', 'ut', 'vermont', 'vt',
  'virginia', 'va', 'washington', 'wa', 'west virginia', 'wv', 'wisconsin', 'wi', 'wyoming', 'wy'
]

const STATE_FULL_NAMES: Record<string, string> = {
  'al': 'alabama', 'ak': 'alaska', 'az': 'arizona', 'ar': 'arkansas', 'ca': 'california',
  'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware', 'dc': 'district of columbia', 'fl': 'florida', 'ga': 'georgia',
  'hi': 'hawaii', 'id': 'idaho', 'il': 'illinois', 'in': 'indiana', 'ia': 'iowa',
  'ks': 'kansas', 'ky': 'kentucky', 'la': 'louisiana', 'me': 'maine', 'md': 'maryland',
  'ma': 'massachusetts', 'mi': 'michigan', 'mn': 'minnesota', 'ms': 'mississippi', 'mo': 'missouri',
  'mt': 'montana', 'ne': 'nebraska', 'nv': 'nevada', 'nh': 'new hampshire', 'nj': 'new jersey',
  'nm': 'new mexico', 'ny': 'new york', 'nc': 'north carolina', 'nd': 'north dakota', 'oh': 'ohio',
  'ok': 'oklahoma', 'or': 'oregon', 'pa': 'pennsylvania', 'ri': 'rhode island', 'sc': 'south carolina',
  'sd': 'south dakota', 'tn': 'tennessee', 'tx': 'texas', 'ut': 'utah', 'vt': 'vermont',
  'va': 'virginia', 'wa': 'washington', 'wv': 'west virginia', 'wi': 'wisconsin', 'wy': 'wyoming'
}

/**
 * Check if a location indicates it's in the USA
 */
function isUSLocation(location: string): boolean {
  const loc = location.toLowerCase()

  // Direct USA indicators
  if (loc.includes('usa') || loc.includes('united states') || loc.includes('u.s.')) {
    return true
  }

  // Check for US state names or abbreviations
  const words = loc.split(/[\s,\/\-]+/)
  for (const word of words) {
    if (US_STATES.includes(word)) {
      return true
    }
  }

  return false
}

/**
 * Extract US state from location string
 */
function extractUSState(location: string): string | null {
  const loc = location.toLowerCase()
  const words = loc.split(/[\s,\/\-]+/)

  for (const word of words) {
    // Check abbreviation
    if (STATE_FULL_NAMES[word]) {
      return STATE_FULL_NAMES[word]
    }
    // Check full name
    if (US_STATES.includes(word) && word.length > 2) {
      return word
    }
  }

  return null
}

/**
 * Extract city from location string (best-effort)
 */
function extractCity(location: string | null | undefined): string | null {
  if (!location) return null
  const loc = location.toLowerCase().trim()

  // Prefer "City, State" format
  if (loc.includes(',')) {
    const city = loc.split(',')[0]?.trim()
    return city || null
  }

  return null
}

/**
 * Map dropdown preference values to state names
 */
const PREF_LOCATION_TO_STATE: Record<string, string | null> = {
  'doesnt_matter': null,
  'usa': null,  // Any US location
  'within_50_miles': null,  // NOTE: Cannot verify without geocoding - returns true (technical limitation)
  'within_100_miles': null, // NOTE: Cannot verify without geocoding - returns true (technical limitation)
  'within_200_miles': null, // NOTE: Cannot verify without geocoding - returns true (technical limitation)
  'same_city': null,        // NOTE: Would need exact city matching - returns true (technical limitation)
  'same_state': null,       // Will be handled by extracting seeker's state
  'bay_area': 'california',
  'southern_california': 'california',
  'california': 'california',
  'texas': 'texas',
  'new_york': 'new york',
  'new_jersey': 'new jersey',
  'washington': 'washington',
  'illinois': 'illinois',
  'massachusetts': 'massachusetts',
  'georgia': 'georgia',
  'virginia': 'virginia',
  'north_carolina': 'north carolina',
  'pennsylvania': 'pennsylvania',
  'florida': 'florida',
  'colorado': 'colorado',
  'arizona': 'arizona',
  'maryland': 'maryland',
  'ohio': 'ohio',
  'michigan': 'michigan',
  'minnesota': 'minnesota',
  'indiana': 'indiana',
  'missouri': 'missouri',
  'other_state': null,
  'open_to_relocation': null,
}

/**
 * Bay Area cities for matching
 */
const BAY_AREA_CITIES = [
  'san francisco', 'san jose', 'oakland', 'fremont', 'sunnyvale', 'santa clara',
  'hayward', 'berkeley', 'palo alto', 'mountain view', 'redwood city', 'milpitas',
  'pleasanton', 'livermore', 'dublin', 'union city', 'newark', 'cupertino',
  'san mateo', 'daly city', 'san leandro', 'walnut creek', 'concord', 'alameda',
  'menlo park', 'burlingame', 'foster city', 'san ramon', 'santa rosa', 'vallejo',
  'pittsburg', 'antioch', 'richmond', 'napa', 'petaluma', 'sfo'
]

/**
 * Smart location matching that handles dropdown preference values
 * STRICT: If someone specifies a state, only match that state
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isLocationMatch(
  preference: string | null | undefined,
  candidateLocation: string | null | undefined,
  seekerLocation: string | null | undefined,
  strict: boolean = false
): boolean {
  // No preference or "doesn't matter"
  if (isNoPreferenceValue(preference)) {
    return true
  }

  // No candidate location - can't verify
  if (!candidateLocation) {
    return true // Missing data never blocks a match
  }

  const prefList = parsePreferenceList(preference)
  if (prefList.length > 1) {
    return prefList.some(pref => isLocationMatch(pref, candidateLocation, seekerLocation, strict))
  }

  const prefLower = (prefList[0] ?? preference)?.toLowerCase().trim() || ''
  const candLower = candidateLocation.toLowerCase().trim()

  // Handle standard dropdown values
  if (prefLower === 'doesnt_matter' || prefLower === 'open_to_relocation' || prefLower === 'other_state') {
    return true
  }

  // Distance-based preferences - cannot verify without geocoding
  if (prefLower === 'within_50_miles' || prefLower === 'within_100_miles' || prefLower === 'within_200_miles') {
    return true
  }

  // Same city/state matching
  if (prefLower === 'same_city') {
    const seekerCity = extractCity(seekerLocation)
    const candCity = extractCity(candidateLocation)
    if (!seekerCity || !candCity) return true
    return seekerCity === candCity
  }

  if (prefLower === 'same_state') {
    const seekerState = seekerLocation ? extractUSState(seekerLocation) : null
    const candState = extractUSState(candidateLocation)
    if (!seekerState || !candState) return false  // Reject if state cannot be determined
    return seekerState === candState
  }

  // Multi-state regions
  if (prefLower === 'tri_state') {
    const candState = extractUSState(candidateLocation)
    if (!candState) return false  // Reject if state cannot be determined
    return ['new york', 'new jersey', 'connecticut'].includes(candState)
  }

  if (prefLower === 'dmv_area') {
    const candState = extractUSState(candidateLocation)
    if (!candState) return false  // Reject if state cannot be determined
    return ['district of columbia', 'maryland', 'virginia'].includes(candState)
  }

  // USA - any US location
  if (prefLower === 'usa') {
    return isUSLocation(candidateLocation)
  }

  // Bay Area - check for Bay Area cities ONLY (STRICT)
  if (prefLower === 'bay_area') {
    const candState = extractUSState(candidateLocation)
    if (candState !== 'california') return false
    // Check if it's specifically in Bay Area - STRICT matching
    for (const city of BAY_AREA_CITIES) {
      if (candLower.includes(city)) return true
    }
    // Only allow if explicitly mentions Bay Area
    if (candLower.includes('bay area')) return true
    // STRICT: Don't assume all California is Bay Area
    return false
  }

  // Southern California
  if (prefLower === 'southern_california') {
    const candState = extractUSState(candidateLocation)
    if (candState !== 'california') return false
    const socalCities = ['los angeles', 'san diego', 'la', 'orange county', 'irvine', 'anaheim', 'long beach', 'pasadena', 'riverside', 'san bernardino']
    for (const city of socalCities) {
      if (candLower.includes(city)) return true
    }
    return false
  }

  // Check if preference is a standard state dropdown value
  const prefState = PREF_LOCATION_TO_STATE[prefLower]
  if (prefState !== undefined) {
    if (prefState === null) return true  // doesnt_matter, usa, etc already handled above
    const candState = extractUSState(candidateLocation)
    if (!candState) return false  // Reject if state cannot be determined
    return candState === prefState
  }

  // Legacy: Handle "prefer X" or "preferred X" format - extract the actual location
  let actualPref = prefLower
  if (prefLower.startsWith('prefer ')) {
    actualPref = prefLower.replace(/^prefer\s+/i, '').trim()
  } else if (prefLower.includes('preferred') || prefLower.includes('ideal')) {
    actualPref = prefLower.replace(/would be ideal|is ideal|preferred|ideally|prefer/gi, '').trim()
  }

  // If preference is "usa", "us", or "united states", check if candidate is in US
  if (actualPref === 'usa' || actualPref === 'us' || actualPref === 'united states') {
    return isUSLocation(candidateLocation)
  }

  // Extract states from both preference and candidate location
  const extractedPrefState = extractUSState(actualPref)
  const candState = extractUSState(candidateLocation)

  // If preference specifies a state, candidate MUST be in that state
  if (extractedPrefState) {
    return candState === extractedPrefState
  }

  // Direct substring match for non-state preferences (cities, regions, etc.)
  if (candLower.includes(actualPref) || actualPref.includes(candLower)) {
    return true
  }

  // Check for common area names like "Bay Area"
  if (actualPref.includes('bay area') || actualPref.includes('bay_area')) {
    return candLower.includes('bay area') || candLower.includes('california') || candLower.includes('ca')
  }

  return false
}

/**
 * Check if diet preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isDietMatch(seekerPref: string | null | undefined, candidateDiet: string | null | undefined, strict: boolean = false): boolean {
  // No preference
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }

  // No candidate diet info
  if (!candidateDiet) {
    return true // Missing data never blocks a match
  }

  const normalizeDiet = (diet: string) => diet.toLowerCase().replace(/[_\s-]/g, '')

  const dietType = (diet: string): 'veg' | 'egg' | 'nonveg' | 'unknown' => {
    const d = normalizeDiet(diet)
    if (d.includes('nonveg') || d.includes('nonvegetarian') || d.includes('meat') || d.includes('occasionally')) {
      return 'nonveg'
    }
    if (d.includes('egg')) return 'egg'
    if (d.includes('vegetarian') || d.includes('vegan') || d.includes('jain') || d.includes('veg')) {
      return 'veg'
    }
    return 'unknown'
  }

  const seekerDietType = dietType(seekerPref || '')
  const candidateDietType = dietType(candidateDiet || '')

  // Match logic
  if (seekerDietType === 'veg') {
    // Vegetarian-only: exclude egg and non-veg
    return candidateDietType === 'veg'
  }
  if (seekerDietType === 'egg') {
    // Veg/Eggetarian: allow veg + egg, exclude non-veg
    return candidateDietType === 'veg' || candidateDietType === 'egg'
  }
  if (seekerDietType === 'nonveg') {
    // Non-veg OK: matches anyone
    return true
  }

  // Fallback direct match
  const seekerDiet = normalizeDiet(seekerPref || '')
  const candDiet = normalizeDiet(candidateDiet || '')
  return seekerDiet === candDiet || seekerDiet.includes(candDiet) || candDiet.includes(seekerDiet)
}

/**
 * Check if gotra requirement is met
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isGotraMatch(seekerGotra: string | null | undefined, seekerPref: string | null | undefined, candidateGotra: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }

  const prefLower = seekerPref.toLowerCase()

  // "Different Gotra" requirement
  if (prefLower.includes('different') || prefLower.includes('not ')) {
    if (!seekerGotra || !candidateGotra) return true // Missing data never blocks a match
    return seekerGotra.toLowerCase() !== candidateGotra.toLowerCase()
  }

  // Same gotra requirement
  if (prefLower.includes('same')) {
    if (!seekerGotra || !candidateGotra) return true
    return seekerGotra.toLowerCase() === candidateGotra.toLowerCase()
  }

  return true
}

/**
 * Check if education requirement is met
 * Supports both level-based (e.g., "Bachelor's or higher") and category-based (e.g., "Medical Professional") matching
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isEducationMatch(seekerPref: string | null | undefined, candidateQual: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }

  // Get preference configuration
  const prefNormalized = seekerPref.toLowerCase().trim()
  const prefConfig = PREF_EDUCATION_CONFIG[prefNormalized]

  if (prefConfig) {
    // Use configured matching rules
    if (prefConfig.type === 'any') {
      return true
    }

    if (prefConfig.type === 'level' && prefConfig.minLevel !== undefined) {
      // Level-based matching: candidate level must be >= minimum
      const candidateLevel = getEducationLevel(candidateQual)
      if (candidateLevel === 0) return true // Missing data never blocks a match
      return candidateLevel >= prefConfig.minLevel
    }

    if (prefConfig.type === 'category' && prefConfig.categories) {
      // Category-based matching: candidate must be in specific categories
      if (!candidateQual) return true
      return matchesEducationCategory(candidateQual, prefConfig.categories)
    }
  }

  // Fallback to legacy level-based matching
  const seekerMinLevel = getEducationLevel(seekerPref)
  const candidateLevel = getEducationLevel(candidateQual)

  // If we can't determine levels, allow the match
  if (seekerMinLevel === 0 || candidateLevel === 0) {
    return true
  }

  return candidateLevel >= seekerMinLevel
}

/**
 * Check if a deal-breaker flag is set
 */
function isDealbreaker(flag: boolean | string | undefined): boolean {
  return flag === true || flag === 'true'
}

function parsePreferenceList(pref: string | null | undefined): string[] {
  if (!pref) return []
  const trimmed = pref.trim()
  if (!trimmed) return []

  let values: string[] = []

  // Handle JSON array stored as string
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        values = parsed.map(v => String(v))
      }
    } catch {
      // Fall back to comma-separated parsing
    }
  }

  if (values.length === 0) {
    values = trimmed.split(',')
  }

  const normalized = values.map(v => v.trim()).filter(v => v).map(v => v.toLowerCase())

  // Treat "doesn't matter" in list as no preference
  if (normalized.some(v => isNoPreferenceValue(v))) return []

  return normalized
}

function parseFreeTextList(value: string | null | undefined): string[] {
  if (!value) return []
  return parsePreferenceList(value)
}

function hasListOverlap(listA: string[], listB: string[]): boolean {
  return listA.some(item =>
    listB.some(other => other.includes(item) || item.includes(other))
  )
}

function parseHeightToInches(height: string | null | undefined): number | null {
  if (!height) return null
  const normalized = height.toLowerCase().trim()
  if (!normalized) return null

  // Handle centimeters (e.g., "170 cm")
  const cmMatch = normalized.match(/^(\d{2,3})\s*cm$/)
  if (cmMatch) {
    const cm = parseInt(cmMatch[1], 10)
    if (!Number.isNaN(cm)) {
      return Math.round(cm / 2.54)
    }
  }

  // Handle feet/inches formats (e.g., 5'10", 5'10, 5 ft 10)
  const match = normalized.match(/(\d+)\s*['′]?\s*(\d+)?/)
  if (!match) return null
  const feet = parseInt(match[1], 10)
  const inches = parseInt(match[2] || '0', 10)
  if (Number.isNaN(feet) || Number.isNaN(inches)) return null
  return feet * 12 + inches
}

function isHeightMatch(
  prefMin: string | null | undefined,
  prefMax: string | null | undefined,
  prefExact: string | null | undefined,
  candidateHeight: string | null | undefined,
  strict: boolean = false
): boolean {
  const hasMin = isPrefSet(prefMin)
  const hasMax = isPrefSet(prefMax)
  const hasExact = isPrefSet(prefExact)

  if (!hasMin && !hasMax && !hasExact) return true

  const candidateInches = parseHeightToInches(candidateHeight)
  if (candidateInches === null) return true

  let minInches: number | null = null
  let maxInches: number | null = null

  if (hasMin) {
    const parsedMin = parseHeightToInches(prefMin)
    if (parsedMin !== null) minInches = parsedMin
  }
  if (hasMax) {
    const parsedMax = parseHeightToInches(prefMax)
    if (parsedMax !== null) maxInches = parsedMax
  }

  if (!hasMin && !hasMax && hasExact) {
    const parsedExact = parseHeightToInches(prefExact)
    if (parsedExact === null) return true
    const prefLower = prefExact?.toLowerCase() || ''
    if (prefLower.includes('above') || prefLower.includes('+')) {
      minInches = parsedExact
    } else if (prefLower.includes('below')) {
      maxInches = parsedExact
    } else {
      minInches = parsedExact
      maxInches = parsedExact
    }
  }

  if (minInches !== null && candidateInches < minInches) return false
  if (maxInches !== null && candidateInches > maxInches) return false

  return true
}

/**
 * Check if smoking preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isSmokingMatch(seekerPref: string | null | undefined, candidateSmoking: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateSmoking) return true // Missing data never blocks a match

  const pref = seekerPref.toLowerCase()
  const cand = candidateSmoking.toLowerCase()

  const isNonSmoker = cand === 'no' || cand === 'never' || cand === 'non_smoker' || cand === 'non-smoker'
  const isRegularSmoker = cand === 'yes' || cand === 'regular' || cand === 'regularly'

  // "no" or "never" - only match non-smokers
  if (pref === 'no' || pref === 'never' || pref === 'non_smoker') {
    return isNonSmoker
  }

  // "occasionally_ok" / "social" - match non-smokers or occasional/social smokers
  if (pref.includes('occasion') || pref.includes('social')) {
    return !isRegularSmoker
  }

  return true // Any other preference matches anyone
}

/**
 * Check if drinking preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isDrinkingMatch(seekerPref: string | null | undefined, candidateDrinking: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateDrinking) return true // Missing data never blocks a match

  const pref = seekerPref.toLowerCase()
  const cand = candidateDrinking.toLowerCase()

  const isNonDrinker = cand === 'no' || cand === 'never' || cand === 'non_drinker' || cand === 'non-drinker'
  const isRegularDrinker = cand === 'yes' || cand === 'regular' || cand === 'regularly'

  // "no" or "never" - only match non-drinkers
  if (pref === 'no' || pref === 'never' || pref === 'non_drinker') {
    return isNonDrinker
  }

  // "social_ok" / "occasionally" - match non-drinkers or social/occasional drinkers
  if (pref.includes('occasion') || pref.includes('social')) {
    return !isRegularDrinker
  }

  return true // Any other preference matches anyone
}

/**
 * Check if marital status preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isMaritalStatusMatch(seekerPref: string | null | undefined, candidateMaritalStatus: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateMaritalStatus) return true // Missing data never blocks a match

  const pref = seekerPref.toLowerCase()

  // Check if "any" or "doesnt_matter" is in the preference list
  if (pref.includes('doesnt_matter') || pref.includes('any')) {
    return true
  }

  const candStatus = candidateMaritalStatus.toLowerCase().trim().replace(/\s+/g, '_')

  // Normalize marital status values - map equivalent terms to canonical forms
  const normalizeMaritalStatus = (status: string): string => {
    const s = status.toLowerCase().trim().replace(/\s+/g, '_')
    // Single = never_married (most common equivalence)
    if (s === 'single' || s === 'unmarried' || s === 'bachelor' || s === 'spinster') {
      return 'never_married'
    }
    // Divorced variations
    if (s === 'divorcee' || s === 'divorced_person') {
      return 'divorced'
    }
    // Widowed variations
    if (s === 'widow' || s === 'widower') {
      return 'widowed'
    }
    return s
  }

  const normalizedCandStatus = normalizeMaritalStatus(candStatus)

  // Preference could be comma-separated list like "never_married, divorced"
  const acceptedStatuses = pref.split(',').map(s => normalizeMaritalStatus(s.trim()))

  return acceptedStatuses.some(status =>
    normalizedCandStatus === status ||
    normalizedCandStatus.includes(status) ||
    status.includes(normalizedCandStatus)
  )
}

/**
 * Check if partner's children preferences match
 * Preferences: doesnt_matter, no_children, ok_not_living, ok_living, ok_any
 * Candidate values: no, yes_living_with_me, yes_not_living_with_me
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isHasChildrenMatch(seekerPref: string | null | undefined, candidateHasChildren: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateHasChildren) return true // Missing data never blocks a match

  const pref = seekerPref.toLowerCase()
  const cand = candidateHasChildren.toLowerCase()
  const hasNoChildren = cand === 'no' || cand === 'none' || cand === 'no_children'
  const hasNotLiving = cand.includes('not_living')
  const hasLiving = cand.includes('living') && !hasNotLiving

  // no_children - candidate must not have children
  if (pref === 'no_children') {
    return hasNoChildren
  }

  // ok_not_living - OK if no children OR children not living with them
  if (pref === 'ok_not_living') {
    return hasNoChildren || hasNotLiving
  }

  // ok_living - OK if no children OR children living with them
  if (pref === 'ok_living') {
    return hasNoChildren || hasLiving
  }

  // ok_any - OK with any situation (has children or not)
  if (pref === 'ok_any') {
    return true
  }

  return true // Default: accept
}

/**
 * Check if family values preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isFamilyValuesMatch(seekerPref: string | null | undefined, seekerFamilyValues: string | null | undefined, candidateFamilyValues: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateFamilyValues) return true // Missing data never blocks a match

  const pref = seekerPref.toLowerCase()
  const cand = candidateFamilyValues.toLowerCase()

  // "same_as_mine" - match if same as seeker's family values
  if (pref === 'same_as_mine' || pref === 'same as mine') {
    if (!seekerFamilyValues) return true
    return seekerFamilyValues.toLowerCase() === cand
  }

  // Direct match (traditional, moderate, liberal)
  return pref === cand
}

/**
 * Check if family location preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isFamilyLocationMatch(seekerPref: string | null | undefined, seekerFamilyLocation: string | null | undefined, candidateFamilyLocation: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateFamilyLocation) return true // Missing data never blocks a match

  const pref = seekerPref.toLowerCase()
  const cand = candidateFamilyLocation.toLowerCase()

  // "same_as_mine" / "same_country" - match if similar location
  if (pref === 'same_as_mine' || pref === 'same as mine' || pref === 'same_country' || pref === 'same country') {
    if (!seekerFamilyLocation) return true
    // Check for overlap in location strings
    const seekerLoc = seekerFamilyLocation.toLowerCase()
    return cand.includes(seekerLoc) || seekerLoc.includes(cand) ||
           extractUSState(cand) === extractUSState(seekerLoc)
  }

  // Country-based matching (USA, India, UK, Canada)
  if (pref === 'usa') {
    return isUSLocation(candidateFamilyLocation)
  }

  return cand.includes(pref) || pref.includes(cand)
}

/**
 * Check if mother tongue preferences match
 * Handles multiple languages (comma-separated list) and "Other" with custom text
 * @param seekerPrefList - comma-separated list of preferred languages or single language
 * @param seekerPrefOther - custom text when "Other" is selected in preferences
 * @param seekerMotherTongue - seeker's own mother tongue (for "same_as_mine")
 * @param seekerMotherTongueOther - seeker's custom mother tongue if "Other"
 * @param candidateMotherTongue - candidate's mother tongue
 * @param candidateMotherTongueOther - candidate's custom mother tongue if "Other"
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isMotherTongueMatch(
  seekerPrefList: string | null | undefined,
  seekerPrefOther: string | null | undefined,
  seekerMotherTongue: string | null | undefined,
  seekerMotherTongueOther: string | null | undefined,
  candidateMotherTongue: string | null | undefined,
  candidateMotherTongueOther: string | null | undefined,
  strict: boolean = false
): boolean {
  if (isNoPreferenceValue(seekerPrefList)) {
    return true
  }
  if (!candidateMotherTongue) return true // Missing data never blocks a match

  // Parse the preference list (comma-separated or JSON)
  const prefList = parsePreferenceList(seekerPrefList)
  const candidateLang = candidateMotherTongue.toLowerCase()
  const candidateOtherLang = candidateMotherTongueOther?.toLowerCase() || ''

  // Check each preferred language
  for (const pref of prefList) {
    // "same_as_mine" - match if same mother tongue
    if (pref === 'same_as_mine' || pref === 'same as mine') {
      if (!seekerMotherTongue) continue
      const seekerLang = seekerMotherTongue.toLowerCase()
      const seekerOtherLang = seekerMotherTongueOther?.toLowerCase() || ''

      // If both are "Other", compare the custom text intelligently
      if (seekerLang === 'other' && candidateLang === 'other') {
        if (intelligentTextMatch(seekerOtherLang, candidateOtherLang)) return true
      }
      // If seeker is "Other", check if candidate matches the custom text
      else if (seekerLang === 'other') {
        if (intelligentTextMatch(seekerOtherLang, candidateLang)) return true
      }
      // If candidate is "Other", check if seeker matches the custom text
      else if (candidateLang === 'other') {
        if (intelligentTextMatch(seekerLang, candidateOtherLang)) return true
      }
      // Direct match
      else if (seekerLang === candidateLang) return true
    }
    // "Other" in preferences - use custom text for matching
    else if (pref === 'other') {
      if (seekerPrefOther) {
        // If candidate is also "Other", compare custom texts
        if (candidateLang === 'other') {
          if (intelligentTextMatch(seekerPrefOther.toLowerCase(), candidateOtherLang)) return true
        }
        // Otherwise, check if candidate's language matches the custom text
        else {
          if (intelligentTextMatch(seekerPrefOther.toLowerCase(), candidateLang)) return true
        }
      }
    }
    // Direct match
    else if (pref === candidateLang) return true
    // If candidate is "Other", check if their custom text matches the preference
    else if (candidateLang === 'other' && candidateOtherLang) {
      if (intelligentTextMatch(pref, candidateOtherLang)) return true
    }
  }

  return false
}

/**
 * Intelligent text matching for languages
 * Handles partial matches, common abbreviations, and variations
 */
function intelligentTextMatch(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false

  const t1 = text1.toLowerCase().trim()
  const t2 = text2.toLowerCase().trim()

  // Exact match
  if (t1 === t2) return true

  // One contains the other
  if (t1.includes(t2) || t2.includes(t1)) return true

  // Split by common delimiters and check for any word match
  const words1 = t1.split(/[\s,\/\-]+/).filter(w => w.length > 2)
  const words2 = t2.split(/[\s,\/\-]+/).filter(w => w.length > 2)

  for (const w1 of words1) {
    for (const w2 of words2) {
      // Word match or one starts with the other
      if (w1 === w2 || w1.startsWith(w2) || w2.startsWith(w1)) return true
    }
  }

  return false
}

/**
 * Check if income preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isIncomeMatch(seekerPref: string | null | undefined, candidateIncome: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateIncome) return true // Missing data never blocks a match

  // Map income ranges to numeric values for comparison
  const incomeToValue: Record<string, number> = {
    'student': 0,
    'homemaker': 0,
    '<50k': 25,
    '50k-75k': 62,
    '75k-100k': 87,
    '100k-150k': 125,
    '150k-200k': 175,
    '>200k': 250,
  }

  const prefToMinValue: Record<string, number> = {
    '50k+': 50,
    '75k+': 75,
    '100k+': 100,
    '150k+': 150,
    '200k+': 200,
  }

  const candValue = incomeToValue[candidateIncome.toLowerCase()] ?? 0
  const minRequired = prefToMinValue[seekerPref.toLowerCase()] ?? 0

  return candValue >= minRequired
}

/**
 * Check if sub-community preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isSubCommunityMatch(seekerPref: string | null | undefined, seekerSubCommunity: string | null | undefined, candidateSubCommunity: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateSubCommunity) return true // Missing data never blocks a match

  const prefList = parsePreferenceList(seekerPref)
  const prefLower = (prefList[0] ?? seekerPref).toLowerCase()
  const wantsSameAsMine = prefLower === 'same_as_mine' || prefLower === 'same as mine' || prefList.includes('same_as_mine') || prefList.includes('same as mine')

  // "same_as_mine" - match if same sub-community
  if (wantsSameAsMine) {
    if (!seekerSubCommunity) return true
    if (seekerSubCommunity.toLowerCase() === candidateSubCommunity.toLowerCase()) return true
  }

  // If specific sub-communities are listed, match any
  if (prefList.length > 0) {
    const candidateLower = candidateSubCommunity.toLowerCase()
    return prefList.some(pref => candidateLower === pref || candidateLower.includes(pref) || pref.includes(candidateLower))
  }

  return true
}

/**
 * Check if religion preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isReligionMatch(seekerPref: string | null | undefined, candidateReligion: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateReligion) return true

  const pref = seekerPref.toLowerCase()
  const cand = candidateReligion.toLowerCase()

  return pref === cand || pref.includes(cand) || cand.includes(pref)
}

/**
 * Check if citizenship preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isCitizenshipMatch(seekerPref: string | null | undefined, seekerCitizenship: string | null | undefined, candidateCitizenship: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateCitizenship) return true

  const pref = seekerPref.toLowerCase()
  const cand = candidateCitizenship.toLowerCase()

  // "same_as_mine" - match if same citizenship
  if (pref === 'same_as_mine' || pref === 'same as mine') {
    if (!seekerCitizenship) return true
    return seekerCitizenship.toLowerCase() === cand
  }

  return pref === cand || pref.includes(cand) || cand.includes(pref)
}

/**
 * Check if grew up in preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isGrewUpInMatch(seekerPref: string | null | undefined, seekerGrewUpIn: string | null | undefined, candidateGrewUpIn: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateGrewUpIn) return true

  const pref = seekerPref.toLowerCase()
  const cand = candidateGrewUpIn.toLowerCase()

  // "same_as_mine" - match if same grew up location
  if (pref === 'same_as_mine' || pref === 'same as mine') {
    if (!seekerGrewUpIn) return true
    return seekerGrewUpIn.toLowerCase() === cand
  }

  return pref === cand || pref.includes(cand) || cand.includes(pref)
}

/**
 * Check if relocation preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isRelocationMatch(seekerPref: string | null | undefined, candidateRelocation: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateRelocation) return true

  const pref = seekerPref.toLowerCase()
  const cand = candidateRelocation.toLowerCase()

  // "yes" pref - candidate must be open to relocation
  if (pref === 'yes' || pref === 'open' || pref === 'willing') {
    return cand === 'yes' || cand === 'open' || cand.includes('yes') || cand === 'depends'
  }

  // "no" pref - candidate should not be open to relocation
  if (pref === 'no' || pref === 'not_required' || pref === 'not required') {
    return cand === 'no' || cand.includes('no')
  }

  return true
}

/**
 * Check if pets preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isPetsMatch(seekerPref: string | null | undefined, candidatePets: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidatePets) return true

  const pref = seekerPref.toLowerCase()
  const cand = candidatePets.toLowerCase()

  const lovesPets = cand === 'have_love' || cand === 'no_but_love'
  const openToPets = lovesPets || cand === 'no_but_open'
  const prefersNoPets = cand === 'prefer_not' || cand === 'allergic'

  // "no_pets" - candidate must prefer not to have pets
  if (pref === 'no_pets' || pref === 'no pets' || pref === 'no') {
    return prefersNoPets
  }

  // "must_love" or "love_pets" - candidate should love pets
  if (pref === 'must_love' || pref === 'love_pets' || pref === 'has_pets') {
    return lovesPets
  }

  // "open_to_pets" - candidate should be open to pets
  if (pref === 'open_to_pets' || pref === 'open to pets') {
    return openToPets
  }

  return true
}

/**
 * Check if hobbies preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isHobbiesMatch(seekerPref: string | null | undefined, seekerHobbies: string | null | undefined, candidateHobbies: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateHobbies) return true

  const prefList = parsePreferenceList(seekerPref)
  if (prefList.length === 0) return true

  const candidateList = parseFreeTextList(candidateHobbies)
  if (candidateList.length === 0) return true

  const wantsSameAsMine = prefList.some(pref => pref === 'same_as_mine' || pref === 'same as mine')
  const cleanedPrefList = prefList.filter(pref => pref !== 'same_as_mine' && pref !== 'same as mine' && pref !== 'specific')

  if (wantsSameAsMine) {
    const seekerList = parseFreeTextList(seekerHobbies)
    if (seekerList.length === 0) return true
    if (hasListOverlap(seekerList, candidateList)) return true
    if (cleanedPrefList.length === 0) return false
  }

  if (cleanedPrefList.length === 0) return true
  return hasListOverlap(cleanedPrefList, candidateList)
}

/**
 * Check if fitness preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isFitnessMatch(seekerPref: string | null | undefined, seekerFitness: string | null | undefined, candidateFitness: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateFitness) return true

  const prefList = parsePreferenceList(seekerPref)
  if (prefList.length === 0) return true

  const candidateList = parseFreeTextList(candidateFitness)
  if (candidateList.length === 0) return true

  const wantsSameAsMine = prefList.some(pref => pref === 'same_as_mine' || pref === 'same as mine')
  const cleanedPrefList = prefList.filter(pref => pref !== 'same_as_mine' && pref !== 'same as mine' && pref !== 'specific')

  if (wantsSameAsMine) {
    const seekerList = parseFreeTextList(seekerFitness)
    if (seekerList.length === 0) return true
    if (hasListOverlap(seekerList, candidateList)) return true
    if (cleanedPrefList.length === 0) return false
  }

  if (cleanedPrefList.length === 0) return true
  return hasListOverlap(cleanedPrefList, candidateList)
}

/**
 * Check if interests preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isInterestsMatch(seekerPref: string | null | undefined, seekerInterests: string | null | undefined, candidateInterests: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateInterests) return true

  const prefList = parsePreferenceList(seekerPref)
  if (prefList.length === 0) return true

  const candidateList = parseFreeTextList(candidateInterests)
  if (candidateList.length === 0) return true

  const wantsSameAsMine = prefList.some(pref => pref === 'same_as_mine' || pref === 'same as mine')
  const cleanedPrefList = prefList.filter(pref => pref !== 'same_as_mine' && pref !== 'same as mine' && pref !== 'specific')

  if (wantsSameAsMine) {
    const seekerList = parseFreeTextList(seekerInterests)
    if (seekerList.length === 0) return true
    if (hasListOverlap(seekerList, candidateList)) return true
    if (cleanedPrefList.length === 0) return false
  }

  if (cleanedPrefList.length === 0) return true
  return hasListOverlap(cleanedPrefList, candidateList)
}

/**
 * Check if occupation preferences match
 * @param strict - if true, enforce preference when data is present (missing data never blocks)
 */
function isOccupationMatch(seekerPref: string | null | undefined, candidateOccupation: string | null | undefined, strict: boolean = false): boolean {
  if (isNoPreferenceValue(seekerPref) || !seekerPref) {
    return true
  }
  if (!candidateOccupation) return true

  const prefList = parsePreferenceList(seekerPref)
  if (prefList.length === 0) return true

  const candidateLower = candidateOccupation.toLowerCase()
  return prefList.some(pref => candidateLower === pref || candidateLower.includes(pref) || pref.includes(candidateLower))
}

/**
 * Check if a candidate matches the seeker's preferences
 * Uses deal-breaker flags to determine hard filters vs soft preferences
 * Returns true if candidate passes all deal-breaker criteria
 */
export function matchesSeekerPreferences(
  seeker: ProfileForMatching,
  candidate: ProfileForMatching
): boolean {
  // 1. Gender check (required) - Must be opposite gender
  if (seeker.gender === candidate.gender) return false

  // Get ages for comparison
  const seekerAge = calculateAgeFromDOB(seeker.dateOfBirth)
  const candidateAge = calculateAgeFromDOB(candidate.dateOfBirth)

  // 2. Age check - use prefAgeMin/Max if available, otherwise legacy prefAgeDiff
  // STRICT: No buffer - respect exact user preferences
  const hasAgePref = isPrefSet(seeker.prefAgeMin) || isPrefSet(seeker.prefAgeMax) || isPrefSet(seeker.prefAgeDiff)
  if (hasAgePref) {
    let ageMatches = true

    if (candidateAge !== null) {
      // Use min/max if set - exact matching, no buffer
      if (isPrefSet(seeker.prefAgeMin)) {
        const minAge = parseInt(seeker.prefAgeMin || '18')
        if (candidateAge < minAge) ageMatches = false
      }
      if (isPrefSet(seeker.prefAgeMax)) {
        const maxAge = parseInt(seeker.prefAgeMax || '99')
        if (candidateAge > maxAge) ageMatches = false
      }
      // Legacy support
      if (!isPrefSet(seeker.prefAgeMin) && !isPrefSet(seeker.prefAgeMax) && isPrefSet(seeker.prefAgeDiff)) {
        const ageRange = parseAgePreference(seeker.prefAgeDiff, seekerAge)
        if (ageRange && (candidateAge < ageRange.min || candidateAge > ageRange.max)) {
          ageMatches = false
        }
      }
    }

    // If deal-breaker and doesn't match, reject
    if (!ageMatches && isDealbreaker(seeker.prefAgeIsDealbreaker)) {
      return false
    }
  }

  // 2.5. Height check
  const hasHeightPref = isPrefSet(seeker.prefHeightMin) || isPrefSet(seeker.prefHeightMax) || isPrefSet(seeker.prefHeight)
  if (hasHeightPref) {
    const matches = isHeightMatch(seeker.prefHeightMin, seeker.prefHeightMax, seeker.prefHeight, candidate.height, false)
    if (!matches && isDealbreaker(seeker.prefHeightIsDealbreaker)) {
      return false
    }
  }

  // 3. Marital Status check
  if (isPrefSet(seeker.prefMaritalStatus)) {
    const matches = isMaritalStatusMatch(seeker.prefMaritalStatus, candidate.maritalStatus, false)
    if (!matches && isDealbreaker(seeker.prefMaritalStatusIsDealbreaker)) {
      return false
    }
  }

  // 3.5. Has Children check
  if (isPrefSet(seeker.prefHasChildren)) {
    let candidateHasChildren = candidate.hasChildren
    if (candidate.maritalStatus === 'never_married' && !candidateHasChildren) {
      candidateHasChildren = 'no'
    }
    const matches = isHasChildrenMatch(seeker.prefHasChildren, candidateHasChildren, false)
    if (!matches && isDealbreaker(seeker.prefHasChildrenIsDealbreaker)) {
      return false
    }
  }

  // 4. Diet check
  if (isPrefSet(seeker.prefDiet)) {
    const matches = isDietMatch(seeker.prefDiet, candidate.dietaryPreference, false)
    if (!matches && isDealbreaker(seeker.prefDietIsDealbreaker)) {
      return false
    }
  }

  // 5. Smoking check
  if (isPrefSet(seeker.prefSmoking)) {
    const matches = isSmokingMatch(seeker.prefSmoking, candidate.smoking, false)
    if (!matches && isDealbreaker(seeker.prefSmokingIsDealbreaker)) {
      return false
    }
  }

  // 6. Drinking check
  if (isPrefSet(seeker.prefDrinking)) {
    const matches = isDrinkingMatch(seeker.prefDrinking, candidate.drinking, false)
    if (!matches && isDealbreaker(seeker.prefDrinkingIsDealbreaker)) {
      return false
    }
  }

  // 7. Religion check
  if (isPrefSet(seeker.prefReligion)) {
    const matches = isReligionMatch(seeker.prefReligion, candidate.religion, false)
    if (!matches && isDealbreaker(seeker.prefReligionIsDealbreaker)) {
      return false
    }
  }

  // 8. Community check (community + caste fallback)
  const communityPref = seeker.prefCommunity || seeker.prefCaste
  const seekerCommunity = seeker.community || seeker.caste
  const candidateCommunity = candidate.community || candidate.caste
  if (isPrefSet(communityPref)) {
    const matches = isCommunityMatch(seekerCommunity, communityPref, candidateCommunity, false)
    if (!matches && isDealbreaker(seeker.prefCommunityIsDealbreaker)) {
      return false
    }
  }

  // 9. Gotra check (always a deal-breaker if "different" is specified)
  if (isPrefSet(seeker.prefGotra)) {
    const matches = isGotraMatch(seeker.gotra, seeker.prefGotra, candidate.gotra, false)
    if (!matches) {
      return false
    }
  }

  // 10. Location check
  const locationPref = seeker.prefLocationList || seeker.prefLocation
  if (isPrefSet(locationPref)) {
    const matches = isLocationMatch(locationPref, candidate.currentLocation, seeker.currentLocation, false)
    if (!matches && isDealbreaker(seeker.prefLocationIsDealbreaker)) {
      return false
    }
  }

  // 11. Education check
  if (isPrefSet(seeker.prefQualification)) {
    const matches = isEducationMatch(seeker.prefQualification, candidate.qualification, false)
    if (!matches && isDealbreaker(seeker.prefEducationIsDealbreaker)) {
      return false
    }
  }

  // 12. Income check
  if (isPrefSet(seeker.prefIncome)) {
    const matches = isIncomeMatch(seeker.prefIncome, candidate.annualIncome, false)
    if (!matches && isDealbreaker(seeker.prefIncomeIsDealbreaker)) {
      return false
    }
  }

  // 12.5. Occupation check
  const occupationPref = seeker.prefOccupationList || seeker.prefOccupation
  if (isPrefSet(occupationPref)) {
    const matches = isOccupationMatch(occupationPref, candidate.occupation, false)
    if (!matches && isDealbreaker(seeker.prefOccupationIsDealbreaker)) {
      return false
    }
  }

  // 13. Family Values check
  if (isPrefSet(seeker.prefFamilyValues)) {
    const matches = isFamilyValuesMatch(seeker.prefFamilyValues, seeker.familyValues, candidate.familyValues, false)
    if (!matches && isDealbreaker(seeker.prefFamilyValuesIsDealbreaker)) {
      return false
    }
  }

  // 14. Family Location check
  const familyLocationPref = seeker.prefFamilyLocationCountry || seeker.prefFamilyLocation
  if (isPrefSet(familyLocationPref)) {
    const matches = isFamilyLocationMatch(familyLocationPref, seeker.familyLocation, candidate.familyLocation, false)
    if (!matches && (isDealbreaker(seeker.prefFamilyLocationIsDealbreaker) || isDealbreaker(seeker.prefFamilyLocationCountryIsDealbreaker))) {
      return false
    }
  }

  // 15. Mother Tongue check
  if (isPrefSet(seeker.prefMotherTongue) || isPrefSet(seeker.prefMotherTongueList)) {
    const prefList = seeker.prefMotherTongueList || seeker.prefMotherTongue
    const matches = isMotherTongueMatch(
      prefList,
      seeker.prefMotherTongueOther,
      seeker.motherTongue,
      seeker.motherTongueOther,
      candidate.motherTongue,
      candidate.motherTongueOther,
      false
    )
    if (!matches && isDealbreaker(seeker.prefMotherTongueIsDealbreaker)) {
      return false
    }
  }

  // 16. Sub-Community check
  const subCommunityPref = seeker.prefSubCommunityList || seeker.prefSubCommunity
  if (isPrefSet(subCommunityPref)) {
    const matches = isSubCommunityMatch(subCommunityPref, seeker.subCommunity, candidate.subCommunity, false)
    if (!matches && isDealbreaker(seeker.prefSubCommunityIsDealbreaker)) {
      return false
    }
  }

  // 17. Citizenship check
  if (isPrefSet(seeker.prefCitizenship)) {
    const matches = isCitizenshipMatch(seeker.prefCitizenship, seeker.citizenship, candidate.citizenship, false)
    if (!matches && isDealbreaker(seeker.prefCitizenshipIsDealbreaker)) {
      return false
    }
  }

  // 18. Grew Up In check
  if (isPrefSet(seeker.prefGrewUpIn)) {
    const seekerGrewUpIn = seeker.grewUpIn || seeker.country
    const matches = isGrewUpInMatch(seeker.prefGrewUpIn, seekerGrewUpIn, candidate.grewUpIn, false)
    if (!matches && isDealbreaker(seeker.prefGrewUpInIsDealbreaker)) {
      return false
    }
  }

  // 19. Relocation check
  if (isPrefSet(seeker.prefRelocation)) {
    const matches = isRelocationMatch(seeker.prefRelocation, candidate.openToRelocation, false)
    if (!matches && isDealbreaker(seeker.prefRelocationIsDealbreaker)) {
      return false
    }
  }

  // 20. Pets check
  if (isPrefSet(seeker.prefPets)) {
    const matches = isPetsMatch(seeker.prefPets, candidate.pets, false)
    if (!matches && isDealbreaker(seeker.prefPetsIsDealbreaker)) {
      return false
    }
  }

  // 21. Hobbies check
  if (isPrefSet(seeker.prefHobbies)) {
    const matches = isHobbiesMatch(seeker.prefHobbies, seeker.hobbies, candidate.hobbies, false)
    if (!matches && isDealbreaker(seeker.prefHobbiesIsDealbreaker)) {
      return false
    }
  }

  // 22. Fitness check
  if (isPrefSet(seeker.prefFitness)) {
    const matches = isFitnessMatch(seeker.prefFitness, seeker.fitness, candidate.fitness, false)
    if (!matches && isDealbreaker(seeker.prefFitnessIsDealbreaker)) {
      return false
    }
  }

  // 23. Interests check
  if (isPrefSet(seeker.prefInterests)) {
    const matches = isInterestsMatch(seeker.prefInterests, seeker.interests, candidate.interests, false)
    if (!matches && isDealbreaker(seeker.prefInterestsIsDealbreaker)) {
      return false
    }
  }

  return true
}

/**
 * Check if two profiles are a mutual match
 * STRICT: Requires BOTH parties' preferences to match
 * A match only happens when her preferences match him AND his preferences match her
 */
export function isMutualMatch(
  profile1: ProfileForMatching,
  profile2: ProfileForMatching
): boolean {
  // Gender must be opposite
  if (profile1.gender === profile2.gender) return false

  // Check if BOTH profiles match each other's preferences
  // Profile1 must match Profile2's preferences AND Profile2 must match Profile1's preferences
  const profile1MatchesProfile2Prefs = matchesSeekerPreferences(profile2, profile1)
  const profile2MatchesProfile1Prefs = matchesSeekerPreferences(profile1, profile2)

  // Only a match if BOTH directions satisfy preferences
  return profile1MatchesProfile2Prefs && profile2MatchesProfile1Prefs
}

/**
 * Filter candidates to find mutual matches for a seeker
 */
export function findMutualMatches<T extends ProfileForMatching>(
  seeker: ProfileForMatching,
  candidates: T[]
): T[] {
  return candidates.filter(candidate => {
    // Skip self
    if (candidate.userId === seeker.userId) return false

    // Check mutual match
    return isMutualMatch(seeker, candidate)
  })
}

/**
 * Helper to check if preference is set (not empty, "doesn't matter", or "any")
 */
function isPrefSet(pref: string | null | undefined): boolean {
  return !isNoPreferenceValue(pref)
}

/**
 * Calculate match score between seeker and candidate
 * Returns a score object with total percentage and individual criteria scores
 * Shows ALL criteria for transparency with deal-breaker information
 */
export function calculateMatchScore(
  seeker: ProfileForMatching,
  candidate: ProfileForMatching
): {
  totalScore: number
  maxScore: number
  percentage: number
  criteria: {
    name: string
    matched: boolean
    seekerPref: string | null
    candidateValue: string | null
    isDealbreaker: boolean
  }[]
} {
  const criteria: {
    name: string
    matched: boolean
    seekerPref: string | null
    candidateValue: string | null
    isDealbreaker: boolean
  }[] = []

  let matchedCount = 0
  let totalCriteria = 0

  const seekerAge = calculateAgeFromDOB(seeker.dateOfBirth)
  const candidateAge = calculateAgeFromDOB(candidate.dateOfBirth)

  // 1. Age match
  let ageMatched = true
  const hasAgePref = isPrefSet(seeker.prefAgeMin) || isPrefSet(seeker.prefAgeMax) || isPrefSet(seeker.prefAgeDiff)
  if (hasAgePref) {
    totalCriteria++
    if (candidateAge !== null) {
      if (isPrefSet(seeker.prefAgeMin)) {
        const minAge = parseInt(seeker.prefAgeMin || '18')
        if (candidateAge < minAge) ageMatched = false
      }
      if (isPrefSet(seeker.prefAgeMax)) {
        const maxAge = parseInt(seeker.prefAgeMax || '99')
        if (candidateAge > maxAge) ageMatched = false
      }
      if (!isPrefSet(seeker.prefAgeMin) && !isPrefSet(seeker.prefAgeMax) && isPrefSet(seeker.prefAgeDiff)) {
        const ageRange = parseAgePreference(seeker.prefAgeDiff, seekerAge)
        if (ageRange) {
          ageMatched = candidateAge >= ageRange.min && candidateAge <= ageRange.max
        }
      }
    }
    // Missing candidate age never blocks a match
    if (ageMatched) matchedCount++
  }

  // Format age preference display
  let agePrefDisplay = "Doesn't matter"
  if (isPrefSet(seeker.prefAgeMin) || isPrefSet(seeker.prefAgeMax)) {
    const minAge = seeker.prefAgeMin || '18'
    const maxAge = seeker.prefAgeMax || '99'
    agePrefDisplay = `${minAge} - ${maxAge} years`
  } else if (isPrefSet(seeker.prefAgeDiff)) {
    agePrefDisplay = seeker.prefAgeDiff!
  }

  criteria.push({
    name: 'Age',
    matched: ageMatched,
    seekerPref: agePrefDisplay,
    candidateValue: candidateAge ? `${candidateAge} years` : 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefAgeIsDealbreaker)
  })

  // 2. Height match
  let heightMatched = true
  const hasHeightPref = isPrefSet(seeker.prefHeightMin) || isPrefSet(seeker.prefHeightMax) || isPrefSet(seeker.prefHeight)
  if (hasHeightPref) {
    totalCriteria++
    heightMatched = isHeightMatch(seeker.prefHeightMin, seeker.prefHeightMax, seeker.prefHeight, candidate.height, true)
    if (heightMatched) matchedCount++
  }

  let heightPrefDisplay = "Doesn't matter"
  if (isPrefSet(seeker.prefHeightMin) || isPrefSet(seeker.prefHeightMax)) {
    const minH = seeker.prefHeightMin || ''
    const maxH = seeker.prefHeightMax || ''
    heightPrefDisplay = minH && maxH ? `${minH} - ${maxH}` : (minH ? `Min ${minH}` : `Max ${maxH}`)
  } else if (isPrefSet(seeker.prefHeight)) {
    heightPrefDisplay = seeker.prefHeight!
  }

  criteria.push({
    name: 'Height',
    matched: heightMatched,
    seekerPref: heightPrefDisplay,
    candidateValue: candidate.height || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefHeightIsDealbreaker)
  })

  // 3. Location match
  let locationMatched = true
  const locationPref = seeker.prefLocationList || seeker.prefLocation
  if (isPrefSet(locationPref)) {
    totalCriteria++
    locationMatched = isLocationMatch(locationPref, candidate.currentLocation, seeker.currentLocation, true)
    if (locationMatched) matchedCount++
  }

  criteria.push({
    name: 'Location',
    matched: locationMatched,
    seekerPref: locationPref || "Doesn't matter",
    candidateValue: candidate.currentLocation || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefLocationIsDealbreaker)
  })

  // 4. Community match
  let communityMatched = true
  const communityPref = seeker.prefCommunity || seeker.prefCaste
  const seekerCommunity = seeker.community || seeker.caste
  const candidateCommunity = candidate.community || candidate.caste
  if (isPrefSet(communityPref)) {
    totalCriteria++
    communityMatched = isCommunityMatch(seekerCommunity, communityPref, candidateCommunity, true)
    if (communityMatched) matchedCount++
  }

  criteria.push({
    name: 'Community',
    matched: communityMatched,
    seekerPref: communityPref || "Doesn't matter",
    candidateValue: candidateCommunity || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefCommunityIsDealbreaker)
  })

  // 5. Gotra match
  let gotraMatched = true
  if (isPrefSet(seeker.prefGotra)) {
    totalCriteria++
    gotraMatched = isGotraMatch(seeker.gotra, seeker.prefGotra, candidate.gotra, true)
    if (gotraMatched) matchedCount++
  }

  criteria.push({
    name: 'Gotra',
    matched: gotraMatched,
    seekerPref: seeker.prefGotra || "Doesn't matter",
    candidateValue: candidate.gotra || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefGotraIsDealbreaker)
  })

  // 6. Diet match
  let dietMatched = true
  if (isPrefSet(seeker.prefDiet)) {
    totalCriteria++
    dietMatched = isDietMatch(seeker.prefDiet, candidate.dietaryPreference, true)
    if (dietMatched) matchedCount++
  }

  criteria.push({
    name: 'Diet',
    matched: dietMatched,
    seekerPref: seeker.prefDiet || "Doesn't matter",
    candidateValue: candidate.dietaryPreference || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefDietIsDealbreaker)
  })

  // 7. Qualification/Education match
  let qualMatched = true
  if (isPrefSet(seeker.prefQualification)) {
    totalCriteria++
    qualMatched = isEducationMatch(seeker.prefQualification, candidate.qualification, true)
    if (qualMatched) matchedCount++
  }

  criteria.push({
    name: 'Education',
    matched: qualMatched,
    seekerPref: seeker.prefQualification || "Doesn't matter",
    candidateValue: candidate.qualification || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefEducationIsDealbreaker)
  })

  // 8. Marital Status match
  let maritalMatched = true
  if (isPrefSet(seeker.prefMaritalStatus)) {
    totalCriteria++
    maritalMatched = isMaritalStatusMatch(seeker.prefMaritalStatus, candidate.maritalStatus, true)
    if (maritalMatched) matchedCount++
  }

  criteria.push({
    name: 'Marital Status',
    matched: maritalMatched,
    seekerPref: seeker.prefMaritalStatus || "Doesn't matter",
    candidateValue: candidate.maritalStatus || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefMaritalStatusIsDealbreaker)
  })

  // 8.5. Has Children match (only relevant when candidate's marital status is not never_married)
  let hasChildrenMatched = true
  const candidateNotNeverMarried = candidate.maritalStatus && candidate.maritalStatus !== 'never_married'
  let candidateHasChildren = candidate.hasChildren
  if (candidate.maritalStatus === 'never_married' && !candidateHasChildren) {
    candidateHasChildren = 'no'
  }
  if (isPrefSet(seeker.prefHasChildren) && candidateNotNeverMarried) {
    totalCriteria++
    hasChildrenMatched = isHasChildrenMatch(seeker.prefHasChildren, candidateHasChildren, true)
    if (hasChildrenMatched) matchedCount++
  }

  // Only show criteria if relevant (candidate is not never married)
  if (candidateNotNeverMarried) {
    criteria.push({
      name: 'Partner\'s Children',
      matched: hasChildrenMatched,
      seekerPref: seeker.prefHasChildren || "Doesn't matter",
      candidateValue: candidateHasChildren || 'Not specified',
      isDealbreaker: isDealbreaker(seeker.prefHasChildrenIsDealbreaker)
    })
  }

  // 9. Smoking match
  let smokingMatched = true
  if (isPrefSet(seeker.prefSmoking)) {
    totalCriteria++
    smokingMatched = isSmokingMatch(seeker.prefSmoking, candidate.smoking, true)
    if (smokingMatched) matchedCount++
  }

  criteria.push({
    name: 'Smoking',
    matched: smokingMatched,
    seekerPref: seeker.prefSmoking || "Doesn't matter",
    candidateValue: candidate.smoking || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefSmokingIsDealbreaker)
  })

  // 10. Drinking match
  let drinkingMatched = true
  if (isPrefSet(seeker.prefDrinking)) {
    totalCriteria++
    drinkingMatched = isDrinkingMatch(seeker.prefDrinking, candidate.drinking, true)
    if (drinkingMatched) matchedCount++
  }

  criteria.push({
    name: 'Drinking',
    matched: drinkingMatched,
    seekerPref: seeker.prefDrinking || "Doesn't matter",
    candidateValue: candidate.drinking || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefDrinkingIsDealbreaker)
  })

  // 11. Income match
  let incomeMatched = true
  if (isPrefSet(seeker.prefIncome)) {
    totalCriteria++
    incomeMatched = isIncomeMatch(seeker.prefIncome, candidate.annualIncome, true)
    if (incomeMatched) matchedCount++
  }

  criteria.push({
    name: 'Income',
    matched: incomeMatched,
    seekerPref: seeker.prefIncome || "Doesn't matter",
    candidateValue: candidate.annualIncome || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefIncomeIsDealbreaker)
  })

  // 11.5. Occupation match
  let occupationMatched = true
  const occupationPref = seeker.prefOccupationList || seeker.prefOccupation
  if (isPrefSet(occupationPref)) {
    totalCriteria++
    occupationMatched = isOccupationMatch(occupationPref, candidate.occupation, true)
    if (occupationMatched) matchedCount++
  }

  criteria.push({
    name: 'Occupation',
    matched: occupationMatched,
    seekerPref: occupationPref || "Doesn't matter",
    candidateValue: candidate.occupation || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefOccupationIsDealbreaker)
  })

  // 12. Family Values match
  let familyValuesMatched = true
  if (isPrefSet(seeker.prefFamilyValues)) {
    totalCriteria++
    familyValuesMatched = isFamilyValuesMatch(seeker.prefFamilyValues, seeker.familyValues, candidate.familyValues, true)
    if (familyValuesMatched) matchedCount++
  }

  criteria.push({
    name: 'Family Values',
    matched: familyValuesMatched,
    seekerPref: seeker.prefFamilyValues || "Doesn't matter",
    candidateValue: candidate.familyValues || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefFamilyValuesIsDealbreaker)
  })

  // 13. Family Location match
  let familyLocationMatched = true
  const familyLocationPref = seeker.prefFamilyLocationCountry || seeker.prefFamilyLocation
  if (isPrefSet(familyLocationPref)) {
    totalCriteria++
    familyLocationMatched = isFamilyLocationMatch(familyLocationPref, seeker.familyLocation, candidate.familyLocation, true)
    if (familyLocationMatched) matchedCount++
  }

  criteria.push({
    name: 'Family Location',
    matched: familyLocationMatched,
    seekerPref: familyLocationPref || "Doesn't matter",
    candidateValue: candidate.familyLocation || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefFamilyLocationIsDealbreaker) || isDealbreaker(seeker.prefFamilyLocationCountryIsDealbreaker)
  })

  // 14. Mother Tongue match
  let motherTongueMatched = true
  const hasMTPref = isPrefSet(seeker.prefMotherTongue) || isPrefSet(seeker.prefMotherTongueList)
  if (hasMTPref) {
    totalCriteria++
    const prefList = seeker.prefMotherTongueList || seeker.prefMotherTongue
    motherTongueMatched = isMotherTongueMatch(
      prefList,
      seeker.prefMotherTongueOther,
      seeker.motherTongue,
      seeker.motherTongueOther,
      candidate.motherTongue,
      candidate.motherTongueOther,
      true
    )
    if (motherTongueMatched) matchedCount++
  }

  criteria.push({
    name: 'Mother Tongue',
    matched: motherTongueMatched,
    seekerPref: seeker.prefMotherTongueList || seeker.prefMotherTongue || "Doesn't matter",
    candidateValue: candidate.motherTongue?.toLowerCase() === 'other'
      ? (candidate.motherTongueOther || 'Other')
      : (candidate.motherTongue || 'Not specified'),
    isDealbreaker: isDealbreaker(seeker.prefMotherTongueIsDealbreaker)
  })

  // 15. Sub-Community match
  let subCommunityMatched = true
  const subCommunityPref = seeker.prefSubCommunityList || seeker.prefSubCommunity
  if (isPrefSet(subCommunityPref)) {
    totalCriteria++
    subCommunityMatched = isSubCommunityMatch(subCommunityPref, seeker.subCommunity, candidate.subCommunity, true)
    if (subCommunityMatched) matchedCount++
  }

  criteria.push({
    name: 'Sub-Community',
    matched: subCommunityMatched,
    seekerPref: subCommunityPref || "Doesn't matter",
    candidateValue: candidate.subCommunity || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefSubCommunityIsDealbreaker)
  })

  // 16. Religion match
  let religionMatched = true
  if (isPrefSet(seeker.prefReligion)) {
    totalCriteria++
    religionMatched = isReligionMatch(seeker.prefReligion, candidate.religion, true)
    if (religionMatched) matchedCount++
  }

  criteria.push({
    name: 'Religion',
    matched: religionMatched,
    seekerPref: seeker.prefReligion || "Doesn't matter",
    candidateValue: candidate.religion || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefReligionIsDealbreaker)
  })

  // 17. Citizenship match
  let citizenshipMatched = true
  if (isPrefSet(seeker.prefCitizenship)) {
    totalCriteria++
    citizenshipMatched = isCitizenshipMatch(seeker.prefCitizenship, seeker.citizenship, candidate.citizenship, true)
    if (citizenshipMatched) matchedCount++
  }

  criteria.push({
    name: 'Citizenship',
    matched: citizenshipMatched,
    seekerPref: seeker.prefCitizenship || "Doesn't matter",
    candidateValue: candidate.citizenship || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefCitizenshipIsDealbreaker)
  })

  // 18. Grew Up In match
  let grewUpInMatched = true
  if (isPrefSet(seeker.prefGrewUpIn)) {
    totalCriteria++
    const seekerGrewUpIn = seeker.grewUpIn || seeker.country
    grewUpInMatched = isGrewUpInMatch(seeker.prefGrewUpIn, seekerGrewUpIn, candidate.grewUpIn, true)
    if (grewUpInMatched) matchedCount++
  }

  criteria.push({
    name: 'Grew Up In',
    matched: grewUpInMatched,
    seekerPref: seeker.prefGrewUpIn || "Doesn't matter",
    candidateValue: candidate.grewUpIn || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefGrewUpInIsDealbreaker)
  })

  // 19. Relocation match
  let relocationMatched = true
  if (isPrefSet(seeker.prefRelocation)) {
    totalCriteria++
    relocationMatched = isRelocationMatch(seeker.prefRelocation, candidate.openToRelocation, true)
    if (relocationMatched) matchedCount++
  }

  criteria.push({
    name: 'Relocation',
    matched: relocationMatched,
    seekerPref: seeker.prefRelocation || "Doesn't matter",
    candidateValue: candidate.openToRelocation || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefRelocationIsDealbreaker)
  })

  // 20. Pets match
  let petsMatched = true
  if (isPrefSet(seeker.prefPets)) {
    totalCriteria++
    petsMatched = isPetsMatch(seeker.prefPets, candidate.pets, true)
    if (petsMatched) matchedCount++
  }

  criteria.push({
    name: 'Pets',
    matched: petsMatched,
    seekerPref: seeker.prefPets || "Doesn't matter",
    candidateValue: candidate.pets || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefPetsIsDealbreaker)
  })

  // 21. Hobbies match
  let hobbiesMatched = true
  if (isPrefSet(seeker.prefHobbies)) {
    totalCriteria++
    hobbiesMatched = isHobbiesMatch(seeker.prefHobbies, seeker.hobbies, candidate.hobbies, true)
    if (hobbiesMatched) matchedCount++
  }

  criteria.push({
    name: 'Hobbies',
    matched: hobbiesMatched,
    seekerPref: seeker.prefHobbies || "Doesn't matter",
    candidateValue: candidate.hobbies ? 'Has hobbies' : 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefHobbiesIsDealbreaker)
  })

  // 22. Fitness match
  let fitnessMatched = true
  if (isPrefSet(seeker.prefFitness)) {
    totalCriteria++
    fitnessMatched = isFitnessMatch(seeker.prefFitness, seeker.fitness, candidate.fitness, true)
    if (fitnessMatched) matchedCount++
  }

  criteria.push({
    name: 'Fitness',
    matched: fitnessMatched,
    seekerPref: seeker.prefFitness || "Doesn't matter",
    candidateValue: candidate.fitness ? 'Has fitness activities' : 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefFitnessIsDealbreaker)
  })

  // 23. Interests match
  let interestsMatched = true
  if (isPrefSet(seeker.prefInterests)) {
    totalCriteria++
    interestsMatched = isInterestsMatch(seeker.prefInterests, seeker.interests, candidate.interests, true)
    if (interestsMatched) matchedCount++
  }

  criteria.push({
    name: 'Interests',
    matched: interestsMatched,
    seekerPref: seeker.prefInterests || "Doesn't matter",
    candidateValue: candidate.interests ? 'Has interests' : 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefInterestsIsDealbreaker)
  })

  // Calculate percentage (only from criteria where preference was set)
  const percentage = totalCriteria > 0 ? Math.round((matchedCount / totalCriteria) * 100) : 100

  return {
    totalScore: matchedCount,
    maxScore: totalCriteria,
    percentage,
    criteria
  }
}
