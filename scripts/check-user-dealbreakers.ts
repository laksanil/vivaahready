import { prisma } from '../src/lib/prisma'

async function checkUserDealbreakers() {
  // Get all profiles and check their deal-breaker flags
  const profiles = await prisma.profile.findMany({
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      prefAgeMin: true,
      prefAgeMax: true,
      prefAgeIsDealbreaker: true,
      prefHeightIsDealbreaker: true,
      prefMaritalStatusIsDealbreaker: true,
      prefCommunityIsDealbreaker: true,
      prefDietIsDealbreaker: true,
      prefSmokingIsDealbreaker: true,
      prefDrinkingIsDealbreaker: true,
      prefLocationIsDealbreaker: true,
      prefEducationIsDealbreaker: true,
      prefIncomeIsDealbreaker: true,
      prefGotraIsDealbreaker: true,
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  })

  console.log('\n=== User Deal-breaker Flags ===\n')

  for (const profile of profiles) {
    console.log(`User: ${profile.user?.name || profile.firstName} (${profile.user?.email})`)
    console.log(`  Age Preference: ${profile.prefAgeMin || '?'} - ${profile.prefAgeMax || '?'} years`)
    console.log('  Deal-breaker Flags:')
    console.log(`    - Age: ${profile.prefAgeIsDealbreaker ?? 'null'}`)
    console.log(`    - Height: ${profile.prefHeightIsDealbreaker ?? 'null'}`)
    console.log(`    - Marital Status: ${profile.prefMaritalStatusIsDealbreaker ?? 'null'}`)
    console.log(`    - Community: ${profile.prefCommunityIsDealbreaker ?? 'null'}`)
    console.log(`    - Diet: ${profile.prefDietIsDealbreaker ?? 'null'}`)
    console.log(`    - Smoking: ${profile.prefSmokingIsDealbreaker ?? 'null'}`)
    console.log(`    - Drinking: ${profile.prefDrinkingIsDealbreaker ?? 'null'}`)
    console.log(`    - Location: ${profile.prefLocationIsDealbreaker ?? 'null'}`)
    console.log(`    - Education: ${profile.prefEducationIsDealbreaker ?? 'null'}`)
    console.log(`    - Income: ${profile.prefIncomeIsDealbreaker ?? 'null'}`)
    console.log(`    - Gotra: ${profile.prefGotraIsDealbreaker ?? 'null'}`)
    console.log('')
  }
}

checkUserDealbreakers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
