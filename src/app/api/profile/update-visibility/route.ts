import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { profileId, photoVisibility } = body

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    const validOptions = ['verified_only', 'matching_preferences', 'mutual_interest']
    if (!validOptions.includes(photoVisibility)) {
      return NextResponse.json({ error: 'Invalid photo visibility option' }, { status: 400 })
    }

    // Verify profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Update photo visibility
    await prisma.profile.update({
      where: { id: profileId },
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
