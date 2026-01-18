import { prisma } from '../src/lib/prisma'
import { isMutualMatch, matchesSeekerPreferences } from '../src/lib/matching'

async function checkMatchList() {
  // Get test user (seeker)
  const seeker = await prisma.profile.findFirst({
    where: { user: { email: 'lnagasamudra1@gmail.com' } },
    include: { user: { select: { name: true, email: true } } }
  })

  if (!seeker) {
    console.log('Seeker not found')
    return
  }

  console.log(`\n=== Checking matches for: ${seeker.user?.name} (${seeker.user?.email}) ===`)
  console.log(`Gender: ${seeker.gender}`)
  console.log(`Age preference: ${seeker.prefAgeMin} - ${seeker.prefAgeMax} (deal-breaker: ${seeker.prefAgeIsDealbreaker})`)

  // Get all female candidates (what matches/auto API does)
  const candidates = await prisma.profile.findMany({
    where: {
      gender: 'female',
      isActive: true,
      userId: { not: seeker.userId }
    },
    include: { user: { select: { name: true, email: true } } }
  })

  console.log(`\nTotal female candidates: ${candidates.length}`)

  // Filter to mutual matches (same as matches/auto API)
  const mutualMatches = candidates.filter(candidate => isMutualMatch(seeker, candidate))

  console.log(`\nMutual matches (after filtering): ${mutualMatches.length}`)
  console.log('\n--- Profiles that WOULD appear in matches feed ---')

  for (const match of mutualMatches) {
    // Calculate age from DOB
    let age = 'unknown'
    if (match.dateOfBirth) {
      const dobMatch = match.dateOfBirth.match(/(\d+)\/(\d+)\/(\d+)/)
      if (dobMatch) {
        const [, month, day, year] = dobMatch
        const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const today = new Date()
        let calcAge = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calcAge--
        }
        age = calcAge.toString()
      }
    }
    console.log(`  - ${match.user?.name || 'Unknown'} (age: ${age})`)
  }

  // Check specifically for Devi S.
  const devi = candidates.find(c => c.user?.email === 'jayasanthosh608@gmail.com')
  if (devi) {
    console.log('\n--- Specific check for Devi S. ---')
    const isMutual = isMutualMatch(seeker, devi)
    const sheMatchesYourPrefs = matchesSeekerPreferences(seeker, devi)
    const youMatchHerPrefs = matchesSeekerPreferences(devi, seeker)

    console.log(`Devi S. in your match list: ${isMutual}`)
    console.log(`  She matches your prefs: ${sheMatchesYourPrefs}`)
    console.log(`  You match her prefs: ${youMatchHerPrefs}`)

    if (!isMutual) {
      console.log('\n  => Devi S. should NOT appear in your matches feed.')
    }
  }
}

checkMatchList()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
