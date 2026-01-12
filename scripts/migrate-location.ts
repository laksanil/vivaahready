/**
 * Migration script to update location preference values to standard dropdown values
 *
 * Run with: npx tsx scripts/migrate-location.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping for prefLocation field
const PREF_LOCATION_MAPPING: Record<string, string> = {
  // Empty/Any
  '': 'doesnt_matter',
  'n/a': 'doesnt_matter',
  'any': 'doesnt_matter',
  'none': 'doesnt_matter',
  'no preference': 'doesnt_matter',
  'no preference ': 'doesnt_matter',
  "doesn't matter": 'doesnt_matter',
  'flexible': 'doesnt_matter',

  // USA general
  'usa': 'usa',
  'usa ': 'usa',
  'any where in usa': 'usa',
  'any state in usa': 'usa',
  'usa citizen or green card holder': 'usa',
  'usa citizen or green card holder ': 'usa',

  // Bay Area
  'bay area': 'bay_area',
  'bay area ': 'bay_area',
  'bay area ca': 'bay_area',
  'bay area ca ': 'bay_area',
  'within bay area would be preferrable.': 'bay_area',
  'within bay area would be preferrable. ': 'bay_area',
  'in california bay area': 'bay_area',
  'in california bay area ': 'bay_area',
  'first preference located in sf bay area and across us': 'bay_area',
  'bay area (or willing to relocate)': 'bay_area',

  // California
  'california': 'california',
  'california ': 'california',
  'ca': 'california',
  'ca would be ideal': 'california',
  'prefer ca, open to other states within us': 'california',

  // Texas
  'texas': 'texas',
  'prefer texas': 'texas',

  // New York
  'new york': 'new_york',
  'new york city': 'new_york',
  'new york city ': 'new_york',

  // New Jersey
  'new jersey': 'new_jersey',
  'new jersey, texas.': 'new_jersey',
  'new jersey, texas. ': 'new_jersey',

  // Missouri
  'st. louis, mo': 'missouri',

  // Indiana
  'indianapolis but open to reloc. preference central usa (wfh)': 'indiana',

  // Massachusetts
  'within ~1 hour drive of boston, ma': 'massachusetts',

  // Open to relocation
  'open to relocation': 'open_to_relocation',
}

async function migrateLocation() {
  console.log('=== Location Preference Migration ===\n')

  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      prefLocation: true,
      user: { select: { name: true } }
    }
  })

  console.log(`Found ${profiles.length} profiles to process\n`)

  let updates = 0
  const unmapped: string[] = []

  for (const profile of profiles) {
    if (profile.prefLocation) {
      const prefLower = profile.prefLocation.toLowerCase().trim()
      const newPref = PREF_LOCATION_MAPPING[prefLower]

      if (newPref) {
        if (newPref !== profile.prefLocation) {
          await prisma.profile.update({
            where: { id: profile.id },
            data: { prefLocation: newPref }
          })
          console.log(`[${profile.user.name}] "${profile.prefLocation}" -> "${newPref}"`)
          updates++
        }
      } else {
        // Check if it's already a valid value
        const validValues = [
          'doesnt_matter', 'usa', 'bay_area', 'southern_california',
          'california', 'texas', 'new_york', 'new_jersey', 'washington',
          'illinois', 'massachusetts', 'georgia', 'virginia', 'north_carolina',
          'pennsylvania', 'florida', 'colorado', 'arizona', 'maryland',
          'ohio', 'michigan', 'minnesota', 'indiana', 'missouri',
          'other_state', 'open_to_relocation'
        ]
        if (!validValues.includes(prefLower) && !unmapped.includes(profile.prefLocation)) {
          unmapped.push(profile.prefLocation)
        }
      }
    } else {
      // Empty prefLocation - set to doesnt_matter
      await prisma.profile.update({
        where: { id: profile.id },
        data: { prefLocation: 'doesnt_matter' }
      })
      console.log(`[${profile.user.name}] (empty) -> "doesnt_matter"`)
      updates++
    }
  }

  console.log('\n=== Migration Summary ===')
  console.log(`Updates: ${updates}`)
  console.log(`Total profiles: ${profiles.length}`)

  if (unmapped.length > 0) {
    console.log('\n⚠ Unmapped values (need manual review):')
    unmapped.forEach(v => console.log(`   - "${v}"`))
  }

  console.log('\nMigration complete!')
}

migrateLocation()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
