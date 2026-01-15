import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateVrId } from '@/lib/vrId'
import { getTargetUserId } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: targetUser.userId },
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
        caste: body.caste,
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
        prefCaste: body.preferredCaste || body.prefCaste,
        prefGotra: body.prefGotra,
        prefQualification: body.preferredEducation || body.prefQualification,
        prefIncome: body.prefIncome,
        idealPartnerDesc: body.partnerPreferences || body.idealPartnerDesc,
        approvalStatus: 'pending', // All new profiles start as pending
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

    const profile = await prisma.profile.findUnique({
      where: { userId: targetUser.userId },
      include: { user: { select: { name: true, emailVerified: true } } },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse user's name into firstName and lastName
    const nameParts = (profile.user.name || '').trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Return profile with firstName, lastName, and verification status
    const { user, ...profileData } = profile
    return NextResponse.json({
      ...profileData,
      firstName,
      lastName,
      emailVerified: !!user.emailVerified,
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
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found. Please create a profile first.' }, { status: 404 })
    }

    const body = await request.json()

    // Build update data - only include fields that are in the schema
    const updateData: Record<string, unknown> = {}

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
    if (body.linkedinProfile !== undefined) updateData.linkedinProfile = body.linkedinProfile
    if (body.facebookInstagram !== undefined) updateData.facebookInstagram = body.facebookInstagram
    if (body.facebook !== undefined) updateData.facebook = body.facebook
    if (body.instagram !== undefined) updateData.instagram = body.instagram
    if (body.community !== undefined) updateData.community = body.community
    if (body.subCommunity !== undefined) updateData.subCommunity = body.subCommunity
    if (body.caste !== undefined) updateData.caste = body.caste
    if (body.gotra !== undefined) updateData.gotra = body.gotra
    if (body.qualification !== undefined) updateData.qualification = body.qualification
    if (body.university !== undefined) updateData.university = body.university
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
    if (body.prefCaste !== undefined) updateData.prefCaste = body.prefCaste
    if (body.prefGotra !== undefined) updateData.prefGotra = body.prefGotra
    if (body.prefQualification !== undefined) updateData.prefQualification = body.prefQualification
    if (body.prefWorkArea !== undefined) updateData.prefWorkArea = body.prefWorkArea
    if (body.prefOccupation !== undefined) updateData.prefOccupation = body.prefOccupation
    if (body.prefIncome !== undefined) updateData.prefIncome = body.prefIncome
    if (body.prefLanguage !== undefined) updateData.prefLanguage = body.prefLanguage
    if (body.prefHobbies !== undefined) updateData.prefHobbies = body.prefHobbies
    if (body.prefFitness !== undefined) updateData.prefFitness = body.prefFitness
    if (body.prefInterests !== undefined) updateData.prefInterests = body.prefInterests
    if (body.prefGrewUpIn !== undefined) updateData.prefGrewUpIn = body.prefGrewUpIn
    if (body.prefMaritalStatus !== undefined) updateData.prefMaritalStatus = body.prefMaritalStatus
    if (body.prefRelocation !== undefined) updateData.prefRelocation = body.prefRelocation
    if (body.prefMotherTongue !== undefined) updateData.prefMotherTongue = body.prefMotherTongue
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

    // Additional fields
    if (body.religion !== undefined) updateData.religion = body.religion
    if (body.employerName !== undefined) updateData.employerName = body.employerName
    if (body.workingAs !== undefined) updateData.workingAs = body.workingAs
    if (body.livesWithFamily !== undefined) updateData.livesWithFamily = body.livesWithFamily
    if (body.createdBy !== undefined) updateData.createdBy = body.createdBy

    // Update User's name if firstName or lastName changed
    if (body.firstName !== undefined || body.lastName !== undefined) {
      // Get current user to preserve existing name parts
      const currentUser = await prisma.user.findUnique({
        where: { id: targetUser.userId },
        select: { name: true },
      })

      const currentNameParts = (currentUser?.name || '').trim().split(' ')
      const currentFirstName = currentNameParts[0] || ''
      const currentLastName = currentNameParts.slice(1).join(' ') || ''

      const newFirstName = body.firstName !== undefined ? body.firstName : currentFirstName
      const newLastName = body.lastName !== undefined ? body.lastName : currentLastName
      const fullName = `${newFirstName} ${newLastName}`.trim()

      await prisma.user.update({
        where: { id: targetUser.userId },
        data: { name: fullName },
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
