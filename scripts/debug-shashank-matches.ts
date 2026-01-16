import { PrismaClient } from '@prisma/client'
import { isMutualMatch, matchesSeekerPreferences } from '../src/lib/matching'

const prisma = new PrismaClient()

async function check() {
  // Get Shashank's profile
  const shashank = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Shashank', mode: 'insensitive' } } },
    include: { user: true }
  })

  // Get Aditi's profile
  const aditi = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Aditi Sriram', mode: 'insensitive' } } },
    include: { user: true }
  })

  if (!shashank || !aditi) {
    console.log('Profiles not found')
    return
  }

  console.log('=== SHASHANK\'S PERSPECTIVE ===\n')
  console.log('Shashank:')
  console.log('  qualification:', shashank.qualification)
  console.log('  prefQualification:', shashank.prefQualification)
  console.log('  prefEducationIsDealbreaker:', shashank.prefEducationIsDealbreaker)
  console.log('')
  console.log('Aditi:')
  console.log('  qualification:', aditi.qualification)
  console.log('  prefQualification:', aditi.prefQualification)
  console.log('  prefEducationIsDealbreaker:', aditi.prefEducationIsDealbreaker)
  console.log('')

  // Test 1: Does Aditi match Shashank's preferences?
  console.log('Test 1: Does Aditi match Shashank\'s preferences?')
  const aditiMatchesShashank = matchesSeekerPreferences(shashank, aditi)
  console.log('Result:', aditiMatchesShashank)
  console.log('')

  // Test 2: Does Shashank match Aditi's preferences?
  console.log('Test 2: Does Shashank match Aditi\'s preferences?')
  const shashankMatchesAditi = matchesSeekerPreferences(aditi, shashank)
  console.log('Result:', shashankMatchesAditi)
  console.log('')

  // Test 3: Mutual match (BOTH must be true)
  console.log('Test 3: Is it a MUTUAL match? (Both must match each other\'s prefs)')
  const isMutual = isMutualMatch(shashank, aditi)
  console.log('Result:', isMutual)
  console.log('')

  if (isMutual) {
    console.log('BUG: Should NOT be a mutual match because Shashank doesn\'t meet Aditi\'s education deal-breaker!')
  } else {
    console.log('CORRECT: Not a mutual match. Aditi should NOT appear in Shashank\'s matches.')
  }

  // Also check all of Shashank's actual matches
  console.log('\n=== ALL OF SHASHANK\'S MATCHES ===')
  const candidates = await prisma.profile.findMany({
    where: {
      gender: shashank.gender === 'male' ? 'female' : 'male',
      isActive: true,
      userId: { not: shashank.userId },
    },
    include: { user: { select: { name: true } } }
  })

  const matches = candidates.filter(c => isMutualMatch(shashank, c))
  console.log(`${matches.length} matches found:`)
  matches.forEach(m => console.log(`  - ${m.user.name}`))

  const hasAditi = matches.some(m => m.user.name.toLowerCase().includes('aditi'))
  console.log('\nIs Aditi in matches list?', hasAditi)
}

check().catch(console.error).finally(() => prisma.$disconnect())
