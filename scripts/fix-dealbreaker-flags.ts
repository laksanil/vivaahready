import { prisma } from '../src/lib/prisma'

/**
 * Fix deal-breaker flags for existing profiles
 * Remove deal-breaker flags for fields where user didn't make a selection
 * (i.e., "doesn't matter" or empty values)
 */
async function fixDealbreakerFlags() {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      userId: true,
      firstName: true,
      // Preference values
      prefAgeMin: true,
      prefAgeMax: true,
      prefAgeDiff: true,
      prefHeightMin: true,
      prefHeightMax: true,
      prefHeight: true,
      prefMaritalStatus: true,
      prefHasChildren: true,
      prefCommunity: true,
      prefSubCommunity: true,
      prefGotra: true,
      prefDiet: true,
      prefSmoking: true,
      prefDrinking: true,
      prefLocation: true,
      prefLocationList: true,
      prefCitizenship: true,
      prefGrewUpIn: true,
      prefRelocation: true,
      prefQualification: true,
      prefIncome: true,
      prefOccupation: true,
      prefFamilyValues: true,
      prefFamilyLocation: true,
      prefFamilyLocationCountry: true,
      prefMotherTongue: true,
      prefPets: true,
      prefReligion: true,
      // Deal-breaker flags
      prefAgeIsDealbreaker: true,
      prefHeightIsDealbreaker: true,
      prefMaritalStatusIsDealbreaker: true,
      prefHasChildrenIsDealbreaker: true,
      prefCommunityIsDealbreaker: true,
      prefSubCommunityIsDealbreaker: true,
      prefGotraIsDealbreaker: true,
      prefDietIsDealbreaker: true,
      prefSmokingIsDealbreaker: true,
      prefDrinkingIsDealbreaker: true,
      prefLocationIsDealbreaker: true,
      prefCitizenshipIsDealbreaker: true,
      prefGrewUpInIsDealbreaker: true,
      prefRelocationIsDealbreaker: true,
      prefEducationIsDealbreaker: true,
      prefIncomeIsDealbreaker: true,
      prefOccupationIsDealbreaker: true,
      prefFamilyValuesIsDealbreaker: true,
      prefFamilyLocationIsDealbreaker: true,
      prefMotherTongueIsDealbreaker: true,
      prefPetsIsDealbreaker: true,
      prefReligionIsDealbreaker: true,
      user: { select: { email: true } }
    }
  })

  console.log(`\nChecking ${profiles.length} profiles for incorrect deal-breaker flags...\n`)

  // Helper to check if a preference value is empty/doesn't matter
  const isEmpty = (value: string | null | undefined): boolean => {
    if (!value) return true
    const normalized = value.toLowerCase().trim()
    return normalized === '' ||
           normalized === 'doesnt_matter' ||
           normalized === "doesn't matter" ||
           normalized === 'any' ||
           normalized === 'not specified'
  }

  let totalFixed = 0

  for (const profile of profiles) {
    const updates: Record<string, boolean> = {}

    // Age: check if prefAgeMin/Max or prefAgeDiff is set
    const hasAgePref = !isEmpty(profile.prefAgeMin) || !isEmpty(profile.prefAgeMax) || !isEmpty(profile.prefAgeDiff)
    if (profile.prefAgeIsDealbreaker && !hasAgePref) {
      updates.prefAgeIsDealbreaker = false
    }

    // Height: check if prefHeightMin/Max or prefHeight is set
    const hasHeightPref = !isEmpty(profile.prefHeightMin) || !isEmpty(profile.prefHeightMax) || !isEmpty(profile.prefHeight)
    if (profile.prefHeightIsDealbreaker && !hasHeightPref) {
      updates.prefHeightIsDealbreaker = false
    }

    // Marital Status
    if (profile.prefMaritalStatusIsDealbreaker && isEmpty(profile.prefMaritalStatus)) {
      updates.prefMaritalStatusIsDealbreaker = false
    }

    // Has Children
    if (profile.prefHasChildrenIsDealbreaker && isEmpty(profile.prefHasChildren)) {
      updates.prefHasChildrenIsDealbreaker = false
    }

    // Community
    if (profile.prefCommunityIsDealbreaker && isEmpty(profile.prefCommunity)) {
      updates.prefCommunityIsDealbreaker = false
    }

    // Sub-Community
    if (profile.prefSubCommunityIsDealbreaker && isEmpty(profile.prefSubCommunity)) {
      updates.prefSubCommunityIsDealbreaker = false
    }

    // Gotra
    if (profile.prefGotraIsDealbreaker && isEmpty(profile.prefGotra)) {
      updates.prefGotraIsDealbreaker = false
    }

    // Diet
    if (profile.prefDietIsDealbreaker && isEmpty(profile.prefDiet)) {
      updates.prefDietIsDealbreaker = false
    }

    // Smoking
    if (profile.prefSmokingIsDealbreaker && isEmpty(profile.prefSmoking)) {
      updates.prefSmokingIsDealbreaker = false
    }

    // Drinking
    if (profile.prefDrinkingIsDealbreaker && isEmpty(profile.prefDrinking)) {
      updates.prefDrinkingIsDealbreaker = false
    }

    // Location
    const hasLocationPref = !isEmpty(profile.prefLocation) || !isEmpty(profile.prefLocationList)
    if (profile.prefLocationIsDealbreaker && !hasLocationPref) {
      updates.prefLocationIsDealbreaker = false
    }

    // Citizenship
    if (profile.prefCitizenshipIsDealbreaker && isEmpty(profile.prefCitizenship)) {
      updates.prefCitizenshipIsDealbreaker = false
    }

    // Grew Up In
    if (profile.prefGrewUpInIsDealbreaker && isEmpty(profile.prefGrewUpIn)) {
      updates.prefGrewUpInIsDealbreaker = false
    }

    // Relocation
    if (profile.prefRelocationIsDealbreaker && isEmpty(profile.prefRelocation)) {
      updates.prefRelocationIsDealbreaker = false
    }

    // Education
    if (profile.prefEducationIsDealbreaker && isEmpty(profile.prefQualification)) {
      updates.prefEducationIsDealbreaker = false
    }

    // Income
    if (profile.prefIncomeIsDealbreaker && isEmpty(profile.prefIncome)) {
      updates.prefIncomeIsDealbreaker = false
    }

    // Occupation
    if (profile.prefOccupationIsDealbreaker && isEmpty(profile.prefOccupation)) {
      updates.prefOccupationIsDealbreaker = false
    }

    // Family Values
    if (profile.prefFamilyValuesIsDealbreaker && isEmpty(profile.prefFamilyValues)) {
      updates.prefFamilyValuesIsDealbreaker = false
    }

    // Family Location
    const hasFamilyLocationPref = !isEmpty(profile.prefFamilyLocation) || !isEmpty(profile.prefFamilyLocationCountry)
    if (profile.prefFamilyLocationIsDealbreaker && !hasFamilyLocationPref) {
      updates.prefFamilyLocationIsDealbreaker = false
    }

    // Mother Tongue
    if (profile.prefMotherTongueIsDealbreaker && isEmpty(profile.prefMotherTongue)) {
      updates.prefMotherTongueIsDealbreaker = false
    }

    // Pets
    if (profile.prefPetsIsDealbreaker && isEmpty(profile.prefPets)) {
      updates.prefPetsIsDealbreaker = false
    }

    // Religion
    if (profile.prefReligionIsDealbreaker && isEmpty(profile.prefReligion)) {
      updates.prefReligionIsDealbreaker = false
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      console.log(`Fixing ${profile.firstName || profile.user?.email}: removing ${Object.keys(updates).length} incorrect deal-breaker flags`)
      console.log(`  Removing: ${Object.keys(updates).join(', ')}`)

      await prisma.profile.update({
        where: { id: profile.id },
        data: updates
      })

      totalFixed++
    }
  }

  console.log(`\n✅ Fixed ${totalFixed} profiles with incorrect deal-breaker flags`)
}

fixDealbreakerFlags()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
