import zipcodes from 'zipcodes'

interface ZipCodeInfo {
  zip: string
  latitude: number
  longitude: number
  city: string
  state: string
  country: string
}

/**
 * Look up zip code information
 */
export function lookupZipCode(zipCode: string): ZipCodeInfo | null {
  const info = zipcodes.lookup(zipCode)
  return info || null
}

/**
 * Calculate distance between two zip codes in miles
 * Returns null if either zip code is invalid
 */
export function getDistanceBetweenZipCodes(zip1: string, zip2: string): number | null {
  if (!zip1 || !zip2) return null

  const distance = zipcodes.distance(zip1, zip2)
  return distance || null
}

/**
 * Check if two zip codes are within a certain distance
 */
export function isWithinDistance(zip1: string, zip2: string, maxMiles: number): boolean {
  const distance = getDistanceBetweenZipCodes(zip1, zip2)
  if (distance === null) return false
  return distance <= maxMiles
}

/**
 * Get all zip codes within a radius of a given zip code
 * Note: This can be slow for large radiuses
 */
export function getZipCodesInRadius(zipCode: string, radiusMiles: number): string[] {
  const results = zipcodes.radius(zipCode, radiusMiles)
  if (!results) return []
  // Results can be string[] or ZipCode[] depending on version, handle both
  return results.map((r: string | { zip: string }) => typeof r === 'string' ? r : r.zip)
}

/**
 * Validate if a string is a valid US zip code format
 */
export function isValidZipCodeFormat(zipCode: string): boolean {
  // US zip codes are 5 digits, optionally followed by -4 digits
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zipCode)
}

/**
 * Parse distance preference value and return the miles
 * e.g., "within_100_miles" => 100
 */
export function parseDistancePreference(prefLocation: string | null): number | null {
  if (!prefLocation) return null

  const match = prefLocation.match(/within_(\d+)_miles/)
  if (match) {
    return parseInt(match[1], 10)
  }

  // Handle other cases - no distance filter for these
  if (prefLocation === 'same_country' || prefLocation === 'doesnt_matter' || prefLocation === 'open_to_relocation') {
    return null // No distance filter
  }

  return null
}

/**
 * Check if two profiles match based on location preference
 */
export function matchesLocationPreference(
  seekerZipCode: string | null,
  seekerPrefLocation: string | null,
  candidateZipCode: string | null
): { matches: boolean; distance: number | null; reason: string } {
  // If seeker doesn't care about location
  if (!seekerPrefLocation || seekerPrefLocation === 'doesnt_matter' || seekerPrefLocation === 'open_to_relocation') {
    return { matches: true, distance: null, reason: 'No location preference' }
  }

  // If either party doesn't have a zip code, we can't calculate
  if (!seekerZipCode || !candidateZipCode) {
    return { matches: true, distance: null, reason: 'Zip code not available' }
  }

  // Validate zip codes
  if (!isValidZipCodeFormat(seekerZipCode) || !isValidZipCodeFormat(candidateZipCode)) {
    return { matches: true, distance: null, reason: 'Invalid zip code format' }
  }

  // Handle same_state preference
  if (seekerPrefLocation === 'same_state') {
    const seekerInfo = lookupZipCode(seekerZipCode)
    const candidateInfo = lookupZipCode(candidateZipCode)

    if (!seekerInfo || !candidateInfo) {
      return { matches: true, distance: null, reason: 'Could not lookup zip code' }
    }

    const sameState = seekerInfo.state === candidateInfo.state
    const distance = getDistanceBetweenZipCodes(seekerZipCode, candidateZipCode)

    return {
      matches: sameState,
      distance,
      reason: sameState
        ? `Same state (${seekerInfo.state})`
        : `Different states (${seekerInfo.state} vs ${candidateInfo.state})`
    }
  }

  const maxDistance = parseDistancePreference(seekerPrefLocation)

  // If no distance limit (e.g., same_country)
  if (maxDistance === null) {
    return { matches: true, distance: null, reason: 'No distance limit' }
  }

  const distance = getDistanceBetweenZipCodes(seekerZipCode, candidateZipCode)

  if (distance === null) {
    return { matches: true, distance: null, reason: 'Could not calculate distance' }
  }

  const matches = distance <= maxDistance
  return {
    matches,
    distance,
    reason: matches
      ? `Within ${maxDistance} miles (${Math.round(distance)} miles away)`
      : `Too far (${Math.round(distance)} miles away, max ${maxDistance})`
  }
}
