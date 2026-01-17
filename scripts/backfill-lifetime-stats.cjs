/**
 * Backfill Lifetime Stats Script
 *
 * This script backfills the lifetime stats fields with current actual counts
 * from the database. It ensures existing users have their historical stats populated.
 *
 * Stats backfilled:
 * - lifetimeInterestsReceived: Count of Match records where user is receiver
 * - lifetimeInterestsSent: Count of Match records where user is sender
 * - lifetimeMatches: Current potential matches count (high-water mark)
 * - lifetimeMutualMatches: Count of mutual matches (where both parties have accepted)
 * - lifetimeProfileViews: Not backfilled (historical data not available)
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function backfillLifetimeStats() {
  console.log('\n=== BACKFILLING LIFETIME STATS ===\n')

  // Get all profiles
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      userId: true,
      lifetimeInterestsReceived: true,
      lifetimeInterestsSent: true,
      lifetimeMatches: true,
      lifetimeMutualMatches: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  console.log(`Found ${profiles.length} profiles to backfill\n`)

  let updated = 0
  let skipped = 0

  for (const profile of profiles) {
    // Count interests received (all Match records where user is receiver)
    const interestsReceived = await prisma.match.count({
      where: { receiverId: profile.userId }
    })

    // Count interests sent (all Match records where user is sender)
    const interestsSent = await prisma.match.count({
      where: { senderId: profile.userId }
    })

    // Count mutual matches (unique partners with accepted status)
    const acceptedMatches = await prisma.match.findMany({
      where: {
        OR: [
          { senderId: profile.userId, status: 'accepted' },
          { receiverId: profile.userId, status: 'accepted' }
        ]
      },
      select: {
        senderId: true,
        receiverId: true
      }
    })

    // Get unique partner IDs
    const partnerIds = new Set()
    for (const match of acceptedMatches) {
      const partnerId = match.senderId === profile.userId ? match.receiverId : match.senderId
      partnerIds.add(partnerId)
    }

    const mutualMatches = partnerIds.size

    // Check if we need to update
    // Note: lifetimeMatches (potential matches) will be updated when user views matches page
    const needsUpdate =
      profile.lifetimeInterestsReceived !== interestsReceived ||
      profile.lifetimeInterestsSent !== interestsSent ||
      profile.lifetimeMutualMatches !== mutualMatches

    if (needsUpdate) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          lifetimeInterestsReceived: interestsReceived,
          lifetimeInterestsSent: interestsSent,
          lifetimeMutualMatches: mutualMatches
        }
      })

      console.log(`✅ Updated: ${profile.user.name} (${profile.user.email})`)
      console.log(`   Received: ${profile.lifetimeInterestsReceived} -> ${interestsReceived}`)
      console.log(`   Sent: ${profile.lifetimeInterestsSent} -> ${interestsSent}`)
      console.log(`   Mutual Matches: ${profile.lifetimeMutualMatches || 0} -> ${mutualMatches}`)
      updated++
    } else {
      skipped++
    }
  }

  console.log('\n=== BACKFILL COMPLETE ===')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (already correct): ${skipped}`)
  console.log(`Total: ${profiles.length}`)
}

backfillLifetimeStats()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
