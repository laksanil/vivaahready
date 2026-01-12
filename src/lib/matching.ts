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
  dietaryPreference: string | null
  qualification: string | null
  height: string | null
  gotra: string | null
  aboutMe?: string | null  // Used to check for ongoing education

  // Preferences
  prefAgeDiff: string | null
  prefLocation: string | null
  prefCaste: string | null
  prefDiet: string | null
  prefQualification: string | null
  prefHeight: string | null
  prefGotra: string | null
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
export function parseAgePreference(prefAgeDiff: string | null, seekerAge: number | null): { min: number; max: number } | null {
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

function getEducationLevel(qualification: string | null): number {
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
function matchesEducationCategory(candidateQual: string | null, categories: string[]): boolean {
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
function isCasteMatch(seekerCaste: string | null, seekerPref: string | null, candidateCaste: string | null): boolean {
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
function isLocationMatch(preference: string | null, candidateLocation: string | null): boolean {
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
function isDietMatch(seekerPref: string | null, candidateDiet: string | null): boolean {
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
function isGotraMatch(seekerGotra: string | null, seekerPref: string | null, candidateGotra: string | null): boolean {
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
function isEducationMatch(seekerPref: string | null, candidateQual: string | null): boolean {
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
 * Check if a candidate matches the seeker's preferences
 * Returns true if candidate is potentially compatible
 * This is now more lenient - we show profiles and let users decide
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

  // 2. Age check (lenient - only filter if WAY outside range)
  if (seeker.prefAgeDiff && seeker.prefAgeDiff.toLowerCase() !== "doesn't matter") {
    const ageRange = parseAgePreference(seeker.prefAgeDiff, seekerAge)
    if (candidateAge !== null && ageRange !== null) {
      // Allow 3 years buffer on either side for flexibility
      if (candidateAge < ageRange.min - 3 || candidateAge > ageRange.max + 3) {
        return false
      }
    }
  }

  // 3. Location check - HARD FILTER for specific state preferences
  if (!isLocationMatch(seeker.prefLocation, candidate.currentLocation)) {
    return false
  }

  // 4. Caste - use intelligent matching
  if (!isCasteMatch(seeker.caste, seeker.prefCaste, candidate.caste)) {
    // Only hard filter if "same caste ONLY" and clearly different caste
    const prefLower = (seeker.prefCaste || '').toLowerCase()
    if (prefLower.includes('only')) {
      return false
    }
  }

  // 5. Diet check (can be a dealbreaker for vegetarians)
  if (!isDietMatch(seeker.prefDiet, candidate.dietaryPreference)) {
    // Vegetarian preference is usually strict
    const prefLower = (seeker.prefDiet || '').toLowerCase()
    if (prefLower.includes('vegetarian') || prefLower === 'veg') {
      return false
    }
  }

  // 6. Gotra check (traditional requirement)
  if (!isGotraMatch(seeker.gotra, seeker.prefGotra, candidate.gotra)) {
    return false
  }

  // 7. Education check - HARD FILTER for specific preferences
  // Category-based preferences (medical_masters, eng_masters, etc.) are strict requirements
  if (!isEducationMatch(seeker.prefQualification, candidate.qualification)) {
    return false
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
function isPrefSet(pref: string | null): boolean {
  if (!pref) return false
  const lower = pref.toLowerCase().trim()
  return lower !== "" && lower !== "doesn't matter" && lower !== "any" && lower !== "no preference"
}

/**
 * Calculate match score between seeker and candidate
 * Returns a score object with total percentage and individual criteria scores
 * Shows ALL criteria for transparency
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
  }[]
} {
  const criteria: {
    name: string
    matched: boolean
    seekerPref: string | null
    candidateValue: string | null
  }[] = []

  let matchedCount = 0
  let totalCriteria = 0

  const seekerAge = calculateAgeFromDOB(seeker.dateOfBirth)
  const candidateAge = calculateAgeFromDOB(candidate.dateOfBirth)

  // 1. Age match
  let ageMatched = true
  if (isPrefSet(seeker.prefAgeDiff)) {
    totalCriteria++
    const ageRange = parseAgePreference(seeker.prefAgeDiff, seekerAge)
    if (candidateAge !== null && ageRange !== null) {
      ageMatched = candidateAge >= ageRange.min && candidateAge <= ageRange.max
    }
    if (ageMatched) matchedCount++
  }

  criteria.push({
    name: 'Age',
    matched: ageMatched,
    seekerPref: seeker.prefAgeDiff || "Doesn't matter",
    candidateValue: candidateAge ? `${candidateAge} years` : 'Not specified'
  })

  // 2. Height match
  let heightMatched = true
  if (isPrefSet(seeker.prefHeight)) {
    totalCriteria++
    heightMatched = !!candidate.height
    if (heightMatched) matchedCount++
  }

  criteria.push({
    name: 'Height',
    matched: heightMatched,
    seekerPref: seeker.prefHeight || "Doesn't matter",
    candidateValue: candidate.height || 'Not specified'
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
    candidateValue: candidate.currentLocation || 'Not specified'
  })

  // 4. Caste match
  let casteMatched = true
  if (isPrefSet(seeker.prefCaste)) {
    totalCriteria++
    casteMatched = isCasteMatch(seeker.caste, seeker.prefCaste, candidate.caste)
    if (casteMatched) matchedCount++
  }

  criteria.push({
    name: 'Caste',
    matched: casteMatched,
    seekerPref: seeker.prefCaste || "Doesn't matter",
    candidateValue: candidate.caste || 'Not specified'
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
    candidateValue: candidate.gotra || 'Not specified'
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
    candidateValue: candidate.dietaryPreference || 'Not specified'
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
    candidateValue: candidate.qualification || 'Not specified'
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
