import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Event configuration
const EVENT_SLUG = 'april-2026-vegetarian'
const EVENT_CONFIG = {
  minAge: 30,
  maxAge: 35,
  dietaryReq: 'Vegetarian',
  locationReq: 'California',
  maxMaleSpots: 10,
  maxFemaleSpots: 10,
}

// Helper to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const [month, day, year] = dateOfBirth.split('/').map(Number)
  const dob = new Date(year, month - 1, day)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}


export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Get or create the event
    let event = await prisma.event.findUnique({
      where: { slug: EVENT_SLUG },
    })

    // If event doesn't exist, create it
    if (!event) {
      event = await prisma.event.create({
        data: {
          slug: EVENT_SLUG,
          title: 'Singles Zoom Mixer - April 2026',
          description: 'Exclusive vegetarian singles event for California residents aged 29-35',
          eventDate: new Date('2026-04-05T11:00:00-07:00'),
          timezone: 'America/Los_Angeles',
          duration: 60,
          maxMaleSpots: EVENT_CONFIG.maxMaleSpots,
          maxFemaleSpots: EVENT_CONFIG.maxFemaleSpots,
          minAge: EVENT_CONFIG.minAge,
          maxAge: EVENT_CONFIG.maxAge,
          dietaryReq: EVENT_CONFIG.dietaryReq,
          locationReq: EVENT_CONFIG.locationReq,
          price: 25,
          status: 'upcoming',
          isPublished: true,
          minAttendeesToRun: 10,
        },
      })
    }

    // Get registration counts by gender
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: 'registered',
        paymentStatus: 'paid',
      },
    })

    // Fix: Get profile from the registration properly
    const profiles = await Promise.all(
      registrations.map(async (reg) => {
        const profile = await prisma.profile.findUnique({
          where: { id: reg.profileId },
          select: { gender: true },
        })
        return profile
      })
    )

    const maleCount = profiles.filter((p) => p?.gender === 'male').length
    const femaleCount = profiles.filter((p) => p?.gender === 'female').length

    // Check if current user is registered or on waitlist
    let isRegistered = false
    let isWaitlisted = false
    let userEligibility: {
      eligible: boolean
      reason?: string
      profileComplete: boolean
      ageEligible: boolean
      dietEligible: boolean
    } | undefined

    if (session?.user?.id) {
      const userProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
      })

      if (userProfile) {
        // Check if already registered
        const existingRegistration = await prisma.eventRegistration.findUnique({
          where: {
            eventId_profileId: {
              eventId: event.id,
              profileId: userProfile.id,
            },
          },
        })

        if (existingRegistration) {
          isRegistered = existingRegistration.status === 'registered' && existingRegistration.paymentStatus === 'paid'
          isWaitlisted = existingRegistration.status === 'waitlisted'
        }

        // Check eligibility
        const profileComplete = userProfile.signupStep >= 9
        const age = userProfile.dateOfBirth ? calculateAge(userProfile.dateOfBirth) : (userProfile.age ? Number(userProfile.age) : null)
        const ageEligible = age !== null && age >= EVENT_CONFIG.minAge && age <= EVENT_CONFIG.maxAge
        const diet = userProfile.dietaryPreference?.toLowerCase()
        const dietEligible = diet === 'vegetarian' || diet === 'eggetarian'

        let reason: string | undefined
        if (!profileComplete) {
          reason = 'Please complete your profile to register for this event.'
        } else if (!ageEligible) {
          reason = `This event is only for ages ${EVENT_CONFIG.minAge}-${EVENT_CONFIG.maxAge}.`
        } else if (!dietEligible) {
          reason = 'This event is exclusively for vegetarians and eggetarians.'
        }

        userEligibility = {
          eligible: profileComplete && ageEligible && dietEligible,
          reason,
          profileComplete,
          ageEligible,
          dietEligible,
        }
      } else {
        // No profile yet
        userEligibility = {
          eligible: false,
          reason: 'Please create your profile to register for this event.',
          profileComplete: false,
          ageEligible: false,
          dietEligible: false,
        }
      }
    }

    return NextResponse.json({
      eventId: event.id,
      maleCount,
      femaleCount,
      maxMaleSpots: event.maxMaleSpots,
      maxFemaleSpots: event.maxFemaleSpots,
      isRegistered,
      isWaitlisted,
      userEligibility,
    })
  } catch (error) {
    console.error('Error fetching event status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event status' },
      { status: 500 }
    )
  }
}
