import { PrismaClient } from '@prisma/client'
import { isMutualMatch, matchesSeekerPreferences } from '../src/lib/matching'

const prisma = new PrismaClient()

async function testMatching() {
  console.log('=== TESTING MATCHING ALGORITHM (FLEXIBLE PROFILES) ===\n')

  // Get a female profile with flexible location preference
  const testProfile = await prisma.profile.findFirst({
    where: {
      gender: 'female',
      approvalStatus: 'approved',
      OR: [
        { prefLocation: 'doesnt_matter' },
        { prefLocation: 'usa' },
        { prefLocation: null }
      ]
    },
    include: { user: { select: { name: true } } }
  })

  if (!testProfile) {
    console.log('No approved female profile with flexible location found')
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
      console.log(`   His location: ${candidate.currentLocation}`)
      console.log(`   His qual: ${candidate.qualification}`)
    } else {
      console.log(`❌ ${candidate.user.name}:`)
      if (!theyMatchMyPrefs) {
        console.log(`   - HE doesn't match MY preferences`)
      }
      if (!iMatchTheirPrefs) {
        console.log(`   - I don't match HIS preferences`)
        if (candidate.prefLocation && candidate.prefLocation !== 'doesnt_matter') {
          console.log(`     Location issue: My loc "${testProfile.currentLocation}", He wants "${candidate.prefLocation}"`)
        }
        if (candidate.prefQualification && candidate.prefQualification !== 'doesnt_matter') {
          console.log(`     Education issue: My qual "${testProfile.qualification}", He wants "${candidate.prefQualification}"`)
        }
        if (candidate.prefCaste && !['Doesn\'t Matter', 'doesnt_matter', 'any'].includes(candidate.prefCaste)) {
          console.log(`     Caste issue: My caste "${testProfile.caste}", He wants "${candidate.prefCaste}"`)
        }
        if (candidate.prefDiet && !['Doesn\'t Matter', 'doesnt_matter', 'any'].includes(candidate.prefDiet)) {
          console.log(`     Diet issue: My diet "${testProfile.dietaryPreference}", He wants "${candidate.prefDiet}"`)
        }
      }
    }
    console.log('')
  }

  console.log(`\n=== RESULT: ${matchCount} matches out of ${candidates.length} candidates ===`)

  await prisma.$disconnect()
}

testMatching().catch(console.error)
