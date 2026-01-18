import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateMatchScore, isMutualMatch } from '@/lib/matching'
import { getTargetUserId } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Helper function to format profile name as "FirstName L" from user.name
    const formatProfileName = (userName?: string | null): string => {
      if (!userName) return 'User'
      const nameParts = userName.trim().split(' ')
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ')
      const lastInitial = lastName ? ` ${lastName.charAt(0).toUpperCase()}` : ''
      return `${firstName}${lastInitial}`
    }

    // Get the profile being viewed (with user for name)
    const viewedProfile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: { user: { select: { name: true } } },
    })

    if (!viewedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get the "viewer's" profile - either the actual user or the user being viewed as (admin mode)
    const viewerUserId = targetUser.userId

    const myProfile = await prisma.profile.findUnique({
      where: { userId: viewerUserId },
      include: { user: { select: { name: true } } },
    })

    if (!myProfile) {
      return NextResponse.json({ error: 'Your profile not found' }, { status: 404 })
    }

    // Don't show match score for own profile (check both actual user and viewAsUser)
    if (viewedProfile.userId === viewerUserId) {
      return NextResponse.json({ theirMatchScore: null, yourMatchScore: null })
    }

    // Check if this is a mutual match (both parties' deal-breakers satisfied)
    const isMutual = isMutualMatch(myProfile as any, viewedProfile as any)

    // If not a mutual match due to deal-breaker violations, block access
    if (!isMutual) {
      return NextResponse.json({
        blocked: true,
        reason: 'This profile cannot be viewed due to deal-breaker preference conflicts.',
      })
    }

    // Calculate BOTH match scores:
    // 1. How well YOU match THEIR preferences (theirMatchScore)
    const theirMatchScore = calculateMatchScore(viewedProfile as any, myProfile as any)

    // 2. How well THEY match YOUR preferences (yourMatchScore)
    const yourMatchScore = calculateMatchScore(myProfile as any, viewedProfile as any)

    return NextResponse.json({
      blocked: false,
      theirMatchScore,  // How well you match their preferences
      yourMatchScore,   // How well they match your preferences
      myProfile: {
        profileImageUrl: myProfile.profileImageUrl,
        gender: myProfile.gender,
        name: formatProfileName(myProfile.user?.name),
        hobbies: myProfile.hobbies,
        fitness: myProfile.fitness,
        interests: myProfile.interests,
      },
      theirProfile: {
        profileImageUrl: viewedProfile.profileImageUrl,
        gender: viewedProfile.gender,
        name: formatProfileName(viewedProfile.user?.name),
      }
    })
  } catch (error) {
    console.error('Match score error:', error)
    return NextResponse.json({ error: 'Failed to calculate match score' }, { status: 500 })
  }
}
