import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ hasProfile: false }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ hasProfile: false })
    }

    return NextResponse.json({
      hasProfile: !!user.profile,
      profileId: user.profile?.id || null,
      signupStep: user.profile?.signupStep || 0,
    })
  } catch (error) {
    console.error('Error checking profile status:', error)
    return NextResponse.json({ hasProfile: false, error: 'Failed to check profile status' }, { status: 500 })
  }
}
