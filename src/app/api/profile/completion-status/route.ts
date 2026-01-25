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
 * 4. Signup flow is complete (signupStep >= 9)
 *
 * signupStep mapping: 1-8 = profile sections, 9 = complete (photos done)
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
            signupStep: true,
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
        signupStep: 0,
      })
    }

    const hasProfile = !!user.profile
    const hasPhone = !!user.phone && user.phone.trim() !== ''
    const hasPhotos = !!(user.profile?.profileImageUrl || user.profile?.photoUrls)
    const signupStep = user.profile?.signupStep || 2 // Default to 2 (basics done, need location_education)

    // Profile is complete only if all requirements met AND signup flow finished (step 9 = photos done)
    const isComplete = hasProfile && hasPhone && hasPhotos && signupStep >= 9

    return NextResponse.json({
      isComplete,
      hasProfile,
      hasPhone,
      hasPhotos,
      signupStep,
      profileId: user.profile?.id || null,
      reason: !isComplete
        ? !hasProfile
          ? 'no_profile'
          : signupStep < 9
            ? 'signup_incomplete'
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
