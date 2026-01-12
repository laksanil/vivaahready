import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateVrId } from '@/lib/vrId'

const profileSchema = z.object({
  email: z.string().email(),
  gender: z.string(),
  createdBy: z.string().optional(),

  // Basic Info
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  maritalStatus: z.string().optional(),
  bloodGroup: z.string().optional(),
  healthInfo: z.string().optional(),
  anyDisability: z.string().optional(),

  // Location & Background
  country: z.string().optional(),
  currentLocation: z.string().optional(),
  citizenship: z.string().optional(),
  grewUpIn: z.string().optional(),
  livesWithFamily: z.string().optional(),
  familyLocation: z.string().optional(),
  motherTongue: z.string().optional(),
  languagesKnown: z.string().optional(),
  linkedinProfile: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),

  // Education & Career
  qualification: z.string().optional(),
  university: z.string().optional(),
  occupation: z.string().optional(),
  employerName: z.string().optional(),
  annualIncome: z.string().optional(),

  // Religion & Astro
  religion: z.string().optional(),
  caste: z.string().optional(),
  gotra: z.string().optional(),
  placeOfBirthCountry: z.string().optional(),
  placeOfBirthState: z.string().optional(),
  placeOfBirthCity: z.string().optional(),
  timeOfBirth: z.string().optional(),
  manglik: z.string().optional(),
  raasi: z.string().optional(),
  nakshatra: z.string().optional(),
  doshas: z.string().optional(),

  // Family
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  numberOfBrothers: z.string().optional(),
  numberOfSisters: z.string().optional(),
  familyType: z.string().optional(),
  familyValues: z.string().optional(),

  // Lifestyle
  dietaryPreference: z.string().optional(),
  smoking: z.string().optional(),
  drinking: z.string().optional(),
  hobbies: z.string().optional(),
  interests: z.string().optional(),
  pets: z.string().optional(),
  allergiesOrMedical: z.string().optional(),
  aboutMe: z.string().optional(),

  // Partner Preferences
  prefAgeDiff: z.string().optional(),
  prefHeight: z.string().optional(),
  prefCaste: z.string().optional(),
  prefGotra: z.string().optional(),
  prefLocation: z.string().optional(),
  prefCountry: z.string().optional(),
  prefQualification: z.string().optional(),
  prefDiet: z.string().optional(),
  idealPartnerDesc: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = profileSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      )
    }

    // Check if profile already exists
    if (user.profile) {
      return NextResponse.json(
        { error: 'Profile already exists for this user.' },
        { status: 400 }
      )
    }

    // Generate VR ID
    const vrId = await generateVrId()

    // Create profile with all fields
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        odNumber: vrId,
        gender: data.gender,
        createdBy: data.createdBy,

        // Basic Info
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        maritalStatus: data.maritalStatus,
        bloodGroup: data.bloodGroup,
        healthInfo: data.healthInfo,
        anyDisability: data.anyDisability,

        // Location & Background
        country: data.country,
        currentLocation: data.currentLocation,
        citizenship: data.citizenship,
        grewUpIn: data.grewUpIn,
        livesWithFamily: data.livesWithFamily,
        familyLocation: data.familyLocation,
        motherTongue: data.motherTongue,
        languagesKnown: data.languagesKnown,
        linkedinProfile: data.linkedinProfile,
        instagram: data.instagram,
        facebook: data.facebook,

        // Education & Career
        qualification: data.qualification,
        university: data.university,
        occupation: data.occupation,
        employerName: data.employerName,
        annualIncome: data.annualIncome,

        // Religion & Astro
        religion: data.religion,
        caste: data.caste,
        gotra: data.gotra,
        placeOfBirthCountry: data.placeOfBirthCountry,
        placeOfBirthState: data.placeOfBirthState,
        placeOfBirthCity: data.placeOfBirthCity,
        timeOfBirth: data.timeOfBirth,
        manglik: data.manglik,
        raasi: data.raasi,
        nakshatra: data.nakshatra,
        doshas: data.doshas,

        // Family
        fatherName: data.fatherName,
        fatherOccupation: data.fatherOccupation,
        motherName: data.motherName,
        motherOccupation: data.motherOccupation,
        numberOfBrothers: data.numberOfBrothers,
        numberOfSisters: data.numberOfSisters,
        familyType: data.familyType,
        familyValues: data.familyValues,

        // Lifestyle
        dietaryPreference: data.dietaryPreference,
        smoking: data.smoking,
        drinking: data.drinking,
        hobbies: data.hobbies,
        interests: data.interests,
        pets: data.pets,
        allergiesOrMedical: data.allergiesOrMedical,
        aboutMe: data.aboutMe,

        // Partner Preferences
        prefAgeDiff: data.prefAgeDiff,
        prefHeight: data.prefHeight,
        prefCaste: data.prefCaste,
        prefGotra: data.prefGotra,
        prefLocation: data.prefLocation,
        prefCountry: data.prefCountry,
        prefQualification: data.prefQualification,
        prefDiet: data.prefDiet,
        idealPartnerDesc: data.idealPartnerDesc,

        // Status
        approvalStatus: 'pending',
      },
    })

    return NextResponse.json(
      {
        message: 'Profile created successfully',
        profileId: profile.id,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Profile creation error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
