import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateMatchScore } from '@/lib/matching'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['laksanil@gmail.com', 'naga@example.com']

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for admin view mode
    const { searchParams } = new URL(request.url)
    const viewAsUserId = searchParams.get('viewAsUser')
    const isAdmin = ADMIN_EMAILS.includes(session.user.email || '')

    // Get the profile being viewed
    const viewedProfile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    if (!viewedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get the "viewer's" profile - either the actual user or the user being viewed as (admin mode)
    let myProfile
    let viewerName = session.user.name

    if (viewAsUserId && isAdmin) {
      // Admin is viewing as another user
      const viewAsUser = await prisma.user.findUnique({
        where: { id: viewAsUserId },
        select: { name: true }
      })
      myProfile = await prisma.profile.findUnique({
        where: { userId: viewAsUserId },
      })
      viewerName = viewAsUser?.name || 'User'
    } else {
      // Normal user viewing
      myProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
      })
    }

    if (!myProfile) {
      return NextResponse.json({ error: 'Your profile not found' }, { status: 404 })
    }

    // Don't show match score for own profile (check both actual user and viewAsUser)
    const viewerUserId = viewAsUserId && isAdmin ? viewAsUserId : session.user.id
    if (viewedProfile.userId === viewerUserId) {
      return NextResponse.json({ theirMatchScore: null, yourMatchScore: null })
    }

    // Calculate BOTH match scores:
    // 1. How well YOU match THEIR preferences (theirMatchScore)
    const theirMatchScore = calculateMatchScore(viewedProfile as any, myProfile as any)

    // 2. How well THEY match YOUR preferences (yourMatchScore)
    const yourMatchScore = calculateMatchScore(myProfile as any, viewedProfile as any)

    return NextResponse.json({
      theirMatchScore,  // How well you match their preferences
      yourMatchScore,   // How well they match your preferences
      myProfile: {
        profileImageUrl: myProfile.profileImageUrl,
        gender: myProfile.gender,
        name: viewerName,
      },
      theirProfile: {
        profileImageUrl: viewedProfile.profileImageUrl,
        gender: viewedProfile.gender,
        name: viewedProfile.user?.name,
      }
    })
  } catch (error) {
    console.error('Match score error:', error)
    return NextResponse.json({ error: 'Failed to calculate match score' }, { status: 500 })
  }
}
