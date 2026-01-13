import { PrismaClient } from '@prisma/client'
import { isMutualMatch, matchesSeekerPreferences } from '../src/lib/matching'

const prisma = new PrismaClient()

async function testMatching() {
  console.log('=== TESTING MATCHING ALGORITHM ===\n')

  // Get an approved female profile to test
  const testProfile = await prisma.profile.findFirst({
    where: {
      gender: 'female',
      approvalStatus: 'approved'
    },
    include: { user: { select: { name: true } } }
  })

  if (!testProfile) {
    console.log('No approved female profile found')
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
      console.log(`❌ ${candidate.user.name}:`)
      if (!theyMatchMyPrefs) {
        console.log(`   - HE doesn't match MY preferences`)
        console.log(`     His location: ${candidate.currentLocation}, I want: ${testProfile.prefLocation}`)
        console.log(`     His qual: ${candidate.qualification}, I want: ${testProfile.prefQualification}`)
        console.log(`     His caste: ${candidate.caste}, I want: ${testProfile.prefCaste}`)
        console.log(`     His diet: ${candidate.dietaryPreference}, I want: ${testProfile.prefDiet}`)
      }
      if (!iMatchTheirPrefs) {
        console.log(`   - I don't match HIS preferences`)
        console.log(`     My location: ${testProfile.currentLocation}, He wants: ${candidate.prefLocation}`)
        console.log(`     My qual: ${testProfile.qualification}, He wants: ${candidate.prefQualification}`)
        console.log(`     My caste: ${testProfile.caste}, He wants: ${candidate.prefCaste}`)
        console.log(`     My diet: ${testProfile.dietaryPreference}, He wants: ${candidate.prefDiet}`)
      }
    }
    console.log('')
  }

  console.log(`\n=== RESULT: ${matchCount} matches out of ${candidates.length} candidates ===`)

  await prisma.$disconnect()
}

testMatching().catch(console.error)
