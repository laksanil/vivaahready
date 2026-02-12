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

// Local step order for /profile/complete page (8 steps)
// This page is used when users need to complete their profile after Google OAuth signup
// or when redirected by ProfileCompletionGuard
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

// signupStep now maps directly to local step (1:1 mapping)
// signupStep 1 = local step 1 (basics)
// signupStep 2 = local step 2 (location_education)
// signupStep 3 = local step 3 (religion)
// ... etc up to signupStep 8 = local step 8 (preferences_2)
// signupStep 9 = complete (photos done)
const getLocalStepFromSignupStep = (signupStep: number): number => {
  return Math.max(1, Math.min(signupStep, SECTION_ORDER.length))
}

// Map local step to signupStep (database value) - now 1:1
const getSignupStepFromLocalStep = (localStep: number): number => {
  return localStep
}

function ProfileCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const urlProfileId = searchParams.get('profileId')
  const fromGoogleAuth = searchParams.get('fromGoogleAuth') === 'true'
  const initialStep = parseInt(searchParams.get('step') || '1', 10) // Default to step 1 (basics)
  const returnTo = searchParams.get('returnTo')

  // Read form data from URL params (most reliable - survives incognito mode OAuth redirects)
  const urlFirstName = searchParams.get('firstName')
  const urlLastName = searchParams.get('lastName')
  const urlPhone = searchParams.get('phone')

  const [profileId, setProfileId] = useState<string | null>(urlProfileId)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [step, setStep] = useState(() => getLocalStepFromSignupStep(initialStep))
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  // Handle profile creation from Google auth (when redirected here with stored form data)
  useEffect(() => {
    const createProfileFromStoredData = async () => {
      if (status !== 'authenticated' || !session?.user?.email) return
      if (profileId || creatingProfile) return // Already have profile or creating one

      // PRIORITY 1: Check cookie first (most reliable - survives OAuth redirects in incognito)
      let formDataFromCookie: { firstName?: string; lastName?: string; phone?: string } | null = null
      if (fromGoogleAuth) {
        const cookies = document.cookie.split(';')
        const signupCookie = cookies.find(c => c.trim().startsWith('signupFormData='))
        if (signupCookie) {
          try {
            const cookieValue = signupCookie.split('=')[1]
            formDataFromCookie = JSON.parse(decodeURIComponent(cookieValue))
            // Clear the cookie after reading
            document.cookie = 'signupFormData=; path=/; max-age=0'
          } catch (e) {
            console.error('Failed to parse signup cookie:', e)
          }
        }
      }

      // PRIORITY 2: Check URL params as fallback
      let formDataFromUrl: { firstName?: string; lastName?: string; phone?: string } | null = null
      if (!formDataFromCookie && fromGoogleAuth && urlFirstName && urlLastName && urlPhone) {
        formDataFromUrl = {
          firstName: urlFirstName,
          lastName: urlLastName,
          phone: urlPhone,
        }
      }

      // PRIORITY 3: Check storage as last resort
      let storedFormData = sessionStorage.getItem('signupFormData')
      if (!storedFormData) {
        storedFormData = localStorage.getItem('signupFormData')
        if (storedFormData) {
          // Found in localStorage as fallback
        }
      }

      // If no form data from any source, check if user already has a profile
      if (!formDataFromCookie && !formDataFromUrl && !storedFormData) {
        // Check if user already has a profile in the database
        try {
          const checkResponse = await fetch('/api/user/profile-status')
          if (checkResponse.ok) {
            const data = await checkResponse.json()
            if (data.hasProfile && data.profileId) {
              // User already has a profile, use it
              setProfileId(data.profileId)
              return
            }
          }
        } catch (err) {
          console.error('Error checking profile status:', err)
        }

        // No stored data and no profile
        // If user has returnTo (coming from event registration), create profile using Google session data
        if (returnTo && session?.user?.name) {
          // Creating profile from session data for event registration flow
          setCreatingProfile(true)
          try {
            // Parse name from Google session
            const nameParts = session.user.name.split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            const response = await fetch('/api/profile/create-from-modal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.user.email,
                firstName,
                lastName,
                phone: '', // Will be collected during profile completion
              }),
            })

            if (response.ok) {
              const data = await response.json()
              setProfileId(data.profileId)
              setFormData({ firstName, lastName, maritalStatus: 'never_married' })
              setStep(1)
              setCreatingProfile(false)
              setPageLoading(false)
              return
            } else if (response.status === 409 || response.status === 400) {
              // Profile already exists - try to fetch it again
              const retryCheck = await fetch('/api/user/profile-status')
              if (retryCheck.ok) {
                const retryData = await retryCheck.json()
                if (retryData.hasProfile && retryData.profileId) {
                  setProfileId(retryData.profileId)
                  setCreatingProfile(false)
                  return
                }
              }
            }
          } catch (err) {
            console.error('Error creating profile from session:', err)
          }
          setCreatingProfile(false)
          setPageLoading(false)
          return
        }

        // No stored data and no profile - redirect to dashboard
        // Don't redirect to homepage with startSignup=true as that creates a loop
        if (fromGoogleAuth) {
          // No signup data found, redirecting to dashboard
          router.push('/dashboard')
          return
        }
        return
      }

      setCreatingProfile(true)

      try {
        // Use cookie first, then URL params, then storage
        const formDataToUse = formDataFromCookie || formDataFromUrl || (storedFormData ? JSON.parse(storedFormData) : {})
        const referredBy = sessionStorage.getItem('referredBy') || document.cookie.match(/referredBy=([^;]+)/)?.[1] || undefined

        const response = await fetch('/api/profile/create-from-modal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            ...formDataToUse,
            referredBy,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setProfileId(data.profileId)
          sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
          // Pre-fill form with the data (includes phone from account step)
          setFormData(formDataToUse)
          // Start at step 1 (basics) - user needs to fill name, gender, age, etc.
          // Phone is already saved from the account step
          setStep(1)
        } else if (response.status === 409) {
          // Duplicate profile - clear sessionStorage and redirect
          sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
          router.push('/dashboard')
          return
        } else if (response.status === 400) {
          // Profile already exists - clear sessionStorage and get existing profile
          sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
          try {
            const checkResponse = await fetch('/api/user/profile-status')
            if (checkResponse.ok) {
              const data = await checkResponse.json()
              if (data.hasProfile && data.profileId) {
                setProfileId(data.profileId)
                return
              }
            }
          } catch {
            // Fallback to dashboard
          }
          router.push('/dashboard')
          return
        } else {
          // Any other error - clear sessionStorage to prevent infinite loading
          sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
          const errorData = await response.json()
          setError(errorData.error || 'Failed to create profile')
        }
      } catch (err) {
        console.error('Error creating profile:', err)
        sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData') // Clear to prevent infinite loading
        setError('Failed to create profile. Please try again.')
      } finally {
        setCreatingProfile(false)
        setPageLoading(false)
      }
    }

    createProfileFromStoredData()
  }, [status, session?.user?.email, session?.user?.name, profileId, creatingProfile, fromGoogleAuth, urlFirstName, urlLastName, urlPhone, returnTo, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Safety timeout - prevent infinite loading (10 seconds max)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pageLoading || creatingProfile) {
        // Safety timeout triggered - stopping loading
        sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
        setPageLoading(false)
        setCreatingProfile(false)
        // Check if user has a profile
        fetch('/api/user/profile-status')
          .then(res => res.json())
          .then(data => {
            if (data.hasProfile && data.profileId) {
              setProfileId(data.profileId)
            } else {
              setError('Profile setup timed out. Please try again.')
            }
          })
          .catch(() => {
            setError('Profile setup timed out. Please try again.')
          })
      }
    }, 10000)
    return () => clearTimeout(timeout)
  }, [pageLoading, creatingProfile])

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (status !== 'authenticated') return

      // If no profileId, stop loading - either profile creation will set it or we show error
      if (!profileId) {
        setPageLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/profile/${profileId}`)
        if (response.ok) {
          const data = await response.json()
          // Populate form with existing data
          setFormData({
            // Basic fields (already filled)
            createdBy: data.createdBy,
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            age: data.age,
            height: data.height,
            maritalStatus: data.maritalStatus || 'never_married',
            hasChildren: data.hasChildren,
            motherTongue: data.motherTongue,
            languagesKnown: data.languagesKnown,
            phone: data.phone, // Contact number
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
            prefAgeIsDealbreaker: data.prefAgeIsDealbreaker ?? true,
            prefHeightMin: data.prefHeightMin,
            prefHeightMax: data.prefHeightMax,
            prefHeightIsDealbreaker: data.prefHeightIsDealbreaker ?? true,
            prefMaritalStatus: data.prefMaritalStatus,
            prefMaritalStatusIsDealbreaker: data.prefMaritalStatusIsDealbreaker ?? true,
            prefHasChildren: data.prefHasChildren,
            prefHasChildrenIsDealbreaker: data.prefHasChildrenIsDealbreaker,
            prefReligion: data.prefReligion,
            prefReligionIsDealbreaker: data.prefReligionIsDealbreaker ?? true,
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

  // Merge "Other" custom text fields into main fields before saving
  // e.g., if motherTongue="Other" and motherTongueOther="Tulu", save motherTongue="Tulu"
  const mergeOtherFields = (data: Record<string, unknown>): Record<string, unknown> => {
    const merged = { ...data }

    // Simple select fields: if value is "Other"/"other" and *Other field has text, use the text
    const otherFieldMappings = [
      { main: 'motherTongue', other: 'motherTongueOther', otherValue: 'Other' },
      { main: 'qualification', other: 'qualificationOther', otherValue: 'other' },
      { main: 'occupation', other: 'occupationOther', otherValue: 'other' },
      { main: 'residencyStatus', other: 'residencyStatusOther', otherValue: 'other' },
      { main: 'religion', other: 'religionOther', otherValue: 'Other' },
      { main: 'familyLocation', other: 'familyLocationOther', otherValue: 'Other' },
    ]

    for (const { main, other, otherValue } of otherFieldMappings) {
      if (merged[main] === otherValue && merged[other] && (merged[other] as string).trim()) {
        merged[main] = (merged[other] as string).trim()
      }
    }

    // Checkbox fields (comma-separated): replace "Other" with custom text
    const checkboxOtherMappings = [
      { main: 'hobbies', other: 'hobbiesOther' },
      { main: 'fitness', other: 'fitnessOther' },
      { main: 'interests', other: 'interestsOther' },
      { main: 'languagesKnown', other: 'languagesKnownOther' },
    ]

    for (const { main, other } of checkboxOtherMappings) {
      const val = merged[main] as string
      const otherText = merged[other] as string
      if (val && val.includes('Other') && otherText && otherText.trim()) {
        merged[main] = val.replace('Other', otherText.trim())
      }
    }

    return merged
  }

  // Update profile with section data
  const handleUpdateProfile = async (nextStep: number) => {
    if (!profileId) return

    setError('')
    setLoading(true)

    try {
      const signupStep = getSignupStepFromLocalStep(nextStep)
      const dataToSave = mergeOtherFields(formData)

      const response = await fetch(`/api/profile/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dataToSave,
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
      const photosUrl = `/profile/photos?profileId=${profileId}&fromSignup=true${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`
      router.push(photosUrl)
    } else if (step < SECTION_ORDER.length) {
      await handleUpdateProfile(step + 1)
    }
  }

  // Section validations
  // Basics validation (name and phone already collected during registration, not needed here)
  const hasAgeOrDOB = !!(formData.dateOfBirth || formData.age)
  const isBasicsComplete = !!(
    formData.createdBy &&
    formData.gender &&
    hasAgeOrDOB &&
    formData.height &&
    formData.maritalStatus &&
    formData.motherTongue
  )

  // Location & Education validation
  const isUSALocation = (formData.country as string || 'USA') === 'USA'
  const occupationValue = (formData.occupation as string || '').toLowerCase()
  const isNonWorkingOccupation = ['student', 'homemaker', 'home maker', 'retired', 'not working', 'unemployed'].some(
    status => occupationValue.includes(status)
  )
  const isLocationEducationComplete = !!(
    formData.country &&
    formData.grewUpIn &&
    formData.citizenship &&
    (!isUSALocation || formData.zipCode) &&
    formData.qualification &&
    formData.university &&
    formData.occupation &&
    (isNonWorkingOccupation || formData.employerName) &&
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

  // Preferences Page 1 validation - Age and Height are required (both min and max)
  const prefAgeMinValue = formData.prefAgeMin as string || ''
  const prefAgeMaxValue = formData.prefAgeMax as string || ''
  const prefHeightMinValue = formData.prefHeightMin as string || ''
  const prefHeightMaxValue = formData.prefHeightMax as string || ''
  const isPreferences1Complete =
    prefAgeMinValue !== '' &&
    prefAgeMaxValue !== '' &&
    prefHeightMinValue !== '' &&
    prefHeightMaxValue !== ''

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

  // Check if we have pending signup data (for Google auth flow)
  // Check cookie, URL params, and storage
  const hasCookie = typeof document !== 'undefined' && document.cookie.includes('signupFormData=')
  const hasPendingSignupData = (fromGoogleAuth && (hasCookie || (urlFirstName && urlLastName && urlPhone))) ||
    (typeof window !== 'undefined' && (sessionStorage.getItem('signupFormData') !== null || localStorage.getItem('signupFormData') !== null))

  if (status === 'loading' || pageLoading || creatingProfile || (hasPendingSignupData && !profileId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            {creatingProfile || hasPendingSignupData ? 'Setting up your profile...' : 'Loading your profile...'}
          </p>
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
                <BasicsSection {...sectionProps} hideNameFields={true} hidePhoneField={true} />
                {/* Debug: Show which fields are missing */}
                {!isBasicsComplete && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    Missing: {[
                      !formData.createdBy && 'Created By',
                      !formData.gender && 'Gender',
                      !hasAgeOrDOB && 'Age/DOB',
                      !formData.height && 'Height',
                      !formData.maritalStatus && 'Marital Status',
                      !formData.motherTongue && 'Mother Tongue',
                    ].filter(Boolean).join(', ') || 'Unknown'}
                  </div>
                )}
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
                {renderContinueButton(handleSectionContinue, !isPreferences1Complete)}
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
