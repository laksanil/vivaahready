/**
 * Migration script to convert prefCaste to prefCommunity/prefSubCommunity
 *
 * Patterns:
 * - "Doesn't Matter" / "Any" / empty → prefCommunity: null (no restriction)
 * - "Same Caste only" → copy user's own community to prefCommunity
 * - "Brahmin" → prefCommunity: "Brahmin"
 * - "Brahmin/ Madhwa/ Smartha" → prefCommunity: "Brahmin", prefSubCommunity: "Madhwa, Smartha"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ParsedPref {
  prefCommunity: string | null
  prefSubCommunity: string | null
}

// Known Brahmin sub-communities for parsing
const BRAHMIN_SUB_COMMUNITIES = [
  'madhwa', 'smartha', 'iyengar', 'iyer', 'vadama', 'havyaka',
  'vaidiki', 'niyogi', 'velanadu', 'deshastha', 'konkanastha',
  'saraswat', 'gaur', 'hoysala', 'uttaradi', 'raghavendra'
]

function cleanSubCommunity(str: string): string {
  return str
    .replace(/^[\s,\-\/\(\)]+|[\s,\-\/]+$/g, '')
    .split(/[\s,\/]+/)
    .filter(s => s.length > 0)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(', ')
    .replace(/uttaradi\s*mutt/gi, 'Uttaradi Mutt')
    .replace(/raghavendra\s*mutt/gi, 'Raghavendra Mutt')
    .trim()
}

interface ParsedPrefWithDealbreaker extends ParsedPref {
  isDealbreaker: boolean
}

function parsePrefCaste(prefCaste: string | null, userCommunity: string | null): ParsedPrefWithDealbreaker {
  if (!prefCaste || prefCaste.trim() === '') {
    return { prefCommunity: null, prefSubCommunity: null, isDealbreaker: false }
  }

  const original = prefCaste.trim()
  const lower = original.toLowerCase()

  // "Doesn't Matter" or "Any" → no restriction
  if (lower === "doesn't matter" || lower === 'any' || lower === 'doesnt matter') {
    return { prefCommunity: null, prefSubCommunity: null, isDealbreaker: false }
  }

  // "Same Caste only" → use user's own community AND set as deal-breaker
  if (lower === 'same caste only' || lower.includes('same caste')) {
    return {
      prefCommunity: userCommunity || null,
      prefSubCommunity: null,
      isDealbreaker: true  // Same Caste = deal-breaker
    }
  }

  // Check if it's a Brahmin preference
  const isBrahminPref = lower.includes('brahmin') ||
    BRAHMIN_SUB_COMMUNITIES.some(sub => lower.includes(sub))

  if (isBrahminPref) {
    // Extract sub-communities
    let subCommunities = original
      .replace(/brahmin[s]?/gi, '')
      .replace(/[\s]*[,\/]+[\s]*/g, ', ')
      .trim()

    subCommunities = cleanSubCommunity(subCommunities)

    return {
      prefCommunity: 'Brahmin',
      prefSubCommunity: subCommunities || null,
      isDealbreaker: false
    }
  }

  // Other specific communities (Kapu, Reddy, etc.)
  return {
    prefCommunity: original.charAt(0).toUpperCase() + original.slice(1),
    prefSubCommunity: null,
    isDealbreaker: false
  }
}

async function migrate() {
  console.log('Starting prefCaste to prefCommunity migration...\n')

  // Get all profiles with prefCaste but missing prefCommunity
  const profiles = await prisma.profile.findMany({
    where: {
      prefCaste: { not: null },
    },
    select: {
      id: true,
      prefCaste: true,
      prefCommunity: true,
      prefSubCommunity: true,
      community: true,  // User's own community (for "Same Caste only")
      user: { select: { name: true } }
    }
  })

  console.log(`Found ${profiles.length} profiles with prefCaste field\n`)

  let updated = 0
  let skipped = 0
  let noChange = 0

  for (const profile of profiles) {
    // Skip if already has prefCommunity set
    if (profile.prefCommunity) {
      skipped++
      continue
    }

    const parsed = parsePrefCaste(profile.prefCaste, profile.community)

    // Check if we have something to update
    if (parsed.prefCommunity !== null) {
      console.log(`${profile.user.name}:`)
      console.log(`  prefCaste: "${profile.prefCaste}"`)
      console.log(`  → prefCommunity: "${parsed.prefCommunity}"`)
      console.log(`  → prefSubCommunity: "${parsed.prefSubCommunity || 'null'}"`)
      console.log(`  → isDealbreaker: ${parsed.isDealbreaker}`)
      if (profile.prefCaste?.toLowerCase().includes('same caste')) {
        console.log(`  (Used their community: ${profile.community})`)
      }
      console.log('')

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          prefCommunity: parsed.prefCommunity,
          prefSubCommunity: parsed.prefSubCommunity,
          prefCommunityIsDealbreaker: parsed.isDealbreaker,
        }
      })
      updated++
    } else {
      // "Doesn't Matter" or empty - no update needed
      noChange++
    }
  }

  console.log(`\nMigration complete!`)
  console.log(`Updated: ${updated} profiles`)
  console.log(`Skipped (already had prefCommunity): ${skipped} profiles`)
  console.log(`No change needed ("Doesn't Matter"): ${noChange} profiles`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
