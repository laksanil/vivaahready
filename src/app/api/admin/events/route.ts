import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all events with registrations
    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'desc' },
      include: {
        registrations: {
          orderBy: { registeredAt: 'desc' },
        },
      },
    })

    // Get profile data for all registrations
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const registrationsWithProfiles = await Promise.all(
          event.registrations.map(async (reg) => {
            const profile = await prisma.profile.findUnique({
              where: { id: reg.profileId },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            })

            return {
              id: reg.id,
              status: reg.status,
              paymentStatus: reg.paymentStatus,
              whatsappOptIn: reg.whatsappOptIn,
              smsOptIn: reg.smsOptIn,
              registeredAt: reg.registeredAt?.toISOString() || reg.createdAt.toISOString(),
              profile: profile
                ? {
                    id: profile.id,
                    odNumber: profile.odNumber,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    gender: profile.gender,
                    dateOfBirth: profile.dateOfBirth,
                    currentLocation: profile.currentLocation,
                    zipCode: profile.zipCode,
                    dietaryPreference: profile.dietaryPreference,
                    user: profile.user,
                  }
                : null,
            }
          })
        )

        // Calculate stats
        const paidRegistrations = registrationsWithProfiles.filter(
          (r) => r.status === 'registered' && r.paymentStatus === 'paid'
        )
        const waitlistedRegistrations = registrationsWithProfiles.filter(
          (r) => r.status === 'waitlisted'
        )

        const maleCount = paidRegistrations.filter(
          (r) => r.profile?.gender === 'male'
        ).length
        const femaleCount = paidRegistrations.filter(
          (r) => r.profile?.gender === 'female'
        ).length
        const totalRevenue = paidRegistrations.length * event.price

        return {
          id: event.id,
          slug: event.slug,
          title: event.title,
          eventDate: event.eventDate.toISOString(),
          status: event.status,
          price: event.price,
          maxMaleSpots: event.maxMaleSpots,
          maxFemaleSpots: event.maxFemaleSpots,
          registrations: registrationsWithProfiles.filter((r) => r.profile !== null),
          stats: {
            totalRegistered: paidRegistrations.length,
            totalWaitlisted: waitlistedRegistrations.length,
            maleCount,
            femaleCount,
            totalRevenue,
          },
        }
      })
    )

    return NextResponse.json({ events: eventsWithDetails })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
