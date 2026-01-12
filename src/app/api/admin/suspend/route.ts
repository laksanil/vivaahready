import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

// POST - Suspend or unsuspend a profile
export async function POST(request: Request) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession || adminSession.value !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, profileId, action, reason } = body

    if (!userId && !profileId) {
      return NextResponse.json({ error: 'User ID or Profile ID is required' }, { status: 400 })
    }

    if (!action || !['suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "suspend" or "unsuspend"' }, { status: 400 })
    }

    // Find the profile by userId or profileId
    const profile = await prisma.profile.findFirst({
      where: userId ? { userId } : { id: profileId },
      include: { user: { select: { name: true, email: true } } },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (action === 'suspend') {
      if (profile.isSuspended) {
        return NextResponse.json({ error: 'Profile is already suspended' }, { status: 400 })
      }

      // Suspend the profile
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: reason || 'No reason provided',
        },
      })

      return NextResponse.json({
        message: `Profile for ${profile.user.name} has been suspended`,
        action: 'suspended',
      })
    } else {
      // Unsuspend
      if (!profile.isSuspended) {
        return NextResponse.json({ error: 'Profile is not suspended' }, { status: 400 })
      }

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          isSuspended: false,
          suspendedAt: null,
          suspendedReason: null,
        },
      })

      return NextResponse.json({
        message: `Profile for ${profile.user.name} has been unsuspended`,
        action: 'unsuspended',
      })
    }
  } catch (error) {
    console.error('Suspend/unsuspend error:', error)
    return NextResponse.json({ error: 'Failed to update profile suspension status' }, { status: 500 })
  }
}
