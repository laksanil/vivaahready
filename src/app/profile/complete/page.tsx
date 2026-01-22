'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import {
  BasicsSection,
  LocationSection,
  EducationSection,
  ReligionSection,
  FamilySection,
  LifestyleSection,
  AboutMeSection,
  PreferencesPage1Section,
  PreferencesPage2Section,
} from '@/components/ProfileFormSections'

// Full step order including all sections
// Steps: 1=basics, 2=location_education, 3=religion, 4=family, 5=lifestyle, 6=aboutme, 7=preferences_1, 8=preferences_2
// Note: Account creation (original step 3) is already done when user reaches this page
// Photos are handled separately on /profile/photos page (with phone number)
const SECTION_ORDER = ['basics', 'location_education', 'religion', 'family', 'lifestyle', 'aboutme', 'preferences_1', 'preferences_2']

const SECTION_TITLES: Record<string, string> = {
  basics: 'Basic Info',
  location_education: 'Education & Career',
  religion: 'Religion & Astro',
  family: 'Family Details',
  lifestyle: 'Lifestyle',
  aboutme: 'About Me',
  preferences_1: 'Partner Preferences',
  preferences_2: 'More Preferences',
}

// Map signupStep (database value) to local step index
// Database signupStep: 4=religion done, 5=family done, etc.
// Local step: 1=basics, 2=location_education, 3=religion, etc.
const getLocalStepFromSignupStep = (signupStep: number): number => {
  // signupStep 4 means user should start at religion (local step 3)
  // signupStep is the NEXT step to complete, so:
  // signupStep 4 → local step 3 (religion)
  // signupStep 5 → local step 4 (family)
  // etc.
  return Math.max(1, Math.min(signupStep - 1, SECTION_ORDER.length))
}

// Map local step to signupStep (database value)
const getSignupStepFromLocalStep = (localStep: number): number => {
  // local step 3 (religion) = signupStep 4
  // local step 4 (family) = signupStep 5
  return localStep + 1
}

function ProfileCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const profileId = searchParams.get('profileId')
  const initialStep = parseInt(searchParams.get('step') || '4', 10)

  const [step, setStep] = useState(() => getLocalStepFromSignupStep(initialStep))
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Record<string, unknown>>({})


  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId || status !== 'authenticated') return

      try {
        const response = await fetch(`/api/profile/${profileId}`)
        if (response.ok) {
          const data = await response.json()
          // Populate form with existing data
          setFormData({
            // Basic fields (already filled)
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            age: data.age,
            height: data.height,
            maritalStatus: data.maritalStatus,
            hasChildren: data.hasChildren,
            motherTongue: data.motherTongue,
            // Location & Education (already filled)
            country: data.country || 'USA',
            grewUpIn: data.grewUpIn || 'USA',
            citizenship: data.citizenship || 'USA',
            currentLocation: data.currentLocation,
            zipCode: data.zipCode,
            qualification: data.qualification,
            university: data.university,
            occupation: data.occupation,
            annualIncome: data.annualIncome,
            openToRelocation: data.openToRelocation,
            // Religion & Astro
            religion: data.religion,
            community: data.community,
            subCommunity: data.subCommunity,
            gotra: data.gotra,
            nakshatra: data.nakshatra,
            rashi: data.rashi,
            timeOfBirth: data.timeOfBirth,
            placeOfBirth: data.placeOfBirth,
            manglik: data.manglik,
            // Family
            familyLocation: data.familyLocation,
            familyValues: data.familyValues,
            familyType: data.familyType,
            fatherName: data.fatherName,
            fatherOccupation: data.fatherOccupation,
            motherName: data.motherName,
            motherOccupation: data.motherOccupation,
            numberOfBrothers: data.numberOfBrothers,
            numberOfSisters: data.numberOfSisters,
            siblingDetails: data.siblingDetails,
            // Lifestyle
            dietaryPreference: data.dietaryPreference,
            smoking: data.smoking,
            drinking: data.drinking,
            pets: data.pets,
            hobbies: data.hobbies,
            interests: data.interests,
            fitness: data.fitness,
            // About Me
            aboutMe: data.aboutMe,
            linkedinProfile: data.linkedinProfile,
            instagram: data.instagram,
            facebook: data.facebook,
            bloodGroup: data.bloodGroup,
            anyDisability: data.anyDisability || 'none',
            disabilityDetails: data.disabilityDetails,
            // Partner Preferences
            prefAgeMin: data.prefAgeMin,
            prefAgeMax: data.prefAgeMax,
            prefAgeIsDealbreaker: data.prefAgeIsDealbreaker,
            prefHeightMin: data.prefHeightMin,
            prefHeightMax: data.prefHeightMax,
            prefHeightIsDealbreaker: data.prefHeightIsDealbreaker,
            prefMaritalStatus: data.prefMaritalStatus,
            prefMaritalStatusIsDealbreaker: data.prefMaritalStatusIsDealbreaker,
            prefHasChildren: data.prefHasChildren,
            prefHasChildrenIsDealbreaker: data.prefHasChildrenIsDealbreaker,
            prefReligion: data.prefReligion,
            prefReligionIsDealbreaker: data.prefReligionIsDealbreaker,
            prefCommunity: data.prefCommunity,
            prefCommunityIsDealbreaker: data.prefCommunityIsDealbreaker,
            prefGotra: data.prefGotra,
            prefGotraIsDealbreaker: data.prefGotraIsDealbreaker,
            prefDiet: data.prefDiet,
            prefDietIsDealbreaker: data.prefDietIsDealbreaker,
            prefSmoking: data.prefSmoking,
            prefSmokingIsDealbreaker: data.prefSmokingIsDealbreaker,
            prefDrinking: data.prefDrinking,
            prefDrinkingIsDealbreaker: data.prefDrinkingIsDealbreaker,
            prefLocation: data.prefLocation,
            prefLocationIsDealbreaker: data.prefLocationIsDealbreaker,
            prefCitizenship: data.prefCitizenship,
            prefCitizenshipIsDealbreaker: data.prefCitizenshipIsDealbreaker,
            prefGrewUpIn: data.prefGrewUpIn,
            prefGrewUpInIsDealbreaker: data.prefGrewUpInIsDealbreaker,
            prefRelocation: data.prefRelocation,
            prefRelocationIsDealbreaker: data.prefRelocationIsDealbreaker,
            prefQualification: data.prefQualification,
            prefEducationIsDealbreaker: data.prefEducationIsDealbreaker,
            prefWorkArea: data.prefWorkArea,
            prefWorkAreaIsDealbreaker: data.prefWorkAreaIsDealbreaker,
            prefIncome: data.prefIncome,
            prefIncomeIsDealbreaker: data.prefIncomeIsDealbreaker,
            prefFamilyValues: data.prefFamilyValues,
            prefFamilyValuesIsDealbreaker: data.prefFamilyValuesIsDealbreaker,
            prefFamilyType: data.prefFamilyType,
            prefFamilyTypeIsDealbreaker: data.prefFamilyTypeIsDealbreaker,
            prefMotherTongue: data.prefMotherTongue,
            prefMotherTongueIsDealbreaker: data.prefMotherTongueIsDealbreaker,
            idealPartnerDesc: data.idealPartnerDesc,
          })
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setPageLoading(false)
      }
    }

    fetchProfile()
  }, [profileId, status])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
    // Don't allow going back to dashboard - user must complete profile first
    // The back button on step 1 does nothing since profile is incomplete
  }

  // Update profile with section data
  const handleUpdateProfile = async (nextStep: number) => {
    if (!profileId) return

    setError('')
    setLoading(true)

    try {
      const signupStep = getSignupStepFromLocalStep(nextStep)

      const response = await fetch(`/api/profile/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          signupStep,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save profile data')
        setLoading(false)
        return
      }

      setStep(nextStep)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionContinue = async () => {
    // If on last step (preferences_2, which is step 8), save and redirect to photos page
    if (step === SECTION_ORDER.length) {
      await handleUpdateProfile(step)
      router.push(`/profile/photos?profileId=${profileId}&fromSignup=true`)
    } else if (step < SECTION_ORDER.length) {
      await handleUpdateProfile(step + 1)
    }
  }

  // Section validations
  // Basics validation
  const hasAgeOrDOB = !!(formData.dateOfBirth || formData.age)
  const isBasicsComplete = !!(
    formData.createdBy &&
    formData.firstName &&
    formData.lastName &&
    formData.gender &&
    hasAgeOrDOB &&
    formData.height &&
    formData.maritalStatus &&
    formData.motherTongue
  )

  // Location & Education validation
  const isUSALocation = (formData.country as string || 'USA') === 'USA'
  const isLocationEducationComplete = !!(
    formData.country &&
    formData.grewUpIn &&
    formData.citizenship &&
    (!isUSALocation || formData.zipCode) &&
    formData.qualification &&
    formData.occupation &&
    formData.openToRelocation
  )

  // Religion validation
  const religionValue = formData.religion as string || ''
  const communityValue = formData.community as string || ''
  const isReligionComplete = religionValue !== '' && communityValue !== ''

  // Family validation
  const familyLocationValue = formData.familyLocation as string || ''
  const familyValuesValue = formData.familyValues as string || ''
  const isFamilyComplete = familyLocationValue !== '' && familyValuesValue !== ''

  // Lifestyle validation
  const dietValue = formData.dietaryPreference as string || ''
  const smokingValue = formData.smoking as string || ''
  const drinkingValue = formData.drinking as string || ''
  const petsValue = formData.pets as string || ''
  const isLifestyleComplete = dietValue !== '' && smokingValue !== '' && drinkingValue !== '' && petsValue !== ''

  // About Me validation
  const linkedinUrl = formData.linkedinProfile as string || ''
  const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/
  const hasValidLinkedIn = linkedinUrl === 'no_linkedin' || linkedinUrl === '' || linkedinRegex.test(linkedinUrl)
  const isAboutMeComplete = !!(
    formData.aboutMe &&
    hasValidLinkedIn &&
    !formData.linkedinError
  )

  const currentSection = SECTION_ORDER[step - 1]
  const totalSteps = SECTION_ORDER.length
  const progress = Math.round((step / totalSteps) * 100)

  const sectionProps = { formData, handleChange, setFormData }

  const getSectionStatus = (sectionIndex: number) => {
    if (sectionIndex < step - 1) return 'completed'
    if (sectionIndex === step - 1) return 'current'
    return 'upcoming'
  }

  const renderContinueButton = (onClick: () => void, disabled: boolean = false) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`mt-8 w-full py-3.5 font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
        !disabled && !loading
          ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md active:scale-[0.99]'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
          Processing...
        </span>
      ) : (
        <>
          Continue
          {!disabled && <CheckCircle className="w-4 h-4" />}
        </>
      )}
    </button>
  )

  if (status === 'loading' || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!profileId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Profile not found. Please try again.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-primary-600 hover:underline"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
            {/* Top bar */}
            <div className="px-6 py-3 flex justify-between items-center">
              <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all rounded">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {SECTION_TITLES[currentSection]}
                </h2>
                <p className="text-xs text-gray-500">Complete your profile</p>
              </div>
              <div className="w-9" /> {/* Spacer for alignment */}
            </div>

            {/* Progress indicator */}
            <div className="px-6 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Step {step} of {totalSteps}</span>
                <span className="text-xs font-semibold text-primary-600">{progress}% Complete</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Step dots */}
              <div className="flex justify-between mt-2">
                {SECTION_ORDER.map((section, index) => (
                  <div
                    key={section}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      getSectionStatus(index) === 'completed' ? 'bg-primary-600' :
                      getSectionStatus(index) === 'current' ? 'bg-primary-400 ring-2 ring-primary-200' :
                      'bg-gray-200'
                    }`}
                    title={SECTION_TITLES[section]}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="p-6 pb-8">
            {/* Basics Section */}
            {currentSection === 'basics' && (
              <div className="space-y-4">
                <BasicsSection {...sectionProps} />
                {renderContinueButton(handleSectionContinue, !isBasicsComplete)}
              </div>
            )}

            {/* Location & Education Section */}
            {currentSection === 'location_education' && (
              <div className="space-y-6">
                <LocationSection {...sectionProps} />
                <EducationSection {...sectionProps} />
                {renderContinueButton(handleSectionContinue, !isLocationEducationComplete)}
              </div>
            )}

            {/* Religion Section */}
            {currentSection === 'religion' && (
              <div className="space-y-4">
                <ReligionSection {...sectionProps} />
                {renderContinueButton(handleSectionContinue, !isReligionComplete)}
              </div>
            )}

            {/* Family Section */}
            {currentSection === 'family' && (
              <div className="space-y-4">
                <FamilySection {...sectionProps} />
                {renderContinueButton(handleSectionContinue, !isFamilyComplete)}
              </div>
            )}

            {/* Lifestyle Section */}
            {currentSection === 'lifestyle' && (
              <div className="space-y-4">
                <LifestyleSection {...sectionProps} />
                {renderContinueButton(handleSectionContinue, !isLifestyleComplete)}
              </div>
            )}

            {/* About Me Section */}
            {currentSection === 'aboutme' && (
              <div className="space-y-4">
                <AboutMeSection {...sectionProps} />
                {renderContinueButton(handleSectionContinue, !isAboutMeComplete)}
              </div>
            )}

            {/* Preferences Page 1 */}
            {currentSection === 'preferences_1' && (
              <div className="space-y-4">
                <PreferencesPage1Section {...sectionProps} />
                {renderContinueButton(handleSectionContinue)}
              </div>
            )}

            {/* Preferences Page 2 */}
            {currentSection === 'preferences_2' && (
              <div className="space-y-4">
                <PreferencesPage2Section {...sectionProps} />
                {renderContinueButton(handleSectionContinue)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfileCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <ProfileCompleteContent />
    </Suspense>
  )
}
