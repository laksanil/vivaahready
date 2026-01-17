import { prisma } from './prisma'

/**
 * Lifetime Stats Module
 *
 * These functions manage lifetime statistics that never decrease.
 * Used to showcase platform value to users by showing historical engagement.
 *
 * Stats tracked:
 * - lifetimeInterestsReceived: Total interests ever received
 * - lifetimeInterestsSent: Total interests ever sent
 * - lifetimeProfileViews: Total profile views ever received
 * - lifetimeMatches: Total potential matches ever shown (high-water mark)
 * - lifetimeMutualMatches: Total mutual matches/connections ever made
 */

/**
 * Increment the lifetime interests received counter for a user
 * Called when someone expresses interest in a profile
 */
export async function incrementInterestsReceived(userId: string): Promise<void> {
  await prisma.profile.update({
    where: { userId },
    data: {
      lifetimeInterestsReceived: {
        increment: 1
      }
    }
  })
}

/**
 * Increment the lifetime interests sent counter for a user
 * Called when a user expresses interest in someone else
 */
export async function incrementInterestsSent(userId: string): Promise<void> {
  await prisma.profile.update({
    where: { userId },
    data: {
      lifetimeInterestsSent: {
        increment: 1
      }
    }
  })
}

/**
 * Increment the lifetime profile views counter for a user
 * Called when someone views a profile
 */
export async function incrementProfileViews(userId: string): Promise<void> {
  await prisma.profile.update({
    where: { userId },
    data: {
      lifetimeProfileViews: {
        increment: 1
      }
    }
  })
}

/**
 * Increment both sender and receiver lifetime stats in a single transaction
 * This is the preferred method when expressing interest to ensure atomicity
 */
export async function incrementInterestStats(
  senderId: string,
  receiverId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: senderId },
      data: {
        lifetimeInterestsSent: {
          increment: 1
        }
      }
    }),
    prisma.profile.update({
      where: { userId: receiverId },
      data: {
        lifetimeInterestsReceived: {
          increment: 1
        }
      }
    })
  ])
}

/**
 * Update the lifetime matches counter for a user
 * Called to update the potential matches count shown to the user
 * Only increases (never decreases) to maintain lifetime high-water mark
 */
export async function updateLifetimeMatches(
  userId: string,
  currentPotentialMatches: number
): Promise<void> {
  // Get current lifetime matches
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { lifetimeMatches: true }
  })

  // Only update if current potential matches is higher than stored lifetime matches
  if (profile && currentPotentialMatches > profile.lifetimeMatches) {
    await prisma.profile.update({
      where: { userId },
      data: {
        lifetimeMatches: currentPotentialMatches
      }
    })
  }
}

/**
 * Increment the lifetime mutual matches counter for both users
 * Called when a mutual match is created (either via accept or both expressing interest)
 */
export async function incrementMutualMatchesForBoth(
  userId1: string,
  userId2: string
): Promise<void> {
  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: userId1 },
      data: {
        lifetimeMutualMatches: {
          increment: 1
        }
      }
    }),
    prisma.profile.update({
      where: { userId: userId2 },
      data: {
        lifetimeMutualMatches: {
          increment: 1
        }
      }
    })
  ])
}

/**
 * Get lifetime stats for a user
 */
export async function getLifetimeStats(userId: string): Promise<{
  lifetimeInterestsReceived: number
  lifetimeInterestsSent: number
  lifetimeProfileViews: number
  lifetimeMatches: number
  lifetimeMutualMatches: number
} | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      lifetimeInterestsReceived: true,
      lifetimeInterestsSent: true,
      lifetimeProfileViews: true,
      lifetimeMatches: true,
      lifetimeMutualMatches: true
    }
  })

  return profile
}
