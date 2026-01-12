/**
 * Check all education values in the database and verify they map correctly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkEducationValues() {
  console.log('=== Checking Education Values in Database ===\n')

  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      qualification: true,
      prefQualification: true,
      user: {
        select: {
          name: true
        }
      }
    }
  })

  // Collect unique values
  const qualificationValues: Record<string, string[]> = {}
  const prefQualificationValues: Record<string, string[]> = {}

  for (const profile of profiles) {
    const qual = profile.qualification || '(empty)'
    const pref = profile.prefQualification || '(empty)'

    if (!qualificationValues[qual]) qualificationValues[qual] = []
    qualificationValues[qual].push(profile.user.name)

    if (!prefQualificationValues[pref]) prefQualificationValues[pref] = []
    prefQualificationValues[pref].push(profile.user.name)
  }

  console.log('--- Qualification Values (what they have) ---')
  for (const [value, users] of Object.entries(qualificationValues)) {
    console.log(`"${value}": ${users.length} profiles`)
    // Show first 3 users as example
    console.log(`   Examples: ${users.slice(0, 3).join(', ')}${users.length > 3 ? '...' : ''}`)
  }

  console.log('\n--- Preferred Qualification Values (what they want) ---')
  for (const [value, users] of Object.entries(prefQualificationValues)) {
    console.log(`"${value}": ${users.length} profiles`)
    console.log(`   Examples: ${users.slice(0, 3).join(', ')}${users.length > 3 ? '...' : ''}`)
  }

  // Check which values need mapping
  const VALID_QUALIFICATIONS = [
    'high_school', 'diploma',
    'undergrad', 'undergrad_eng', 'undergrad_cs',
    'mbbs', 'bds', 'llb',
    'masters', 'masters_eng', 'masters_cs',
    'mba', 'md', 'ca_cpa', 'cs', 'llm',
    'phd', 'dm_mch', 'other'
  ]

  const VALID_PREF_QUALIFICATIONS = [
    'doesnt_matter', 'undergrad', 'masters',
    'eng_undergrad', 'eng_masters',
    'cs_undergrad', 'cs_masters',
    'medical_undergrad', 'medical_masters',
    'mba', 'ca_professional', 'law', 'doctorate'
  ]

  console.log('\n--- Values Needing Attention ---')

  let needsUpdate = false
  for (const value of Object.keys(qualificationValues)) {
    if (value !== '(empty)' && !VALID_QUALIFICATIONS.includes(value.toLowerCase())) {
      console.log(`⚠ Qualification "${value}" is not in valid list`)
      needsUpdate = true
    }
  }

  for (const value of Object.keys(prefQualificationValues)) {
    if (value !== '(empty)' && !VALID_PREF_QUALIFICATIONS.includes(value.toLowerCase())) {
      console.log(`⚠ Pref Qualification "${value}" is not in valid list`)
      needsUpdate = true
    }
  }

  if (!needsUpdate) {
    console.log('✓ All values are valid!')
  }
}

checkEducationValues()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
