import { PrismaClient } from '@prisma/client'
import { isMutualMatch, matchesSeekerPreferences } from '../src/lib/matching'

const prisma = new PrismaClient()

async function testMatching() {
  console.log('=== TESTING MATCHING (BRAHMIN VEGETARIAN FEMALE) ===\n')

  // Get Novely Joshi - Brahmin, Vegetarian, flexible prefs
  const testProfile = await prisma.profile.findFirst({
    where: {
      gender: 'female',
      approvalStatus: 'approved',
      prefLocation: 'doesnt_matter',
      caste: { contains: 'Brahmin' },
      dietaryPreference: 'Vegetarian'
    },
    include: { user: { select: { name: true } } }
  })

  if (!testProfile) {
    console.log('No matching profile found')

    // Try lakshmi talupur instead
    const alt = await prisma.profile.findFirst({
      where: { user: { name: { contains: 'lakshmi' } } },
      include: { user: { select: { name: true } } }
    })
    if (alt) {
      console.log(`\nFound alt profile: ${alt.user.name}`)
      console.log(`Caste: ${alt.caste}`)
      console.log(`Diet: ${alt.dietaryPreference}`)
      console.log(`Pref Location: ${alt.prefLocation}`)
    }
    return
  }

  console.log(`Testing as: ${testProfile.user.name}`)
  console.log(`Location: ${testProfile.currentLocation}`)
  console.log(`Pref Location: ${testProfile.prefLocation}`)
  console.log(`Qualification: ${testProfile.qualification}`)
  console.log(`Pref Qualification: ${testProfile.prefQualification}`)
  console.log(`Caste: ${testProfile.caste}`)
  console.log(`Pref Caste: ${testProfile.prefCaste}`)
  console.log(`Diet: ${testProfile.dietaryPreference}`)
  console.log(`Pref Diet: ${testProfile.prefDiet}`)
  console.log('')

  // Get all opposite gender profiles
  const candidates = await prisma.profile.findMany({
    where: {
      gender: 'male',
      isActive: true,
      approvalStatus: 'approved',
      userId: { not: testProfile.userId }
    },
    include: { user: { select: { name: true } } }
  })

  console.log(`Found ${candidates.length} male candidates\n`)

  let matchCount = 0
  for (const candidate of candidates) {
    const theyMatchMyPrefs = matchesSeekerPreferences(testProfile, candidate)
    const iMatchTheirPrefs = matchesSeekerPreferences(candidate, testProfile)
    const isMutual = isMutualMatch(testProfile, candidate)

    if (isMutual) {
      matchCount++
      console.log(`✅ MATCH: ${candidate.user.name}`)
    } else {
      const issues: string[] = []
      if (!theyMatchMyPrefs) issues.push('He fails my prefs')
      if (!iMatchTheirPrefs) issues.push('I fail his prefs')
      console.log(`❌ ${candidate.user.name}: ${issues.join(', ')}`)

      // Show specific issues for debugging
      if (!iMatchTheirPrefs && candidate.prefLocation && candidate.prefLocation !== 'doesnt_matter' && candidate.prefLocation !== 'usa') {
        console.log(`   Location: My "${testProfile.currentLocation}" vs wants "${candidate.prefLocation}"`)
      }
    }
  }

  console.log(`\n=== RESULT: ${matchCount} matches out of ${candidates.length} candidates ===`)

  await prisma.$disconnect()
}

testMatching().catch(console.error)
