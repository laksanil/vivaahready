import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTargetUserId } from '@/lib/admin'
import { normalizeSameAsMinePreferences } from '@/lib/preferenceNormalization'
import {
  getEffectiveUniversity,
  validateLocationEducationStep,
  validatePartnerPreferencesMustHaves,
} from '@/lib/profileFlowValidation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)

    // Fetch the profile with user info
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check interest status if user is logged in
    let interestStatus = { sentByMe: false, receivedFromThem: false, mutual: false }

    const viewerUserId = targetUser?.userId
    if (viewerUserId && viewerUserId !== profile.userId) {
      const sentInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: viewerUserId,
            receiverId: profile.userId,
          }
        }
      })

      const receivedInterest = await prisma.match.findUnique({
        where: {
          senderId_receiverId: {
            senderId: profile.userId,
            receiverId: viewerUserId,
          }
        }
      })

      const isMutual = (sentInterest && receivedInterest) ||
        sentInterest?.status === 'accepted' ||
        receivedInterest?.status === 'accepted'

      interestStatus = {
        sentByMe: !!sentInterest,
        receivedFromThem: !!receivedInterest,
        mutual: !!isMutual,
      }
    }

    // Show contact info if: viewing own profile OR mutual interest
    const isOwnProfile = viewerUserId === profile.userId
    const canSeeContact = isOwnProfile || interestStatus.mutual

    const responseData = {
      ...profile,
      user: {
        id: profile.user.id,
        name: profile.user.name,
        email: canSeeContact ? profile.user.email : undefined,
        phone: canSeeContact ? profile.user.phone : undefined,
        emailVerified: profile.user.emailVerified,
        phoneVerified: profile.user.phoneVerified,
      },
      interestStatus,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

/**
 * PUT /api/profile/[id]
 * Update profile by ID - used during signup flow to save data progressively
 * Verifies ownership via sessionStorage userId or authenticated session
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profileId = params.id

    // Get the profile to verify it exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: { select: { id: true, email: true, phone: true } } },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Try to get session for authenticated users
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)

    // For security, verify the request is from:
    // 1. The profile owner (via session user ID)
    // 2. Or via session email matching profile owner's email
    // 3. Or via newUserId header (set during signup flow before session exists)
    const newUserIdHeader = request.headers.get('x-new-user-id')
    const isOwnerViaSession = targetUser?.userId === existingProfile.userId
    const isOwnerViaEmail = session?.user?.email && existingProfile.user?.email &&
      session.user.email.toLowerCase() === existingProfile.user.email.toLowerCase()
    const isOwnerViaHeader = newUserIdHeader === existingProfile.userId

    if (!isOwnerViaSession && !isOwnerViaEmail && !isOwnerViaHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = normalizeSameAsMinePreferences(await request.json(), existingProfile)
    const normalizeText = (value: unknown): string => {
      return typeof value === 'string' ? value.trim() : ''
    }
    const requestedSignupStep = body.signupStep !== undefined ? Number(body.signupStep) : undefined

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {}

    // Basic fields
    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName
    if (body.gender !== undefined) updateData.gender = body.gender
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth
    if (body.age !== undefined) updateData.age = body.age
    if (body.height !== undefined) updateData.height = body.height
    if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus
    if (body.hasChildren !== undefined) updateData.hasChildren = body.hasChildren
    if (body.motherTongue !== undefined) updateData.motherTongue = body.motherTongue

    // Location & Education
    if (body.country !== undefined) updateData.country = body.country
    if (body.grewUpIn !== undefined) updateData.grewUpIn = body.grewUpIn
    if (body.citizenship !== undefined) updateData.citizenship = body.citizenship
    if (body.currentLocation !== undefined) updateData.currentLocation = body.currentLocation
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode
    if (body.qualification !== undefined) updateData.qualification = body.qualification
    if (body.university !== undefined || body.universityOther !== undefined) {
      const baseUniversity = body.university !== undefined ? body.university : existingProfile.university
      updateData.university = getEffectiveUniversity(baseUniversity, body.universityOther)
    }
    if (body.occupation !== undefined) updateData.occupation = body.occupation
    if (body.employerName !== undefined) updateData.employerName = normalizeText(body.employerName) || null
    if (body.annualIncome !== undefined) updateData.annualIncome = body.annualIncome
    if (body.openToRelocation !== undefined) updateData.openToRelocation = body.openToRelocation

    // Religion & Astro
    if (body.religion !== undefined) updateData.religion = body.religion
    if (body.community !== undefined) updateData.community = body.community
    if (body.subCommunity !== undefined) updateData.subCommunity = body.subCommunity
    if (body.gotra !== undefined) updateData.gotra = body.gotra
    if (body.nakshatra !== undefined) updateData.nakshatra = body.nakshatra
    if (body.rashi !== undefined) updateData.rashi = body.rashi
    if (body.timeOfBirth !== undefined) updateData.timeOfBirth = body.timeOfBirth
    if (body.placeOfBirth !== undefined) updateData.placeOfBirth = body.placeOfBirth
    if (body.manglik !== undefined) updateData.manglik = body.manglik

    // Family
    if (body.familyLocation !== undefined) updateData.familyLocation = body.familyLocation
    if (body.familyValues !== undefined) updateData.familyValues = body.familyValues
    if (body.familyType !== undefined) updateData.familyType = body.familyType
    if (body.fatherName !== undefined) updateData.fatherName = body.fatherName
    if (body.fatherOccupation !== undefined) updateData.fatherOccupation = body.fatherOccupation
    if (body.motherName !== undefined) updateData.motherName = body.motherName
    if (body.motherOccupation !== undefined) updateData.motherOccupation = body.motherOccupation
    if (body.numberOfBrothers !== undefined) updateData.numberOfBrothers = body.numberOfBrothers
    if (body.numberOfSisters !== undefined) updateData.numberOfSisters = body.numberOfSisters
    if (body.siblingDetails !== undefined) updateData.siblingDetails = body.siblingDetails

    // Lifestyle
    if (body.dietaryPreference !== undefined) updateData.dietaryPreference = body.dietaryPreference
    if (body.smoking !== undefined) updateData.smoking = body.smoking
    if (body.drinking !== undefined) updateData.drinking = body.drinking
    if (body.pets !== undefined) updateData.pets = body.pets
    if (body.hobbies !== undefined) updateData.hobbies = body.hobbies
    if (body.interests !== undefined) updateData.interests = body.interests
    if (body.fitness !== undefined) updateData.fitness = body.fitness

    // About Me
    if (body.aboutMe !== undefined) updateData.aboutMe = body.aboutMe
    if (body.linkedinProfile !== undefined) updateData.linkedinProfile = body.linkedinProfile === 'no_linkedin' ? null : body.linkedinProfile
    if (body.instagram !== undefined) updateData.instagram = body.instagram
    if (body.facebook !== undefined) updateData.facebook = body.facebook
    if (body.referralSource !== undefined) updateData.referralSource = body.referralSource
    if (body.referredBy !== undefined) updateData.referredBy = body.referredBy
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup
    if (body.anyDisability !== undefined) updateData.anyDisability = body.anyDisability
    if (body.disabilityDetails !== undefined) updateData.disabilityDetails = body.disabilityDetails

    // Partner Preferences - Page 1
    if (body.prefAgeMin !== undefined) updateData.prefAgeMin = body.prefAgeMin
    if (body.prefAgeMax !== undefined) updateData.prefAgeMax = body.prefAgeMax
    if (body.prefAgeIsDealbreaker !== undefined) updateData.prefAgeIsDealbreaker = body.prefAgeIsDealbreaker
    if (body.prefHeightMin !== undefined) updateData.prefHeightMin = body.prefHeightMin
    if (body.prefHeightMax !== undefined) updateData.prefHeightMax = body.prefHeightMax
    if (body.prefHeightIsDealbreaker !== undefined) updateData.prefHeightIsDealbreaker = body.prefHeightIsDealbreaker
    if (body.prefMaritalStatus !== undefined) updateData.prefMaritalStatus = body.prefMaritalStatus
    if (body.prefMaritalStatusIsDealbreaker !== undefined) updateData.prefMaritalStatusIsDealbreaker = body.prefMaritalStatusIsDealbreaker
    if (body.prefHasChildren !== undefined) updateData.prefHasChildren = body.prefHasChildren
    if (body.prefHasChildrenIsDealbreaker !== undefined) updateData.prefHasChildrenIsDealbreaker = body.prefHasChildrenIsDealbreaker
    if (body.prefReligion !== undefined) updateData.prefReligion = body.prefReligion
    if (body.prefReligions !== undefined) {
      updateData.prefReligions = Array.isArray(body.prefReligions) ? body.prefReligions : []
    }
    if (body.prefReligionIsDealbreaker !== undefined) updateData.prefReligionIsDealbreaker = body.prefReligionIsDealbreaker
    if (body.prefCommunity !== undefined) updateData.prefCommunity = body.prefCommunity
    if (body.prefCommunityIsDealbreaker !== undefined) updateData.prefCommunityIsDealbreaker = body.prefCommunityIsDealbreaker
    if (body.prefGotra !== undefined) updateData.prefGotra = body.prefGotra
    if (body.prefGotraIsDealbreaker !== undefined) updateData.prefGotraIsDealbreaker = body.prefGotraIsDealbreaker
    if (body.prefDiet !== undefined) updateData.prefDiet = body.prefDiet
    if (body.prefDietIsDealbreaker !== undefined) updateData.prefDietIsDealbreaker = body.prefDietIsDealbreaker
    if (body.prefSmoking !== undefined) updateData.prefSmoking = body.prefSmoking
    if (body.prefSmokingIsDealbreaker !== undefined) updateData.prefSmokingIsDealbreaker = body.prefSmokingIsDealbreaker
    if (body.prefDrinking !== undefined) updateData.prefDrinking = body.prefDrinking
    if (body.prefDrinkingIsDealbreaker !== undefined) updateData.prefDrinkingIsDealbreaker = body.prefDrinkingIsDealbreaker

    // Partner Preferences - Page 2
    if (body.prefLocation !== undefined) updateData.prefLocation = body.prefLocation
    if (body.prefLocationIsDealbreaker !== undefined) updateData.prefLocationIsDealbreaker = body.prefLocationIsDealbreaker
    if (body.prefCitizenship !== undefined) updateData.prefCitizenship = body.prefCitizenship
    if (body.prefCitizenshipIsDealbreaker !== undefined) updateData.prefCitizenshipIsDealbreaker = body.prefCitizenshipIsDealbreaker
    if (body.prefGrewUpIn !== undefined) updateData.prefGrewUpIn = body.prefGrewUpIn
    if (body.prefGrewUpInIsDealbreaker !== undefined) updateData.prefGrewUpInIsDealbreaker = body.prefGrewUpInIsDealbreaker
    if (body.prefRelocation !== undefined) updateData.prefRelocation = body.prefRelocation
    if (body.prefRelocationIsDealbreaker !== undefined) updateData.prefRelocationIsDealbreaker = body.prefRelocationIsDealbreaker
    if (body.prefQualification !== undefined) updateData.prefQualification = body.prefQualification
    if (body.prefEducationIsDealbreaker !== undefined) updateData.prefEducationIsDealbreaker = body.prefEducationIsDealbreaker
    if (body.prefWorkArea !== undefined) updateData.prefWorkArea = body.prefWorkArea
    if (body.prefWorkAreaIsDealbreaker !== undefined) updateData.prefWorkAreaIsDealbreaker = body.prefWorkAreaIsDealbreaker
    if (body.prefIncome !== undefined) updateData.prefIncome = body.prefIncome
    if (body.prefIncomeIsDealbreaker !== undefined) updateData.prefIncomeIsDealbreaker = body.prefIncomeIsDealbreaker
    if (body.prefFamilyValues !== undefined) updateData.prefFamilyValues = body.prefFamilyValues
    if (body.prefFamilyValuesIsDealbreaker !== undefined) updateData.prefFamilyValuesIsDealbreaker = body.prefFamilyValuesIsDealbreaker
    if (body.prefFamilyType !== undefined) updateData.prefFamilyType = body.prefFamilyType
    if (body.prefFamilyTypeIsDealbreaker !== undefined) updateData.prefFamilyTypeIsDealbreaker = body.prefFamilyTypeIsDealbreaker
    if (body.prefMotherTongue !== undefined) updateData.prefMotherTongue = body.prefMotherTongue
    if (body.prefMotherTongueIsDealbreaker !== undefined) updateData.prefMotherTongueIsDealbreaker = body.prefMotherTongueIsDealbreaker
    if (body.idealPartnerDesc !== undefined) updateData.idealPartnerDesc = body.idealPartnerDesc

    // Referral
    if (body.howDidYouHear !== undefined) updateData.howDidYouHear = body.howDidYouHear
    if (body.referredBy !== undefined) updateData.referredBy = body.referredBy

    // Validate preference ranges: min must be ≤ max
    if (updateData.prefAgeMin !== undefined && updateData.prefAgeMax !== undefined) {
      if (Number(updateData.prefAgeMin) > Number(updateData.prefAgeMax)) {
        return NextResponse.json(
          { error: 'Preferred minimum age cannot be greater than maximum age.' },
          { status: 400 }
        )
      }
    }
    if (updateData.prefHeightMin !== undefined && updateData.prefHeightMax !== undefined) {
      const heightOrder = ["4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\""]
      const minIdx = heightOrder.indexOf(updateData.prefHeightMin as string)
      const maxIdx = heightOrder.indexOf(updateData.prefHeightMax as string)
      if (minIdx !== -1 && maxIdx !== -1 && minIdx > maxIdx) {
        return NextResponse.json(
          { error: 'Preferred minimum height cannot be greater than maximum height.' },
          { status: 400 }
        )
      }
    }

    const mergedState: Record<string, unknown> = { ...existingProfile, ...updateData }

    if (requestedSignupStep !== undefined && requestedSignupStep >= 3) {
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

    if (requestedSignupStep !== undefined && requestedSignupStep >= 8) {
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

    // Signup progress tracking
    // IMPORTANT: Phone number is REQUIRED to proceed past step 1 (basics)
    // Users cannot move to step 2+ without a phone number
    if (body.signupStep !== undefined) {
      if (Number.isNaN(requestedSignupStep)) {
        return NextResponse.json({ error: 'Invalid signup step.' }, { status: 400 })
      }

      if ((requestedSignupStep || 0) > 1) {
        // Check if phone exists in DB or is being provided in this request
        const existingPhone = existingProfile.user?.phone?.trim() || ''
        const providedPhone = body.phone?.trim() || ''
        const hasPhone = existingPhone !== '' || providedPhone !== ''
        if (!hasPhone) {
          return NextResponse.json(
            { error: 'Phone number is required to continue. Please add your phone number in the Basic Info section.' },
            { status: 400 }
          )
        }
      }
      updateData.signupStep = requestedSignupStep
    }

    // Update phone number on User model if provided
    if (body.phone !== undefined) {
      await prisma.user.update({
        where: { id: existingProfile.userId },
        data: { phone: body.phone.trim() || null },
      })
    }

    // Update the profile
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      profileId: updatedProfile.id
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
