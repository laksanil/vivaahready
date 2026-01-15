/**
 * Matching Algorithm for VivaahReady
 *
 * FLEXIBLE MATCHING: Shows profiles based on compatibility, not hard filters.
 * - Profiles are shown if they are potentially compatible
 * - Match score indicates how well preferences align
 * - Users can see profiles even if not all preferences match perfectly
 *
 * Matching Criteria:
 * - Gender (required): Opposite gender
 * - Age: Within preferred age range (interpreted as relative age difference)
 * - Location: Matches preferred location
 * - Caste: Intelligent caste matching with sub-caste awareness
 * - Diet: Matches preferred diet
 * - Qualification: Meets minimum preferred education
 * - Gotra: Different gotra if required
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
  annualIncome: string | null

  // Preferences - Core (Page 1)
  prefAgeDiff?: string | null
  prefAgeMin?: string | null
  prefAgeMax?: string | null
  prefHeight?: string | null
  prefHeightMin?: string | null
  prefHeightMax?: string | null
  prefMaritalStatus?: string | null
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
  prefFamilyValues?: string | null
  prefFamilyLocation?: string | null
  prefMotherTongue?: string | null
  prefSubCommunity?: string | null
  prefPets?: string | null
  prefCaste?: string | null

  // Deal-breaker flags
  prefAgeIsDealbreaker?: boolean | string
  prefHeightIsDealbreaker?: boolean | string
  prefMaritalStatusIsDealbreaker?: boolean | string
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
  prefMotherTongueIsDealbreaker?: boolean | string
  prefSubCommunityIsDealbreaker?: boolean | string
  prefPetsIsDealbreaker?: boolean | string
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
  if (pref === "doesn't matter" || pref === "any" || pref === "") return null

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
    // Assuming they want someone older by this many years
    return { min: seekerAge + diffMin - 2, max: seekerAge + diffMax + 2 }
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
    if (youngerOlderMatch[2] === 'younger') {
      return { min: seekerAge - diff - 2, max: seekerAge }
    } else {
      return { min: seekerAge, max: seekerAge + diff + 2 }
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
 * - MBBS = Bachelor's level (undergraduate medical degree)
 * - MD/MS = Master's level (postgraduate medical degree)
 * - DM/MCh = Super-specialty (doctorate level)
 */
const EDUCATION_LEVELS: Record<string, number> = {
  // Level 1: High School / Diploma
  'high_school': 1,
  'high school': 1,
  'diploma': 1,
  '12th': 1,

  // Level 2: Undergrad (including MBBS - medical undergrad)
  'undergrad': 2,
  'undergrad_eng': 2,
  'undergrad_cs': 2,
  'bachelors': 2,  // Legacy
  'bachelors_eng': 2,  // Legacy
  'bachelors_cs': 2,  // Legacy
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
  'mbbs': 2,  // Medical Undergrad
  'bds': 2,   // Dental Undergrad
  'llb': 2,   // Law Undergrad

  // Level 3: Master's (including MD - medical master's)
  'masters': 3,
  'masters_eng': 3,
  'masters_cs': 3,
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
  'md': 3,    // Medical Master's (postgraduate)
  'ms_medical': 3,
  'llm': 3,   // Law Master's
  'ca_cpa': 3,
  'ca': 3,
  'cpa': 3,
  'cs': 3,

  // Level 4: Doctorate / Super-specialty
  'phd': 4,
  'ph.d': 4,
  'doctorate': 4,
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
  // Engineering
  'eng_undergrad': ['undergrad_eng', 'bachelors_eng', 'be', 'btech'],
  'eng_masters': ['masters_eng', 'me', 'mtech'],
  'engineering': ['undergrad_eng', 'bachelors_eng', 'masters_eng', 'be', 'btech', 'me', 'mtech'],  // All engineering
  // Computer Science
  'cs_undergrad': ['undergrad_cs', 'bachelors_cs', 'bca', 'bsc cs'],
  'cs_masters': ['masters_cs', 'mca', 'msc cs'],
  'computer_science': ['undergrad_cs', 'bachelors_cs', 'masters_cs', 'bca', 'mca'],  // All CS
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
  // Engineering
  'eng_undergrad': { type: 'category', categories: ['undergrad_eng', 'bachelors_eng', 'be', 'btech'] },
  'eng_masters': { type: 'category', categories: ['masters_eng', 'me', 'mtech'] },
  // Computer Science
  'cs_undergrad': { type: 'category', categories: ['undergrad_cs', 'bachelors_cs', 'bca'] },
  'cs_masters': { type: 'category', categories: ['masters_cs', 'mca'] },
  // Medical
  'medical_undergrad': { type: 'category', categories: ['mbbs', 'bds'] },
  'medical_masters': { type: 'category', categories: ['md', 'ms_medical'] },
  // Other Professional
  'mba': { type: 'category', categories: ['mba'] },
  'ca_professional': { type: 'category', categories: ['ca_cpa', 'cs'] },
  'law': { type: 'category', categories: ['llb', 'llm'] },
  'doctorate': { type: 'category', categories: ['phd', 'dm_mch'] },
  // Legacy values support
  'graduate': { type: 'level', minLevel: 2 },  // Legacy
  'post_graduate': { type: 'level', minLevel: 3 },  // Legacy
  'bachelors': { type: 'level', minLevel: 2 },  // Legacy
  'phd': { type: 'category', categories: ['phd'] },
  'eng_bachelor': { type: 'category', categories: ['undergrad_eng', 'bachelors_eng', 'be', 'btech'] },  // Legacy
  'eng_master': { type: 'category', categories: ['masters_eng', 'me', 'mtech'] },  // Legacy
  'cs_bachelor': { type: 'category', categories: ['undergrad_cs', 'bachelors_cs', 'bca'] },  // Legacy
  'cs_master': { type: 'category', categories: ['masters_cs', 'mca'] },  // Legacy
  'medical_bachelor': { type: 'category', categories: ['mbbs', 'bds'] },  // Legacy
  'medical_master': { type: 'category', categories: ['md', 'ms_medical'] },  // Legacy
  'engineering': { type: 'category', categories: ['undergrad_eng', 'bachelors_eng', 'masters_eng'] },  // Legacy
  'medical': { type: 'category', categories: ['mbbs', 'bds', 'md', 'dm_mch'] },  // Legacy
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
    if (normalized === category || normalized.includes(category)) {
      return true
    }
    // Also check if the category keywords are in the qualification
    const categoryKeywords = EDUCATION_CATEGORIES[category] || [category]
    for (const keyword of categoryKeywords) {
      if (normalized.includes(keyword)) {
        return true
      }
    }
  }

  return false
}

/**
 * Known Brahmin sub-castes and their variations
 * This list helps identify that "Iyengar" and "Niyogi" are both Brahmin sub-castes
 */
const BRAHMIN_CASTES = [
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
 * Check if a caste string indicates Brahmin
 */
function isBrahmin(caste: string): boolean {
  const lower = caste.toLowerCase()
  return BRAHMIN_CASTES.some(bc => lower.includes(bc))
}

/**
 * Intelligent caste matching
 * - "Same Caste only" -> Match at broad level (e.g., both Brahmins)
 * - Specific caste -> Match if castes are compatible
 */
function isCasteMatch(seekerCaste: string | null | undefined, seekerPref: string | null | undefined, candidateCaste: string | null | undefined): boolean {
  // No preference or "doesn't matter"
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'any') {
    return true
  }

  // No candidate caste info - can't verify, so allow
  if (!candidateCaste) {
    return true
  }

  const prefLower = seekerPref.toLowerCase()
  const candidateLower = candidateCaste.toLowerCase()

  // "Same Caste only" logic
  if (prefLower.includes('same caste') || prefLower.includes('same_caste')) {
    if (!seekerCaste) return true // Can't compare, allow

    const seekerLower = seekerCaste.toLowerCase()

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

  // Direct caste comparison
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
  'colorado', 'co', 'connecticut', 'ct', 'delaware', 'de', 'florida', 'fl', 'georgia', 'ga',
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
  'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware', 'fl': 'florida', 'ga': 'georgia',
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
 * Map dropdown preference values to state names
 */
const PREF_LOCATION_TO_STATE: Record<string, string | null> = {
  'doesnt_matter': null,
  'usa': null,  // Any US location
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
 */
function isLocationMatch(preference: string | null | undefined, candidateLocation: string | null | undefined): boolean {
  // No preference or "doesn't matter"
  if (!preference || preference.toLowerCase() === "doesn't matter" || preference.toLowerCase() === 'any') {
    return true
  }

  // No candidate location - can't verify, so allow
  if (!candidateLocation) {
    return true
  }

  const prefLower = preference.toLowerCase().trim()
  const candLower = candidateLocation.toLowerCase().trim()

  // Handle standard dropdown values
  if (prefLower === 'doesnt_matter' || prefLower === 'open_to_relocation' || prefLower === 'other_state') {
    return true
  }

  // USA - any US location
  if (prefLower === 'usa') {
    return isUSLocation(candidateLocation)
  }

  // Bay Area - check for Bay Area cities or California
  if (prefLower === 'bay_area') {
    const candState = extractUSState(candidateLocation)
    if (candState !== 'california') return false
    // Check if it's specifically in Bay Area
    for (const city of BAY_AREA_CITIES) {
      if (candLower.includes(city)) return true
    }
    // If just "California" or "CA", allow it (benefit of doubt)
    if (candLower === 'california' || candLower === 'ca' || candLower.includes('bay area')) return true
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
 */
function isDietMatch(seekerPref: string | null | undefined, candidateDiet: string | null | undefined): boolean {
  // No preference
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'any') {
    return true
  }

  // No candidate diet info
  if (!candidateDiet) {
    return true
  }

  const seekerDiet = seekerPref.toLowerCase().replace(/[_\s-]/g, '')
  const candDiet = candidateDiet.toLowerCase().replace(/[_\s-]/g, '')

  // Helper functions
  const isVeg = (diet: string) => diet === 'veg' || diet === 'vegetarian' || diet.includes('vegetarian')
  const isNonVeg = (diet: string) => diet.includes('non') || diet.includes('nonveg') || diet.includes('meat')
  const isEgg = (diet: string) => diet.includes('egg') || diet.includes('eggetarian')

  // Match logic
  if (isVeg(seekerDiet)) {
    return isVeg(candDiet)
  } else if (isNonVeg(seekerDiet)) {
    return true // Non-veg preference can match anyone
  } else if (isEgg(seekerDiet)) {
    return isEgg(candDiet) || isNonVeg(candDiet) || isVeg(candDiet) // Eggetarian can match most
  }

  // Direct match
  return seekerDiet === candDiet || seekerDiet.includes(candDiet) || candDiet.includes(seekerDiet)
}

/**
 * Check if gotra requirement is met
 */
function isGotraMatch(seekerGotra: string | null | undefined, seekerPref: string | null | undefined, candidateGotra: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'any') {
    return true
  }

  // "Different Gotra" requirement
  if (seekerPref.toLowerCase().includes('different')) {
    if (!seekerGotra || !candidateGotra) return true // Can't verify, allow
    return seekerGotra.toLowerCase() !== candidateGotra.toLowerCase()
  }

  // Same gotra requirement
  if (seekerPref.toLowerCase().includes('same')) {
    if (!seekerGotra || !candidateGotra) return true
    return seekerGotra.toLowerCase() === candidateGotra.toLowerCase()
  }

  return true
}

/**
 * Check if education requirement is met
 * Supports both level-based (e.g., "Bachelor's or higher") and category-based (e.g., "Medical Professional") matching
 */
function isEducationMatch(seekerPref: string | null | undefined, candidateQual: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'any') {
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
      if (candidateLevel === 0) return true // Can't determine, allow
      return candidateLevel >= prefConfig.minLevel
    }

    if (prefConfig.type === 'category' && prefConfig.categories) {
      // Category-based matching: candidate must be in specific categories
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

/**
 * Check if smoking preferences match
 */
function isSmokingMatch(seekerPref: string | null | undefined, candidateSmoking: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateSmoking) return true // Can't verify, allow

  const pref = seekerPref.toLowerCase()
  const cand = candidateSmoking.toLowerCase()

  // "no" or "never" - only match non-smokers
  if (pref === 'no' || pref === 'never' || pref === 'non_smoker') {
    return cand === 'no' || cand === 'never' || cand === 'non_smoker'
  }

  // "occasional" - match non-smokers or occasional
  if (pref === 'occasional' || pref === 'socially') {
    return cand !== 'yes' && cand !== 'regular'
  }

  return true // "yes" or any other preference matches anyone
}

/**
 * Check if drinking preferences match
 */
function isDrinkingMatch(seekerPref: string | null | undefined, candidateDrinking: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateDrinking) return true // Can't verify, allow

  const pref = seekerPref.toLowerCase()
  const cand = candidateDrinking.toLowerCase()

  // "no" or "never" - only match non-drinkers
  if (pref === 'no' || pref === 'never' || pref === 'non_drinker') {
    return cand === 'no' || cand === 'never' || cand === 'non_drinker'
  }

  // "occasional" or "socially" - match non-drinkers or occasional
  if (pref === 'occasional' || pref === 'socially' || pref === 'social') {
    return cand !== 'yes' && cand !== 'regular'
  }

  return true // "yes" or any other preference matches anyone
}

/**
 * Check if marital status preferences match
 */
function isMaritalStatusMatch(seekerPref: string | null | undefined, candidateMaritalStatus: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateMaritalStatus) return true // Can't verify, allow

  const pref = seekerPref.toLowerCase()

  // Check if "any" or "doesnt_matter" is in the preference list
  if (pref.includes('doesnt_matter') || pref.includes('any')) {
    return true
  }

  const candStatus = candidateMaritalStatus.toLowerCase()

  // Preference could be comma-separated list like "never_married, divorced"
  const acceptedStatuses = pref.split(',').map(s => s.trim().replace(/\s+/g, '_'))

  return acceptedStatuses.some(status =>
    candStatus === status ||
    candStatus.includes(status) ||
    status.includes(candStatus)
  )
}

/**
 * Check if family values preferences match
 */
function isFamilyValuesMatch(seekerPref: string | null | undefined, seekerFamilyValues: string | null | undefined, candidateFamilyValues: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateFamilyValues) return true // Can't verify, allow

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
 */
function isFamilyLocationMatch(seekerPref: string | null | undefined, seekerFamilyLocation: string | null | undefined, candidateFamilyLocation: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateFamilyLocation) return true // Can't verify, allow

  const pref = seekerPref.toLowerCase()
  const cand = candidateFamilyLocation.toLowerCase()

  // "same_as_mine" - match if similar location
  if (pref === 'same_as_mine' || pref === 'same as mine') {
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
 */
function isMotherTongueMatch(seekerPref: string | null | undefined, seekerMotherTongue: string | null | undefined, candidateMotherTongue: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateMotherTongue) return true // Can't verify, allow

  const pref = seekerPref.toLowerCase()
  const cand = candidateMotherTongue.toLowerCase()

  // "same_as_mine" - match if same mother tongue
  if (pref === 'same_as_mine' || pref === 'same as mine') {
    if (!seekerMotherTongue) return true
    return seekerMotherTongue.toLowerCase() === cand
  }

  // Direct match
  return pref === cand
}

/**
 * Check if income preferences match
 */
function isIncomeMatch(seekerPref: string | null | undefined, candidateIncome: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateIncome) return true // Can't verify, allow

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
 */
function isSubCommunityMatch(seekerPref: string | null | undefined, seekerSubCommunity: string | null | undefined, candidateSubCommunity: string | null | undefined): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter" || seekerPref.toLowerCase() === 'doesnt_matter') {
    return true
  }
  if (!candidateSubCommunity) return true // Can't verify, allow

  const pref = seekerPref.toLowerCase()

  // "same_as_mine" - match if same sub-community
  if (pref === 'same_as_mine' || pref === 'same as mine') {
    if (!seekerSubCommunity) return true
    return seekerSubCommunity.toLowerCase() === candidateSubCommunity.toLowerCase()
  }

  return true
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
  const hasAgePref = isPrefSet(seeker.prefAgeMin) || isPrefSet(seeker.prefAgeMax) || isPrefSet(seeker.prefAgeDiff)
  if (hasAgePref) {
    let ageMatches = true

    if (candidateAge !== null) {
      // Use min/max if set
      if (isPrefSet(seeker.prefAgeMin)) {
        const minAge = parseInt(seeker.prefAgeMin || '18')
        if (candidateAge < minAge - 2) ageMatches = false // 2 year buffer
      }
      if (isPrefSet(seeker.prefAgeMax)) {
        const maxAge = parseInt(seeker.prefAgeMax || '99')
        if (candidateAge > maxAge + 2) ageMatches = false // 2 year buffer
      }
      // Legacy support
      if (!isPrefSet(seeker.prefAgeMin) && !isPrefSet(seeker.prefAgeMax) && isPrefSet(seeker.prefAgeDiff)) {
        const ageRange = parseAgePreference(seeker.prefAgeDiff, seekerAge)
        if (ageRange && (candidateAge < ageRange.min - 2 || candidateAge > ageRange.max + 2)) {
          ageMatches = false
        }
      }
    }

    // If deal-breaker and doesn't match, reject
    if (!ageMatches && isDealbreaker(seeker.prefAgeIsDealbreaker)) {
      return false
    }
  }

  // 3. Marital Status check
  if (isPrefSet(seeker.prefMaritalStatus)) {
    const matches = isMaritalStatusMatch(seeker.prefMaritalStatus, candidate.maritalStatus)
    if (!matches && isDealbreaker(seeker.prefMaritalStatusIsDealbreaker)) {
      return false
    }
  }

  // 4. Diet check
  if (isPrefSet(seeker.prefDiet)) {
    const matches = isDietMatch(seeker.prefDiet, candidate.dietaryPreference)
    if (!matches && isDealbreaker(seeker.prefDietIsDealbreaker)) {
      return false
    }
  }

  // 5. Smoking check
  if (isPrefSet(seeker.prefSmoking)) {
    const matches = isSmokingMatch(seeker.prefSmoking, candidate.smoking)
    if (!matches && isDealbreaker(seeker.prefSmokingIsDealbreaker)) {
      return false
    }
  }

  // 6. Drinking check
  if (isPrefSet(seeker.prefDrinking)) {
    const matches = isDrinkingMatch(seeker.prefDrinking, candidate.drinking)
    if (!matches && isDealbreaker(seeker.prefDrinkingIsDealbreaker)) {
      return false
    }
  }

  // 7. Religion/Community check
  if (isPrefSet(seeker.prefReligion) && seeker.prefReligion?.toLowerCase() !== 'doesnt_matter') {
    // For now, religion is informational - we don't have religion field in candidate
    // This would need to be added if religion filtering is required
  }

  // 8. Community check
  if (isPrefSet(seeker.prefCommunity)) {
    const matches = isCasteMatch(seeker.community, seeker.prefCommunity, candidate.community)
    if (!matches && isDealbreaker(seeker.prefCommunityIsDealbreaker)) {
      return false
    }
  }

  // 9. Gotra check (always a deal-breaker if "different" is specified)
  if (isPrefSet(seeker.prefGotra)) {
    const matches = isGotraMatch(seeker.gotra, seeker.prefGotra, candidate.gotra)
    if (!matches) {
      return false // Gotra is always strict
    }
  }

  // 10. Location check
  const locationPref = seeker.prefLocationList || seeker.prefLocation
  if (isPrefSet(locationPref)) {
    const matches = isLocationMatch(locationPref, candidate.currentLocation)
    if (!matches && isDealbreaker(seeker.prefLocationIsDealbreaker)) {
      return false
    }
  }

  // 11. Education check
  if (isPrefSet(seeker.prefQualification)) {
    const matches = isEducationMatch(seeker.prefQualification, candidate.qualification)
    if (!matches && isDealbreaker(seeker.prefEducationIsDealbreaker)) {
      return false
    }
  }

  // 12. Income check
  if (isPrefSet(seeker.prefIncome)) {
    const matches = isIncomeMatch(seeker.prefIncome, candidate.annualIncome)
    if (!matches && isDealbreaker(seeker.prefIncomeIsDealbreaker)) {
      return false
    }
  }

  // 13. Family Values check
  if (isPrefSet(seeker.prefFamilyValues)) {
    const matches = isFamilyValuesMatch(seeker.prefFamilyValues, seeker.familyValues, candidate.familyValues)
    if (!matches && isDealbreaker(seeker.prefFamilyValuesIsDealbreaker)) {
      return false
    }
  }

  // 14. Family Location check
  if (isPrefSet(seeker.prefFamilyLocation)) {
    const matches = isFamilyLocationMatch(seeker.prefFamilyLocation, seeker.familyLocation, candidate.familyLocation)
    if (!matches && isDealbreaker(seeker.prefFamilyLocationIsDealbreaker)) {
      return false
    }
  }

  // 15. Mother Tongue check
  if (isPrefSet(seeker.prefMotherTongue)) {
    const matches = isMotherTongueMatch(seeker.prefMotherTongue, seeker.motherTongue, candidate.motherTongue)
    if (!matches && isDealbreaker(seeker.prefMotherTongueIsDealbreaker)) {
      return false
    }
  }

  // 16. Sub-Community check
  if (isPrefSet(seeker.prefSubCommunity)) {
    const matches = isSubCommunityMatch(seeker.prefSubCommunity, seeker.subCommunity, candidate.subCommunity)
    if (!matches && isDealbreaker(seeker.prefSubCommunityIsDealbreaker)) {
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
  if (!pref) return false
  const lower = pref.toLowerCase().trim()
  return lower !== "" && lower !== "doesn't matter" && lower !== "any" && lower !== "no preference"
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
    heightMatched = !!candidate.height
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
  if (isPrefSet(seeker.prefLocation)) {
    totalCriteria++
    locationMatched = isLocationMatch(seeker.prefLocation, candidate.currentLocation)
    if (locationMatched) matchedCount++
  }

  criteria.push({
    name: 'Location',
    matched: locationMatched,
    seekerPref: seeker.prefLocation || "Doesn't matter",
    candidateValue: candidate.currentLocation || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefLocationIsDealbreaker)
  })

  // 4. Community match
  let communityMatched = true
  if (isPrefSet(seeker.prefCommunity)) {
    totalCriteria++
    communityMatched = isCasteMatch(seeker.community, seeker.prefCommunity, candidate.community)
    if (communityMatched) matchedCount++
  }

  criteria.push({
    name: 'Community',
    matched: communityMatched,
    seekerPref: seeker.prefCommunity || "Doesn't matter",
    candidateValue: candidate.community || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefCommunityIsDealbreaker)
  })

  // 5. Gotra match
  let gotraMatched = true
  if (isPrefSet(seeker.prefGotra)) {
    totalCriteria++
    gotraMatched = isGotraMatch(seeker.gotra, seeker.prefGotra, candidate.gotra)
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
    dietMatched = isDietMatch(seeker.prefDiet, candidate.dietaryPreference)
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
    qualMatched = isEducationMatch(seeker.prefQualification, candidate.qualification)
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
    maritalMatched = isMaritalStatusMatch(seeker.prefMaritalStatus, candidate.maritalStatus)
    if (maritalMatched) matchedCount++
  }

  criteria.push({
    name: 'Marital Status',
    matched: maritalMatched,
    seekerPref: seeker.prefMaritalStatus || "Doesn't matter",
    candidateValue: candidate.maritalStatus || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefMaritalStatusIsDealbreaker)
  })

  // 9. Smoking match
  let smokingMatched = true
  if (isPrefSet(seeker.prefSmoking)) {
    totalCriteria++
    smokingMatched = isSmokingMatch(seeker.prefSmoking, candidate.smoking)
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
    drinkingMatched = isDrinkingMatch(seeker.prefDrinking, candidate.drinking)
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
    incomeMatched = isIncomeMatch(seeker.prefIncome, candidate.annualIncome)
    if (incomeMatched) matchedCount++
  }

  criteria.push({
    name: 'Income',
    matched: incomeMatched,
    seekerPref: seeker.prefIncome || "Doesn't matter",
    candidateValue: candidate.annualIncome || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefIncomeIsDealbreaker)
  })

  // 12. Family Values match
  let familyValuesMatched = true
  if (isPrefSet(seeker.prefFamilyValues)) {
    totalCriteria++
    familyValuesMatched = isFamilyValuesMatch(seeker.prefFamilyValues, seeker.familyValues, candidate.familyValues)
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
  if (isPrefSet(seeker.prefFamilyLocation)) {
    totalCriteria++
    familyLocationMatched = isFamilyLocationMatch(seeker.prefFamilyLocation, seeker.familyLocation, candidate.familyLocation)
    if (familyLocationMatched) matchedCount++
  }

  criteria.push({
    name: 'Family Location',
    matched: familyLocationMatched,
    seekerPref: seeker.prefFamilyLocation || "Doesn't matter",
    candidateValue: candidate.familyLocation || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefFamilyLocationIsDealbreaker)
  })

  // 14. Mother Tongue match
  let motherTongueMatched = true
  if (isPrefSet(seeker.prefMotherTongue)) {
    totalCriteria++
    motherTongueMatched = isMotherTongueMatch(seeker.prefMotherTongue, seeker.motherTongue, candidate.motherTongue)
    if (motherTongueMatched) matchedCount++
  }

  criteria.push({
    name: 'Mother Tongue',
    matched: motherTongueMatched,
    seekerPref: seeker.prefMotherTongue || "Doesn't matter",
    candidateValue: candidate.motherTongue || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefMotherTongueIsDealbreaker)
  })

  // 15. Sub-Community match
  let subCommunityMatched = true
  if (isPrefSet(seeker.prefSubCommunity)) {
    totalCriteria++
    subCommunityMatched = isSubCommunityMatch(seeker.prefSubCommunity, seeker.subCommunity, candidate.subCommunity)
    if (subCommunityMatched) matchedCount++
  }

  criteria.push({
    name: 'Sub-Community',
    matched: subCommunityMatched,
    seekerPref: seeker.prefSubCommunity || "Doesn't matter",
    candidateValue: candidate.subCommunity || 'Not specified',
    isDealbreaker: isDealbreaker(seeker.prefSubCommunityIsDealbreaker)
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
