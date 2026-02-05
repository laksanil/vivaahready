/**
 * Migration script to populate prefReligions array from existing prefReligion string
 *
 * Patterns:
 * - "doesnt_matter" / "Doesn't Matter" / null / empty → prefReligions: [] (empty array = any religion is fine)
 * - "Hindu" → prefReligions: ["Hindu"]
 * - Existing array data should be preserved
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Values that mean "any religion is acceptable"
const NO_PREFERENCE_VALUES = [
  'doesnt_matter',
  "doesn't matter",
  'any',
  'no preference',
  ''
]

function isNoPreference(value: string | null | undefined): boolean {
  if (!value) return true
  return NO_PREFERENCE_VALUES.includes(value.toLowerCase().trim())
}

async function migrate() {
  console.log('Starting prefReligion to prefReligions migration...\n')
  console.log('This migration populates the new prefReligions array field from the legacy prefReligion string field.\n')

  // Get all profiles
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      prefReligion: true,
      prefReligions: true,
      user: { select: { name: true, email: true } }
    }
  })

  console.log(`Found ${profiles.length} profiles to check\n`)

  let updated = 0
  let skipped = 0
  let alreadyMigrated = 0

  for (const profile of profiles) {
    // Skip if prefReligions already has data
    if (profile.prefReligions && profile.prefReligions.length > 0) {
      alreadyMigrated++
      continue
    }

    // Check if there's a prefReligion value to migrate
    if (!profile.prefReligion || isNoPreference(profile.prefReligion)) {
      // No preference - set empty array (this is the default anyway)
      skipped++
      continue
    }

    // Has a specific religion preference - convert to array
    const religionArray = [profile.prefReligion]

    console.log(`${profile.user.name} (${profile.user.email}):`)
    console.log(`  prefReligion: "${profile.prefReligion}"`)
    console.log(`  → prefReligions: ${JSON.stringify(religionArray)}`)
    console.log('')

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        prefReligions: religionArray
      }
    })
    updated++
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log('Migration complete!')
  console.log(`${'='.repeat(50)}`)
  console.log(`Updated: ${updated} profiles (prefReligion → prefReligions array)`)
  console.log(`Skipped (no preference/empty): ${skipped} profiles`)
  console.log(`Already migrated: ${alreadyMigrated} profiles`)
  console.log(`\nNote: Empty prefReligions array = "Doesn't Matter" (any religion is acceptable)`)
}

// Dry run option
async function dryRun() {
  console.log('=== DRY RUN MODE ===')
  console.log('No changes will be made to the database.\n')

  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      prefReligion: true,
      prefReligions: true,
      user: { select: { name: true, email: true } }
    }
  })

  let wouldUpdate = 0
  let wouldSkip = 0
  let alreadyMigrated = 0

  for (const profile of profiles) {
    if (profile.prefReligions && profile.prefReligions.length > 0) {
      alreadyMigrated++
      continue
    }

    if (!profile.prefReligion || isNoPreference(profile.prefReligion)) {
      wouldSkip++
      continue
    }

    console.log(`Would update: ${profile.user.name}`)
    console.log(`  "${profile.prefReligion}" → ["${profile.prefReligion}"]`)
    wouldUpdate++
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log('Dry run summary:')
  console.log(`Would update: ${wouldUpdate} profiles`)
  console.log(`Would skip: ${wouldSkip} profiles`)
  console.log(`Already migrated: ${alreadyMigrated} profiles`)
}

// Check command line arguments
const args = process.argv.slice(2)
if (args.includes('--dry-run')) {
  dryRun()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
} else {
  migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
