/**
 * Migration script: Backfill existing profiles from old `qualification` → new education fields
 *
 * Maps old qualification values (e.g., "masters_cs", "bachelors_eng") to:
 * - educationLevel: the degree tier (bachelors, masters, medical, law, doctorate, etc.)
 * - fieldOfStudy: the broad academic area (engineering, cs_it, business, etc.)
 *
 * Also migrates old prefQualification values that were category-based to the new system.
 *
 * Usage: node scripts/migrate-education-fields.mjs [--dry-run]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const dryRun = process.argv.includes('--dry-run')

// Maps old qualification values → new educationLevel + fieldOfStudy
const QUALIFICATION_MAP = {
  'high_school': { educationLevel: 'high_school' },
  'associates': { educationLevel: 'associates' },
  'bachelors_arts': { educationLevel: 'bachelors', fieldOfStudy: 'arts' },
  'bachelors_science': { educationLevel: 'bachelors', fieldOfStudy: 'science' },
  'bachelors_eng': { educationLevel: 'bachelors', fieldOfStudy: 'engineering' },
  'bachelors_cs': { educationLevel: 'bachelors', fieldOfStudy: 'cs_it' },
  'bba': { educationLevel: 'bachelors', fieldOfStudy: 'business' },
  'bfa': { educationLevel: 'bachelors', fieldOfStudy: 'arts' },
  'bsn': { educationLevel: 'bachelors', fieldOfStudy: 'medical_health' },
  'masters_arts': { educationLevel: 'masters', fieldOfStudy: 'arts' },
  'masters_science': { educationLevel: 'masters', fieldOfStudy: 'science' },
  'masters_eng': { educationLevel: 'masters', fieldOfStudy: 'engineering' },
  'masters_cs': { educationLevel: 'masters', fieldOfStudy: 'cs_it' },
  'mba': { educationLevel: 'mba', fieldOfStudy: 'business' },
  'mfa': { educationLevel: 'masters', fieldOfStudy: 'arts' },
  'mph': { educationLevel: 'masters', fieldOfStudy: 'medical_health' },
  'msw': { educationLevel: 'masters', fieldOfStudy: 'social_sciences' },
  'md': { educationLevel: 'medical', fieldOfStudy: 'medical_health' },
  'do': { educationLevel: 'medical', fieldOfStudy: 'medical_health' },
  'dds': { educationLevel: 'medical', fieldOfStudy: 'medical_health' },
  'pharmd': { educationLevel: 'medical', fieldOfStudy: 'medical_health' },
  'jd': { educationLevel: 'law', fieldOfStudy: 'law_legal' },
  'cpa': { educationLevel: 'masters', fieldOfStudy: 'business' },
  'phd': { educationLevel: 'doctorate' },
  'edd': { educationLevel: 'doctorate', fieldOfStudy: 'education_field' },
  'psyd': { educationLevel: 'doctorate', fieldOfStudy: 'social_sciences' },
}

// Maps old prefQualification category values → new prefQualification + prefFieldOfStudy
const PREF_QUALIFICATION_MAP = {
  // These stay as-is (level-based)
  'doesnt_matter': {},
  'bachelors': {},
  'masters': {},
  // Category-based → split into level + field
  'eng_bachelors': { prefQualification: 'bachelors', prefFieldOfStudy: 'engineering' },
  'eng_masters': { prefQualification: 'masters', prefFieldOfStudy: 'engineering' },
  'cs_bachelors': { prefQualification: 'bachelors', prefFieldOfStudy: 'cs_it' },
  'cs_masters': { prefQualification: 'masters', prefFieldOfStudy: 'cs_it' },
  'medical': { prefQualification: 'medical' },
  'healthcare': { prefQualification: 'medical' },
  'mba': { prefQualification: 'mba' },
  'cpa': { prefQualification: 'masters', prefFieldOfStudy: 'business' },
  'law': { prefQualification: 'law' },
  'doctorate': { prefQualification: 'doctorate' },
}

async function migrate() {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Starting education field migration...`)

  // 1. Migrate qualification → educationLevel + fieldOfStudy
  const profiles = await prisma.profile.findMany({
    where: {
      qualification: { not: null },
      educationLevel: null, // Only profiles that haven't been migrated yet
    },
    select: { id: true, qualification: true },
  })

  console.log(`Found ${profiles.length} profiles to migrate (qualification → educationLevel + fieldOfStudy)`)

  let migrated = 0
  let skipped = 0
  for (const profile of profiles) {
    const mapping = QUALIFICATION_MAP[profile.qualification]
    if (mapping) {
      if (!dryRun) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            educationLevel: mapping.educationLevel,
            fieldOfStudy: mapping.fieldOfStudy || null,
          },
        })
      }
      migrated++
      console.log(`  ${dryRun ? '[DRY] ' : ''}${profile.id}: ${profile.qualification} → level=${mapping.educationLevel}, field=${mapping.fieldOfStudy || 'null'}`)
    } else {
      skipped++
      console.log(`  SKIP ${profile.id}: unknown qualification "${profile.qualification}"`)
    }
  }

  console.log(`\nQualification migration: ${migrated} migrated, ${skipped} skipped`)

  // 2. Migrate prefQualification category values
  const prefProfiles = await prisma.profile.findMany({
    where: {
      prefQualification: { not: null },
    },
    select: { id: true, prefQualification: true, prefFieldOfStudy: true },
  })

  let prefMigrated = 0
  for (const profile of prefProfiles) {
    const mapping = PREF_QUALIFICATION_MAP[profile.prefQualification]
    if (mapping && (mapping.prefQualification || mapping.prefFieldOfStudy)) {
      const updateData = {}
      if (mapping.prefQualification) updateData.prefQualification = mapping.prefQualification
      if (mapping.prefFieldOfStudy && !profile.prefFieldOfStudy) updateData.prefFieldOfStudy = mapping.prefFieldOfStudy

      if (Object.keys(updateData).length > 0) {
        if (!dryRun) {
          await prisma.profile.update({
            where: { id: profile.id },
            data: updateData,
          })
        }
        prefMigrated++
        console.log(`  ${dryRun ? '[DRY] ' : ''}Pref ${profile.id}: ${profile.prefQualification} → ${JSON.stringify(updateData)}`)
      }
    }
  }

  console.log(`\nPreference migration: ${prefMigrated} migrated`)
  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Migration complete!`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
