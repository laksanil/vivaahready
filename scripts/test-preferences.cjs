#!/usr/bin/env node
/**
 * Comprehensive Partner Preference Test Suite
 *
 * This script tests EACH preference type individually with extensive edge cases.
 * Run specific preference: node scripts/test-preferences.cjs --type diet
 *
 * Preference Types:
 * 1. Diet (vegetarian, non-veg, occasionally non-veg)
 * 2. Location (state, city, proximity, bay area)
 * 3. Community (caste, sub-caste, brahmin variants)
 * 4. Education (levels, medical, specific degrees)
 * 5. Age (range matching)
 * 6. Height (range matching)
 * 7. Marital Status (never married, divorced, etc.)
 * 8. Children (has children, willing to accept)
 *
 * Run: node scripts/test-preferences.cjs
 * Run specific: node scripts/test-preferences.cjs --type location
 * Run with DB: node scripts/test-preferences.cjs --live
 */

const { PrismaClient } = require('@prisma/client');

// ============ HELPER FUNCTIONS ============

function isDealbreaker(value) {
  return value === true || value === 'true';
}

function isPrefSet(pref) {
  if (!pref) return false;
  const lower = pref.toLowerCase().trim();
  return lower !== '' && lower !== "doesn't matter" && lower !== 'doesnt_matter' && lower !== 'any' && lower !== 'no_preference';
}

// ============ 1. DIET MATCHING ============

function isDietMatch(seekerPref, candidateDiet) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateDiet) return { match: false, reason: 'Candidate diet unknown' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidateDiet.toLowerCase().replace(/[_\s-]/g, '');

  // Detect diet types
  const isNonVeg = (d) => d.includes('nonveg') || d.includes('occasionally') || d.includes('meat') || d.includes('eggetarian');
  const isVeg = (d) => !isNonVeg(d) && (d === 'veg' || d.includes('vegetarian') || d === 'pure_veg' || d === 'pureveg');
  const isVegan = (d) => d.includes('vegan');

  // Vegan is strictest
  if (isVegan(pref)) {
    if (isVegan(cand)) return { match: true, reason: 'Both vegan' };
    return { match: false, reason: `Seeker wants vegan, candidate is ${candidateDiet}` };
  }

  // Vegetarian preference
  if (isVeg(pref) || pref === 'pureveg') {
    if (isVeg(cand) || isVegan(cand)) return { match: true, reason: 'Both vegetarian compatible' };
    return { match: false, reason: `Seeker wants vegetarian, candidate is ${candidateDiet}` };
  }

  // Non-veg or flexible preference accepts anyone
  return { match: true, reason: 'Flexible diet preference' };
}

const DIET_TESTS = [
  // ===== VEGETARIAN STRICT =====
  {
    name: 'Diet: Pure Veg accepts Pure Veg',
    pref: 'Pure Vegetarian',
    candidate: 'Vegetarian',
    expected: true,
  },
  {
    name: 'Diet: Pure Veg rejects Occasionally Non-Veg',
    pref: 'Vegetarian',
    candidate: 'Occasionally Non-Veg',
    expected: false,
  },
  {
    name: 'Diet: Pure Veg rejects Non-Vegetarian',
    pref: 'Vegetarian',
    candidate: 'Non Vegetarian',
    expected: false,
  },
  {
    name: 'Diet: Veg accepts Vegan',
    pref: 'Vegetarian',
    candidate: 'Vegan',
    expected: true,
  },
  {
    name: 'Diet: Veg rejects Eggetarian',
    pref: 'Vegetarian',
    candidate: 'Eggetarian',
    expected: false,
  },

  // ===== NON-VEG FLEXIBLE =====
  {
    name: 'Diet: Non-Veg accepts Vegetarian',
    pref: 'Non Vegetarian',
    candidate: 'Vegetarian',
    expected: true,
  },
  {
    name: 'Diet: Non-Veg accepts Non-Veg',
    pref: 'Non Vegetarian',
    candidate: 'Non Vegetarian',
    expected: true,
  },
  {
    name: 'Diet: Non-Veg accepts Occasionally Non-Veg',
    pref: 'Non Vegetarian',
    candidate: 'Occasionally Non-Veg',
    expected: true,
  },

  // ===== NO PREFERENCE =====
  {
    name: 'Diet: doesnt_matter accepts anyone',
    pref: 'doesnt_matter',
    candidate: 'Non Vegetarian',
    expected: true,
  },
  {
    name: 'Diet: null preference accepts anyone',
    pref: null,
    candidate: 'Vegetarian',
    expected: true,
  },
  {
    name: 'Diet: empty string accepts anyone',
    pref: '',
    candidate: 'Occasionally Non-Veg',
    expected: true,
  },

  // ===== EDGE CASES =====
  {
    name: 'Diet: Candidate diet unknown rejects match',
    pref: 'Vegetarian',
    candidate: null,
    expected: false,
  },
  {
    name: 'Diet: Underscore format "pure_veg" works',
    pref: 'pure_veg',
    candidate: 'Vegetarian',
    expected: true,
  },
  {
    name: 'Diet: Case insensitive matching',
    pref: 'VEGETARIAN',
    candidate: 'vegetarian',
    expected: true,
  },
];

// ============ 2. LOCATION MATCHING ============

function isLocationMatch(seekerPref, candidateLocation) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };

  const pref = seekerPref.toLowerCase().trim();

  // Flexible preferences
  const flexiblePrefs = ['doesnt_matter', 'usa', 'open_to_relocation', 'other_state', 'anywhere', 'any'];
  if (flexiblePrefs.includes(pref)) {
    return { match: true, reason: 'Flexible location preference' };
  }

  // Proximity preferences - cannot be geocoded, treat as flexible
  if (pref.includes('within_') || pref === 'same_city' || pref === 'same_state' || pref.includes('miles')) {
    return { match: true, reason: 'Proximity preference (flexible without geocoding)' };
  }

  if (!candidateLocation) return { match: false, reason: 'Candidate location unknown' };

  const cand = candidateLocation.toLowerCase().trim();

  // State mapping with cities (NO state abbreviations to avoid substring bugs like "mo" in "vermont")
  const states = {
    'california': ['california', 'bay area', 'fremont', 'san jose', 'los angeles', 'san francisco', 'oakland', 'palo alto', 'sunnyvale', 'mountain view', 'cupertino', 'santa clara', 'san diego', 'sacramento'],
    'texas': ['texas', 'houston', 'dallas', 'austin', 'san antonio', 'fort worth', 'el paso'],
    'new york': ['new york', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'buffalo'],
    'new jersey': ['new jersey', 'jersey city', 'newark', 'hoboken', 'princeton'],
    'missouri': ['missouri', 'st louis', 'st. louis', 'kansas city', 'springfield'],
    'vermont': ['vermont', 'wells river', 'burlington', 'montpelier'],
    'washington': ['washington', 'seattle', 'tacoma', 'spokane', 'bellevue', 'redmond'],
    'illinois': ['illinois', 'chicago', 'aurora', 'naperville'],
    'massachusetts': ['massachusetts', 'boston', 'cambridge', 'worcester'],
    'georgia': ['georgia', 'atlanta', 'savannah', 'augusta'],
    'virginia': ['virginia', 'richmond', 'norfolk', 'virginia beach', 'arlington'],
    'florida': ['florida', 'miami', 'orlando', 'tampa', 'jacksonville'],
    'pennsylvania': ['pennsylvania', 'philadelphia', 'pittsburgh', 'allentown'],
    'ohio': ['ohio', 'columbus', 'cleveland', 'cincinnati', 'toledo'],
    'michigan': ['michigan', 'detroit', 'ann arbor', 'grand rapids'],
    'arizona': ['arizona', 'phoenix', 'tucson', 'scottsdale', 'mesa'],
    'colorado': ['colorado', 'denver', 'boulder', 'colorado springs'],
    'maryland': ['maryland', 'baltimore', 'bethesda', 'rockville'],
    'north carolina': ['north carolina', 'charlotte', 'raleigh', 'durham', 'chapel hill'],
    'minnesota': ['minnesota', 'minneapolis', 'st paul', 'saint paul'],
    'indiana': ['indiana', 'indianapolis', 'fort wayne'],
    'tennessee': ['tennessee', 'nashville', 'memphis', 'knoxville'],
    'connecticut': ['connecticut', 'hartford', 'new haven', 'stamford'],
  };

  // Bay area special handling
  if (pref === 'bay_area' || pref.includes('bay area')) {
    const bayAreaCities = ['fremont', 'san jose', 'san francisco', 'oakland', 'palo alto', 'sunnyvale', 'mountain view', 'cupertino', 'santa clara', 'milpitas', 'hayward', 'union city', 'newark', 'pleasanton', 'livermore', 'dublin', 'walnut creek', 'concord', 'berkeley', 'daly city', 'redwood city', 'menlo park', 'foster city', 'san mateo', 'burlingame', 'south san francisco'];
    if (bayAreaCities.some(c => cand.includes(c)) || cand.includes('bay area') || cand.includes('sf bay')) {
      return { match: true, reason: 'Both in Bay Area' };
    }
    // California but not bay area
    if (cand.includes('california') && !bayAreaCities.some(c => cand.includes(c))) {
      return { match: false, reason: `Wants Bay Area specifically, candidate in ${candidateLocation}` };
    }
    return { match: false, reason: `Wants Bay Area, candidate in ${candidateLocation}` };
  }

  // Check against state mappings
  for (const [state, keywords] of Object.entries(states)) {
    const prefMatches = pref === state || pref === state.replace(' ', '_') || keywords.some(k => pref === k);
    if (prefMatches) {
      if (cand.includes(state) || keywords.some(k => cand.includes(k))) {
        return { match: true, reason: `Both in ${state}` };
      }
      return { match: false, reason: `Wants ${seekerPref}, candidate in ${candidateLocation}` };
    }
  }

  // Direct substring match for unlisted locations
  if (cand.includes(pref) || pref.includes(cand.split(',')[0]?.trim())) {
    return { match: true, reason: 'Location matches directly' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate in ${candidateLocation}` };
}

const LOCATION_TESTS = [
  // ===== STATE MATCHING =====
  {
    name: 'Location: California preference matches San Jose, CA',
    pref: 'california',
    candidate: 'San Jose, CA',
    expected: true,
  },
  {
    name: 'Location: California preference matches Fremont, California',
    pref: 'california',
    candidate: 'Fremont, California',
    expected: true,
  },
  {
    name: 'Location: Missouri preference rejects Vermont location',
    pref: 'missouri',
    candidate: 'Wells River, Vermont',
    expected: false,
  },
  {
    name: 'Location: Texas preference matches Houston, TX',
    pref: 'texas',
    candidate: 'Houston, TX',
    expected: true,
  },
  {
    name: 'Location: new_york preference matches NYC',
    pref: 'new_york',
    candidate: 'NYC, New York',
    expected: true,
  },

  // ===== BAY AREA SPECIAL =====
  {
    name: 'Location: Bay Area matches Fremont',
    pref: 'bay_area',
    candidate: 'Fremont, CA',
    expected: true,
  },
  {
    name: 'Location: Bay Area matches San Francisco',
    pref: 'bay_area',
    candidate: 'San Francisco, California',
    expected: true,
  },
  {
    name: 'Location: Bay Area matches Mountain View',
    pref: 'bay_area',
    candidate: 'Mountain View, CA',
    expected: true,
  },
  {
    name: 'Location: Bay Area rejects Los Angeles (still California)',
    pref: 'bay_area',
    candidate: 'Los Angeles, California',
    expected: false,
  },
  {
    name: 'Location: Bay Area rejects Texas',
    pref: 'bay_area',
    candidate: 'Houston, TX',
    expected: false,
  },

  // ===== FLEXIBLE PREFERENCES =====
  {
    name: 'Location: doesnt_matter accepts any location',
    pref: 'doesnt_matter',
    candidate: 'Random City, Alaska',
    expected: true,
  },
  {
    name: 'Location: USA preference accepts any US location',
    pref: 'usa',
    candidate: 'Miami, FL',
    expected: true,
  },
  {
    name: 'Location: open_to_relocation accepts any location',
    pref: 'open_to_relocation',
    candidate: 'Seattle, WA',
    expected: true,
  },

  // ===== PROXIMITY (FLEXIBLE) =====
  {
    name: 'Location: within_50_miles is flexible (cannot verify)',
    pref: 'within_50_miles',
    candidate: 'New York, NY',
    expected: true,
  },
  {
    name: 'Location: within_100_miles is flexible',
    pref: 'within_100_miles',
    candidate: 'Tokyo, Japan',
    expected: true,
  },
  {
    name: 'Location: same_city is flexible',
    pref: 'same_city',
    candidate: 'Different City, Different State',
    expected: true,
  },
  {
    name: 'Location: same_state is flexible',
    pref: 'same_state',
    candidate: 'Any City, Any State',
    expected: true,
  },

  // ===== EDGE CASES =====
  {
    name: 'Location: null preference accepts anyone',
    pref: null,
    candidate: 'Anywhere, USA',
    expected: true,
  },
  {
    name: 'Location: Candidate location unknown rejects',
    pref: 'california',
    candidate: null,
    expected: false,
  },
  {
    name: 'Location: Empty candidate location rejects',
    pref: 'texas',
    candidate: '',
    expected: false,
  },

  // ===== BUG FIX: SUBSTRING MATCHING =====
  {
    name: 'Location: Missouri should NOT match Vermont (mo substring bug)',
    pref: 'missouri',
    candidate: 'Wells River, Vermont',
    expected: false,
  },
  {
    name: 'Location: Georgia should NOT match Virginia (a substring)',
    pref: 'georgia',
    candidate: 'Richmond, Virginia',
    expected: false,
  },
];

// ============ 3. COMMUNITY/CASTE MATCHING ============

function isCommunityMatch(seekerCommunity, seekerPref, candidateCommunity) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateCommunity) return { match: false, reason: 'Candidate community unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateCommunity.toLowerCase().trim();

  // "Same caste" preference - match seeker's own caste
  if (pref.includes('same caste') || pref.includes('same_caste') || pref === 'same') {
    if (!seekerCommunity) return { match: false, reason: 'Same caste wanted but seeker has no caste defined' };
    const seeker = seekerCommunity.toLowerCase().trim();

    // Brahmin sub-caste matching (all Brahmin variants match each other)
    const brahminTypes = ['brahmin', 'iyer', 'iyengar', 'smartha', 'madhwa', 'namboodiri', 'saraswat', 'karhade', 'deshastha', 'chitpavan', 'kokanastha', 'gaud', 'maithil', 'bhumihar'];
    const seekerIsBrahmin = brahminTypes.some(b => seeker.includes(b));
    const candIsBrahmin = brahminTypes.some(b => cand.includes(b));
    if (seekerIsBrahmin && candIsBrahmin) {
      return { match: true, reason: 'Both Brahmin (sub-castes considered same)' };
    }

    // Direct match or substring match
    if (cand.includes(seeker) || seeker.includes(cand) || cand === seeker) {
      return { match: true, reason: 'Same community' };
    }

    return { match: false, reason: `Same caste wanted: seeker is ${seekerCommunity}, candidate is ${candidateCommunity}` };
  }

  // Specific community preference (e.g., "Brahmin", "Reddy")
  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Community matches preference' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate is ${candidateCommunity}` };
}

const COMMUNITY_TESTS = [
  // ===== SAME CASTE =====
  {
    name: 'Community: Same caste Brahmin matches Brahmin Iyer',
    seekerCommunity: 'Brahmin',
    pref: 'Same Caste only',
    candidate: 'Brahmin Iyer',
    expected: true,
  },
  {
    name: 'Community: Brahmin Iyer matches Brahmin Iyengar (Brahmin variants)',
    seekerCommunity: 'Brahmin Iyer',
    pref: 'Same Caste only',
    candidate: 'Brahmin Iyengar',
    expected: true,
  },
  {
    name: 'Community: Brahmin rejects Reddy',
    seekerCommunity: 'Brahmin',
    pref: 'Same Caste only',
    candidate: 'Reddy',
    expected: false,
  },
  {
    name: 'Community: Kapu matches Kapu',
    seekerCommunity: 'Kapu',
    pref: 'Same Caste only',
    candidate: 'Kapu',
    expected: true,
  },
  {
    name: 'Community: Kapu rejects Kamma',
    seekerCommunity: 'Kapu',
    pref: 'Same Caste only',
    candidate: 'Kamma',
    expected: false,
  },

  // ===== SPECIFIC PREFERENCE =====
  {
    name: 'Community: Specific "Brahmin" pref matches "Brahmin Smartha"',
    seekerCommunity: 'Reddy',
    pref: 'Brahmin',
    candidate: 'Brahmin Smartha',
    expected: true,
  },
  {
    name: 'Community: Specific "Nair" pref matches "Nair"',
    seekerCommunity: 'Any',
    pref: 'Nair',
    candidate: 'Nair',
    expected: true,
  },
  {
    name: 'Community: Specific "Nair" pref rejects "Menon"',
    seekerCommunity: 'Any',
    pref: 'Nair',
    candidate: 'Menon',
    expected: false,
  },

  // ===== FLEXIBLE =====
  {
    name: 'Community: doesnt_matter accepts anyone',
    seekerCommunity: 'Brahmin',
    pref: 'doesnt_matter',
    candidate: 'Any Community',
    expected: true,
  },
  {
    name: 'Community: null preference accepts anyone',
    seekerCommunity: 'Brahmin',
    pref: null,
    candidate: 'Random Community',
    expected: true,
  },

  // ===== EDGE CASES =====
  {
    name: 'Community: Candidate community unknown rejects',
    seekerCommunity: 'Brahmin',
    pref: 'Same Caste only',
    candidate: null,
    expected: false,
  },
  {
    name: 'Community: Same caste with seeker undefined fails',
    seekerCommunity: null,
    pref: 'Same Caste only',
    candidate: 'Brahmin',
    expected: false,
  },
];

// ============ 4. EDUCATION MATCHING ============

function isEducationMatch(seekerPref, candidateQual) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateQual) return { match: false, reason: 'Candidate qualification unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateQual.toLowerCase().trim();

  // Medical preference (special handling)
  const medicalPrefs = ['medical', 'medical_masters', 'medical_undergrad', 'doctor', 'physician'];
  const medicalQuals = ['md', 'mbbs', 'bds', 'dm', 'mch', 'dm_mch', 'ms', 'doctor', 'physician', 'surgeon'];

  if (medicalPrefs.some(m => pref.includes(m))) {
    if (medicalQuals.some(m => cand.includes(m)) || cand.includes('medical')) {
      return { match: true, reason: 'Medical qualification matches' };
    }
    return { match: false, reason: `Wants medical qualification, candidate has ${candidateQual}` };
  }

  // Engineering preference
  if (pref.includes('engineering') || pref === 'btech' || pref === 'be') {
    if (cand.includes('engineering') || cand.includes('btech') || cand.includes('be') || cand.includes('ms') || cand.includes('mtech')) {
      return { match: true, reason: 'Engineering qualification matches' };
    }
    // Higher qualifications also satisfy
    if (cand.includes('phd') || cand.includes('doctorate')) {
      return { match: true, reason: 'PhD exceeds engineering requirement' };
    }
  }

  // Level-based matching (higher is better)
  const levels = {
    'high_school': 1,
    'diploma': 1.5,
    'undergrad': 2,
    'bachelors': 2,
    'graduate': 2.5,
    'post_graduate': 3,
    'masters': 3,
    'mba': 3,
    'ms': 3,
    'mtech': 3,
    'phd': 4,
    'doctorate': 4,
    'md': 4,
    'dm_mch': 5,
  };

  const prefLevel = levels[pref] || levels[pref.replace('_', '')] || 2;
  let candLevel = 1;
  for (const [qual, level] of Object.entries(levels)) {
    if (cand.includes(qual) || cand.includes(qual.replace('_', ''))) {
      candLevel = Math.max(candLevel, level);
    }
  }

  if (candLevel >= prefLevel) {
    return { match: true, reason: `${candidateQual} (level ${candLevel}) meets ${seekerPref} (level ${prefLevel})` };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate has ${candidateQual}` };
}

const EDUCATION_TESTS = [
  // ===== MEDICAL =====
  {
    name: 'Education: Medical pref matches MD',
    pref: 'medical',
    candidate: 'md',
    expected: true,
  },
  {
    name: 'Education: Medical pref matches MBBS',
    pref: 'medical',
    candidate: 'mbbs',
    expected: true,
  },
  {
    name: 'Education: Medical pref rejects Masters',
    pref: 'medical',
    candidate: 'masters',
    expected: false,
  },
  {
    name: 'Education: Medical pref rejects PhD (non-medical)',
    pref: 'medical',
    candidate: 'phd',
    expected: false,
  },
  {
    name: 'Education: medical_masters matches DM/MCH',
    pref: 'medical_masters',
    candidate: 'dm_mch',
    expected: true,
  },

  // ===== LEVEL MATCHING =====
  {
    name: 'Education: Masters pref accepts PhD',
    pref: 'masters',
    candidate: 'phd',
    expected: true,
  },
  {
    name: 'Education: Masters pref accepts Masters',
    pref: 'masters',
    candidate: 'masters',
    expected: true,
  },
  {
    name: 'Education: Masters pref rejects Bachelors',
    pref: 'masters',
    candidate: 'bachelors',
    expected: false,
  },
  {
    name: 'Education: Bachelors pref accepts Masters',
    pref: 'bachelors',
    candidate: 'masters',
    expected: true,
  },
  {
    name: 'Education: PhD pref accepts PhD',
    pref: 'phd',
    candidate: 'phd',
    expected: true,
  },
  {
    name: 'Education: PhD pref rejects Masters',
    pref: 'phd',
    candidate: 'masters',
    expected: false,
  },

  // ===== FLEXIBLE =====
  {
    name: 'Education: doesnt_matter accepts any qualification',
    pref: 'doesnt_matter',
    candidate: 'high_school',
    expected: true,
  },
  {
    name: 'Education: null preference accepts anyone',
    pref: null,
    candidate: 'bachelors',
    expected: true,
  },

  // ===== EDGE CASES =====
  {
    name: 'Education: Unknown candidate qualification rejects',
    pref: 'masters',
    candidate: null,
    expected: false,
  },
  {
    name: 'Education: undergrad equals bachelors',
    pref: 'undergrad',
    candidate: 'bachelors',
    expected: true,
  },
];

// ============ 5. AGE MATCHING ============

function isAgeMatch(seekerMinAge, seekerMaxAge, candidateAge) {
  if (!seekerMinAge && !seekerMaxAge) return { match: true, reason: 'No age preference set' };
  if (!candidateAge) return { match: false, reason: 'Candidate age unknown' };

  const age = typeof candidateAge === 'number' ? candidateAge : parseInt(candidateAge);
  if (isNaN(age)) return { match: false, reason: 'Invalid candidate age' };

  const minAge = seekerMinAge ? parseInt(seekerMinAge) : 18;
  const maxAge = seekerMaxAge ? parseInt(seekerMaxAge) : 99;

  if (age >= minAge && age <= maxAge) {
    return { match: true, reason: `Age ${age} is within range ${minAge}-${maxAge}` };
  }

  if (age < minAge) {
    return { match: false, reason: `Candidate age ${age} below minimum ${minAge}` };
  }

  return { match: false, reason: `Candidate age ${age} above maximum ${maxAge}` };
}

const AGE_TESTS = [
  {
    name: 'Age: 28 within 25-35 range',
    minAge: 25,
    maxAge: 35,
    candidate: 28,
    expected: true,
  },
  {
    name: 'Age: 25 at minimum boundary passes',
    minAge: 25,
    maxAge: 35,
    candidate: 25,
    expected: true,
  },
  {
    name: 'Age: 35 at maximum boundary passes',
    minAge: 25,
    maxAge: 35,
    candidate: 35,
    expected: true,
  },
  {
    name: 'Age: 24 below minimum fails',
    minAge: 25,
    maxAge: 35,
    candidate: 24,
    expected: false,
  },
  {
    name: 'Age: 36 above maximum fails',
    minAge: 25,
    maxAge: 35,
    candidate: 36,
    expected: false,
  },
  {
    name: 'Age: No preference accepts any age',
    minAge: null,
    maxAge: null,
    candidate: 50,
    expected: true,
  },
  {
    name: 'Age: Only min set, no max (defaults to 99)',
    minAge: 30,
    maxAge: null,
    candidate: 45,
    expected: true,
  },
  {
    name: 'Age: Unknown candidate age fails',
    minAge: 25,
    maxAge: 35,
    candidate: null,
    expected: false,
  },
];

// ============ 6. HEIGHT MATCHING ============

function isHeightMatch(seekerMinHeight, seekerMaxHeight, candidateHeight) {
  if (!seekerMinHeight && !seekerMaxHeight) return { match: true, reason: 'No height preference set' };
  if (!candidateHeight) return { match: false, reason: 'Candidate height unknown' };

  const height = typeof candidateHeight === 'number' ? candidateHeight : parseInt(candidateHeight);
  if (isNaN(height)) return { match: false, reason: 'Invalid candidate height' };

  const minHeight = seekerMinHeight ? parseInt(seekerMinHeight) : 0;
  const maxHeight = seekerMaxHeight ? parseInt(seekerMaxHeight) : 999;

  if (height >= minHeight && height <= maxHeight) {
    return { match: true, reason: `Height ${height}cm is within range ${minHeight}-${maxHeight}cm` };
  }

  if (height < minHeight) {
    return { match: false, reason: `Candidate height ${height}cm below minimum ${minHeight}cm` };
  }

  return { match: false, reason: `Candidate height ${height}cm above maximum ${maxHeight}cm` };
}

const HEIGHT_TESTS = [
  {
    name: 'Height: 170cm within 165-180cm range',
    minHeight: 165,
    maxHeight: 180,
    candidate: 170,
    expected: true,
  },
  {
    name: 'Height: At minimum boundary passes',
    minHeight: 165,
    maxHeight: 180,
    candidate: 165,
    expected: true,
  },
  {
    name: 'Height: Below minimum fails',
    minHeight: 165,
    maxHeight: 180,
    candidate: 160,
    expected: false,
  },
  {
    name: 'Height: Above maximum fails',
    minHeight: 165,
    maxHeight: 180,
    candidate: 185,
    expected: false,
  },
  {
    name: 'Height: No preference accepts any height',
    minHeight: null,
    maxHeight: null,
    candidate: 150,
    expected: true,
  },
];

// ============ 7. MARITAL STATUS MATCHING ============

function isMaritalStatusMatch(seekerPref, candidateStatus) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateStatus) return { match: false, reason: 'Candidate marital status unknown' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidateStatus.toLowerCase().replace(/[_\s-]/g, '');

  // "Never married only" preference
  if (pref.includes('nevermarried') || pref === 'single') {
    if (cand.includes('nevermarried') || cand === 'single') {
      return { match: true, reason: 'Both never married' };
    }
    return { match: false, reason: `Wants never married, candidate is ${candidateStatus}` };
  }

  // "Divorced ok" or flexible
  if (pref.includes('divorcedok') || pref.includes('anymaritalstatus') || pref === 'any') {
    return { match: true, reason: 'Flexible marital status preference' };
  }

  // Direct match
  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Marital status matches' };
  }

  return { match: true, reason: 'Default: marital status flexible' };
}

const MARITAL_STATUS_TESTS = [
  {
    name: 'MaritalStatus: Never married pref matches Never Married',
    pref: 'never_married',
    candidate: 'Never Married',
    expected: true,
  },
  {
    name: 'MaritalStatus: Never married pref rejects Divorced',
    pref: 'never_married',
    candidate: 'Divorced',
    expected: false,
  },
  {
    name: 'MaritalStatus: Never married pref rejects Widowed',
    pref: 'never_married',
    candidate: 'Widowed',
    expected: false,
  },
  {
    name: 'MaritalStatus: Divorced ok accepts Divorced',
    pref: 'divorced_ok',
    candidate: 'Divorced',
    expected: true,
  },
  {
    name: 'MaritalStatus: Divorced ok accepts Never Married',
    pref: 'divorced_ok',
    candidate: 'Never Married',
    expected: true,
  },
  {
    name: 'MaritalStatus: Any accepts all',
    pref: 'any_marital_status',
    candidate: 'Widowed',
    expected: true,
  },
  {
    name: 'MaritalStatus: No preference accepts anyone',
    pref: null,
    candidate: 'Divorced',
    expected: true,
  },
];

// ============ 8. CHILDREN MATCHING ============

function isChildrenMatch(seekerPref, candidateHasChildren) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidateHasChildren ? candidateHasChildren.toLowerCase().replace(/[_\s-]/g, '') : 'none';

  // "No children" preference
  if (pref.includes('nochildren') || pref.includes('withoutchildren') || pref === 'none') {
    if (cand === 'none' || cand === 'no' || !candidateHasChildren) {
      return { match: true, reason: 'Candidate has no children' };
    }
    return { match: false, reason: `Wants no children, candidate has ${candidateHasChildren}` };
  }

  // "Children ok" or flexible
  if (pref.includes('childrenok') || pref.includes('acceptable') || pref === 'any') {
    return { match: true, reason: 'Flexible children preference' };
  }

  return { match: true, reason: 'Default: children preference flexible' };
}

const CHILDREN_TESTS = [
  {
    name: 'Children: No children pref matches candidate with none',
    pref: 'no_children',
    candidate: null,
    expected: true,
  },
  {
    name: 'Children: No children pref rejects candidate with children',
    pref: 'no_children',
    candidate: 'Yes, living with me',
    expected: false,
  },
  {
    name: 'Children: Children ok accepts candidate with children',
    pref: 'children_ok',
    candidate: 'Yes, living with me',
    expected: true,
  },
  {
    name: 'Children: Children ok accepts candidate without children',
    pref: 'children_ok',
    candidate: null,
    expected: true,
  },
  {
    name: 'Children: No preference accepts anyone',
    pref: null,
    candidate: 'Yes, not living with me',
    expected: true,
  },
];

// ============ 9. SMOKING MATCHING ============

function isSmokingMatch(seekerPref, candidateSmoking) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateSmoking) return { match: true, reason: 'Candidate smoking status unknown (defaulting to match)' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidateSmoking.toLowerCase().replace(/[_\s-]/g, '');

  // "No smoking" strict
  if (pref === 'no' || pref === 'never' || pref === 'nosmoking') {
    if (cand === 'no' || cand === 'never' || cand === 'nosmoking' || cand.includes('never')) {
      return { match: true, reason: 'Both non-smokers' };
    }
    return { match: false, reason: `Wants non-smoker, candidate ${candidateSmoking}` };
  }

  // "Occasionally ok" accepts occasional and never
  if (pref.includes('occasionally') || pref === 'socialok') {
    if (cand.includes('heavy') || cand.includes('regular') || cand.includes('daily')) {
      return { match: false, reason: `Wants occasional max, candidate ${candidateSmoking}` };
    }
    return { match: true, reason: 'Occasional or never smoking acceptable' };
  }

  return { match: true, reason: 'Flexible smoking preference' };
}

const SMOKING_TESTS = [
  {
    name: 'Smoking: No smoking pref matches non-smoker',
    pref: 'no',
    candidate: 'Never',
    expected: true,
  },
  {
    name: 'Smoking: No smoking pref rejects occasional smoker',
    pref: 'no',
    candidate: 'Occasionally',
    expected: false,
  },
  {
    name: 'Smoking: No smoking pref rejects regular smoker',
    pref: 'no',
    candidate: 'Regular',
    expected: false,
  },
  {
    name: 'Smoking: Occasionally ok accepts non-smoker',
    pref: 'occasionally_ok',
    candidate: 'Never',
    expected: true,
  },
  {
    name: 'Smoking: Occasionally ok accepts occasional',
    pref: 'occasionally_ok',
    candidate: 'Occasionally',
    expected: true,
  },
  {
    name: 'Smoking: Occasionally ok rejects heavy smoker',
    pref: 'occasionally_ok',
    candidate: 'Heavy/Daily',
    expected: false,
  },
  {
    name: 'Smoking: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'Regular',
    expected: true,
  },
];

// ============ 10. DRINKING MATCHING ============

function isDrinkingMatch(seekerPref, candidateDrinking) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateDrinking) return { match: true, reason: 'Candidate drinking status unknown (defaulting to match)' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidateDrinking.toLowerCase().replace(/[_\s-]/g, '');

  // "No drinking" strict
  if (pref === 'no' || pref === 'never' || pref === 'nodrinking' || pref === 'teetotaler') {
    if (cand === 'no' || cand === 'never' || cand === 'nodrinking' || cand.includes('never') || cand === 'teetotaler') {
      return { match: true, reason: 'Both non-drinkers' };
    }
    return { match: false, reason: `Wants non-drinker, candidate ${candidateDrinking}` };
  }

  // "Social ok" accepts social and never
  if (pref.includes('social') || pref.includes('occasionally')) {
    if (cand.includes('heavy') || cand.includes('regular') || cand.includes('daily')) {
      return { match: false, reason: `Wants social max, candidate ${candidateDrinking}` };
    }
    return { match: true, reason: 'Social or never drinking acceptable' };
  }

  return { match: true, reason: 'Flexible drinking preference' };
}

const DRINKING_TESTS = [
  {
    name: 'Drinking: No drinking pref matches non-drinker',
    pref: 'no',
    candidate: 'Never',
    expected: true,
  },
  {
    name: 'Drinking: No drinking pref rejects social drinker',
    pref: 'no',
    candidate: 'Social',
    expected: false,
  },
  {
    name: 'Drinking: Social ok accepts non-drinker',
    pref: 'social_ok',
    candidate: 'Never',
    expected: true,
  },
  {
    name: 'Drinking: Social ok accepts social drinker',
    pref: 'social_ok',
    candidate: 'Social/Occasional',
    expected: true,
  },
  {
    name: 'Drinking: Social ok rejects heavy drinker',
    pref: 'social_ok',
    candidate: 'Heavy/Regular',
    expected: false,
  },
  {
    name: 'Drinking: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'Regular',
    expected: true,
  },
];

// ============ 11. RELIGION MATCHING ============

function isReligionMatch(seekerPref, candidateReligion) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateReligion) return { match: false, reason: 'Candidate religion unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateReligion.toLowerCase().trim();

  if (pref === 'hindu' && cand.includes('hindu')) return { match: true, reason: 'Both Hindu' };
  if (pref === 'muslim' && cand.includes('muslim')) return { match: true, reason: 'Both Muslim' };
  if (pref === 'christian' && cand.includes('christian')) return { match: true, reason: 'Both Christian' };
  if (pref === 'sikh' && cand.includes('sikh')) return { match: true, reason: 'Both Sikh' };
  if (pref === 'jain' && cand.includes('jain')) return { match: true, reason: 'Both Jain' };
  if (pref === 'buddhist' && cand.includes('buddhist')) return { match: true, reason: 'Both Buddhist' };

  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Religion matches' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate is ${candidateReligion}` };
}

const RELIGION_TESTS = [
  {
    name: 'Religion: Hindu pref matches Hindu',
    pref: 'Hindu',
    candidate: 'Hindu',
    expected: true,
  },
  {
    name: 'Religion: Hindu pref rejects Muslim',
    pref: 'Hindu',
    candidate: 'Muslim',
    expected: false,
  },
  {
    name: 'Religion: Hindu pref rejects Christian',
    pref: 'Hindu',
    candidate: 'Christian',
    expected: false,
  },
  {
    name: 'Religion: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'Buddhist',
    expected: true,
  },
  {
    name: 'Religion: Jain pref matches Jain',
    pref: 'Jain',
    candidate: 'Jain',
    expected: true,
  },
];

// ============ 12. GOTRA MATCHING ============

function isGotraMatch(seekerGotra, seekerPref, candidateGotra) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };

  const pref = seekerPref.toLowerCase().trim();

  // "Different gotra" preference (cannot be same)
  if (pref.includes('different') || pref === 'must_be_different') {
    if (!seekerGotra || !candidateGotra) {
      return { match: true, reason: 'Gotra unknown, cannot verify' };
    }
    if (seekerGotra.toLowerCase() !== candidateGotra.toLowerCase()) {
      return { match: true, reason: 'Different gotras' };
    }
    return { match: false, reason: `Same gotra (${seekerGotra}) - not allowed` };
  }

  return { match: true, reason: 'Flexible gotra preference' };
}

const GOTRA_TESTS = [
  {
    name: 'Gotra: Different gotra pref with different gotras passes',
    seekerGotra: 'Kashyap',
    pref: 'Different Gothra',
    candidate: 'Bharadwaj',
    expected: true,
  },
  {
    name: 'Gotra: Different gotra pref with same gotra fails',
    seekerGotra: 'Kashyap',
    pref: 'Different Gothra',
    candidate: 'Kashyap',
    expected: false,
  },
  {
    name: 'Gotra: doesnt_matter accepts same gotra',
    seekerGotra: 'Kashyap',
    pref: 'doesnt_matter',
    candidate: 'Kashyap',
    expected: true,
  },
  {
    name: 'Gotra: Unknown candidate gotra passes (cannot verify)',
    seekerGotra: 'Kashyap',
    pref: 'Different Gothra',
    candidate: null,
    expected: true,
  },
];

// ============ 13. CITIZENSHIP MATCHING ============

function isCitizenshipMatch(seekerPref, candidateCitizenship) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateCitizenship) return { match: false, reason: 'Candidate citizenship unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateCitizenship.toLowerCase().trim();

  // US citizen preference
  if (pref.includes('us') || pref.includes('american') || pref === 'usa') {
    if (cand.includes('us') || cand.includes('american') || cand === 'usa' || cand.includes('citizen')) {
      return { match: true, reason: 'US citizen' };
    }
    // Green card also acceptable usually
    if (cand.includes('green card') || cand.includes('permanent resident')) {
      return { match: true, reason: 'US permanent resident' };
    }
    return { match: false, reason: `Wants US citizen, candidate is ${candidateCitizenship}` };
  }

  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Citizenship matches' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate is ${candidateCitizenship}` };
}

const CITIZENSHIP_TESTS = [
  {
    name: 'Citizenship: US citizen pref matches US Citizen',
    pref: 'US Citizen',
    candidate: 'US Citizen',
    expected: true,
  },
  {
    name: 'Citizenship: US citizen pref matches Green Card',
    pref: 'US Citizen',
    candidate: 'Green Card Holder',
    expected: true,
  },
  {
    name: 'Citizenship: US citizen pref rejects H1B',
    pref: 'US Citizen',
    candidate: 'H1B Visa',
    expected: false,
  },
  {
    name: 'Citizenship: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'Student Visa',
    expected: true,
  },
];

// ============ 14. RELOCATION MATCHING ============

function isRelocationMatch(seekerPref, candidateWilling) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateWilling) return { match: true, reason: 'Candidate relocation status unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateWilling.toLowerCase().trim();

  // Must be willing to relocate
  if (pref === 'willing' || pref === 'must_relocate' || pref === 'required') {
    // Check for "not willing" FIRST before checking for "willing"
    if (cand.includes('not willing') || cand.includes('not_willing') || cand.includes('cannot') || cand.includes('unwilling')) {
      return { match: false, reason: 'Candidate not willing to relocate' };
    }
    if (cand.includes('willing') || cand.includes('yes') || cand.includes('open')) {
      return { match: true, reason: 'Candidate willing to relocate' };
    }
    // Default to no match if unclear
    return { match: false, reason: 'Candidate relocation willingness unclear' };
  }

  return { match: true, reason: 'Flexible relocation preference' };
}

const RELOCATION_TESTS = [
  {
    name: 'Relocation: Willing pref matches willing candidate',
    pref: 'willing',
    candidate: 'Willing to relocate',
    expected: true,
  },
  {
    name: 'Relocation: Willing pref rejects unwilling candidate',
    pref: 'willing',
    candidate: 'Not willing to relocate',
    expected: false,
  },
  {
    name: 'Relocation: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'Not willing',
    expected: true,
  },
];

// ============ 15. INCOME MATCHING ============

function isIncomeMatch(seekerPref, candidateIncome) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateIncome) return { match: true, reason: 'Candidate income unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateIncome.toLowerCase().trim();

  // Parse income levels
  const incomeLevels = {
    'under_50k': 1,
    'below_50000': 1,
    '50k_100k': 2,
    '50000_100000': 2,
    '100k_150k': 3,
    '100000_150000': 3,
    '150k_200k': 4,
    '150000_200000': 4,
    '200k_plus': 5,
    'above_200000': 5,
  };

  const prefLevel = incomeLevels[pref.replace(/[\s,\$]/g, '')] || 0;
  let candLevel = 0;
  for (const [key, level] of Object.entries(incomeLevels)) {
    if (cand.includes(key.replace('_', '')) || cand.includes(key)) {
      candLevel = level;
      break;
    }
  }

  // If we can parse both, candidate should meet or exceed preference
  if (prefLevel > 0 && candLevel > 0) {
    if (candLevel >= prefLevel) {
      return { match: true, reason: 'Candidate income meets preference' };
    }
    return { match: false, reason: `Wants ${seekerPref}, candidate earns ${candidateIncome}` };
  }

  return { match: true, reason: 'Income preference flexible' };
}

const INCOME_TESTS = [
  {
    name: 'Income: 100k+ pref matches 150k earner',
    pref: '100k_150k',
    candidate: '150k_200k',
    expected: true,
  },
  {
    name: 'Income: 100k+ pref matches same level',
    pref: '100k_150k',
    candidate: '100k_150k',
    expected: true,
  },
  {
    name: 'Income: 150k+ pref rejects 50k earner',
    pref: '150k_200k',
    candidate: '50k_100k',
    expected: false,
  },
  {
    name: 'Income: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'under_50k',
    expected: true,
  },
];

// ============ 16. MOTHER TONGUE MATCHING ============

function isMotherTongueMatch(seekerMotherTongue, seekerPref, candidateMotherTongue) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateMotherTongue) return { match: false, reason: 'Candidate mother tongue unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateMotherTongue.toLowerCase().trim();

  // "Same as mine" preference
  if (pref.includes('same') || pref === 'same_as_mine') {
    if (!seekerMotherTongue) return { match: false, reason: 'Same language wanted but seeker has none defined' };
    if (seekerMotherTongue.toLowerCase() === cand) {
      return { match: true, reason: 'Same mother tongue' };
    }
    return { match: false, reason: `Wants same language (${seekerMotherTongue}), candidate speaks ${candidateMotherTongue}` };
  }

  // Specific language preference
  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Mother tongue matches preference' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate speaks ${candidateMotherTongue}` };
}

const MOTHER_TONGUE_TESTS = [
  {
    name: 'MotherTongue: Same as mine matches',
    seekerMotherTongue: 'Telugu',
    pref: 'same_as_mine',
    candidate: 'Telugu',
    expected: true,
  },
  {
    name: 'MotherTongue: Same as mine rejects different',
    seekerMotherTongue: 'Telugu',
    pref: 'same_as_mine',
    candidate: 'Tamil',
    expected: false,
  },
  {
    name: 'MotherTongue: Specific Hindi pref matches Hindi',
    seekerMotherTongue: 'Telugu',
    pref: 'Hindi',
    candidate: 'Hindi',
    expected: true,
  },
  {
    name: 'MotherTongue: doesnt_matter accepts any',
    seekerMotherTongue: 'Telugu',
    pref: 'doesnt_matter',
    candidate: 'Kannada',
    expected: true,
  },
];

// ============ 17. PETS MATCHING ============

function isPetsMatch(seekerPref, candidatePets) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidatePets) return { match: true, reason: 'Candidate pet status unknown' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidatePets.toLowerCase().replace(/[_\s-]/g, '');

  // "No pets" strict
  if (pref === 'nopets' || pref === 'noneallowed') {
    if (cand === 'none' || cand === 'nopets' || cand.includes('no')) {
      return { match: true, reason: 'No pets' };
    }
    return { match: false, reason: `No pets wanted, candidate has ${candidatePets}` };
  }

  // "Must love pets" preference
  if (pref.includes('mustlove') || pref.includes('required')) {
    if (cand.includes('love') || cand.includes('yes') || cand.includes('have')) {
      return { match: true, reason: 'Candidate loves/has pets' };
    }
    return { match: false, reason: 'Must love pets, candidate does not' };
  }

  return { match: true, reason: 'Flexible pets preference' };
}

const PETS_TESTS = [
  {
    name: 'Pets: No pets pref matches no pets candidate',
    pref: 'no_pets',
    candidate: 'None',
    expected: true,
  },
  {
    name: 'Pets: No pets pref rejects pet owner',
    pref: 'no_pets',
    candidate: 'Has dogs',
    expected: false,
  },
  {
    name: 'Pets: Must love pref matches pet lover',
    pref: 'must_love',
    candidate: 'Loves pets',
    expected: true,
  },
  {
    name: 'Pets: Must love pref rejects no pets',
    pref: 'must_love',
    candidate: 'No pets',
    expected: false,
  },
  {
    name: 'Pets: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'Has cats',
    expected: true,
  },
];

// ============ 18. FAMILY VALUES MATCHING ============

function isFamilyValuesMatch(seekerPref, candidateFamilyValues) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateFamilyValues) return { match: true, reason: 'Candidate family values unknown' };

  const pref = seekerPref.toLowerCase().trim();
  const cand = candidateFamilyValues.toLowerCase().trim();

  // Traditional wants traditional
  if (pref === 'traditional') {
    if (cand === 'traditional') return { match: true, reason: 'Both traditional' };
    if (cand === 'liberal') return { match: false, reason: 'Wants traditional, candidate is liberal' };
    return { match: true, reason: 'Moderate acceptable for traditional' }; // moderate is in between
  }

  // Liberal wants liberal or moderate
  if (pref === 'liberal') {
    if (cand === 'liberal' || cand === 'moderate') return { match: true, reason: 'Compatible family values' };
    if (cand === 'traditional') return { match: false, reason: 'Wants liberal, candidate is traditional' };
  }

  // Moderate accepts all
  if (pref === 'moderate') {
    return { match: true, reason: 'Moderate accepts all family values' };
  }

  return { match: true, reason: 'Flexible family values preference' };
}

const FAMILY_VALUES_TESTS = [
  {
    name: 'FamilyValues: Traditional pref matches traditional',
    pref: 'traditional',
    candidate: 'Traditional',
    expected: true,
  },
  {
    name: 'FamilyValues: Traditional pref rejects liberal',
    pref: 'traditional',
    candidate: 'Liberal',
    expected: false,
  },
  {
    name: 'FamilyValues: Liberal pref matches liberal',
    pref: 'liberal',
    candidate: 'Liberal',
    expected: true,
  },
  {
    name: 'FamilyValues: Liberal pref accepts moderate',
    pref: 'liberal',
    candidate: 'Moderate',
    expected: true,
  },
  {
    name: 'FamilyValues: Liberal pref rejects traditional',
    pref: 'liberal',
    candidate: 'Traditional',
    expected: false,
  },
  {
    name: 'FamilyValues: Moderate accepts all',
    pref: 'moderate',
    candidate: 'Traditional',
    expected: true,
  },
  {
    name: 'FamilyValues: doesnt_matter accepts any',
    pref: 'doesnt_matter',
    candidate: 'Liberal',
    expected: true,
  },
];

// ============ TEST RUNNER ============

function runPreferenceTests(prefType = null) {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║           COMPREHENSIVE PARTNER PREFERENCE TEST SUITE                  ║');
  console.log('╠════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Tests each preference type individually with extensive edge cases      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  let totalPassed = 0;
  let totalFailed = 0;

  const runSection = (title, tests, testFn) => {
    if (prefType && !title.toLowerCase().includes(prefType.toLowerCase())) {
      return;
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('═'.repeat(60));

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const result = testFn(test);
      const testPassed = result.match === test.expected;

      if (testPassed) {
        passed++;
        totalPassed++;
        console.log(`✅ ${test.name}`);
      } else {
        failed++;
        totalFailed++;
        console.log(`❌ ${test.name}`);
        console.log(`   Expected: ${test.expected ? 'MATCH' : 'NO MATCH'}`);
        console.log(`   Got: ${result.match ? 'MATCH' : 'NO MATCH'}`);
        console.log(`   Reason: ${result.reason}`);
      }
    }

    console.log(`\n  Section: ${passed}/${tests.length} passed`);
  };

  // Run all sections
  runSection('1. DIET PREFERENCES', DIET_TESTS, (t) => isDietMatch(t.pref, t.candidate));
  runSection('2. LOCATION PREFERENCES', LOCATION_TESTS, (t) => isLocationMatch(t.pref, t.candidate));
  runSection('3. COMMUNITY/CASTE PREFERENCES', COMMUNITY_TESTS, (t) => isCommunityMatch(t.seekerCommunity, t.pref, t.candidate));
  runSection('4. EDUCATION PREFERENCES', EDUCATION_TESTS, (t) => isEducationMatch(t.pref, t.candidate));
  runSection('5. AGE PREFERENCES', AGE_TESTS, (t) => isAgeMatch(t.minAge, t.maxAge, t.candidate));
  runSection('6. HEIGHT PREFERENCES', HEIGHT_TESTS, (t) => isHeightMatch(t.minHeight, t.maxHeight, t.candidate));
  runSection('7. MARITAL STATUS PREFERENCES', MARITAL_STATUS_TESTS, (t) => isMaritalStatusMatch(t.pref, t.candidate));
  runSection('8. CHILDREN PREFERENCES', CHILDREN_TESTS, (t) => isChildrenMatch(t.pref, t.candidate));
  runSection('9. SMOKING PREFERENCES', SMOKING_TESTS, (t) => isSmokingMatch(t.pref, t.candidate));
  runSection('10. DRINKING PREFERENCES', DRINKING_TESTS, (t) => isDrinkingMatch(t.pref, t.candidate));
  runSection('11. RELIGION PREFERENCES', RELIGION_TESTS, (t) => isReligionMatch(t.pref, t.candidate));
  runSection('12. GOTRA PREFERENCES', GOTRA_TESTS, (t) => isGotraMatch(t.seekerGotra, t.pref, t.candidate));
  runSection('13. CITIZENSHIP PREFERENCES', CITIZENSHIP_TESTS, (t) => isCitizenshipMatch(t.pref, t.candidate));
  runSection('14. RELOCATION PREFERENCES', RELOCATION_TESTS, (t) => isRelocationMatch(t.pref, t.candidate));
  runSection('15. INCOME PREFERENCES', INCOME_TESTS, (t) => isIncomeMatch(t.pref, t.candidate));
  runSection('16. MOTHER TONGUE PREFERENCES', MOTHER_TONGUE_TESTS, (t) => isMotherTongueMatch(t.seekerMotherTongue, t.pref, t.candidate));
  runSection('17. PETS PREFERENCES', PETS_TESTS, (t) => isPetsMatch(t.pref, t.candidate));
  runSection('18. FAMILY VALUES PREFERENCES', FAMILY_VALUES_TESTS, (t) => isFamilyValuesMatch(t.pref, t.candidate));

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log(`TOTAL RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('═'.repeat(70));

  if (totalFailed > 0) {
    console.log('\n⚠️  FAILURES DETECTED - Some preference matching logic may have bugs!\n');
    process.exit(1);
  } else {
    console.log('\n✅ All preference tests passed!\n');
    process.exit(0);
  }
}

// ============ MAIN ============

const args = process.argv.slice(2);

if (args.includes('--type')) {
  const idx = args.indexOf('--type');
  const prefType = args[idx + 1];
  runPreferenceTests(prefType);
} else if (args.includes('--help')) {
  console.log(`
Comprehensive Partner Preference Test Suite

Usage:
  node scripts/test-preferences.cjs                   Run all tests
  node scripts/test-preferences.cjs --type diet       Run diet tests only
  node scripts/test-preferences.cjs --type location   Run location tests only
  node scripts/test-preferences.cjs --type community  Run community tests only
  node scripts/test-preferences.cjs --type education  Run education tests only
  node scripts/test-preferences.cjs --type age        Run age tests only
  node scripts/test-preferences.cjs --type height     Run height tests only
  node scripts/test-preferences.cjs --type marital    Run marital status tests only
  node scripts/test-preferences.cjs --type children   Run children tests only
  node scripts/test-preferences.cjs --type smoking    Run smoking tests only
  node scripts/test-preferences.cjs --type drinking   Run drinking tests only
  node scripts/test-preferences.cjs --type religion   Run religion tests only
  node scripts/test-preferences.cjs --type gotra      Run gotra tests only
  node scripts/test-preferences.cjs --type citizenship Run citizenship tests only
  node scripts/test-preferences.cjs --type relocation Run relocation tests only
  node scripts/test-preferences.cjs --type income     Run income tests only
  node scripts/test-preferences.cjs --type tongue     Run mother tongue tests only
  node scripts/test-preferences.cjs --type pets       Run pets tests only
  node scripts/test-preferences.cjs --type family     Run family values tests only
  node scripts/test-preferences.cjs --help            Show this help

Preference Types Tested (18 Total):
  1. Diet (vegetarian, non-veg, occasionally non-veg, vegan)
  2. Location (state, city, bay area, proximity)
  3. Community (caste, sub-caste, brahmin variants)
  4. Education (levels, medical, specific degrees)
  5. Age (range matching)
  6. Height (range matching)
  7. Marital Status (never married, divorced, widowed)
  8. Children (has children, willing to accept)
  9. Smoking (no, occasionally ok, doesn't matter)
  10. Drinking (no, social ok, doesn't matter)
  11. Religion (Hindu, Muslim, Christian, etc.)
  12. Gotra (different gotra, doesn't matter)
  13. Citizenship (US citizen, green card, visa)
  14. Relocation (willing, not required)
  15. Income (level-based matching)
  16. Mother Tongue (same as mine, specific)
  17. Pets (no pets, must love, open to)
  18. Family Values (traditional, moderate, liberal)
`);
} else {
  runPreferenceTests();
}
