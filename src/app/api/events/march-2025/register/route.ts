import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Event configuration
const EVENT_SLUG = 'april-2026-vegetarian'
const EVENT_CONFIG = {
  minAge: 29,
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
        { error: 'Please create your profile first', redirectTo: '/profile/complete?returnTo=/aprilevent' },
        { status: 400 }
      )
    }

    const missingFields: string[] = []
    if (!profile.dateOfBirth && !profile.age) missingFields.push('date of birth or age')
    if (!profile.dietaryPreference) missingFields.push('dietary preference')
    if (profile.gender !== 'male' && profile.gender !== 'female') missingFields.push('gender')

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Please add ${missingFields.join(', ')} in your profile before registering.`,
        },
        { status: 400 }
      )
    }

    // Check eligibility - use dateOfBirth if available, otherwise fall back to age field
    const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : (profile.age ? Number(profile.age) : null)
    if (!age || age < EVENT_CONFIG.minAge || age > EVENT_CONFIG.maxAge) {
      return NextResponse.json(
        { error: `This event is only for ages ${EVENT_CONFIG.minAge}-${EVENT_CONFIG.maxAge}` },
        { status: 400 }
      )
    }

    const diet = profile.dietaryPreference?.toLowerCase()
    if (diet !== 'vegetarian' && diet !== 'eggetarian') {
      return NextResponse.json(
        { error: 'This event is exclusively for vegetarians and eggetarians' },
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
          title: 'Singles Zoom Mixer - April 2026',
          description: 'Exclusive vegetarian singles event for California residents aged 29-35',
          eventDate: new Date('2026-04-05T18:00:00-07:00'),
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
      paymentUrl: `/aprilevent/payment?registrationId=${registration.id}`,
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
