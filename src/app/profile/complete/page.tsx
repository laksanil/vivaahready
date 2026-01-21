'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ArrowLeft, Loader2, Camera, Upload, Trash2, CheckCircle } from 'lucide-react'
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
// Steps: 1=basics, 2=location_education, 3=religion, 4=family, 5=lifestyle, 6=aboutme, 7=preferences_1, 8=preferences_2, 9=photos
// Note: Account creation (original step 3) is already done when user reaches this page
const SECTION_ORDER = ['basics', 'location_education', 'religion', 'family', 'lifestyle', 'aboutme', 'preferences_1', 'preferences_2', 'photos']

const SECTION_TITLES: Record<string, string> = {
  basics: 'Basic Info',
  location_education: 'Education & Career',
  religion: 'Religion & Astro',
  family: 'Family Details',
  lifestyle: 'Lifestyle',
  aboutme: 'About Me',
  preferences_1: 'Partner Preferences',
  preferences_2: 'More Preferences',
  photos: 'Add Your Photos',
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

  // Photo upload state
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoVisibility, setPhotoVisibility] = useState('verified_only')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSectionContinue = () => {
    if (step < SECTION_ORDER.length) {
      handleUpdateProfile(step + 1)
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

  // Photo handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: { file: File; preview: string }[] = []
    Array.from(files).forEach((file) => {
      if (photos.length + newPhotos.length < 3) {
        newPhotos.push({
          file,
          preview: URL.createObjectURL(file),
        })
      }
    })
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const handlePhotoSubmit = async () => {
    if (!profileId) {
      setError('Profile not found. Please try again.')
      return
    }

    if (photos.length === 0) {
      setError('Please upload at least one photo to continue.')
      return
    }

    setError('')
    setLoading(true)
    setUploadingPhotos(true)

    try {
      // Upload photos
      for (const photo of photos) {
        const photoFormData = new FormData()
        photoFormData.append('file', photo.file)
        photoFormData.append('profileId', profileId)

        await fetch('/api/profile/upload-photo', {
          method: 'POST',
          body: photoFormData,
        })
      }

      // Update photo visibility setting
      await fetch('/api/profile/update-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          photoVisibility,
        }),
      })

      // Mark signup as complete (step 10)
      await fetch(`/api/profile/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupStep: 10 }),
      })

      // Redirect to photos page for phone number entry
      router.push(`/profile/photos?profileId=${profileId}&fromSignup=true`)
    } catch {
      setError('Failed to upload photos. Please try again.')
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

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

            {/* Photos Section */}
            {currentSection === 'photos' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary-100 flex items-center justify-center mx-auto mb-4 rounded-full">
                    <Camera className="h-10 w-10 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Upload Your Photo
                  </h3>
                  <p className="text-gray-600">
                    A profile photo is required to view and connect with matches. Add up to 3 photos.
                  </p>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden border-2 border-primary-500 bg-gray-100 rounded-lg">
                      <Image
                        src={photo.preview}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 shadow-lg hover:bg-red-600 transition-colors rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-xs py-1 text-center">
                          Primary Photo
                        </div>
                      )}
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, index) => (
                    <button
                      key={`empty-${index}`}
                      onClick={() => fileInputRef.current?.click()}
                      className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                        photos.length === 0 && index === 0
                          ? 'border-primary-400 bg-primary-50 hover:bg-primary-100'
                          : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
                      }`}
                    >
                      <Upload className={`h-6 w-6 mb-1 ${photos.length === 0 && index === 0 ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className={`text-xs ${photos.length === 0 && index === 0 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                        {photos.length === 0 && index === 0 ? 'Add Photo *' : 'Add Photo'}
                      </span>
                    </button>
                  ))}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 border-2 border-primary-500 text-primary-600 font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 rounded-lg"
                >
                  <Upload className="h-5 w-5" />
                  Upload from Device
                </button>

                {/* Photo Visibility Options */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Photo Privacy Settings</h4>
                  <p className="text-sm text-gray-500 mb-4">Choose who can view your photos:</p>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="photoVisibility"
                        value="verified_only"
                        checked={photoVisibility === 'verified_only'}
                        onChange={(e) => setPhotoVisibility(e.target.value)}
                        className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Verified Members Only</span>
                        <p className="text-sm text-gray-500">Your photos will only be visible to members with verified profiles</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="photoVisibility"
                        value="matching_preferences"
                        checked={photoVisibility === 'matching_preferences'}
                        onChange={(e) => setPhotoVisibility(e.target.value)}
                        className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Matching Profiles Only</span>
                        <p className="text-sm text-gray-500">Your photos will be visible to members whose preferences align with your profile</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="photoVisibility"
                        value="mutual_interest"
                        checked={photoVisibility === 'mutual_interest'}
                        onChange={(e) => setPhotoVisibility(e.target.value)}
                        className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">After Mutual Interest</span>
                        <p className="text-sm text-gray-500">Your photos will only be revealed after both parties express interest</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Photo Guidelines */}
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Photo Guidelines</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Use a recent, clear photograph of yourself
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Ensure your face is clearly visible
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Avoid group photos or images with accessories obscuring your face
                    </li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button
                    onClick={handlePhotoSubmit}
                    disabled={loading || photos.length === 0}
                    className={`w-full py-3.5 font-semibold text-lg shadow-lg transition-all rounded-lg ${
                      !loading && photos.length > 0
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        {uploadingPhotos ? 'Uploading Photos...' : 'Processing...'}
                      </span>
                    ) : (
                      'Continue to Phone Verification'
                    )}
                  </button>
                  {photos.length === 0 && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Please upload at least one photo to continue
                    </p>
                  )}
                </div>
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
