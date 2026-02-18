import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateVrId } from '@/lib/vrId'
import { getTargetUserId } from '@/lib/admin'
import { normalizeSameAsMinePreferences } from '@/lib/preferenceNormalization'
import {
  validateAboutMeStep,
  getEffectiveUniversity,
  validateLocationEducationStep,
  validatePartnerPreferencesAdditional,
  validatePartnerPreferencesMustHaves,
} from '@/lib/profileFlowValidation'

/**
 * Format display name as "Firstname L." for privacy
 * This is used for user.name (public display in navbar, etc.)
 * The full firstName and lastName are stored separately in the Profile model
 */
function formatDisplayName(firstName: string, lastName: string): string {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''

  if (!first && !last) return 'User'
  if (!last) return first

  const lastInitial = last.charAt(0).toUpperCase()
  return `${first} ${lastInitial}.`
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if email is verified (skip for admin creating profiles or Google OAuth users)
    if (!targetUser.isAdminView) {
      const user = await prisma.user.findUnique({
        where: { id: targetUser.userId },
        select: { emailVerified: true, password: true },
      })

      // Only require verification for email/password users (not Google OAuth)
      // Google OAuth users have emailVerified set automatically
      if (user?.password && !user.emailVerified) {
        return NextResponse.json(
          { error: 'Please verify your email before creating a profile', requiresEmailVerification: true },
          { status: 403 }
        )
      }
    }

    const body = normalizeSameAsMinePreferences(await request.json())

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: targetUser.userId },
      select: { id: true },
    })

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 })
    }

    // Build location string from city and state
    let currentLocation = null
    if (body.city && body.state) {
      currentLocation = `${body.city}, ${body.state}`
    } else if (body.city) {
      currentLocation = body.city
    } else if (body.state) {
      currentLocation = body.state
    } else if (body.currentLocation) {
      currentLocation = body.currentLocation
    }

    // Generate VR ID
    const vrId = await generateVrId()

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: targetUser.userId,
        odNumber: vrId,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        placeOfBirth: body.nativePlace || body.placeOfBirth,
        height: body.height,
        maritalStatus: body.maritalStatus,
        hasChildren: body.hasChildren,
        dietaryPreference: body.diet || body.dietaryPreference,
        languagesKnown: body.motherTongue || body.languagesKnown,
        currentLocation: currentLocation,
        zipCode: body.zipCode,
        community: body.community || body.caste, // community is primary, caste is legacy fallback
        gotra: body.gothra || body.gotra,
        qualification: body.education || body.qualification,
        university: body.educationDetail || body.university,
        occupation: body.occupation,
        annualIncome: body.income || body.annualIncome,
        fatherName: body.fatherOccupation || body.fatherName,
        motherName: body.motherOccupation || body.motherName,
        siblingDetails: body.siblings || body.siblingDetails,
        familyLocation: body.familyLocation,
        aboutMe: body.aboutMe,
        photoUrls: body.photoUrls,
        profileImageUrl: body.profileImageUrl,
        citizenship: body.citizenship,
        residencyStatus: body.residencyStatus,
        grewUpIn: body.grewUpIn,
        country: body.country,
        linkedinProfile: body.linkedin || body.linkedinProfile,
        facebookInstagram: body.instagram || body.facebook || body.facebookInstagram,
        prefHeight: body.preferredHeightMin && body.preferredHeightMax
          ? `${body.preferredHeightMin}-${body.preferredHeightMax}cm`
          : body.prefHeight,
        prefAgeDiff: body.preferredAgeMin && body.preferredAgeMax
          ? `${body.preferredAgeMin}-${body.preferredAgeMax} years`
          : body.prefAgeDiff,
        prefLocation: body.preferredDistance || body.preferredLocation || body.prefLocation,
        prefDiet: body.prefDiet,
        prefCommunity: body.prefCommunity || body.preferredCaste || body.prefCaste, // prefCommunity is primary, prefCaste is legacy fallback
        prefGotra: body.prefGotra,
        prefQualification: body.preferredEducation || body.prefQualification,
        prefIncome: body.prefIncome,
        idealPartnerDesc: body.partnerPreferences || body.idealPartnerDesc,
        approvalStatus: 'pending', // All new profiles start as pending
        // Campaign tracking
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
        utm_content: body.utm_content,
        utm_term: body.utm_term,
        acquisitionChannel: body.utm_source ? (body.utm_source === 'direct' ? 'organic' : body.utm_medium === 'social' ? 'social' : body.utm_medium === 'cpc' || body.utm_medium === 'ppc' ? 'paid_search' : 'other') : 'organic',
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
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile: Record<string, unknown> | null = null
    try {
      profile = await prisma.profile.findUnique({
        where: { userId: targetUser.userId },
        include: { user: { select: { name: true, email: true, phone: true, emailVerified: true, phoneVerified: true } } },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
        profile = await prisma.profile.findUnique({
          where: { userId: targetUser.userId },
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            age: true,
            height: true,
            motherTongue: true,
            maritalStatus: true,
            currentLocation: true,
            signupStep: true,
            approvalStatus: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                emailVerified: true,
                phoneVerified: true,
              },
            },
          },
        })
      } else {
        throw error
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Use stored firstName/lastName from Profile, fallback to parsing user.name for legacy data
    const profileDataRaw = profile as Record<string, unknown>
    const userRaw = profileDataRaw.user as Record<string, unknown> | undefined
    let firstName = (profileDataRaw.firstName as string | null) || ''
    let lastName = (profileDataRaw.lastName as string | null) || ''

    // Fallback for legacy profiles that don't have firstName/lastName stored
    if (!firstName && typeof userRaw?.name === 'string') {
      const nameParts = userRaw.name.trim().split(' ')
      firstName = nameParts[0] || ''
      // Don't use parsed lastName from "Firstname L." format - it would just be "L."
    }

    // Return profile with firstName, lastName, contact info, and verification status
    const { user: _user, ...profileData } = profileDataRaw
    return NextResponse.json({
      ...profileData,
      firstName,
      lastName,
      email: userRaw?.email || null,
      phone: userRaw?.phone || null,
      emailVerified: !!userRaw?.emailVerified,
      phoneVerified: !!userRaw?.phoneVerified,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile exists first
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: targetUser.userId },
      select: {
        id: true,
        university: true,
        referralSource: true,
        prefQualification: true,
      },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found. Please create a profile first.' }, { status: 404 })
    }

    const body = normalizeSameAsMinePreferences(await request.json(), existingProfile || undefined)
    const normalizeText = (value: unknown): string => {
      return typeof value === 'string' ? value.trim() : ''
    }
    const editSection = typeof body._editSection === 'string' ? body._editSection : ''

    // Build update data - only include fields that are in the schema
    const updateData: Record<string, unknown> = {}

    // Store firstName and lastName in Profile model (full names)
    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName

    // Map incoming fields to database fields
    if (body.gender !== undefined) updateData.gender = body.gender
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth
    if (body.age !== undefined) updateData.age = body.age
    if (body.height !== undefined) updateData.height = body.height
    if (body.weight !== undefined) updateData.weight = body.weight
    if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus
    if (body.hasChildren !== undefined) updateData.hasChildren = body.hasChildren
    if (body.currentLocation !== undefined) updateData.currentLocation = body.currentLocation
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode
    if (body.citizenship !== undefined) updateData.citizenship = body.citizenship
    if (body.linkedinProfile !== undefined) updateData.linkedinProfile = body.linkedinProfile === 'no_linkedin' ? null : body.linkedinProfile
    if (body.facebookInstagram !== undefined) updateData.facebookInstagram = body.facebookInstagram
    if (body.facebook !== undefined) updateData.facebook = body.facebook
    if (body.instagram !== undefined) updateData.instagram = body.instagram
    if (body.community !== undefined) updateData.community = body.community
    if (body.subCommunity !== undefined) updateData.subCommunity = body.subCommunity
    if (body.caste !== undefined) updateData.caste = body.caste
    if (body.gotra !== undefined) updateData.gotra = body.gotra
    if (body.qualification !== undefined) updateData.qualification = body.qualification
    if (body.university !== undefined || body.universityOther !== undefined) {
      const baseUniversity = body.university !== undefined ? body.university : existingProfile.university
      updateData.university = getEffectiveUniversity(baseUniversity, body.universityOther)
    }
    if (body.occupation !== undefined) updateData.occupation = body.occupation
    if (body.annualIncome !== undefined) updateData.annualIncome = body.annualIncome
    if (body.fatherName !== undefined) updateData.fatherName = body.fatherName
    if (body.motherName !== undefined) updateData.motherName = body.motherName
    if (body.fatherOccupation !== undefined) updateData.fatherOccupation = body.fatherOccupation
    if (body.motherOccupation !== undefined) updateData.motherOccupation = body.motherOccupation
    if (body.numberOfBrothers !== undefined) updateData.numberOfBrothers = body.numberOfBrothers
    if (body.numberOfSisters !== undefined) updateData.numberOfSisters = body.numberOfSisters
    if (body.siblingDetails !== undefined) updateData.siblingDetails = body.siblingDetails
    if (body.familyType !== undefined) updateData.familyType = body.familyType
    if (body.familyValues !== undefined) updateData.familyValues = body.familyValues
    if (body.familyLocation !== undefined) updateData.familyLocation = body.familyLocation
    if (body.dietaryPreference !== undefined) updateData.dietaryPreference = body.dietaryPreference
    if (body.motherTongue !== undefined) updateData.motherTongue = body.motherTongue
    if (body.healthInfo !== undefined) updateData.healthInfo = body.healthInfo
    if (body.anyDisability !== undefined) updateData.anyDisability = body.anyDisability
    if (body.disabilityDetails !== undefined) updateData.disabilityDetails = body.disabilityDetails
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup
    if (body.languagesKnown !== undefined) updateData.languagesKnown = body.languagesKnown
    if (body.aboutMe !== undefined) updateData.aboutMe = body.aboutMe
    if (body.prefHeight !== undefined) updateData.prefHeight = body.prefHeight
    if (body.prefHeightMin !== undefined) updateData.prefHeightMin = body.prefHeightMin
    if (body.prefHeightMax !== undefined) updateData.prefHeightMax = body.prefHeightMax
    if (body.prefAgeDiff !== undefined) updateData.prefAgeDiff = body.prefAgeDiff
    if (body.prefAgeMin !== undefined) updateData.prefAgeMin = body.prefAgeMin
    if (body.prefAgeMax !== undefined) updateData.prefAgeMax = body.prefAgeMax
    if (body.prefLocation !== undefined) updateData.prefLocation = body.prefLocation
    if (body.preferredDistance !== undefined) updateData.prefLocation = body.preferredDistance
    if (body.prefCountry !== undefined) updateData.prefCountry = body.prefCountry
    if (body.prefCitizenship !== undefined) updateData.prefCitizenship = body.prefCitizenship
    if (body.prefDiet !== undefined) updateData.prefDiet = body.prefDiet
    if (body.prefSmoking !== undefined) updateData.prefSmoking = body.prefSmoking
    if (body.prefDrinking !== undefined) updateData.prefDrinking = body.prefDrinking
    if (body.prefCommunity !== undefined) updateData.prefCommunity = body.prefCommunity
    if (body.prefSubCommunity !== undefined) updateData.prefSubCommunity = body.prefSubCommunity
    if (body.prefCommunityList !== undefined) updateData.prefCommunity = body.prefCommunityList // Store the list in prefCommunity when specific
    if (body.prefSubCommunityList !== undefined) updateData.prefSubCommunity = body.prefSubCommunityList
    if (body.prefCaste !== undefined) updateData.prefCaste = body.prefCaste
    if (body.prefGotra !== undefined) updateData.prefGotra = body.prefGotra
    if (body.prefQualification !== undefined) updateData.prefQualification = body.prefQualification
    if (body.prefWorkArea !== undefined) updateData.prefWorkArea = body.prefWorkArea
    if (body.prefOccupation !== undefined) updateData.prefOccupation = body.prefOccupation
    if (body.prefIncome !== undefined) updateData.prefIncome = body.prefIncome
    if (body.prefLanguage !== undefined) updateData.prefLanguage = body.prefLanguage
    if (body.prefHobbies !== undefined) updateData.prefHobbies = body.prefHobbies
    if (body.prefSpecificHobbies !== undefined) updateData.prefSpecificHobbies = body.prefSpecificHobbies
    if (body.prefFitness !== undefined) updateData.prefFitness = body.prefFitness
    if (body.prefSpecificFitness !== undefined) updateData.prefSpecificFitness = body.prefSpecificFitness
    if (body.prefInterests !== undefined) updateData.prefInterests = body.prefInterests
    if (body.prefSpecificInterests !== undefined) updateData.prefSpecificInterests = body.prefSpecificInterests
    if (body.prefGrewUpIn !== undefined) updateData.prefGrewUpIn = body.prefGrewUpIn
    if (body.prefMaritalStatus !== undefined) updateData.prefMaritalStatus = body.prefMaritalStatus
    if (body.prefHasChildren !== undefined) updateData.prefHasChildren = body.prefHasChildren
    if (body.prefRelocation !== undefined) updateData.prefRelocation = body.prefRelocation
    if (body.prefMotherTongue !== undefined) updateData.prefMotherTongue = body.prefMotherTongue
    if (body.prefMotherTongueList !== undefined) updateData.prefMotherTongue = body.prefMotherTongueList
    if (body.prefPets !== undefined) updateData.prefPets = body.prefPets
    if (body.idealPartnerDesc !== undefined) updateData.idealPartnerDesc = body.idealPartnerDesc
    if (body.photoUrls !== undefined) updateData.photoUrls = body.photoUrls
    if (body.profileImageUrl !== undefined) updateData.profileImageUrl = body.profileImageUrl
    if (body.residencyStatus !== undefined) updateData.residencyStatus = body.residencyStatus
    if (body.grewUpIn !== undefined) updateData.grewUpIn = body.grewUpIn
    if (body.country !== undefined) updateData.country = body.country

    // Birth details (all religions)
    if (body.placeOfBirthCountry !== undefined) updateData.placeOfBirthCountry = body.placeOfBirthCountry
    if (body.placeOfBirthState !== undefined) updateData.placeOfBirthState = body.placeOfBirthState
    if (body.placeOfBirthCity !== undefined) updateData.placeOfBirthCity = body.placeOfBirthCity

    // Hindu-specific astro fields
    if (body.timeOfBirth !== undefined) updateData.timeOfBirth = body.timeOfBirth
    if (body.manglik !== undefined) updateData.manglik = body.manglik
    if (body.raasi !== undefined) updateData.raasi = body.raasi
    if (body.nakshatra !== undefined) updateData.nakshatra = body.nakshatra
    if (body.doshas !== undefined) updateData.doshas = body.doshas

    // Muslim-specific fields
    if (body.maslak !== undefined) updateData.maslak = body.maslak
    if (body.namazPractice !== undefined) updateData.namazPractice = body.namazPractice

    // Sikh-specific fields
    if (body.amritdhari !== undefined) updateData.amritdhari = body.amritdhari
    if (body.turban !== undefined) updateData.turban = body.turban

    // Christian-specific fields
    if (body.churchAttendance !== undefined) updateData.churchAttendance = body.churchAttendance
    if (body.baptized !== undefined) updateData.baptized = body.baptized

    // Lifestyle fields
    if (body.smoking !== undefined) updateData.smoking = body.smoking
    if (body.drinking !== undefined) updateData.drinking = body.drinking
    if (body.hobbies !== undefined) updateData.hobbies = body.hobbies
    if (body.fitness !== undefined) updateData.fitness = body.fitness
    if (body.interests !== undefined) updateData.interests = body.interests
    if (body.pets !== undefined) updateData.pets = body.pets
    if (body.allergiesOrMedical !== undefined) updateData.allergiesOrMedical = body.allergiesOrMedical
    if (body.referralSource !== undefined) updateData.referralSource = body.referralSource
    if (body.referredBy !== undefined) updateData.referredBy = body.referredBy

    // Additional fields
    if (body.religion !== undefined) updateData.religion = body.religion
    if (body.employerName !== undefined) updateData.employerName = normalizeText(body.employerName) || null
    if (body.workingAs !== undefined) updateData.workingAs = body.workingAs
    if (body.livesWithFamily !== undefined) updateData.livesWithFamily = body.livesWithFamily
    if (body.createdBy !== undefined) updateData.createdBy = body.createdBy
    if (body.openToRelocation !== undefined) updateData.openToRelocation = body.openToRelocation
    if (body.drivePhotosLink !== undefined) updateData.drivePhotosLink = body.drivePhotosLink
    if (body.photoVisibility !== undefined) updateData.photoVisibility = body.photoVisibility

    // Additional preference fields
    if (body.prefReligion !== undefined) updateData.prefReligion = body.prefReligion
    if (body.prefReligions !== undefined) {
      // Handle array field - ensure it's an array
      updateData.prefReligions = Array.isArray(body.prefReligions) ? body.prefReligions : []
    }
    if (body.prefFamilyValues !== undefined) updateData.prefFamilyValues = body.prefFamilyValues
    if (body.prefFamilyLocation !== undefined) updateData.prefFamilyLocation = body.prefFamilyLocation
    if (body.prefFamilyLocationCountry !== undefined) updateData.prefFamilyLocationCountry = body.prefFamilyLocationCountry
    if (body.prefLocationList !== undefined) updateData.prefLocationList = body.prefLocationList

    // Deal-breaker flags
    if (body.prefAgeIsDealbreaker !== undefined) updateData.prefAgeIsDealbreaker = body.prefAgeIsDealbreaker === true || body.prefAgeIsDealbreaker === 'true'
    if (body.prefHeightIsDealbreaker !== undefined) updateData.prefHeightIsDealbreaker = body.prefHeightIsDealbreaker === true || body.prefHeightIsDealbreaker === 'true'
    if (body.prefMaritalStatusIsDealbreaker !== undefined) updateData.prefMaritalStatusIsDealbreaker = body.prefMaritalStatusIsDealbreaker === true || body.prefMaritalStatusIsDealbreaker === 'true'
    if (body.prefHasChildrenIsDealbreaker !== undefined) updateData.prefHasChildrenIsDealbreaker = body.prefHasChildrenIsDealbreaker === true || body.prefHasChildrenIsDealbreaker === 'true'
    if (body.prefCommunityIsDealbreaker !== undefined) updateData.prefCommunityIsDealbreaker = body.prefCommunityIsDealbreaker === true || body.prefCommunityIsDealbreaker === 'true'
    if (body.prefGotraIsDealbreaker !== undefined) updateData.prefGotraIsDealbreaker = body.prefGotraIsDealbreaker === true || body.prefGotraIsDealbreaker === 'true'
    if (body.prefDietIsDealbreaker !== undefined) updateData.prefDietIsDealbreaker = body.prefDietIsDealbreaker === true || body.prefDietIsDealbreaker === 'true'
    if (body.prefSmokingIsDealbreaker !== undefined) updateData.prefSmokingIsDealbreaker = body.prefSmokingIsDealbreaker === true || body.prefSmokingIsDealbreaker === 'true'
    if (body.prefDrinkingIsDealbreaker !== undefined) updateData.prefDrinkingIsDealbreaker = body.prefDrinkingIsDealbreaker === true || body.prefDrinkingIsDealbreaker === 'true'
    if (body.prefLocationIsDealbreaker !== undefined) updateData.prefLocationIsDealbreaker = body.prefLocationIsDealbreaker === true || body.prefLocationIsDealbreaker === 'true'
    if (body.prefCitizenshipIsDealbreaker !== undefined) updateData.prefCitizenshipIsDealbreaker = body.prefCitizenshipIsDealbreaker === true || body.prefCitizenshipIsDealbreaker === 'true'
    if (body.prefGrewUpInIsDealbreaker !== undefined) updateData.prefGrewUpInIsDealbreaker = body.prefGrewUpInIsDealbreaker === true || body.prefGrewUpInIsDealbreaker === 'true'
    if (body.prefRelocationIsDealbreaker !== undefined) updateData.prefRelocationIsDealbreaker = body.prefRelocationIsDealbreaker === true || body.prefRelocationIsDealbreaker === 'true'
    if (body.prefEducationIsDealbreaker !== undefined) updateData.prefEducationIsDealbreaker = body.prefEducationIsDealbreaker === true || body.prefEducationIsDealbreaker === 'true'
    if (body.prefWorkAreaIsDealbreaker !== undefined) updateData.prefWorkAreaIsDealbreaker = body.prefWorkAreaIsDealbreaker === true || body.prefWorkAreaIsDealbreaker === 'true'
    if (body.prefIncomeIsDealbreaker !== undefined) updateData.prefIncomeIsDealbreaker = body.prefIncomeIsDealbreaker === true || body.prefIncomeIsDealbreaker === 'true'
    if (body.prefOccupationIsDealbreaker !== undefined) updateData.prefOccupationIsDealbreaker = body.prefOccupationIsDealbreaker === true || body.prefOccupationIsDealbreaker === 'true'
    if (body.prefFamilyValuesIsDealbreaker !== undefined) updateData.prefFamilyValuesIsDealbreaker = body.prefFamilyValuesIsDealbreaker === true || body.prefFamilyValuesIsDealbreaker === 'true'
    if (body.prefFamilyLocationIsDealbreaker !== undefined) updateData.prefFamilyLocationIsDealbreaker = body.prefFamilyLocationIsDealbreaker === true || body.prefFamilyLocationIsDealbreaker === 'true'
    if (body.prefMotherTongueIsDealbreaker !== undefined) updateData.prefMotherTongueIsDealbreaker = body.prefMotherTongueIsDealbreaker === true || body.prefMotherTongueIsDealbreaker === 'true'
    if (body.prefSubCommunityIsDealbreaker !== undefined) updateData.prefSubCommunityIsDealbreaker = body.prefSubCommunityIsDealbreaker === true || body.prefSubCommunityIsDealbreaker === 'true'
    if (body.prefPetsIsDealbreaker !== undefined) updateData.prefPetsIsDealbreaker = body.prefPetsIsDealbreaker === true || body.prefPetsIsDealbreaker === 'true'
    if (body.prefReligionIsDealbreaker !== undefined) updateData.prefReligionIsDealbreaker = body.prefReligionIsDealbreaker === true || body.prefReligionIsDealbreaker === 'true'

    const mergedState: Record<string, unknown> = { ...existingProfile, ...updateData }

    if (editSection === 'location_education') {
      const locationEducationValidation = validateLocationEducationStep({
        ...mergedState,
        universityOther: body.universityOther,
      })
      if (!locationEducationValidation.isValid) {
        return NextResponse.json(
          { error: locationEducationValidation.errors[0] || 'Please complete all required Education & Career fields.' },
          { status: 400 }
        )
      }
    }

    if (editSection === 'aboutme') {
      const aboutMeValidation = validateAboutMeStep(mergedState)
      if (!aboutMeValidation.isValid) {
        return NextResponse.json(
          { error: aboutMeValidation.errors[0] || 'Please complete all required About Me fields.' },
          { status: 400 }
        )
      }
    }

    if (editSection === 'preferences_1') {
      const preferencesValidation = validatePartnerPreferencesMustHaves(mergedState)
      if (!preferencesValidation.isValid) {
        return NextResponse.json(
          { error: preferencesValidation.errors[0] || 'Please complete required partner preferences.' },
          { status: 400 }
        )
      }

      updateData.prefAgeIsDealbreaker = preferencesValidation.normalizedDealbreakers.prefAgeIsDealbreaker
      updateData.prefHeightIsDealbreaker = preferencesValidation.normalizedDealbreakers.prefHeightIsDealbreaker
      updateData.prefMaritalStatusIsDealbreaker = preferencesValidation.normalizedDealbreakers.prefMaritalStatusIsDealbreaker
      updateData.prefReligionIsDealbreaker = preferencesValidation.normalizedDealbreakers.prefReligionIsDealbreaker

      if (preferencesValidation.normalizedDealbreakers.prefMaritalStatusIsDealbreaker) {
        updateData.prefMaritalStatus = preferencesValidation.sanitizedPrefMaritalStatus
      }

      if (preferencesValidation.normalizedDealbreakers.prefReligionIsDealbreaker) {
        updateData.prefReligions = preferencesValidation.selectedReligions
        updateData.prefReligion = preferencesValidation.selectedReligions.length === 1
          ? preferencesValidation.selectedReligions[0]
          : ''
      }
    }

    if (editSection === 'preferences_2') {
      const preferencesAdditionalValidation = validatePartnerPreferencesAdditional(mergedState)
      if (!preferencesAdditionalValidation.isValid) {
        return NextResponse.json(
          { error: preferencesAdditionalValidation.errors[0] || 'Please complete required partner preferences.' },
          { status: 400 }
        )
      }
    }

    // Update User model fields (name, email, phone)
    const userUpdateData: Record<string, unknown> = {}

    // Update user.name as "Firstname L." format (auto-generated display name for navbar/public)
    // Full firstName and lastName are stored in Profile model separately
    if (body.firstName !== undefined || body.lastName !== undefined) {
      // Get current profile to preserve existing names if not provided
      const currentProfile = await prisma.profile.findUnique({
        where: { userId: targetUser.userId },
        select: { firstName: true, lastName: true },
      })

      const newFirstName = body.firstName !== undefined ? body.firstName : (currentProfile?.firstName || '')
      const newLastName = body.lastName !== undefined ? body.lastName : (currentProfile?.lastName || '')

      // Auto-generate display name as "Firstname L." for user.name (used in navbar, public display)
      userUpdateData.name = formatDisplayName(newFirstName, newLastName)
    }

    // Update email if provided (note: changing email may affect login)
    if (body.email !== undefined && body.email.trim() !== '') {
      userUpdateData.email = body.email.trim()
    }

    // Update phone if provided
    if (body.phone !== undefined) {
      userUpdateData.phone = body.phone.trim() || null
    }

    // Apply user updates if any
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: targetUser.userId },
        data: userUpdateData,
      })
    }

    const profile = await prisma.profile.update({
      where: { userId: targetUser.userId },
      data: updateData,
    })

    return NextResponse.json({ message: 'Profile updated successfully', profile })
  } catch (error) {
    console.error('Profile update error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to update profile: ${errorMessage}` }, { status: 500 })
  }
}
