/**
 * Extract hobbies, fitness activities, and interests from aboutMe field
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Known hobbies to look for
const HOBBIES = [
  'Art & Crafts', 'Blogging', 'Board Games', 'Cooking', 'Dancing', 'DIY Projects',
  'Gardening', 'Gaming', 'Listening to Music', 'Movies & TV Shows', 'Musical Instruments',
  'Painting', 'Photography', 'Playing Cards', 'Podcasts', 'Puzzles', 'Reading',
  'Singing', 'Stand-up Comedy', 'Traveling', 'Video Editing', 'Volunteering',
  'Writing', 'Yoga'
]

// Keywords to match hobbies
const HOBBY_KEYWORDS: Record<string, string[]> = {
  'Art & Crafts': ['art', 'crafts', 'craft'],
  'Cooking': ['cooking', 'cook', 'baking', 'bake'],
  'Dancing': ['dancing', 'dance', 'bharatnatyam', 'bhartnatyam', 'classical dance'],
  'Gardening': ['gardening', 'garden', 'plants'],
  'Gaming': ['gaming', 'games', 'video games'],
  'Listening to Music': ['music', 'listening to music'],
  'Movies & TV Shows': ['movies', 'tv shows', 'netflix', 'films'],
  'Musical Instruments': ['guitar', 'piano', 'violin', 'drums', 'instrument'],
  'Painting': ['painting', 'paint', 'drawing', 'draw', 'sketch'],
  'Photography': ['photography', 'photos', 'photographer'],
  'Reading': ['reading', 'books', 'book reader', 'avid reader'],
  'Singing': ['singing', 'sing', 'songs'],
  'Traveling': ['traveling', 'travelling', 'travel', 'visiting new places', 'explore'],
  'Writing': ['writing', 'write', 'blogging'],
  'Yoga': ['yoga'],
}

// Fitness activities
const FITNESS = [
  'Cricket', 'Football / Soccer', 'Golf', 'Gym / Weight Training', 'Hiking / Trekking',
  'Martial Arts', 'Meditation', 'Pilates', 'Running / Jogging', 'Swimming',
  'Table Tennis', 'Tennis', 'Walking', 'Badminton', 'Basketball', 'Cycling'
]

const FITNESS_KEYWORDS: Record<string, string[]> = {
  'Cricket': ['cricket'],
  'Football / Soccer': ['football', 'soccer'],
  'Golf': ['golf'],
  'Gym / Weight Training': ['gym', 'weight training', 'workout', 'fitness'],
  'Hiking / Trekking': ['hiking', 'trekking', 'hikes', 'trek'],
  'Meditation': ['meditation', 'meditate', 'spiritual'],
  'Running / Jogging': ['running', 'jogging', 'run'],
  'Swimming': ['swimming', 'swim'],
  'Tennis': ['tennis'],
  'Walking': ['walking', 'walks'],
  'Badminton': ['badminton'],
  'Cycling': ['cycling', 'biking', 'bike'],
}

// Interests
const INTERESTS = [
  'Astronomy', 'Automobiles', 'Business & Investing', 'Cars & Bikes', 'Current Affairs',
  'Environment & Sustainability', 'Fashion & Style', 'Finance & Stocks', 'Food & Cuisine',
  'Health & Wellness', 'History', 'Languages', 'Politics', 'Science & Technology',
  'Social Causes', 'Sports', 'Startups', 'Travel & Adventure'
]

const INTEREST_KEYWORDS: Record<string, string[]> = {
  'Business & Investing': ['business', 'investing', 'investment'],
  'Cars & Bikes': ['cars', 'bikes', 'automobiles'],
  'Environment & Sustainability': ['environment', 'sustainability', 'nature'],
  'Food & Cuisine': ['food', 'cuisine', 'culinary'],
  'Health & Wellness': ['health', 'wellness', 'fitness'],
  'Languages': ['languages', 'multilingual'],
  'Science & Technology': ['science', 'technology', 'tech'],
  'Travel & Adventure': ['travel', 'adventure', 'exploring'],
}

function extractItems(aboutMe: string, keywords: Record<string, string[]>): string[] {
  const lower = aboutMe.toLowerCase()
  const found: string[] = []

  for (const [item, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lower.includes(word)) {
        found.push(item)
        break
      }
    }
  }

  return found
}

async function migrate() {
  console.log('Extracting hobbies, fitness, and interests from aboutMe...\n')

  const profiles = await prisma.profile.findMany({
    where: {
      aboutMe: { not: null },
      OR: [
        { hobbies: null },
        { hobbies: '' },
      ]
    },
    select: {
      id: true,
      aboutMe: true,
      hobbies: true,
      fitness: true,
      interests: true,
      user: { select: { name: true } }
    }
  })

  console.log(`Found ${profiles.length} profiles with aboutMe but no hobbies\n`)

  let updated = 0

  for (const profile of profiles) {
    if (!profile.aboutMe) continue

    const hobbies = extractItems(profile.aboutMe, HOBBY_KEYWORDS)
    const fitness = extractItems(profile.aboutMe, FITNESS_KEYWORDS)
    const interests = extractItems(profile.aboutMe, INTEREST_KEYWORDS)

    if (hobbies.length > 0 || fitness.length > 0 || interests.length > 0) {
      console.log(`${profile.user.name}:`)
      console.log(`  aboutMe: "${profile.aboutMe.substring(0, 80)}..."`)
      if (hobbies.length > 0) console.log(`  → hobbies: ${hobbies.join(', ')}`)
      if (fitness.length > 0) console.log(`  → fitness: ${fitness.join(', ')}`)
      if (interests.length > 0) console.log(`  → interests: ${interests.join(', ')}`)
      console.log('')

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          hobbies: hobbies.length > 0 ? hobbies.join(', ') : profile.hobbies,
          fitness: fitness.length > 0 ? fitness.join(', ') : profile.fitness,
          interests: interests.length > 0 ? interests.join(', ') : profile.interests,
        }
      })
      updated++
    }
  }

  console.log(`\nDone! Updated ${updated} profiles.`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
