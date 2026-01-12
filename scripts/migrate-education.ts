/**
 * Migration script to update education values in existing profiles
 *
 * Changes:
 * - "bachelors" -> "undergrad"
 * - "bachelors_eng" -> "undergrad_eng"
 * - "bachelors_cs" -> "undergrad_cs"
 * - "graduate" -> "undergrad" (for preferences)
 * - "post_graduate" -> "masters" (for preferences)
 * - "eng_bachelor" -> "eng_undergrad" (for preferences)
 * - "cs_bachelor" -> "cs_undergrad" (for preferences)
 * - "medical_bachelor" -> "medical_undergrad" (for preferences)
 * - "eng_master" -> "eng_masters" (for preferences)
 * - "cs_master" -> "cs_masters" (for preferences)
 * - "medical_master" -> "medical_masters" (for preferences)
 *
 * Run with: npx tsx scripts/migrate-education.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping for qualification field (what someone has)
const QUALIFICATION_MAPPING: Record<string, string> = {
  'bachelors': 'undergrad',
  'bachelors_eng': 'undergrad_eng',
  'bachelors_cs': 'undergrad_cs',
}

// Mapping for prefQualification field (what someone wants in partner)
const PREF_QUALIFICATION_MAPPING: Record<string, string> = {
  'graduate': 'undergrad',
  'post_graduate': 'masters',
  'eng_bachelor': 'eng_undergrad',
  'eng_master': 'eng_masters',
  'cs_bachelor': 'cs_undergrad',
  'cs_master': 'cs_masters',
  'medical_bachelor': 'medical_undergrad',
  'medical_master': 'medical_masters',
  'bachelors': 'undergrad',
}

async function migrateEducation() {
  console.log('Starting education migration...\n')

  // Get all profiles
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

  console.log(`Found ${profiles.length} profiles to check\n`)

  let qualificationUpdates = 0
  let prefUpdates = 0

  for (const profile of profiles) {
    const updates: { qualification?: string; prefQualification?: string } = {}

    // Check qualification
    if (profile.qualification) {
      const newQual = QUALIFICATION_MAPPING[profile.qualification.toLowerCase()]
      if (newQual) {
        updates.qualification = newQual
        console.log(`[${profile.user.name}] Qualification: "${profile.qualification}" -> "${newQual}"`)
        qualificationUpdates++
      }
    }

    // Check prefQualification
    if (profile.prefQualification) {
      const newPref = PREF_QUALIFICATION_MAPPING[profile.prefQualification.toLowerCase()]
      if (newPref) {
        updates.prefQualification = newPref
        console.log(`[${profile.user.name}] Pref Education: "${profile.prefQualification}" -> "${newPref}"`)
        prefUpdates++
      }
    }

    // Update if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: updates
      })
    }
  }

  console.log('\n--- Migration Summary ---')
  console.log(`Qualification updates: ${qualificationUpdates}`)
  console.log(`Preference updates: ${prefUpdates}`)
  console.log(`Total profiles checked: ${profiles.length}`)
  console.log('Migration complete!')
}

// Run the migration
migrateEducation()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
