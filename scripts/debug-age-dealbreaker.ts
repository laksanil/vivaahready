import { prisma } from '../src/lib/prisma'
import { matchesSeekerPreferences, calculateMatchScore, isMutualMatch } from '../src/lib/matching'

async function debugAgeDealbreaker() {
  // Get test user (seeker)
  const seeker = await prisma.profile.findFirst({
    where: { user: { email: 'lnagasamudra1@gmail.com' } },
    include: { user: { select: { name: true, email: true } } }
  })

  if (!seeker) {
    console.log('Seeker not found')
    return
  }

  console.log('\n=== SEEKER (test M.) ===')
  console.log(`Email: ${seeker.user?.email}`)
  console.log(`Gender: ${seeker.gender}`)
  console.log(`Age preference: ${seeker.prefAgeMin} - ${seeker.prefAgeMax}`)
  console.log(`Age deal-breaker: ${seeker.prefAgeIsDealbreaker}`)

  // Get all female candidates
  const candidates = await prisma.profile.findMany({
    where: {
      gender: 'female',
      isActive: true,
      userId: { not: seeker.userId }
    },
    include: { user: { select: { name: true, email: true } } }
  })

  console.log(`\nFound ${candidates.length} female candidates\n`)

  // Test each candidate
  for (const candidate of candidates) {
    // Calculate candidate's age from DOB
    let candidateAge: number | null = null
    if (candidate.dateOfBirth) {
      const dob = candidate.dateOfBirth
      const match = dob.match(/(\d+)\/(\d+)\/(\d+)/)
      if (match) {
        const [, month, day, year] = match
        const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const today = new Date()
        candidateAge = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          candidateAge--
        }
      }
    }

    // Check if candidate passes seeker's preferences
    const passesPrefs = matchesSeekerPreferences(seeker, candidate)
    const matchScore = calculateMatchScore(seeker, candidate)
    const isMutual = isMutualMatch(seeker, candidate)

    // Only log candidates that DON'T match age but somehow pass
    const ageMin = parseInt(seeker.prefAgeMin || '18')
    const ageMax = parseInt(seeker.prefAgeMax || '99')
    const ageMatches = candidateAge !== null && candidateAge >= ageMin && candidateAge <= ageMax

    if (!ageMatches) {
      console.log(`--- Candidate: ${candidate.user?.name || 'Unknown'} ---`)
      console.log(`  DOB: ${candidate.dateOfBirth}`)
      console.log(`  Calculated Age: ${candidateAge}`)
      console.log(`  Seeker's age range: ${ageMin} - ${ageMax}`)
      console.log(`  Age matches: ${ageMatches}`)
      console.log(`  Passes seeker prefs (matchesSeekerPreferences): ${passesPrefs}`)
      console.log(`  Is mutual match: ${isMutual}`)
      console.log(`  Match score - Age criteria:`)
      const ageCrit = matchScore.criteria.find(c => c.name === 'Age')
      if (ageCrit) {
        console.log(`    - matched: ${ageCrit.matched}`)
        console.log(`    - seekerPref: ${ageCrit.seekerPref}`)
        console.log(`    - candidateValue: ${ageCrit.candidateValue}`)
        console.log(`    - isDealbreaker: ${ageCrit.isDealbreaker}`)
      }
      console.log('')
    }
  }
}

debugAgeDealbreaker()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
