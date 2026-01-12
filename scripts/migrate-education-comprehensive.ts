/**
 * Comprehensive migration script to map all education values to standard values
 *
 * Run with: npx tsx scripts/migrate-education-comprehensive.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping for qualification field (what someone has)
// Maps various free-text values to standard dropdown values
const QUALIFICATION_MAPPING: Record<string, string> = {
  // Already standard
  'undergrad': 'undergrad',
  'masters': 'masters',
  'phd': 'phd',
  'mba': 'mba',
  'md': 'md',
  'mbbs': 'mbbs',
  'high_school': 'high_school',

  // Legacy values
  'bachelors': 'undergrad',
  'bachelors_eng': 'undergrad_eng',
  'bachelors_cs': 'undergrad_cs',

  // Free-text mappings (case-insensitive matching)
  'md or pursuing residency': 'md',
  'md or pursuing residency ': 'md',
  'undergrad/grad': 'undergrad',
  'masters / md/ doctorate': 'masters',
  'masters / md/ doctorate ': 'masters',
  'doctor': 'md',
  'masters or higher': 'masters',
  'masters or above': 'masters',
  'bachelors or masters': 'undergrad',
  'us undergraduate or masters or professional degree': 'undergrad',
  'us undergraduate or masters or professional degree ': 'undergrad',
  'any': 'other',
  'any ': 'other',
  'mba, masters': 'mba',
  'mba, masters ': 'mba',
  'masters & above': 'masters',
  'high school': 'high_school',
  'top us university bachkors and above': 'undergrad',
  'ph.d': 'phd',
  'ph.d.': 'phd',
  'not specific': 'other',
  'professional degree/ masters': 'masters',
  'professional degree': 'masters',
  'doctorate': 'phd',
}

// Mapping for prefQualification field (what they want in partner)
const PREF_QUALIFICATION_MAPPING: Record<string, string> = {
  // Already standard
  'undergrad': 'undergrad',
  'masters': 'masters',
  'doesnt_matter': 'doesnt_matter',
  'doctorate': 'doctorate',
  'mba': 'mba',

  // Legacy values
  'graduate': 'undergrad',
  'post_graduate': 'masters',
  'bachelors': 'undergrad',
  'eng_bachelor': 'eng_undergrad',
  'eng_master': 'eng_masters',
  'cs_bachelor': 'cs_undergrad',
  'cs_master': 'cs_masters',
  'medical_bachelor': 'medical_undergrad',
  'medical_master': 'medical_masters',

  // Free-text mappings (case-insensitive matching)
  'md or pursuing residency': 'medical_masters',
  'md or pursuing residency ': 'medical_masters',
  'undergrad/grad': 'undergrad',
  'masters / md/ doctorate': 'masters',
  'masters / md/ doctorate ': 'masters',
  'doctor': 'medical_masters',
  'masters or higher': 'masters',
  'masters or above': 'masters',
  'bachelors or masters': 'undergrad',
  'us undergraduate or masters or professional degree': 'undergrad',
  'us undergraduate or masters or professional degree ': 'undergrad',
  'any': 'doesnt_matter',
  'any ': 'doesnt_matter',
  'mba, masters': 'masters',
  'mba, masters ': 'masters',
  'masters & above': 'masters',
  'top us university bachkors and above': 'undergrad',
  'ph.d': 'doctorate',
  'ph.d.': 'doctorate',
  'phd': 'doctorate',
  'not specific': 'doesnt_matter',
  'professional degree/ masters': 'masters',
  'professional degree': 'masters',
}

async function migrateEducation() {
  console.log('=== Comprehensive Education Migration ===\n')

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

  console.log(`Found ${profiles.length} profiles to process\n`)

  let qualificationUpdates = 0
  let prefUpdates = 0
  const unmappedQual: string[] = []
  const unmappedPref: string[] = []

  for (const profile of profiles) {
    const updates: { qualification?: string; prefQualification?: string } = {}

    // Check and map qualification
    if (profile.qualification) {
      const qualLower = profile.qualification.toLowerCase().trim()
      const newQual = QUALIFICATION_MAPPING[qualLower]

      if (newQual && newQual !== profile.qualification) {
        updates.qualification = newQual
        console.log(`[${profile.user.name}] Qualification: "${profile.qualification}" -> "${newQual}"`)
        qualificationUpdates++
      } else if (!newQual && !['undergrad', 'undergrad_eng', 'undergrad_cs', 'masters', 'masters_eng', 'masters_cs', 'mba', 'md', 'mbbs', 'bds', 'phd', 'dm_mch', 'ca_cpa', 'cs', 'llb', 'llm', 'high_school', 'diploma', 'other'].includes(qualLower)) {
        if (!unmappedQual.includes(profile.qualification)) {
          unmappedQual.push(profile.qualification)
        }
      }
    }

    // Check and map prefQualification
    if (profile.prefQualification) {
      const prefLower = profile.prefQualification.toLowerCase().trim()
      const newPref = PREF_QUALIFICATION_MAPPING[prefLower]

      if (newPref && newPref !== profile.prefQualification) {
        updates.prefQualification = newPref
        console.log(`[${profile.user.name}] Pref Education: "${profile.prefQualification}" -> "${newPref}"`)
        prefUpdates++
      } else if (!newPref && !['undergrad', 'masters', 'doesnt_matter', 'eng_undergrad', 'eng_masters', 'cs_undergrad', 'cs_masters', 'medical_undergrad', 'medical_masters', 'mba', 'ca_professional', 'law', 'doctorate'].includes(prefLower)) {
        if (!unmappedPref.includes(profile.prefQualification)) {
          unmappedPref.push(profile.prefQualification)
        }
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

  console.log('\n=== Migration Summary ===')
  console.log(`Qualification updates: ${qualificationUpdates}`)
  console.log(`Preference updates: ${prefUpdates}`)
  console.log(`Total profiles processed: ${profiles.length}`)

  if (unmappedQual.length > 0) {
    console.log('\n⚠ Unmapped qualification values:')
    unmappedQual.forEach(v => console.log(`   - "${v}"`))
  }

  if (unmappedPref.length > 0) {
    console.log('\n⚠ Unmapped preference values:')
    unmappedPref.forEach(v => console.log(`   - "${v}"`))
  }

  console.log('\nMigration complete!')
}

migrateEducation()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
