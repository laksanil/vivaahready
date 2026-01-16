import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Recreate the matching logic inline to debug
const EDUCATION_LEVELS: Record<string, number> = {
  'high_school': 1,
  'undergrad': 2,
  'masters': 3,
  'phd': 4,
}

function getEducationLevel(qualification: string | null | undefined): number {
  if (!qualification) return 0
  const normalized = qualification.toLowerCase().trim()
  if (EDUCATION_LEVELS[normalized] !== undefined) {
    return EDUCATION_LEVELS[normalized]
  }
  for (const [key, level] of Object.entries(EDUCATION_LEVELS)) {
    if (normalized.includes(key)) {
      return level
    }
  }
  return 0
}

const PREF_EDUCATION_CONFIG: Record<string, { type: string; minLevel?: number }> = {
  'undergrad': { type: 'level', minLevel: 2 },
  'masters': { type: 'level', minLevel: 3 },
}

function isEducationMatch(seekerPref: string | null | undefined, candidateQual: string | null | undefined, strict: boolean = false): boolean {
  if (!seekerPref || seekerPref.toLowerCase() === "doesn't matter") {
    return true
  }

  const prefNormalized = seekerPref.toLowerCase().trim()
  const prefConfig = PREF_EDUCATION_CONFIG[prefNormalized]

  if (prefConfig && prefConfig.type === 'level' && prefConfig.minLevel !== undefined) {
    const candidateLevel = getEducationLevel(candidateQual)
    console.log('  candidateLevel:', candidateLevel, 'minLevel:', prefConfig.minLevel, 'strict:', strict)
    if (candidateLevel === 0) return !strict
    return candidateLevel >= prefConfig.minLevel
  }

  return true
}

async function check() {
  const aditi = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Aditi Sriram', mode: 'insensitive' } } },
    include: { user: { select: { name: true } } }
  })

  const shashank = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'Shashank', mode: 'insensitive' } } },
    include: { user: { select: { name: true } } }
  })

  if (aditi && shashank) {
    console.log('Aditi prefQualification:', aditi.prefQualification)
    console.log('Aditi prefEducationIsDealbreaker:', aditi.prefEducationIsDealbreaker)
    console.log('Shashank qualification:', shashank.qualification)
    console.log('')

    const isDB = aditi.prefEducationIsDealbreaker === true
    console.log('isDB:', isDB)

    const matches = isEducationMatch(aditi.prefQualification, shashank.qualification, isDB)
    console.log('Education match result:', matches)
    console.log('')

    if (!matches && isDB) {
      console.log('=> Should FILTER OUT Shashank (deal-breaker not met)')
    } else {
      console.log('=> Should INCLUDE Shashank')
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect())
