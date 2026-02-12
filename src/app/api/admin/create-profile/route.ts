import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import bcrypt from 'bcryptjs'
import { normalizeSameAsMinePreferences } from '@/lib/preferenceNormalization'
import { sanitizeObject } from '@/lib/sanitize'

// Generate a VR ID
function generateVRId(): string {
  const prefix = 'VR'
  const randomNum = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}${randomNum}`
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = sanitizeObject(await request.json())
    const { name, email, phone, tempPassword, profileData, skipDuplicateCheck } = body

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

    // Check for duplicate profile (same firstName + lastName + dateOfBirth)
    if (!skipDuplicateCheck && profileData?.firstName && profileData?.lastName && profileData?.dateOfBirth) {
      const duplicateProfile = await prisma.profile.findFirst({
        where: {
          firstName: { equals: profileData.firstName, mode: 'insensitive' },
          lastName: { equals: profileData.lastName, mode: 'insensitive' },
          dateOfBirth: profileData.dateOfBirth,
        },
        include: {
          user: { select: { email: true } },
        },
      })

      if (duplicateProfile) {
        return NextResponse.json(
          {
            error: 'duplicate_profile',
            message: `A profile with the same name and date of birth already exists (${duplicateProfile.odNumber}). This could be a duplicate.`,
            duplicate: {
              vrId: duplicateProfile.odNumber,
              email: duplicateProfile.user?.email,
            },
          },
          { status: 409 }
        )
      }
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

      // Prepare profile data - sanitize to prevent XSS
      const normalizedProfileData = sanitizeObject(normalizeSameAsMinePreferences(profileData || {}))
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
        educationCareerDetails: 'educationCareerDetails',
        fatherName: 'fatherName',
        motherName: 'motherName',
        fatherOccupation: 'fatherOccupation',
        motherOccupation: 'motherOccupation',
        numberOfBrothers: 'numberOfBrothers',
        numberOfSisters: 'numberOfSisters',
        familyType: 'familyType',
        familyValues: 'familyValues',
        familyDetails: 'familyDetails',
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
        community: 'community',
        subCommunity: 'subCommunity',
        caste: 'caste',
        gotra: 'gotra',
        placeOfBirth: 'placeOfBirth',
        placeOfBirthCountry: 'placeOfBirthCountry',
        placeOfBirthState: 'placeOfBirthState',
        placeOfBirthCity: 'placeOfBirthCity',
        // Hindu-specific
        timeOfBirth: 'timeOfBirth',
        manglik: 'manglik',
        raasi: 'raasi',
        nakshatra: 'nakshatra',
        doshas: 'doshas',
        // Muslim-specific
        maslak: 'maslak',
        namazPractice: 'namazPractice',
        // Sikh-specific
        amritdhari: 'amritdhari',
        turban: 'turban',
        // Christian-specific
        churchAttendance: 'churchAttendance',
        baptized: 'baptized',
        prefAgeDiff: 'prefAgeDiff',
        prefAgeMin: 'prefAgeMin',
        prefAgeMax: 'prefAgeMax',
        prefHeight: 'prefHeight',
        prefHeightMin: 'prefHeightMin',
        prefHeightMax: 'prefHeightMax',
        prefLocation: 'prefLocation',
        prefCountry: 'prefCountry',
        prefCitizenship: 'prefCitizenship',
        prefIncome: 'prefIncome',
        prefQualification: 'prefQualification',
        prefWorkArea: 'prefWorkArea',
        prefOccupation: 'prefOccupation',
        prefDiet: 'prefDiet',
        prefSmoking: 'prefSmoking',
        prefDrinking: 'prefDrinking',
        prefMaritalStatus: 'prefMaritalStatus',
        prefRelocation: 'prefRelocation',
        prefMotherTongue: 'prefMotherTongue',
        prefPets: 'prefPets',
        prefCommunity: 'prefCommunity',
        prefSubCommunity: 'prefSubCommunity',
        prefCommunityList: 'prefCommunity',
        prefSubCommunityList: 'prefSubCommunity',
        prefCaste: 'prefCaste',
        prefGotra: 'prefGotra',
        prefHobbies: 'prefHobbies',
        prefFitness: 'prefFitness',
        prefInterests: 'prefInterests',
        prefGrewUpIn: 'prefGrewUpIn',
        prefMotherTongueList: 'prefMotherTongue',
        idealPartnerDesc: 'idealPartnerDesc',
        referralSource: 'referralSource',
        zipCode: 'zipCode',
        residencyStatus: 'residencyStatus',
        createdBy: 'createdBy',
      }

      // Copy profile data
      for (const [formKey, dbKey] of Object.entries(fieldMappings)) {
        if (normalizedProfileData[formKey] !== undefined && normalizedProfileData[formKey] !== '') {
          let value = normalizedProfileData[formKey]
          // Normalize 'no_linkedin' to null
          if (dbKey === 'linkedinProfile' && value === 'no_linkedin') {
            value = null
          }
          profileFields[dbKey] = value
        }
      }

      // Set firstName and lastName on profile
      if (normalizedProfileData.firstName) {
        profileFields.firstName = normalizedProfileData.firstName
      }
      if (normalizedProfileData.lastName) {
        profileFields.lastName = normalizedProfileData.lastName
      }
      if (normalizedProfileData.createdBy) {
        profileFields.createdBy = normalizedProfileData.createdBy
      } else {
        profileFields.createdBy = 'admin'
      }

      // Create profile
      const profile = await tx.profile.create({
        data: profileFields as Parameters<typeof tx.profile.create>[0]['data'],
      })

      // Update user name with first and last name
      if (normalizedProfileData.firstName && normalizedProfileData.lastName) {
        await tx.user.update({
          where: { id: user.id },
          data: { name: `${normalizedProfileData.firstName} ${normalizedProfileData.lastName}` },
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
