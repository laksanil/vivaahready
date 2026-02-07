import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateVrId } from '@/lib/vrId'
import { normalizeSameAsMinePreferences } from '@/lib/preferenceNormalization'
import { sendReferralThankYouEmail } from '@/lib/email'
import { getReferralCount } from '@/lib/referral'

/**
 * Format full name to "Firstname L." format for privacy
 * E.g., "Test Female" -> "Test F."
 */
function formatDisplayName(firstName: string, lastName: string): string {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''

  if (!first && !last) return 'User'
  if (!last) return first

  const lastInitial = last.charAt(0).toUpperCase()
  return `${first} ${lastInitial}.`
}

const profileSchema = z.object({
  email: z.string().email(),
  gender: z.string().optional(), // Optional - user fills this in basics step
  createdBy: z.string().optional(),
  phone: z.string().optional(), // Phone number stored in User model

  // Basic Info
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  age: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  maritalStatus: z.string().optional(),
  bloodGroup: z.string().optional(),
  healthInfo: z.string().optional(),
  anyDisability: z.string().optional(),

  // Location & Background
  country: z.string().optional(),
  currentLocation: z.string().optional(),
  zipCode: z.string().optional(),
  citizenship: z.string().optional(),
  residencyStatus: z.string().optional(),
  grewUpIn: z.string().optional(),
  openToRelocation: z.string().optional(),
  livesWithFamily: z.string().optional(),
  familyLocation: z.string().optional(),
  familyLocationCountry: z.string().optional(),
  familyLocationCountryOther: z.string().optional(),
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
  educationCareerDetails: z.string().optional(),

  // Religion & Community
  religion: z.string().optional(),
  community: z.string().optional(),
  subCommunity: z.string().optional(),
  caste: z.string().optional(),
  gotra: z.string().optional(),

  // Birth Details
  placeOfBirthCountry: z.string().optional(),
  placeOfBirthState: z.string().optional(),
  placeOfBirthCity: z.string().optional(),

  // Hindu-specific Astro
  timeOfBirth: z.string().optional(),
  manglik: z.string().optional(),
  raasi: z.string().optional(),
  nakshatra: z.string().optional(),
  doshas: z.string().optional(),

  // Muslim-specific
  maslak: z.string().optional(),
  namazPractice: z.string().optional(),

  // Sikh-specific
  amritdhari: z.string().optional(),
  turban: z.string().optional(),

  // Christian-specific
  churchAttendance: z.string().optional(),
  baptized: z.string().optional(),

  // Family
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  numberOfBrothers: z.string().optional(),
  numberOfSisters: z.string().optional(),
  familyType: z.string().optional(),
  familyValues: z.string().optional(),
  familyDetails: z.string().optional(),

  // Lifestyle
  dietaryPreference: z.string().optional(),
  smoking: z.string().optional(),
  drinking: z.string().optional(),
  hobbies: z.string().optional(),
  fitness: z.string().optional(),
  interests: z.string().optional(),
  pets: z.string().optional(),
  allergiesOrMedical: z.string().optional(),
  aboutMe: z.string().optional(),
  referralSource: z.string().optional(),
  referredBy: z.string().optional(),

  // Partner Preferences
  prefAgeDiff: z.string().optional(),
  prefAgeMin: z.string().optional(),
  prefAgeMax: z.string().optional(),
  prefHeight: z.string().optional(),
  prefHeightMin: z.string().optional(),
  prefHeightMax: z.string().optional(),
  prefCommunity: z.string().optional(),
  prefSubCommunity: z.string().optional(),
  prefCommunityList: z.string().optional(),
  prefCaste: z.string().optional(),
  prefGotra: z.string().optional(),
  prefLocation: z.string().optional(),
  prefCountry: z.string().optional(),
  prefCitizenship: z.string().optional(),
  prefGrewUpIn: z.string().optional(),
  prefQualification: z.string().optional(),
  prefWorkArea: z.string().optional(),
  prefOccupation: z.string().optional(),
  prefIncome: z.string().optional(),
  prefDiet: z.string().optional(),
  prefSmoking: z.string().optional(),
  prefDrinking: z.string().optional(),
  prefMaritalStatus: z.string().optional(),
  prefRelocation: z.string().optional(),
  prefMotherTongue: z.string().optional(),
  prefMotherTongueList: z.string().optional(), // Multi-select mother tongue
  prefSubCommunityList: z.string().optional(), // Multi-select sub-community
  prefLocationList: z.string().optional(), // Multi-select locations
  prefOccupationList: z.string().optional(), // Multi-select occupations
  prefFamilyLocationCountry: z.string().optional(), // Partner family location country
  prefFamilyValues: z.string().optional(),
  prefReligion: z.string().optional(),
  prefPets: z.string().optional(),
  prefHobbies: z.string().optional(),
  prefFitness: z.string().optional(),
  prefInterests: z.string().optional(),
  idealPartnerDesc: z.string().optional(),

  // Deal-breaker flags
  prefAgeIsDealbreaker: z.boolean().optional(),
  prefHeightIsDealbreaker: z.boolean().optional(),
  prefMaritalStatusIsDealbreaker: z.boolean().optional(),
  prefHasChildrenIsDealbreaker: z.boolean().optional(),
  prefReligionIsDealbreaker: z.boolean().optional(),
  prefCommunityIsDealbreaker: z.boolean().optional(),
  prefGotraIsDealbreaker: z.boolean().optional(),
  prefDietIsDealbreaker: z.boolean().optional(),
  prefSmokingIsDealbreaker: z.boolean().optional(),
  prefDrinkingIsDealbreaker: z.boolean().optional(),
  prefLocationIsDealbreaker: z.boolean().optional(),
  prefCitizenshipIsDealbreaker: z.boolean().optional(),
  prefGrewUpInIsDealbreaker: z.boolean().optional(),
  prefEducationIsDealbreaker: z.boolean().optional(),
  prefWorkAreaIsDealbreaker: z.boolean().optional(),
  prefIncomeIsDealbreaker: z.boolean().optional(),
  prefOccupationIsDealbreaker: z.boolean().optional(),
  prefFamilyValuesIsDealbreaker: z.boolean().optional(),
  prefFamilyLocationIsDealbreaker: z.boolean().optional(),
  prefMotherTongueIsDealbreaker: z.boolean().optional(),
  prefSubCommunityIsDealbreaker: z.boolean().optional(),
  prefPetsIsDealbreaker: z.boolean().optional(),
  prefRelocationIsDealbreaker: z.boolean().optional(),
  skipDuplicateCheck: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = normalizeSameAsMinePreferences(profileSchema.parse(body))

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

    // Note: Email verification check removed - we allow profile creation immediately
    // to prevent data loss (like what happened with Rounak). Email verification can
    // happen later. The profile will be marked as pending approval anyway.

    // Check if profile already exists
    if (user.profile) {
      return NextResponse.json(
        { error: 'Profile already exists for this user.' },
        { status: 400 }
      )
    }

    // Check for duplicate profile (same firstName + lastName + dateOfBirth)
    // This is a HARD BLOCK - no duplicate profiles allowed
    if (data.firstName && data.lastName && data.dateOfBirth) {
      const duplicateProfile = await prisma.profile.findFirst({
        where: {
          firstName: { equals: data.firstName, mode: 'insensitive' },
          lastName: { equals: data.lastName, mode: 'insensitive' },
          dateOfBirth: data.dateOfBirth,
        },
        include: {
          user: { select: { email: true } },
        },
      })

      if (duplicateProfile) {
        // Mask email for privacy: ab***@gmail.com
        const maskedEmail = duplicateProfile.user?.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || 'your existing account'
        return NextResponse.json(
          {
            error: 'duplicate_profile',
            message: `A profile with this name and date of birth already exists. If this is you, please login with your existing account (${maskedEmail}).`,
          },
          { status: 409 }
        )
      }
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

        // Basic Info - Name fields
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        age: data.age,
        height: data.height,
        weight: data.weight,
        maritalStatus: data.maritalStatus,
        bloodGroup: data.bloodGroup,
        healthInfo: data.healthInfo,
        anyDisability: data.anyDisability,

        // Location & Background
        country: data.country,
        currentLocation: data.currentLocation,
        zipCode: data.zipCode,
        citizenship: data.citizenship,
        residencyStatus: data.residencyStatus,
        grewUpIn: data.grewUpIn,
        openToRelocation: data.openToRelocation,
        livesWithFamily: data.livesWithFamily,
        familyLocation: data.familyLocationCountry === 'Other'
          ? data.familyLocationCountryOther
          : data.familyLocationCountry || data.familyLocation,
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
        educationCareerDetails: data.educationCareerDetails,

        // Religion & Community
        religion: data.religion,
        community: data.community,
        subCommunity: data.subCommunity,
        caste: data.caste,
        gotra: data.gotra,

        // Birth Details
        placeOfBirthCountry: data.placeOfBirthCountry,
        placeOfBirthState: data.placeOfBirthState,
        placeOfBirthCity: data.placeOfBirthCity,

        // Hindu-specific Astro
        timeOfBirth: data.timeOfBirth,
        manglik: data.manglik,
        raasi: data.raasi,
        nakshatra: data.nakshatra,
        doshas: data.doshas,

        // Muslim-specific
        maslak: data.maslak,
        namazPractice: data.namazPractice,

        // Sikh-specific
        amritdhari: data.amritdhari,
        turban: data.turban,

        // Christian-specific
        churchAttendance: data.churchAttendance,
        baptized: data.baptized,

        // Family
        fatherName: data.fatherName,
        fatherOccupation: data.fatherOccupation,
        motherName: data.motherName,
        motherOccupation: data.motherOccupation,
        numberOfBrothers: data.numberOfBrothers,
        numberOfSisters: data.numberOfSisters,
        familyType: data.familyType,
        familyValues: data.familyValues,
        familyDetails: data.familyDetails,

        // Lifestyle
        dietaryPreference: data.dietaryPreference,
        smoking: data.smoking,
        drinking: data.drinking,
        hobbies: data.hobbies,
        fitness: data.fitness,
        interests: data.interests,
        pets: data.pets,
        allergiesOrMedical: data.allergiesOrMedical,
        aboutMe: data.aboutMe,
        referralSource: data.referralSource,
        referredBy: data.referredBy,

        // Partner Preferences
        prefAgeDiff: data.prefAgeDiff,
        prefAgeMin: data.prefAgeMin,
        prefAgeMax: data.prefAgeMax,
        prefHeight: data.prefHeight,
        prefHeightMin: data.prefHeightMin,
        prefHeightMax: data.prefHeightMax,
        prefCommunity: data.prefCommunityList || data.prefCommunity,
        prefSubCommunity: data.prefSubCommunityList || data.prefSubCommunity,
        prefCaste: data.prefCaste,
        prefGotra: data.prefGotra,
        prefLocation: data.prefLocationList || data.prefLocation,
        prefCountry: data.prefCountry,
        prefCitizenship: data.prefCitizenship,
        prefGrewUpIn: data.prefGrewUpIn,
        prefQualification: data.prefQualification,
        prefWorkArea: data.prefWorkArea,
        prefOccupation: data.prefOccupationList || data.prefOccupation,
        prefIncome: data.prefIncome,
        prefDiet: data.prefDiet,
        prefSmoking: data.prefSmoking,
        prefDrinking: data.prefDrinking,
        prefMaritalStatus: data.prefMaritalStatus,
        prefRelocation: data.prefRelocation,
        prefMotherTongue: data.prefMotherTongueList || data.prefMotherTongue,
        prefPets: data.prefPets,
        prefHobbies: data.prefHobbies,
        prefFitness: data.prefFitness,
        prefInterests: data.prefInterests,
        idealPartnerDesc: data.idealPartnerDesc,

        // Deal-breaker flags (age, height, marital status, religion default to true)
        prefAgeIsDealbreaker: data.prefAgeIsDealbreaker ?? true,
        prefHeightIsDealbreaker: data.prefHeightIsDealbreaker ?? true,
        prefMaritalStatusIsDealbreaker: data.prefMaritalStatusIsDealbreaker ?? true,
        prefHasChildrenIsDealbreaker: data.prefHasChildrenIsDealbreaker ?? false,
        prefReligionIsDealbreaker: data.prefReligionIsDealbreaker ?? true,
        prefCommunityIsDealbreaker: data.prefCommunityIsDealbreaker ?? false,
        prefGotraIsDealbreaker: data.prefGotraIsDealbreaker ?? false,
        prefDietIsDealbreaker: data.prefDietIsDealbreaker ?? false,
        prefSmokingIsDealbreaker: data.prefSmokingIsDealbreaker ?? false,
        prefDrinkingIsDealbreaker: data.prefDrinkingIsDealbreaker ?? false,
        prefLocationIsDealbreaker: data.prefLocationIsDealbreaker ?? false,
        prefCitizenshipIsDealbreaker: data.prefCitizenshipIsDealbreaker ?? false,
        prefGrewUpInIsDealbreaker: data.prefGrewUpInIsDealbreaker ?? false,
        prefEducationIsDealbreaker: data.prefEducationIsDealbreaker ?? false,
        prefWorkAreaIsDealbreaker: data.prefWorkAreaIsDealbreaker ?? false,
        prefIncomeIsDealbreaker: data.prefIncomeIsDealbreaker ?? false,
        prefOccupationIsDealbreaker: data.prefOccupationIsDealbreaker ?? false,
        prefFamilyValuesIsDealbreaker: data.prefFamilyValuesIsDealbreaker ?? false,
        prefFamilyLocationIsDealbreaker: data.prefFamilyLocationIsDealbreaker ?? false,
        prefMotherTongueIsDealbreaker: data.prefMotherTongueIsDealbreaker ?? false,
        prefSubCommunityIsDealbreaker: data.prefSubCommunityIsDealbreaker ?? false,
        prefPetsIsDealbreaker: data.prefPetsIsDealbreaker ?? false,
        prefRelocationIsDealbreaker: data.prefRelocationIsDealbreaker ?? false,

        // Status
        approvalStatus: 'pending',

        // Signup progress - signupStep tracks the next profile section to complete
        // 1=basics, 2=location_education, 3=religion, 4=family, 5=lifestyle, 6=aboutme, 7=preferences_1, 8=preferences_2, 9=complete
        // Basics is complete only if ALL required fields are filled: firstName, lastName, gender, age/DOB, height, maritalStatus, motherTongue, AND phone
        // If basics is complete, go to step 2 (location_education), otherwise stay at step 1 (basics)
        signupStep: (() => {
          const hasPhone = !!(data.phone || user.phone)
          const hasBasics = !!(
            data.firstName &&
            data.lastName &&
            data.gender &&
            (data.dateOfBirth || data.age) &&
            data.height &&
            data.maritalStatus &&
            data.motherTongue &&
            hasPhone
          )
          return hasBasics ? 2 : 1
        })(),
      },
    })

    // Update user's display name and phone if provided
    const userUpdateData: Record<string, unknown> = {}
    if (data.firstName || data.lastName) {
      userUpdateData.name = formatDisplayName(data.firstName || '', data.lastName || '')
    }
    if (data.phone) {
      userUpdateData.phone = data.phone.trim()
    }
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      })
    }

    // Send thank-you email to referrer (fire and forget)
    if (data.referredBy) {
      (async () => {
        try {
          const referrerProfile = await prisma.profile.findFirst({
            where: { referralCode: data.referredBy },
            include: { user: { select: { email: true, name: true } } },
          })
          if (referrerProfile?.user?.email) {
            const count = await getReferralCount(data.referredBy!)
            await sendReferralThankYouEmail(
              referrerProfile.user.email,
              referrerProfile.user.name || 'User',
              count
            )
          }
        } catch (err) {
          console.error('Failed to send referral thank-you email:', err)
        }
      })()
    }

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
