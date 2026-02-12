import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/user/cleanup-orphan
 * Deletes an orphan user account (one with no profile).
 * Used when duplicate detection triggers during signup and user cancels.
 * Only deletes if the user has NO profile (safety check).
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Find user and check they have no profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.profile) {
      return NextResponse.json(
        { error: 'Cannot delete user with an existing profile' },
        { status: 400 }
      )
    }

    // Delete subscription and user in a transaction
    await prisma.$transaction([
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Orphan cleanup error:', error)
    return NextResponse.json({ error: 'Failed to clean up' }, { status: 500 })
  }
}
