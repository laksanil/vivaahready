import { prisma } from './prisma'

// Starting sequence number for VR IDs
const VR_ID_START = 11

/**
 * Generates the next VR ID in format VRYYYYMMDDXXX
 * Where YYYYMMDD is the date and XXX is a daily sequence number starting from 029
 * Thread-safe using database to track the sequence
 */
export async function generateVrId(): Promise<string> {
  // Get today's date in YYYYMMDD format
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')

  const prefix = `VR${dateStr}`

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

  let nextNumber = VR_ID_START

  if (lastProfile?.odNumber) {
    // Extract sequence number from VRYYYYMMDDXXX format
    const match = lastProfile.odNumber.match(/^VR\d{8}(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Format with leading zeros (029, 030, etc.)
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

  const prefix = `VR${dateStr}`

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

  let nextNumber = VR_ID_START

  if (lastProfile?.odNumber) {
    const match = lastProfile.odNumber.match(/^VR\d{8}(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  const paddedNumber = nextNumber.toString().padStart(3, '0')
  return `${prefix}${paddedNumber}`
}

/**
 * Assigns VR IDs to all profiles that don't have one
 */
export async function assignMissingVrIds(): Promise<number> {
  const profilesWithoutId = await prisma.profile.findMany({
    where: {
      OR: [
        { odNumber: null },
        { odNumber: '' },
        // Find profiles without VR prefix (covers both old and new formats)
        { NOT: { odNumber: { startsWith: 'VR' } } }
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
    const vrId = await generateVrIdForDate(profile.createdAt)
    await prisma.profile.update({
      where: { id: profile.id },
      data: { odNumber: vrId }
    })
    count++
  }

  return count
}

/**
 * Migrates all profiles with old VR ID format (VR-YYYYMMDD-XXX) to new format (VRYYYYMMDDXXX)
 * Also updates sequence to start from 29
 */
export async function migrateVrIdFormat(): Promise<{ migrated: number; errors: string[] }> {
  const profilesWithOldFormat = await prisma.profile.findMany({
    where: {
      odNumber: {
        contains: '-'
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      odNumber: true,
      createdAt: true
    }
  })

  let migrated = 0
  const errors: string[] = []

  for (const profile of profilesWithOldFormat) {
    try {
      // Generate new VR ID based on profile's creation date
      const newVrId = await generateVrIdForDate(profile.createdAt)

      await prisma.profile.update({
        where: { id: profile.id },
        data: { odNumber: newVrId }
      })

      console.log(`Migrated ${profile.odNumber} -> ${newVrId}`)
      migrated++
    } catch (error) {
      const errMsg = `Failed to migrate profile ${profile.id} (${profile.odNumber}): ${error}`
      errors.push(errMsg)
      console.error(errMsg)
    }
  }

  return { migrated, errors }
}
