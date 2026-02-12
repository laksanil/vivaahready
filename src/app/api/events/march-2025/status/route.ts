import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Event configuration
const EVENT_SLUG = 'march-2025-vegetarian'
const EVENT_CONFIG = {
  minAge: 24,
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

// Helper to check if location is in California using zip code
function isCaliforniaResident(zipCode: string | null): boolean {
  if (!zipCode) return false

  const zip = zipCode.trim()

  // California zip codes range from 90001 to 96162
  if (zip.length === 5 && /^\d{5}$/.test(zip)) {
    const zipNum = parseInt(zip)
    // California zip codes: 90001-96162
    if (zipNum >= 90001 && zipNum <= 96162) {
      return true
    }
  }

  return false
}

// Helper to check if user is US Citizen
function isUSCitizen(citizenship: string | null): boolean {
  if (!citizenship) return false

  const status = citizenship.toLowerCase()
  // Only accept US Citizens
  return (
    status.includes('us citizen') ||
    status === 'citizen' ||
    status.includes('american citizen') ||
    status.includes('united states citizen')
  )
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
          title: 'Singles Zoom Meetup - March 2025',
          description: 'Exclusive vegetarian singles event for California residents aged 24-35',
          eventDate: new Date('2026-03-15T10:00:00-07:00'),
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
      locationEligible: boolean
      dietEligible: boolean
      citizenshipEligible: boolean
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
        const profileComplete = userProfile.signupStep >= 10
        const age = userProfile.dateOfBirth ? calculateAge(userProfile.dateOfBirth) : null
        const ageEligible = age !== null && age >= EVENT_CONFIG.minAge && age <= EVENT_CONFIG.maxAge
        const locationEligible = isCaliforniaResident(userProfile.zipCode)
        const dietEligible = userProfile.dietaryPreference?.toLowerCase() === 'vegetarian'
        const citizenshipEligible = isUSCitizen(userProfile.citizenship)

        let reason: string | undefined
        if (!profileComplete) {
          reason = 'Please complete your profile to register for this event.'
        } else if (!ageEligible) {
          reason = `This event is only for ages ${EVENT_CONFIG.minAge}-${EVENT_CONFIG.maxAge}.`
        } else if (!locationEligible) {
          reason = 'This event is only for California residents.'
        } else if (!dietEligible) {
          reason = 'This event is exclusively for vegetarians.'
        } else if (!citizenshipEligible) {
          reason = 'This event is only for US Citizens.'
        }

        userEligibility = {
          eligible: profileComplete && ageEligible && locationEligible && dietEligible && citizenshipEligible,
          reason,
          profileComplete,
          ageEligible,
          locationEligible,
          dietEligible,
          citizenshipEligible,
        }
      } else {
        // No profile yet
        userEligibility = {
          eligible: false,
          reason: 'Please create your profile to register for this event.',
          profileComplete: false,
          ageEligible: false,
          locationEligible: false,
          dietEligible: false,
          citizenshipEligible: false,
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
