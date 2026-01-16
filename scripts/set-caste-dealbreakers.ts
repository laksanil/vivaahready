/**
 * Set prefCommunityIsDealbreaker to true for profiles where prefCaste was "Same Caste only"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setDealbreakers() {
  console.log('Setting deal-breaker flags for "Same Caste only" preferences...\n')

  // Get all profiles where prefCaste indicates "Same Caste only"
  const profiles = await prisma.profile.findMany({
    where: {
      prefCaste: { contains: 'Same Caste', mode: 'insensitive' },
    },
    select: {
      id: true,
      prefCaste: true,
      prefCommunity: true,
      prefCommunityIsDealbreaker: true,
      user: { select: { name: true } }
    }
  })

  console.log(`Found ${profiles.length} profiles with "Same Caste only" preference\n`)

  let updated = 0

  for (const profile of profiles) {
    if (!profile.prefCommunityIsDealbreaker) {
      console.log(`${profile.user.name}:`)
      console.log(`  prefCaste: "${profile.prefCaste}"`)
      console.log(`  prefCommunity: "${profile.prefCommunity}"`)
      console.log(`  → Setting prefCommunityIsDealbreaker: true`)
      console.log('')

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          prefCommunityIsDealbreaker: true,
        }
      })
      updated++
    }
  }

  console.log(`\nDone! Updated ${updated} profiles with deal-breaker flag.`)
}

setDealbreakers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
