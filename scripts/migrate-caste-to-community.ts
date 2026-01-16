/**
 * Migration script to parse caste field and populate community/subCommunity
 *
 * Caste patterns to parse:
 * - "Brahmin Vaidiki Velanadu" → community: "Brahmin", subCommunity: "Vaidiki Velanadu"
 * - "Brahmin/ madhwa/ uttaradi mutt" → community: "Brahmin", subCommunity: "Madhwa, Uttaradi Mutt"
 * - "Brahmin, Madhwa" → community: "Brahmin", subCommunity: "Madhwa"
 * - "Havyaka Brahmin" → community: "Brahmin", subCommunity: "Havyaka"
 * - "Kapu" → community: "Kapu", subCommunity: null
 * - "Vadama, Tamil Brahmin" → community: "Brahmin", subCommunity: "Vadama"
 * - "Vysya chettiar" → community: "Vysya", subCommunity: "Chettiar"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Known main communities
const KNOWN_COMMUNITIES = [
  'Brahmin',
  'Kshatriya',
  'Vaishya',
  'Vysya',
  'Kapu',
  'Kamma',
  'Reddy',
  'Naidu',
  'Nair',
  'Mudaliar',
  'Naicker',
  'Pillai',
  'Chettiar',
  'Gowda',
  'Lingayat',
  'Vokkaligas',
  'Maratha',
  'Jat',
  'Rajput',
  'Kayastha',
  'Bania',
  'Agarwal',
  'Gupta',
  'Sharma',
  'Iyer',
  'Iyengar',
]

// Known Brahmin sub-communities
const BRAHMIN_SUB_COMMUNITIES = [
  'Vaidiki',
  'Niyogi',
  'Velanadu',
  'Madhwa',
  'Smartha',
  'Iyengar',
  'Iyer',
  'Vadama',
  'Havyaka',
  'Hoysala Karnataka',
  'Deshastha',
  'Konkanastha',
  'Chitpavan',
  'Karhade',
  'Saraswat',
  'Gaur',
  'Maithil',
  'Kanyakubja',
  'Saryuparin',
  'Uttaradi Mutt',
  'Raghavendra Mutt',
]

interface ParsedCaste {
  community: string | null
  subCommunity: string | null
}

function cleanSubCommunity(str: string): string {
  return str
    // Remove leading/trailing punctuation and whitespace
    .replace(/^[\s,\-\/\(\)]+|[\s,\-\/]+$/g, '')
    // Clean up parentheses
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    // Capitalize first letter of each word
    .split(/[\s,]+/)
    .filter(s => s.length > 0)
    .map(s => {
      // Handle parentheses
      if (s.startsWith('(')) {
        return '(' + s.slice(1).charAt(0).toUpperCase() + s.slice(2).toLowerCase()
      }
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    })
    .join(' ')
    // Clean up specific patterns
    .replace(/uttaradi\s*mutt/gi, 'Uttaradi Mutt')
    .replace(/raghavendra\s*mutt/gi, 'Raghavendra Mutt')
    .replace(/sri\s*vaishnava/gi, 'Sri Vaishnava')
    .trim()
}

function parseCaste(casteString: string | null): ParsedCaste {
  if (!casteString) return { community: null, subCommunity: null }

  const original = casteString.trim()
  const lower = original.toLowerCase()

  // Check if it's a Brahmin variant
  const isBrahmin = lower.includes('brahmin') ||
    ['iyer', 'iyengar', 'vadama', 'havyaka', 'madhwa', 'smartha', 'vaidiki', 'niyogi'].some(b => lower.includes(b))

  if (isBrahmin) {
    // Extract sub-community - remove "brahmin", "tamil", "telugu", "kannada" etc.
    let subCommunity = original
      .replace(/brahmin[s]?/gi, '')
      .replace(/\btamil\b/gi, '')
      .replace(/\btelugu\b/gi, '')
      .replace(/\bkannada\b/gi, '')
      .replace(/[\/]+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim()

    subCommunity = cleanSubCommunity(subCommunity)

    return {
      community: 'Brahmin',
      subCommunity: subCommunity || null
    }
  }

  // Check for other known communities
  for (const community of KNOWN_COMMUNITIES) {
    if (lower.includes(community.toLowerCase())) {
      const subCommunity = original
        .replace(new RegExp(community, 'gi'), '')
        .replace(/[,\/]+/g, ', ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(', ')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join(', ')

      return {
        community: community,
        subCommunity: subCommunity || null
      }
    }
  }

  // If no known community found, use the whole string as community
  return {
    community: original.charAt(0).toUpperCase() + original.slice(1),
    subCommunity: null
  }
}

async function migrate() {
  console.log('Starting caste to community migration...\n')

  // Get all profiles with caste but missing community
  const profiles = await prisma.profile.findMany({
    where: {
      caste: { not: null },
    },
    select: {
      id: true,
      caste: true,
      community: true,
      subCommunity: true,
      user: {
        select: { name: true }
      }
    }
  })

  console.log(`Found ${profiles.length} profiles with caste field\n`)

  let updated = 0
  let skipped = 0

  for (const profile of profiles) {
    const parsed = parseCaste(profile.caste)

    // Update if we have a better parse (force update)
    if (parsed.community) {
      console.log(`${profile.user.name}:`)
      console.log(`  Caste: "${profile.caste}"`)
      console.log(`  → Community: "${parsed.community}"`)
      console.log(`  → SubCommunity: "${parsed.subCommunity || 'null'}"`)
      console.log('')

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          community: parsed.community,
          subCommunity: parsed.subCommunity,
        }
      })
      updated++
    } else {
      skipped++
    }
  }

  console.log(`\nMigration complete!`)
  console.log(`Updated: ${updated} profiles`)
  console.log(`Skipped: ${skipped} profiles (already had community set)`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
