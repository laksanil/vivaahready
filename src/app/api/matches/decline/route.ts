import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'

type DeclineSource = 'matches' | 'interest_declined' | 'interest_withdrawn' | 'connection_withdrawn'

async function upsertDeclinedProfile(
  userId: string,
  declinedUserId: string,
  options?: { source?: DeclineSource; hiddenFromReconsider?: boolean }
) {
  const hiddenFromReconsider = options?.hiddenFromReconsider ?? false
  const source = options?.source

  try {
    return await prisma.declinedProfile.upsert({
      where: {
        userId_declinedUserId: {
          userId,
          declinedUserId,
        },
      },
      update: {
        hiddenFromReconsider,
        ...(source ? { source } : {}),
      },
      create: {
        userId,
        declinedUserId,
        hiddenFromReconsider,
        ...(source ? { source } : {}),
      },
    })
  } catch (error) {
    if (!source) {
      throw error
    }

    // Backward-compatible fallback when local DB/client doesn't include `source` yet.
    console.warn('Declined source write failed; retrying without source:', error)
    try {
      return await prisma.declinedProfile.upsert({
        where: {
          userId_declinedUserId: {
            userId,
            declinedUserId,
          },
        },
        update: {
          hiddenFromReconsider,
        },
        create: {
          userId,
          declinedUserId,
          hiddenFromReconsider,
        },
      })
    } catch (fallbackError) {
      // Final fallback when local DB is behind schema (e.g., no hiddenFromReconsider yet).
      console.warn('Declined hidden flag write failed; retrying minimal upsert:', fallbackError)
      return prisma.declinedProfile.upsert({
        where: {
          userId_declinedUserId: {
            userId,
            declinedUserId,
          },
        },
        update: {},
        create: {
          userId,
          declinedUserId,
        },
      })
    }
  }
}

// POST - Decline a profile (add to declined list)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserId = targetUser.userId

    const { declinedUserId, source } = await request.json()

    if (!declinedUserId) {
      return NextResponse.json({ error: 'declinedUserId is required' }, { status: 400 })
    }

    // Can't decline yourself
    if (declinedUserId === currentUserId) {
      return NextResponse.json({ error: 'Cannot decline yourself' }, { status: 400 })
    }

    // Create/update the declined profile record.
    const declined = await upsertDeclinedProfile(currentUserId, declinedUserId, {
      source,
      hiddenFromReconsider: false,
    })

    // Also reject any pending interest from this user
    await prisma.match.updateMany({
      where: {
        senderId: declinedUserId,
        receiverId: currentUserId,
        status: 'pending',
      },
      data: {
        status: 'rejected',
      },
    })

    return NextResponse.json({ success: true, declined })
  } catch (error) {
    console.error('Error declining profile:', error)
    return NextResponse.json({ error: 'Failed to decline profile' }, { status: 500 })
  }
}

// PATCH - Permanently remove from reconsider pile while keeping it declined
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserId = targetUser.userId

    const { declinedUserId } = await request.json()

    if (!declinedUserId) {
      return NextResponse.json({ error: 'declinedUserId is required' }, { status: 400 })
    }

    if (declinedUserId === currentUserId) {
      return NextResponse.json({ error: 'Cannot decline yourself' }, { status: 400 })
    }

    const declined = await upsertDeclinedProfile(currentUserId, declinedUserId, {
      hiddenFromReconsider: true,
    })

    // Keep any incoming pending interest from this profile rejected.
    await prisma.match.updateMany({
      where: {
        senderId: declinedUserId,
        receiverId: currentUserId,
        status: 'pending',
      },
      data: {
        status: 'rejected',
      },
    })

    return NextResponse.json({ success: true, declined })
  } catch (error) {
    console.error('Error removing profile from reconsider pile:', error)
    return NextResponse.json({ error: 'Failed to remove profile from reconsider pile' }, { status: 500 })
  }
}

// DELETE - Undecline a profile (remove from declined list / reconsider)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserId = targetUser.userId

    const { searchParams } = new URL(request.url)
    const declinedUserId = searchParams.get('declinedUserId')

    if (!declinedUserId) {
      return NextResponse.json({ error: 'declinedUserId is required' }, { status: 400 })
    }

    // Delete the declined profile record
    await prisma.declinedProfile.deleteMany({
      where: {
        userId: currentUserId,
        declinedUserId: declinedUserId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error undeclining profile:', error)
    return NextResponse.json({ error: 'Failed to undecline profile' }, { status: 500 })
  }
}

// GET - Get all declined profiles for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Get target user ID (supports admin impersonation)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserId = targetUser.userId

    // Get all declined profiles with their profile data
    let declinedRecords: Array<{ declinedUserId: string; createdAt: Date; source?: string | null }>

    try {
      declinedRecords = await prisma.declinedProfile.findMany({
        where: {
          userId: currentUserId,
          hiddenFromReconsider: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          declinedUserId: true,
          createdAt: true,
          source: true,
        },
      })
    } catch (error) {
      // Backward-compatible fallback when local DB/client doesn't include `source` yet.
      console.warn('Declined source read failed; retrying without source:', error)
      try {
        declinedRecords = await prisma.declinedProfile.findMany({
          where: {
            userId: currentUserId,
            hiddenFromReconsider: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            declinedUserId: true,
            createdAt: true,
          },
        })
      } catch (fallbackError) {
        // Final fallback when local DB is behind schema (e.g., no hiddenFromReconsider yet).
        console.warn('Declined hidden flag read failed; retrying minimal query:', fallbackError)
        declinedRecords = await prisma.declinedProfile.findMany({
          where: {
            userId: currentUserId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            declinedUserId: true,
            createdAt: true,
          },
        })
      }
    }

    // Get the profile data for each declined user
    const declinedUserIds = declinedRecords.map(d => d.declinedUserId)

    const profiles = await prisma.profile.findMany({
      where: {
        userId: {
          in: declinedUserIds,
        },
        isActive: true,
        isSuspended: false,
        approvalStatus: 'approved',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Add the declined date and source to each profile
    const profilesWithDeclinedDate = profiles.map(profile => {
      const declinedRecord = declinedRecords.find(d => d.declinedUserId === profile.userId)
      return {
        ...profile,
        declinedAt: declinedRecord?.createdAt,
        declineSource: declinedRecord?.source || null,
      }
    })

    return NextResponse.json({ profiles: profilesWithDeclinedDate })
  } catch (error) {
    console.error('Error fetching declined profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch declined profiles' }, { status: 500 })
  }
}
