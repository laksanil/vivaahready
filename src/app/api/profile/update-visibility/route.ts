import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photoVisibility } = body

    const validOptions = ['verified_only', 'express_interest', 'mutual_interest']
    if (!validOptions.includes(photoVisibility)) {
      return NextResponse.json({ error: 'Invalid photo visibility option' }, { status: 400 })
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Update photo visibility
    await prisma.profile.update({
      where: { id: profile.id },
      data: { photoVisibility }
    })

    return NextResponse.json({
      message: 'Photo visibility updated successfully'
    })
  } catch (error) {
    console.error('Update visibility error:', error)
    return NextResponse.json({ error: 'Failed to update photo visibility' }, { status: 500 })
  }
}
