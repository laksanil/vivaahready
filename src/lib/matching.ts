/**
 * Matching Algorithm for VivaahReady
 *
 * Matches profiles based on mutual preferences:
 * - Gender (required): Opposite gender
 * - Age: Within preferred age range
 * - Location: Matches preferred location
 * - Caste: Matches preferred caste (if specified)
 * - Diet: Matches preferred diet (if specified)
 * - Qualification: Meets minimum preferred education
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

  // Preferences
  prefAgeDiff: string | null
  prefLocation: string | null
  prefCaste: string | null
  prefDiet: string | null
  prefQualification: string | null
}

/**
 * Calculate age from date of birth
 * Handles both ISO date format and MM/YYYY format
 */
export function calculateAgeFromDOB(dob: string | null): number | null {
  if (!dob) return null

  // Handle MM/YYYY format
  const parts = dob.split('/')
  if (parts.length >= 2) {
    const year = parseInt(parts[parts.length - 1])
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
 * Parse age range from preference string
 * Handles formats like "25-35 years", "25-35", etc.
 */
export function parseAgeRange(prefAgeDiff: string | null): { min: number; max: number } | null {
  if (!prefAgeDiff) return null

  // Extract numbers from string
  const match = prefAgeDiff.match(/(\d+)\s*[-–to]\s*(\d+)/)
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) }
  }

  return null
}

/**
 * Education level hierarchy for comparison
 */
const EDUCATION_LEVELS: Record<string, number> = {
  'high_school': 1,
  'high school': 1,
  'bachelors': 2,
  "bachelor's": 2,
  'bachelor': 2,
  'masters': 3,
  "master's": 3,
  'master': 3,
  'phd': 4,
  'ph.d': 4,
  'doctorate': 4,
  'professional': 4,
  'doctor': 4,
  'md': 4,
}

function getEducationLevel(qualification: string | null): number {
  if (!qualification) return 0
  const normalized = qualification.toLowerCase().trim()

  for (const [key, level] of Object.entries(EDUCATION_LEVELS)) {
    if (normalized.includes(key)) {
      return level
    }
  }

  return 0
}

/**
 * Check if a candidate matches the seeker's preferences
 */
export function matchesSeekerPreferences(
  seeker: ProfileForMatching,
  candidate: ProfileForMatching
): boolean {
  // 1. Gender check (required) - Must be opposite gender
  if (seeker.gender === candidate.gender) return false

  // 2. Age check
  if (seeker.prefAgeDiff) {
    const candidateAge = calculateAgeFromDOB(candidate.dateOfBirth)
    const ageRange = parseAgeRange(seeker.prefAgeDiff)

    if (candidateAge !== null && ageRange !== null) {
      if (candidateAge < ageRange.min || candidateAge > ageRange.max) {
        return false
      }
    }
  }

  // 3. Location check
  if (seeker.prefLocation && seeker.prefLocation.toLowerCase() !== "doesn't matter" && seeker.prefLocation.toLowerCase() !== 'any') {
    if (candidate.currentLocation) {
      const seekerPrefLower = seeker.prefLocation.toLowerCase()
      const candidateLocLower = candidate.currentLocation.toLowerCase()

      // Check if any part of the preference matches the candidate's location
      if (!candidateLocLower.includes(seekerPrefLower) && !seekerPrefLower.includes(candidateLocLower)) {
        return false
      }
    }
  }

  // 4. Caste check
  if (seeker.prefCaste && seeker.prefCaste.toLowerCase() !== "doesn't matter" && seeker.prefCaste.toLowerCase() !== 'any') {
    if (candidate.caste) {
      if (candidate.caste.toLowerCase() !== seeker.prefCaste.toLowerCase()) {
        return false
      }
    }
  }

  // 5. Diet check
  if (seeker.prefDiet && seeker.prefDiet.toLowerCase() !== "doesn't matter" && seeker.prefDiet.toLowerCase() !== 'any') {
    if (candidate.dietaryPreference) {
      // Normalize diet strings for comparison
      const seekerDiet = seeker.prefDiet.toLowerCase().replace(/[_\s]/g, '')
      const candidateDiet = candidate.dietaryPreference.toLowerCase().replace(/[_\s]/g, '')

      if (seekerDiet !== candidateDiet) {
        return false
      }
    }
  }

  // 6. Qualification check
  if (seeker.prefQualification && seeker.prefQualification.toLowerCase() !== "doesn't matter" && seeker.prefQualification.toLowerCase() !== 'any') {
    const seekerMinLevel = getEducationLevel(seeker.prefQualification)
    const candidateLevel = getEducationLevel(candidate.qualification)

    if (seekerMinLevel > 0 && candidateLevel > 0) {
      if (candidateLevel < seekerMinLevel) {
        return false
      }
    }
  }

  return true
}

/**
 * Check if two profiles are a mutual match
 * Both must match each other's preferences
 */
export function isMutualMatch(
  profile1: ProfileForMatching,
  profile2: ProfileForMatching
): boolean {
  return (
    matchesSeekerPreferences(profile1, profile2) &&
    matchesSeekerPreferences(profile2, profile1)
  )
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
