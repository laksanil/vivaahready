import { prisma } from './prisma'

/**
 * Generates the next VR ID in sequence (VR001, VR002, etc.)
 * Thread-safe using database to track the sequence
 */
export async function generateVrId(): Promise<string> {
  // Get the highest existing VR number
  const lastProfile = await prisma.profile.findFirst({
    where: {
      odNumber: {
        startsWith: 'VR'
      }
    },
    orderBy: {
      odNumber: 'desc'
    },
    select: {
      odNumber: true
    }
  })

  let nextNumber = 1

  if (lastProfile?.odNumber) {
    // Extract number from VR format (e.g., VR042 -> 42)
    const match = lastProfile.odNumber.match(/VR(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Format with leading zeros (VR001, VR042, VR999, VR1000)
  const paddedNumber = nextNumber.toString().padStart(3, '0')
  return `VR${paddedNumber}`
}

/**
 * Assigns VR IDs to all profiles that don't have one
 * Used for migrating existing profiles
 */
export async function assignMissingVrIds(): Promise<number> {
  const profilesWithoutId = await prisma.profile.findMany({
    where: {
      OR: [
        { odNumber: null },
        { odNumber: '' },
        { NOT: { odNumber: { startsWith: 'VR' } } }
      ]
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true
    }
  })

  let count = 0
  for (const profile of profilesWithoutId) {
    const vrId = await generateVrId()
    await prisma.profile.update({
      where: { id: profile.id },
      data: { odNumber: vrId }
    })
    count++
  }

  return count
}
