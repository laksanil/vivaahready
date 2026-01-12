// Test location matching - import the actual function from matching.ts
// Run with: npx tsx scripts/test-location.ts

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

function extractUSState(location: string): string | null {
  const loc = location.toLowerCase()
  const words = loc.split(/[\s,\/\-]+/)

  for (const word of words) {
    if (STATE_FULL_NAMES[word]) {
      return STATE_FULL_NAMES[word]
    }
    if (US_STATES.includes(word) && word.length > 2) {
      return word
    }
  }
  return null
}

function isUSLocation(location: string): boolean {
  const loc = location.toLowerCase()
  if (loc.includes('usa') || loc.includes('united states') || loc.includes('u.s.')) {
    return true
  }
  const words = loc.split(/[\s,\/\-]+/)
  for (const word of words) {
    if (US_STATES.includes(word)) {
      return true
    }
  }
  return false
}

function isLocationMatch(preference: string | null, candidateLocation: string | null): boolean {
  if (!preference || preference.toLowerCase() === "doesn't matter" || preference.toLowerCase() === 'any') {
    return true
  }
  if (!candidateLocation) {
    return true
  }

  const prefLower = preference.toLowerCase().trim()
  const candLower = candidateLocation.toLowerCase().trim()

  // Handle "prefer X" or "preferred X" format
  let actualPref = prefLower
  if (prefLower.startsWith('prefer ')) {
    actualPref = prefLower.replace(/^prefer\s+/i, '').trim()
  } else if (prefLower.includes('preferred') || prefLower.includes('ideal')) {
    actualPref = prefLower.replace(/would be ideal|is ideal|preferred|ideally|prefer/gi, '').trim()
  }

  // If preference is "usa", "us", or "united states"
  if (actualPref === 'usa' || actualPref === 'us' || actualPref === 'united states') {
    return isUSLocation(candidateLocation)
  }

  const prefState = extractUSState(actualPref)
  const candState = extractUSState(candidateLocation)

  // If preference specifies a state, candidate MUST be in that state
  if (prefState) {
    return candState === prefState
  }

  // Check for common area names like "Bay Area"
  if (actualPref.includes('bay area') || actualPref.includes('bay_area')) {
    return candLower.includes('bay area') || candLower.includes('california') || candLower.includes('ca')
  }

  // Direct substring match
  if (candLower.includes(actualPref) || actualPref.includes(candLower)) {
    return true
  }

  return false
}

// Test cases
console.log("=== Location Matching Tests ===\n")

const tests = [
  { pref: "Prefer Texas", loc: "Bay Area, California", expected: false },
  { pref: "Prefer Texas", loc: "Houston, Texas", expected: true },
  { pref: "Prefer Texas", loc: "Dallas, TX", expected: true },
  { pref: "Bay Area", loc: "Fremont, California", expected: true },
  { pref: "California", loc: "Bay Area, California", expected: true },
  { pref: "USA", loc: "Bay Area, California", expected: true },
  { pref: "Doesn't matter", loc: "Anywhere", expected: true },
  { pref: "Texas would be ideal", loc: "California", expected: false },
]

for (const test of tests) {
  const result = isLocationMatch(test.pref, test.loc)
  const status = result === test.expected ? "✓" : "✗"
  console.log(`${status} "${test.pref}" vs "${test.loc}": ${result} (expected: ${test.expected})`)
}
