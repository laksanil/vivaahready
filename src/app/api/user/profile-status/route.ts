import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id
    const sessionEmail = session?.user?.email || null

    // During immediate post-login transitions, session hydration can lag.
    // Return a stable payload instead of 401 so callers can retry gracefully.
    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({
        hasProfile: false,
        profileId: null,
        signupStep: 0,
        authenticated: false,
      })
    }

    const user = await prisma.user.findUnique({
      where: sessionUserId ? { id: sessionUserId } : { email: sessionEmail! },
      select: {
        id: true,
        profile: {
          select: {
            id: true,
            signupStep: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({
        hasProfile: false,
        profileId: null,
        signupStep: 0,
        authenticated: true,
      })
    }

    return NextResponse.json({
      hasProfile: !!user.profile,
      profileId: user.profile?.id || null,
      signupStep: user.profile?.signupStep || 0,
      authenticated: true,
    })
  } catch (error) {
    console.error('Error checking profile status:', error)
    return NextResponse.json({ hasProfile: false, error: 'Failed to check profile status' }, { status: 500 })
  }
}
