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
  price: 25,
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to register' }, { status: 401 })
    }

    const body = await request.json()
    const { whatsappOptIn = false, smsOptIn = false } = body

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Please create your profile first', redirectTo: '/profile/complete?returnTo=/marchevent/payment' },
        { status: 400 }
      )
    }

    // Check profile completion
    if (profile.signupStep < 10) {
      return NextResponse.json(
        { error: 'Please complete your profile first', redirectTo: '/profile/complete?returnTo=/marchevent' },
        { status: 400 }
      )
    }

    // Check eligibility
    const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
    if (!age || age < EVENT_CONFIG.minAge || age > EVENT_CONFIG.maxAge) {
      return NextResponse.json(
        { error: `This event is only for ages ${EVENT_CONFIG.minAge}-${EVENT_CONFIG.maxAge}` },
        { status: 400 }
      )
    }

    if (!isCaliforniaResident(profile.zipCode)) {
      return NextResponse.json(
        { error: 'This event is only for California residents' },
        { status: 400 }
      )
    }

    if (profile.dietaryPreference?.toLowerCase() !== 'vegetarian') {
      return NextResponse.json(
        { error: 'This event is exclusively for vegetarians' },
        { status: 400 }
      )
    }

    if (!isUSCitizen(profile.citizenship)) {
      return NextResponse.json(
        { error: 'This event is only for US Citizens' },
        { status: 400 }
      )
    }

    // Get or create the event
    let event = await prisma.event.findUnique({
      where: { slug: EVENT_SLUG },
    })

    if (!event) {
      event = await prisma.event.create({
        data: {
          slug: EVENT_SLUG,
          title: 'Singles Zoom Meetup - March 2025',
          description: 'Exclusive vegetarian singles event for California residents aged 24-35',
          eventDate: new Date('2025-03-15T10:00:00-08:00'),
          timezone: 'America/Los_Angeles',
          duration: 60,
          maxMaleSpots: EVENT_CONFIG.maxMaleSpots,
          maxFemaleSpots: EVENT_CONFIG.maxFemaleSpots,
          minAge: EVENT_CONFIG.minAge,
          maxAge: EVENT_CONFIG.maxAge,
          dietaryReq: EVENT_CONFIG.dietaryReq,
          locationReq: EVENT_CONFIG.locationReq,
          price: EVENT_CONFIG.price,
          status: 'upcoming',
          isPublished: true,
          minAttendeesToRun: 10,
        },
      })
    }

    // Check for existing registration
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_profileId: {
          eventId: event.id,
          profileId: profile.id,
        },
      },
    })

    if (existingRegistration) {
      if (existingRegistration.status === 'registered' && existingRegistration.paymentStatus === 'paid') {
        return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 })
      }
      if (existingRegistration.status === 'waitlisted') {
        return NextResponse.json({ error: 'You are already on the waitlist' }, { status: 400 })
      }
      // If there's a pending registration, we can update it
    }

    // Count current registrations by gender
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: 'registered',
        paymentStatus: 'paid',
      },
    })

    const profileIds = registrations.map(r => r.profileId)
    const profiles = await prisma.profile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true, gender: true },
    })

    const genderMap = new Map(profiles.map(p => [p.id, p.gender]))
    const maleCount = registrations.filter(r => genderMap.get(r.profileId) === 'male').length
    const femaleCount = registrations.filter(r => genderMap.get(r.profileId) === 'female').length

    // Check if spots are available
    const userGender = profile.gender
    const spotsAvailable =
      (userGender === 'male' && maleCount < EVENT_CONFIG.maxMaleSpots) ||
      (userGender === 'female' && femaleCount < EVENT_CONFIG.maxFemaleSpots)

    if (!spotsAvailable) {
      // Add to waitlist
      const waitlistCount = await prisma.eventRegistration.count({
        where: {
          eventId: event.id,
          status: 'waitlisted',
        },
      })

      if (existingRegistration) {
        await prisma.eventRegistration.update({
          where: { id: existingRegistration.id },
          data: {
            status: 'waitlisted',
            waitlistPosition: waitlistCount + 1,
            whatsappOptIn,
            smsOptIn,
          },
        })
      } else {
        await prisma.eventRegistration.create({
          data: {
            eventId: event.id,
            profileId: profile.id,
            status: 'waitlisted',
            paymentStatus: 'pending',
            waitlistPosition: waitlistCount + 1,
            whatsappOptIn,
            smsOptIn,
          },
        })
      }

      return NextResponse.json({
        success: true,
        waitlisted: true,
        message: 'You have been added to the waitlist. We will notify you if a spot opens up.',
      })
    }

    // Create or update registration as pending payment
    let registration
    if (existingRegistration) {
      registration = await prisma.eventRegistration.update({
        where: { id: existingRegistration.id },
        data: {
          status: 'registered',
          paymentStatus: 'pending',
          whatsappOptIn,
          smsOptIn,
        },
      })
    } else {
      registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          profileId: profile.id,
          status: 'registered',
          paymentStatus: 'pending',
          whatsappOptIn,
          smsOptIn,
        },
      })
    }

    // Return payment URL
    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      paymentUrl: `/marchevent/payment?registrationId=${registration.id}`,
      amount: EVENT_CONFIG.price,
    })
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
