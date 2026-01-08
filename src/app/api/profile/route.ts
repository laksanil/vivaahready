import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 })
    }

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: session.user.id,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        placeOfBirth: body.placeOfBirth,
        height: body.height,
        maritalStatus: body.maritalStatus,
        dietaryPreference: body.dietaryPreference,
        languagesKnown: body.languagesKnown,
        currentLocation: body.currentLocation,
        caste: body.caste,
        gotra: body.gotra,
        qualification: body.qualification,
        university: body.university,
        occupation: body.occupation,
        annualIncome: body.annualIncome,
        fatherName: body.fatherName,
        motherName: body.motherName,
        siblings: body.siblings,
        familyLocation: body.familyLocation,
        aboutMe: body.aboutMe,
        prefHeight: body.prefHeight,
        prefAgeDiff: body.prefAgeDiff,
        prefLocation: body.prefLocation,
        prefDiet: body.prefDiet,
        prefCaste: body.prefCaste,
        prefGotra: body.prefGotra,
        prefQualification: body.prefQualification,
        prefIncome: body.prefIncome,
        idealPartnerDesc: body.idealPartnerDesc,
      },
    })

    return NextResponse.json({ message: 'Profile created successfully', profileId: profile.id }, { status: 201 })
  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: body,
    })

    return NextResponse.json({ message: 'Profile updated successfully', profile })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
