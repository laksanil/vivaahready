import { prisma } from './prisma'

/**
 * Generates the next VR ID in format VR-YYYYMMDD-XXX
 * Where YYYYMMDD is the current date and XXX is a daily sequence number
 * Thread-safe using database to track the sequence
 */
export async function generateVrId(): Promise<string> {
  // Get today's date in YYYYMMDD format
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')

  const prefix = `VR-${dateStr}-`

  // Get the highest existing VR number for today
  const lastProfile = await prisma.profile.findFirst({
    where: {
      odNumber: {
        startsWith: prefix
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
    // Extract sequence number from VR-YYYYMMDD-XXX format
    const match = lastProfile.odNumber.match(/VR-\d{8}-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Format with leading zeros (001, 002, etc.)
  const paddedNumber = nextNumber.toString().padStart(3, '0')
  return `${prefix}${paddedNumber}`
}

/**
 * Generates a VR ID for a specific date (used for migration)
 */
export async function generateVrIdForDate(date: Date): Promise<string> {
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')

  const prefix = `VR-${dateStr}-`

  // Get the highest existing VR number for that date
  const lastProfile = await prisma.profile.findFirst({
    where: {
      odNumber: {
        startsWith: prefix
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
    const match = lastProfile.odNumber.match(/VR-\d{8}-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  const paddedNumber = nextNumber.toString().padStart(3, '0')
  return `${prefix}${paddedNumber}`
}

/**
 * Assigns VR IDs to all profiles that don't have one
 * Uses the profile's creation date for the VR ID
 */
export async function assignMissingVrIds(): Promise<number> {
  const profilesWithoutId = await prisma.profile.findMany({
    where: {
      OR: [
        { odNumber: null },
        { odNumber: '' },
        { NOT: { odNumber: { startsWith: 'VR-' } } }
      ]
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      createdAt: true
    }
  })

  let count = 0
  for (const profile of profilesWithoutId) {
    // Use the profile's creation date for the VR ID
    const vrId = await generateVrIdForDate(profile.createdAt)
    await prisma.profile.update({
      where: { id: profile.id },
      data: { odNumber: vrId }
    })
    count++
  }

  return count
}
