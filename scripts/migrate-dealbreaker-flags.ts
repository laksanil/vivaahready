/**
 * Migration script to set deal-breaker flags for existing profiles.
 *
 * For existing profiles, if a preference field has a value (other than "doesn't matter" or empty),
 * we set the corresponding isDealbreaker flag to true. This ensures existing user preferences
 * are treated as deal-breakers since they explicitly chose those values.
 *
 * Run with: npx tsx scripts/migrate-dealbreaker-flags.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to check if a preference value is "set" (not empty, not "doesn't matter")
function isPrefSet(value: string | null | undefined): boolean {
  if (!value) return false
  const lower = value.toLowerCase().trim()
  return lower !== '' &&
         lower !== "doesn't matter" &&
         lower !== 'doesnt_matter' &&
         lower !== 'any' &&
         lower !== 'no preference'
}

async function migrateDealBreakerFlags() {
  console.log('Starting deal-breaker flag migration...')

  // Get all profiles
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      prefAgeMin: true,
      prefAgeMax: true,
      prefAgeDiff: true,
      prefHeightMin: true,
      prefHeightMax: true,
      prefHeight: true,
      prefMaritalStatus: true,
      prefCommunity: true,
      prefGotra: true,
      prefDiet: true,
      prefSmoking: true,
      prefDrinking: true,
      prefLocation: true,
      prefCitizenship: true,
      prefGrewUpIn: true,
      prefRelocation: true,
      prefQualification: true,
      prefWorkArea: true,
      prefIncome: true,
      prefOccupation: true,
      prefMotherTongue: true,
      prefSubCommunity: true,
      prefPets: true,
    }
  })

  console.log(`Found ${profiles.length} profiles to process`)

  let updatedCount = 0

  for (const profile of profiles) {
    const updates: Record<string, boolean> = {}

    // Check each preference and set deal-breaker flag if preference is set
    if (isPrefSet(profile.prefAgeMin) || isPrefSet(profile.prefAgeMax) || isPrefSet(profile.prefAgeDiff)) {
      updates.prefAgeIsDealbreaker = true
    }

    if (isPrefSet(profile.prefHeightMin) || isPrefSet(profile.prefHeightMax) || isPrefSet(profile.prefHeight)) {
      updates.prefHeightIsDealbreaker = true
    }

    if (isPrefSet(profile.prefMaritalStatus)) {
      updates.prefMaritalStatusIsDealbreaker = true
    }

    if (isPrefSet(profile.prefCommunity)) {
      updates.prefCommunityIsDealbreaker = true
    }

    if (isPrefSet(profile.prefGotra)) {
      updates.prefGotraIsDealbreaker = true
    }

    if (isPrefSet(profile.prefDiet)) {
      updates.prefDietIsDealbreaker = true
    }

    if (isPrefSet(profile.prefSmoking)) {
      updates.prefSmokingIsDealbreaker = true
    }

    if (isPrefSet(profile.prefDrinking)) {
      updates.prefDrinkingIsDealbreaker = true
    }

    if (isPrefSet(profile.prefLocation)) {
      updates.prefLocationIsDealbreaker = true
    }

    if (isPrefSet(profile.prefCitizenship)) {
      updates.prefCitizenshipIsDealbreaker = true
    }

    if (isPrefSet(profile.prefGrewUpIn)) {
      updates.prefGrewUpInIsDealbreaker = true
    }

    if (isPrefSet(profile.prefRelocation)) {
      updates.prefRelocationIsDealbreaker = true
    }

    if (isPrefSet(profile.prefQualification)) {
      updates.prefEducationIsDealbreaker = true
    }

    if (isPrefSet(profile.prefWorkArea)) {
      updates.prefWorkAreaIsDealbreaker = true
    }

    if (isPrefSet(profile.prefIncome)) {
      updates.prefIncomeIsDealbreaker = true
    }

    if (isPrefSet(profile.prefOccupation)) {
      updates.prefOccupationIsDealbreaker = true
    }

    if (isPrefSet(profile.prefMotherTongue)) {
      updates.prefMotherTongueIsDealbreaker = true
    }

    if (isPrefSet(profile.prefSubCommunity)) {
      updates.prefSubCommunityIsDealbreaker = true
    }

    if (isPrefSet(profile.prefPets)) {
      updates.prefPetsIsDealbreaker = true
    }

    // Only update if there are changes to make
    if (Object.keys(updates).length > 0) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: updates
      })
      updatedCount++

      if (updatedCount % 50 === 0) {
        console.log(`Updated ${updatedCount} profiles...`)
      }
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} profiles with deal-breaker flags.`)
}

migrateDealBreakerFlags()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
