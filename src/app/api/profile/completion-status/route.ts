import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to check if a user's profile is complete
 * Profile is considered complete if:
 * 1. Profile exists
 * 2. User has a phone number
 * 3. Profile has at least one photo (profileImageUrl or photoUrls)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        profile: {
          select: {
            id: true,
            profileImageUrl: true,
            photoUrls: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({
        isComplete: false,
        reason: 'no_user',
        hasProfile: false,
        hasPhone: false,
        hasPhotos: false,
      })
    }

    const hasProfile = !!user.profile
    const hasPhone = !!user.phone && user.phone.trim() !== ''
    const hasPhotos = !!(user.profile?.profileImageUrl || user.profile?.photoUrls)

    const isComplete = hasProfile && hasPhone && hasPhotos

    return NextResponse.json({
      isComplete,
      hasProfile,
      hasPhone,
      hasPhotos,
      profileId: user.profile?.id || null,
      reason: !isComplete
        ? !hasProfile
          ? 'no_profile'
          : !hasPhone
            ? 'no_phone'
            : 'no_photos'
        : null,
    })
  } catch (error) {
    console.error('Profile completion check error:', error)
    return NextResponse.json({ error: 'Failed to check profile completion' }, { status: 500 })
  }
}
