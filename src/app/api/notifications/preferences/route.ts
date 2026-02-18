import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET — Return user's notification preferences (creates defaults if none exist)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
      },
    })

    return NextResponse.json(prefs)
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 })
  }
}

/**
 * PUT — Update user's notification preferences
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Only allow updating known preference fields
    const allowedFields = [
      'emailEnabled',
      'smsEnabled',
      'pushEnabled',
      'matchNotifications',
      'interestNotifications',
      'messageNotifications',
      'marketingEmails',
    ] as const

    const updateData: Record<string, boolean> = {}
    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    })

    return NextResponse.json(prefs)
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
