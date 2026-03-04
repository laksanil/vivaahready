import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const interests = await prisma.eventInterest.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Fetch user and profile info for each submission
    const userIds = interests.map((i) => i.userId)
    const profileIds = interests.filter((i) => i.profileId).map((i) => i.profileId as string)

    const [users, profiles] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, phone: true },
      }),
      prisma.profile.findMany({
        where: { id: { in: profileIds } },
        select: { id: true, odNumber: true, firstName: true, lastName: true, currentLocation: true },
      }),
    ])

    const userMap = new Map(users.map((u) => [u.id, u]))
    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    const data = interests.map((interest) => {
      const user = userMap.get(interest.userId)
      const profile = interest.profileId ? profileMap.get(interest.profileId) : null
      return {
        id: interest.id,
        interestLevel: interest.interestLevel,
        availability: interest.eventFormat,
        duration: interest.eventType,
        goal: interest.budgetRange,
        nameSharing: interest.preferredCity,
        frequency: interest.frequency,
        groupSize: interest.groupSize,
        ageRange: interest.ageRange,
        timeZone: interest.timeZone,
        videoComfort: interest.videoComfort,
        suggestions: interest.suggestions,
        createdAt: interest.createdAt,
        updatedAt: interest.updatedAt,
        user: user
          ? { name: user.name, email: user.email, phone: user.phone }
          : null,
        profile: profile
          ? { odNumber: profile.odNumber, firstName: profile.firstName, lastName: profile.lastName, currentLocation: profile.currentLocation }
          : null,
      }
    })

    // Summary stats
    const summary = {
      total: interests.length,
      interested: interests.filter((i) => i.interestLevel === 'yes').length,
      maybe: interests.filter((i) => i.interestLevel === 'maybe').length,
      notNow: interests.filter((i) => i.interestLevel === 'not_now').length,
    }

    return NextResponse.json({ interests: data, summary })
  } catch (error) {
    console.error('Admin event interest error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event interest data' },
      { status: 500 }
    )
  }
}
