/**
 * Normalize age preferences from difference format to actual age ranges
 * Converts values like "< 3 years" or "0 to 5 years difference" to actual age ranges like "25-30"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Parse date of birth in various formats
function parseAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null

  const now = new Date()
  let birthDate: Date | null = null

  // Try various formats
  // MM/DD/YYYY or DD/MM/YYYY
  const slashParts = dateOfBirth.split('/')
  if (slashParts.length === 3) {
    const [a, b, c] = slashParts.map(p => parseInt(p.trim()))
    if (c > 1900) {
      // MM/DD/YYYY or DD/MM/YYYY - assume MM/DD/YYYY for US
      birthDate = new Date(c, a - 1, b)
    }
  } else if (slashParts.length === 2) {
    // MM/YYYY
    const [month, year] = slashParts.map(p => parseInt(p.trim()))
    if (year > 1900) {
      birthDate = new Date(year, month - 1, 15)
    }
  }

  // DD.MM.YYYY
  if (!birthDate) {
    const dotParts = dateOfBirth.split('.')
    if (dotParts.length === 3) {
      const [a, b, c] = dotParts.map(p => parseInt(p.trim()))
      if (c > 1900) {
        birthDate = new Date(c, b - 1, a)
      }
    }
  }

  // Try ISO format YYYY-MM-DD
  if (!birthDate) {
    const isoDate = new Date(dateOfBirth)
    if (!isNaN(isoDate.getTime())) {
      birthDate = isoDate
    }
  }

  if (!birthDate) return null

  const age = now.getFullYear() - birthDate.getFullYear()
  const monthDiff = now.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    return age - 1
  }
  return age
}

// Parse age difference format and return [minAge, maxAge]
function parseAgeDiff(prefAgeDiff: string, userAge: number, gender: string): [number, number] | null {
  const text = prefAgeDiff.toLowerCase().trim()

  // Already in age range format like "27-30" or "28 to 33"
  const rangeMatch = text.match(/(\d+)\s*[-to]+\s*(\d+)/)
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1])
    const b = parseInt(rangeMatch[2])
    // If both are reasonable ages (18-70), assume it's already an age range
    if (a >= 18 && a <= 70 && b >= 18 && b <= 70) {
      return [Math.min(a, b), Math.max(a, b)]
    }
    // If smaller numbers, might be years difference
    if (a < 10 && b < 10) {
      // Years difference format
      if (gender === 'female') {
        // Female looking for male, typically older
        return [userAge, userAge + Math.max(a, b)]
      } else {
        // Male looking for female, typically younger
        return [userAge - Math.max(a, b), userAge]
      }
    }
  }

  // "< 3 years" or "< 5 years" difference format
  const lessThanMatch = text.match(/<\s*(\d+)\s*years?/)
  if (lessThanMatch) {
    const diff = parseInt(lessThanMatch[1])
    if (gender === 'female') {
      // Female looking for male - can be same age to slightly older
      return [userAge - 1, userAge + diff]
    } else {
      // Male looking for female - can be same age to slightly younger
      return [userAge - diff, userAge + 1]
    }
  }

  // "0 to 5 years difference"
  const diffMatch = text.match(/(\d+)\s*to\s*(\d+)\s*years?\s*diff/)
  if (diffMatch) {
    const maxDiff = parseInt(diffMatch[2])
    if (gender === 'female') {
      return [userAge - 2, userAge + maxDiff]
    } else {
      return [userAge - maxDiff, userAge + 2]
    }
  }

  // "Upto35yrs" format
  const uptoMatch = text.match(/upto?\s*(\d+)\s*y/)
  if (uptoMatch) {
    const maxAge = parseInt(uptoMatch[1])
    return [18, maxAge]
  }

  // Single number like "30" could mean max age
  const singleNum = text.match(/^(\d+)$/)
  if (singleNum) {
    const num = parseInt(singleNum[1])
    if (num >= 18 && num <= 70) {
      return [18, num]
    }
  }

  return null
}

async function migrate() {
  console.log('Normalizing age preferences to actual age ranges...\n')

  const profiles = await prisma.profile.findMany({
    where: {
      prefAgeDiff: { not: null }
    },
    select: {
      id: true,
      prefAgeDiff: true,
      prefAgeMin: true,
      prefAgeMax: true,
      dateOfBirth: true,
      gender: true,
      user: { select: { name: true } }
    }
  })

  console.log(`Found ${profiles.length} profiles with prefAgeDiff\n`)

  let updated = 0
  let skipped = 0

  for (const profile of profiles) {
    const userAge = parseAge(profile.dateOfBirth)

    if (!userAge) {
      console.log(`⚠ ${profile.user.name}: Could not parse DOB "${profile.dateOfBirth}"`)
      skipped++
      continue
    }

    const parsed = parseAgeDiff(profile.prefAgeDiff!, userAge, profile.gender)

    if (!parsed) {
      console.log(`⚠ ${profile.user.name}: Could not parse prefAgeDiff "${profile.prefAgeDiff}"`)
      skipped++
      continue
    }

    const [minAge, maxAge] = parsed
    const newPrefAgeDiff = `${minAge}-${maxAge} years`

    console.log(`${profile.user.name} (age ${userAge}):`)
    console.log(`  "${profile.prefAgeDiff}" → "${newPrefAgeDiff}"`)

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        prefAgeDiff: newPrefAgeDiff,
        prefAgeMin: minAge.toString(),
        prefAgeMax: maxAge.toString()
      }
    })
    updated++
  }

  console.log(`\nDone! Updated ${updated} profiles, skipped ${skipped}.`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
