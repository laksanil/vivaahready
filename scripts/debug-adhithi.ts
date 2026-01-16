import { PrismaClient } from '@prisma/client'
import { matchesSeekerPreferences, isMutualMatch } from '../src/lib/matching'

const prisma = new PrismaClient()

async function check() {
  // Get Adhithi's profile
  const adhithi = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Adhithi', mode: 'insensitive' } } },
    include: { user: true }
  })

  // Get Shashank's profile
  const shashank = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Shashank', mode: 'insensitive' } } },
    include: { user: true }
  })

  if (!adhithi || !shashank) {
    console.log('Profiles not found')
    return
  }

  console.log('=== ADHITHI\'S PROFILE ===')
  console.log('Name:', adhithi.user.name)
  console.log('Education:', adhithi.qualification)
  console.log('prefQualification:', adhithi.prefQualification)
  console.log('prefEducationIsDealbreaker:', adhithi.prefEducationIsDealbreaker)
  console.log('')

  console.log('=== SHASHANK\'S PROFILE ===')
  console.log('Name:', shashank.user.name)
  console.log('Education:', shashank.qualification)
  console.log('prefQualification:', shashank.prefQualification)
  console.log('prefEducationIsDealbreaker:', shashank.prefEducationIsDealbreaker)
  console.log('')

  // Test matching
  console.log('=== MATCHING TESTS ===')
  console.log('Does Shashank match Adhithi\'s prefs?', matchesSeekerPreferences(adhithi, shashank))
  console.log('Does Adhithi match Shashank\'s prefs?', matchesSeekerPreferences(shashank, adhithi))
  console.log('Is it a mutual match?', isMutualMatch(shashank, adhithi))
}

check().catch(console.error).finally(() => prisma.$disconnect())
