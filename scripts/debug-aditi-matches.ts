import { PrismaClient } from '@prisma/client'
import { isMutualMatch } from '../src/lib/matching'

const prisma = new PrismaClient()

async function check() {
  // Get Aditi's profile
  const aditi = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Aditi Sriram', mode: 'insensitive' } } },
    include: { user: true }
  })

  if (!aditi) {
    console.log('Aditi not found')
    return
  }

  console.log('Checking matches for:', aditi.user.name)
  console.log('Gender:', aditi.gender)
  console.log('')

  // Get all opposite gender candidates
  const candidates = await prisma.profile.findMany({
    where: {
      gender: aditi.gender === 'male' ? 'female' : 'male',
      isActive: true,
      userId: { not: aditi.userId },
    },
    include: { user: { select: { name: true } } }
  })

  console.log(`Found ${candidates.length} opposite gender profiles\n`)

  // Check which ones pass mutual match
  const matches: string[] = []
  const nonMatches: { name: string, reason: string }[] = []

  for (const candidate of candidates) {
    const isMatch = isMutualMatch(aditi, candidate)
    if (isMatch) {
      matches.push(candidate.user.name)
    }
  }

  console.log('=== MATCHES ===')
  console.log(`${matches.length} profiles match Aditi:`)
  matches.forEach(name => console.log(`  - ${name}`))

  // Check specifically for Shashank
  const shashank = candidates.find(c => c.user.name.toLowerCase().includes('shashank'))
  if (shashank) {
    console.log('\n=== SHASHANK CHECK ===')
    const isMatch = isMutualMatch(aditi, shashank)
    console.log('Is Shashank in matches?', isMatch)
    if (!isMatch) {
      console.log('Shashank correctly filtered out')
    } else {
      console.log('BUG: Shashank should be filtered out!')
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect())
