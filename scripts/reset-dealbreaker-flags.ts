/**
 * Migration script to reset all deal-breaker flags to false.
 *
 * This makes the matching more flexible by default.
 * Users can then explicitly mark preferences as "must have" deal-breakers.
 *
 * Run with: npx tsx scripts/reset-dealbreaker-flags.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDealBreakerFlags() {
  console.log('Resetting all deal-breaker flags to false...')

  // Update all profiles to set all deal-breaker flags to false
  const result = await prisma.profile.updateMany({
    data: {
      prefAgeIsDealbreaker: false,
      prefHeightIsDealbreaker: false,
      prefMaritalStatusIsDealbreaker: false,
      prefCommunityIsDealbreaker: false,
      prefGotraIsDealbreaker: false,
      prefDietIsDealbreaker: false,
      prefSmokingIsDealbreaker: false,
      prefDrinkingIsDealbreaker: false,
      prefLocationIsDealbreaker: false,
      prefCitizenshipIsDealbreaker: false,
      prefGrewUpInIsDealbreaker: false,
      prefRelocationIsDealbreaker: false,
      prefEducationIsDealbreaker: false,
      prefWorkAreaIsDealbreaker: false,
      prefIncomeIsDealbreaker: false,
      prefOccupationIsDealbreaker: false,
      prefFamilyValuesIsDealbreaker: false,
      prefFamilyLocationIsDealbreaker: false,
      prefMotherTongueIsDealbreaker: false,
      prefSubCommunityIsDealbreaker: false,
      prefPetsIsDealbreaker: false,
    }
  })

  console.log(`Reset deal-breaker flags for ${result.count} profiles.`)
  console.log('Matching will now be more flexible - preferences are "nice to have" by default.')
}

resetDealBreakerFlags()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
