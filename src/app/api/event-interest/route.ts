import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ submitted: false })
    }

    const existing = await prisma.eventInterest.findUnique({
      where: { userId: session.user.id },
    })

    if (existing) {
      return NextResponse.json({ submitted: true, data: existing })
    }

    return NextResponse.json({ submitted: false })
  } catch (error) {
    console.error('Event interest GET error:', error)
    return NextResponse.json({ submitted: false })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { interestLevel, suggestions, frequency, groupSize, ageRange, timeZone, videoComfort } = body
    // New field names mapped to existing DB columns
    const availability = body.availability || body.eventFormat || null
    const duration = body.duration || body.eventType || null
    const goal = body.goal || body.budgetRange || null
    const nameSharing = body.nameSharing || body.preferredCity || null

    if (!interestLevel || !['yes', 'maybe', 'not_now'].includes(interestLevel)) {
      return NextResponse.json(
        { error: 'Interest level is required' },
        { status: 400 }
      )
    }

    // Get profileId if user has a profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    // Store: availability -> eventFormat, nameSharing -> preferredCity, duration -> eventType, goal -> budgetRange
    await prisma.eventInterest.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        profileId: profile?.id || null,
        interestLevel,
        eventFormat: availability,
        preferredCity: nameSharing,
        eventType: duration,
        budgetRange: goal,
        frequency: frequency || null,
        groupSize: groupSize || null,
        ageRange: ageRange || null,
        timeZone: timeZone || null,
        videoComfort: videoComfort || null,
        suggestions: suggestions?.trim() || null,
      },
      update: {
        interestLevel,
        eventFormat: availability,
        preferredCity: nameSharing,
        eventType: duration,
        budgetRange: goal,
        frequency: frequency || null,
        groupSize: groupSize || null,
        ageRange: ageRange || null,
        timeZone: timeZone || null,
        videoComfort: videoComfort || null,
        suggestions: suggestions?.trim() || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Event interest POST error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
