import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Generate a VR ID
function generateVRId(): string {
  const prefix = 'VR'
  const randomNum = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}${randomNum}`
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('admin_session')

    if (!adminCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, tempPassword, profileData } = body

    if (!email || !name || !tempPassword) {
      return NextResponse.json(
        { error: 'Email, name, and temporary password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Generate unique VR ID
    let vrId = generateVRId()
    let idExists = true
    while (idExists) {
      const existing = await prisma.profile.findUnique({
        where: { odNumber: vrId },
      })
      if (!existing) {
        idExists = false
      } else {
        vrId = generateVRId()
      }
    }

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          mustChangePassword: true, // Flag to force password change
        },
      })

      // Create subscription (free tier)
      await tx.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'active',
        },
      })

      // Prepare profile data
      const profileFields: Record<string, unknown> = {
        userId: user.id,
        odNumber: vrId,
        // Set approval status to approved since admin is creating it
        approvalStatus: 'approved',
        approvalDate: new Date(),
        isVerified: false,
        isActive: true,
      }

      // Map form data to profile fields
      const fieldMappings: Record<string, string> = {
        gender: 'gender',
        dateOfBirth: 'dateOfBirth',
        age: 'age',
        height: 'height',
        weight: 'weight',
        maritalStatus: 'maritalStatus',
        currentLocation: 'currentLocation',
        country: 'country',
        citizenship: 'citizenship',
        grewUpIn: 'grewUpIn',
        livesWithFamily: 'livesWithFamily',
        familyLocation: 'familyLocation',
        motherTongue: 'motherTongue',
        languagesKnown: 'languagesKnown',
        linkedinProfile: 'linkedinProfile',
        qualification: 'qualification',
        university: 'university',
        occupation: 'occupation',
        employerName: 'employerName',
        annualIncome: 'annualIncome',
        fatherName: 'fatherName',
        motherName: 'motherName',
        fatherOccupation: 'fatherOccupation',
        motherOccupation: 'motherOccupation',
        numberOfBrothers: 'numberOfBrothers',
        numberOfSisters: 'numberOfSisters',
        familyType: 'familyType',
        familyValues: 'familyValues',
        dietaryPreference: 'dietaryPreference',
        smoking: 'smoking',
        drinking: 'drinking',
        hobbies: 'hobbies',
        fitness: 'fitness',
        interests: 'interests',
        pets: 'pets',
        allergiesOrMedical: 'allergiesOrMedical',
        aboutMe: 'aboutMe',
        religion: 'religion',
        caste: 'caste',
        gotra: 'gotra',
        placeOfBirth: 'placeOfBirth',
        timeOfBirth: 'timeOfBirth',
        manglik: 'manglik',
        raasi: 'raasi',
        nakshatra: 'nakshatra',
        prefAgeDiff: 'prefAgeDiff',
        prefHeightMin: 'prefHeightMin',
        prefHeightMax: 'prefHeightMax',
        prefLocation: 'prefLocation',
        prefCountry: 'prefCountry',
        prefIncome: 'prefIncome',
        prefQualification: 'prefQualification',
        prefDiet: 'prefDiet',
        prefCaste: 'prefCaste',
        prefGotra: 'prefGotra',
        prefHobbies: 'prefHobbies',
        prefFitness: 'prefFitness',
        prefInterests: 'prefInterests',
        prefGrewUpIn: 'prefGrewUpIn',
        idealPartnerDesc: 'idealPartnerDesc',
        referralSource: 'referralSource',
        zipCode: 'zipCode',
        residencyStatus: 'residencyStatus',
        createdBy: 'createdBy',
      }

      // Copy profile data
      for (const [formKey, dbKey] of Object.entries(fieldMappings)) {
        if (profileData[formKey] !== undefined && profileData[formKey] !== '') {
          profileFields[dbKey] = profileData[formKey]
        }
      }

      // Handle name fields specially
      if (profileData.firstName || profileData.lastName) {
        // Store full name in a way that can be retrieved
        profileFields.createdBy = profileData.createdBy || 'admin'
      }

      // Create profile
      const profile = await tx.profile.create({
        data: profileFields as Parameters<typeof tx.profile.create>[0]['data'],
      })

      // Update user name with first and last name
      if (profileData.firstName && profileData.lastName) {
        await tx.user.update({
          where: { id: user.id },
          data: { name: `${profileData.firstName} ${profileData.lastName}` },
        })
      }

      return { user, profile }
    })

    return NextResponse.json({
      success: true,
      userId: result.user.id,
      profileId: result.profile.id,
      vrId: vrId,
      message: 'Profile created successfully',
    })
  } catch (error) {
    console.error('Admin create profile error:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}
