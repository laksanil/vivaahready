import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'

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

    const { declinedUserId } = await request.json()

    if (!declinedUserId) {
      return NextResponse.json({ error: 'declinedUserId is required' }, { status: 400 })
    }

    // Can't decline yourself
    if (declinedUserId === currentUserId) {
      return NextResponse.json({ error: 'Cannot decline yourself' }, { status: 400 })
    }

    // Create the declined profile record
    const declined = await prisma.declinedProfile.upsert({
      where: {
        userId_declinedUserId: {
          userId: currentUserId,
          declinedUserId: declinedUserId,
        },
      },
      update: {}, // No update needed if exists
      create: {
        userId: currentUserId,
        declinedUserId: declinedUserId,
      },
    })

    return NextResponse.json({ success: true, declined })
  } catch (error) {
    console.error('Error declining profile:', error)
    return NextResponse.json({ error: 'Failed to decline profile' }, { status: 500 })
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
    const declinedRecords = await prisma.declinedProfile.findMany({
      where: {
        userId: currentUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

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

    // Add the declined date to each profile
    const profilesWithDeclinedDate = profiles.map(profile => {
      const declinedRecord = declinedRecords.find(d => d.declinedUserId === profile.userId)
      return {
        ...profile,
        declinedAt: declinedRecord?.createdAt,
      }
    })

    return NextResponse.json({ profiles: profilesWithDeclinedDate })
  } catch (error) {
    console.error('Error fetching declined profiles:', error)
    return NextResponse.json({ error: 'Failed to fetch declined profiles' }, { status: 500 })
  }
}
