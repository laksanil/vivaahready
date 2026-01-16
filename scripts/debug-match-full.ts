import { PrismaClient } from '@prisma/client'
import { isMutualMatch, matchesSeekerPreferences, calculateMatchScore } from '../src/lib/matching'

const prisma = new PrismaClient()

async function check() {
  // Find Aditi
  const aditi = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Aditi Sriram', mode: 'insensitive' } } },
  })

  // Find Shashank
  const shashank = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Shashank', mode: 'insensitive' } } },
  })

  if (!aditi || !shashank) {
    console.log('Profiles not found')
    return
  }

  console.log('=== TESTING MATCH ===\n')
  console.log('Aditi (seeker):')
  console.log('  prefQualification:', aditi.prefQualification)
  console.log('  prefEducationIsDealbreaker:', aditi.prefEducationIsDealbreaker)
  console.log('')
  console.log('Shashank (candidate):')
  console.log('  qualification:', shashank.qualification)
  console.log('')

  // Test if Shashank matches Aditi's preferences
  console.log('Testing: Does Shashank match Aditi\'s preferences?')
  const shashankMatchesAditi = matchesSeekerPreferences(aditi, shashank)
  console.log('Result:', shashankMatchesAditi)
  console.log('')

  // Test if Aditi matches Shashank's preferences
  console.log('Testing: Does Aditi match Shashank\'s preferences?')
  const aditiMatchesShashank = matchesSeekerPreferences(shashank, aditi)
  console.log('Result:', aditiMatchesShashank)
  console.log('')

  // Test mutual match
  console.log('Testing: Is it a mutual match?')
  const isMutual = isMutualMatch(aditi, shashank)
  console.log('Result:', isMutual)
  console.log('')

  // Get match score for more details
  console.log('=== MATCH SCORE DETAILS ===')
  const scoreAditiToShashank = calculateMatchScore(aditi, shashank)
  console.log('\nAditi -> Shashank score:', scoreAditiToShashank?.percentage, '%')
  console.log('Criteria:')
  scoreAditiToShashank?.criteria.forEach(c => {
    if (c.isDealbreaker) {
      console.log(`  [DEAL-BREAKER] ${c.name}: ${c.matched ? 'MATCHED' : 'NOT MATCHED'}`)
      console.log(`    Pref: ${c.seekerPref}, Value: ${c.candidateValue}`)
    }
  })
}

check().catch(console.error).finally(() => prisma.$disconnect())
