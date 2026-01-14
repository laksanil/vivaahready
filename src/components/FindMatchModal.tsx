'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ArrowLeft, Shield, Loader2, X, Camera, Upload, Trash2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  BasicsSection,
  LocationSection,
  EducationSection,
  FamilySection,
  LifestyleSection,
  AboutMeSection,
  ReligionSection,
  PreferencesSection,
  ReferralSection
} from './ProfileFormSections'

interface FindMatchModalProps {
  isOpen: boolean
  onClose: () => void
  isAdminMode?: boolean
  onAdminSuccess?: (profileId: string, tempPassword: string, email: string) => void
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US' },
  { code: '+91', country: 'IN' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+65', country: 'SG' },
  { code: '+971', country: 'UAE' },
]

const SECTION_TITLES: Record<string, string> = {
  basics: 'Basic Info',
  account: 'Create Account',
  admin_account: 'Account Details',
  location: 'Location & Background',
  education: 'Education & Career',
  religion: 'Religion & Astro',
  family: 'Family Details',
  lifestyle: 'Lifestyle',
  aboutme: 'About Me',
  preferences: 'Partner Preferences',
  referral: 'How Did You Find Us?',
  photos: 'Add Your Photos',
}

// Steps for user: 1=basics, 2=location, 3=education, 4=religion, 5=family, 6=lifestyle, 7=aboutme, 8=preferences, 9=account, 10=referral, 11=photos
const SECTION_ORDER = ['basics', 'location', 'education', 'religion', 'family', 'lifestyle', 'aboutme', 'preferences', 'account', 'referral', 'photos']

// Admin mode skips account creation (handled separately) and referral
const ADMIN_SECTION_ORDER = ['basics', 'location', 'education', 'religion', 'family', 'lifestyle', 'aboutme', 'preferences', 'admin_account', 'photos']

export default function FindMatchModal({ isOpen, onClose, isAdminMode = false, onAdminSuccess }: FindMatchModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Account creation data
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Profile form data - initialize with defaults for fields that have default UI values
  const [formData, setFormData] = useState<Record<string, unknown>>({
    maritalStatus: 'never_married',
    anyDisability: 'none',
    country: 'USA',
    grewUpIn: 'USA',
    citizenship: 'USA',
  })

  // Photo upload state
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null)
  const [photoVisibility, setPhotoVisibility] = useState('verified_only')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      onClose()
    }
  }

  const handleBasicsContinue = () => {
    // Either dateOfBirth or age is required
    const hasAgeOrDOB = !!(formData.dateOfBirth || formData.age)
    if (formData.createdBy && formData.firstName && formData.lastName && formData.gender && hasAgeOrDOB && formData.height && formData.maritalStatus) {
      setStep(2)
    }
  }

  // Either dateOfBirth or age is required
  const hasAgeOrDOB = !!(formData.dateOfBirth || formData.age)
  const isBasicsComplete = !!(formData.createdBy && formData.firstName && formData.lastName && formData.gender && hasAgeOrDOB && formData.height && formData.maritalStatus)

  // Location section validation
  const isUSALocation = (formData.country as string || 'USA') === 'USA'
  const linkedinUrl = formData.linkedinProfile as string || ''
  const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/
  const hasValidLinkedIn = linkedinUrl === 'no_linkedin' || linkedinRegex.test(linkedinUrl)
  const isLocationComplete = !!(
    formData.country &&
    formData.grewUpIn &&
    formData.citizenship &&
    formData.motherTongue &&
    hasValidLinkedIn &&
    !formData.linkedinError &&
    (!isUSALocation || formData.zipCode) // zipCode only required for USA
  )

  // Education section validation
  const isEducationComplete = !!(
    formData.qualification &&
    formData.occupation
  )

  const handleCreateAccount = async () => {
    if (!email || !phone || !password) return
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email,
          password,
          phone: `${countryCode}${phone}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      sessionStorage.setItem('newUserId', data.userId)
      sessionStorage.setItem('newUserEmail', email)
      setStep(step + 1) // Move to next section after account creation
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionContinue = () => {
    const sectionOrder = isAdminMode ? ADMIN_SECTION_ORDER : SECTION_ORDER
    if (step < sectionOrder.length) {
      setStep(step + 1)
    }
  }

  // Generate a random temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Admin creates account and profile in one step
  const handleAdminCreateAccount = async () => {
    if (!email) {
      setError('Email is required')
      return
    }
    setError('')
    setLoading(true)

    const tempPassword = generateTempPassword()

    try {
      const response = await fetch('/api/admin/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email,
          phone: phone ? `${countryCode}${phone}` : null,
          tempPassword,
          profileData: formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create profile')
        setLoading(false)
        return
      }

      setCreatedProfileId(data.profileId)
      // Store temp password for display
      sessionStorage.setItem('adminTempPassword', tempPassword)
      sessionStorage.setItem('adminCreatedEmail', email)
      setStep(step + 1) // Move to photos step
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: { file: File; preview: string }[] = []
    Array.from(files).forEach((file) => {
      if (photos.length + newPhotos.length < 6) {
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

  const handleCreateProfile = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/profile/create-from-modal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          ...formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create profile')
        setLoading(false)
        return
      }

      const profileData = await response.json()
      setCreatedProfileId(profileData.profileId)
      setStep(step + 1) // Move to photos step
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSubmit = async () => {
    if (!createdProfileId) {
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
        photoFormData.append('profileId', createdProfileId)

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
          profileId: createdProfileId,
          photoVisibility,
        }),
      })

      if (isAdminMode) {
        // Get stored temp password and email for callback
        const tempPassword = sessionStorage.getItem('adminTempPassword') || ''
        const createdEmail = sessionStorage.getItem('adminCreatedEmail') || email
        sessionStorage.removeItem('adminTempPassword')
        sessionStorage.removeItem('adminCreatedEmail')

        if (onAdminSuccess) {
          onAdminSuccess(createdProfileId, tempPassword, createdEmail)
        }
        onClose()
      } else {
        router.push('/login?registered=true&message=Profile created successfully! Please login to continue.')
        onClose()
      }
    } catch {
      setError('Failed to upload photos. Please try again.')
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

  const activeSectionOrder = isAdminMode ? ADMIN_SECTION_ORDER : SECTION_ORDER
  const currentSection = activeSectionOrder[step - 1]
  const totalSteps = activeSectionOrder.length
  const progress = (step / totalSteps) * 100

  const sectionProps = { formData, handleChange, setFormData }

  const renderContinueButton = (onClick: () => void, disabled: boolean = false, isLast: boolean = false) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`mt-8 w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 ${
        !disabled && !loading
          ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg active:scale-[0.98]'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
          {isLast ? 'Creating Profile...' : 'Processing...'}
        </span>
      ) : (
        isLast ? 'Create Profile' : 'Continue'
      )}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
          <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {SECTION_TITLES[currentSection]}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of {totalSteps}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Falsification Warning */}
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-xs">
            <strong>Important:</strong> All information provided must be accurate and truthful. Submission of false or misleading information is a violation of our terms of service and may result in permanent account suspension.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 pb-8">
          {/* Step 1: Basic Info */}
          {currentSection === 'basics' && (
            <div className="space-y-4">
              <BasicsSection {...sectionProps} />
              {renderContinueButton(
                handleBasicsContinue,
                !isBasicsComplete
              )}
            </div>
          )}

          {/* Step 2: Account Creation */}
          {currentSection === 'account' && (
            <div>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-yellow-500" />
              </div>

              <p className="text-center text-gray-600 mb-6">
                Create your account to save your profile
              </p>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => {
                  // Store form data in session storage before redirecting
                  sessionStorage.setItem('signupFormData', JSON.stringify(formData))
                  signIn('google', { callbackUrl: '/dashboard?createProfile=true' })
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or sign up with email</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="form-label">Phone *</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="input-field w-24"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="input-field flex-1"
                      placeholder="Phone number"
                      maxLength={10}
                    />
                  </div>
                  {countryCode === '+1' && (
                    <p className="text-gray-500 text-xs mt-1">10 digits for US phone number</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Password *</label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type="text"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-1">Minimum 8 characters</p>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={!email || !phone || !password || password.length < 8 || password !== confirmPassword || loading}
                className={`mt-6 w-full py-3.5 rounded-full font-semibold text-lg shadow-lg transition-all ${
                  email && phone && password && password.length >= 8 && password === confirmPassword && !loading
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account & Continue'
                )}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                By creating account, you agree to our{' '}
                <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                {' '}and{' '}
                <Link href="/terms" className="text-primary-600 hover:underline">T&C</Link>.
              </p>
            </div>
          )}

          {/* Step 3: Location */}
          {currentSection === 'location' && (
            <div className="space-y-4">
              <LocationSection {...sectionProps} />
              {renderContinueButton(handleSectionContinue, !isLocationComplete)}
            </div>
          )}

          {/* Step 4: Education */}
          {currentSection === 'education' && (
            <div className="space-y-4">
              <EducationSection {...sectionProps} />
              {renderContinueButton(handleSectionContinue, !isEducationComplete)}
            </div>
          )}

          {/* Step 5: Religion */}
          {currentSection === 'religion' && (
            <div className="space-y-4">
              <ReligionSection {...sectionProps} />
              {renderContinueButton(handleSectionContinue)}
            </div>
          )}

          {/* Step 6: Family */}
          {currentSection === 'family' && (
            <div className="space-y-4">
              <FamilySection {...sectionProps} />
              {renderContinueButton(handleSectionContinue)}
            </div>
          )}

          {/* Step 7: Lifestyle */}
          {currentSection === 'lifestyle' && (
            <div className="space-y-4">
              <LifestyleSection {...sectionProps} />
              {renderContinueButton(handleSectionContinue)}
            </div>
          )}

          {/* Step 8: About Me */}
          {currentSection === 'aboutme' && (
            <div className="space-y-4">
              <AboutMeSection {...sectionProps} />
              {renderContinueButton(handleSectionContinue)}
            </div>
          )}

          {/* Step 9: Preferences */}
          {currentSection === 'preferences' && (
            <div className="space-y-4">
              <PreferencesSection {...sectionProps} />
              {renderContinueButton(handleSectionContinue)}
            </div>
          )}

          {/* Admin Account Section - only shown in admin mode */}
          {currentSection === 'admin_account' && (
            <div>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-blue-500" />
              </div>

              <p className="text-center text-gray-600 mb-6">
                Enter the user's email to create their account. A temporary password will be generated.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number (Optional)</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="input-field w-24"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234567890"
                      className="input-field flex-1"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> A temporary password will be generated and displayed after profile creation.
                    The user will need to change this password on their first login.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAdminCreateAccount}
                disabled={!email || loading}
                className={`mt-8 w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 ${
                  email && !loading
                    ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account & Continue'
                )}
              </button>
            </div>
          )}

          {/* Step 10: Referral */}
          {currentSection === 'referral' && (
            <div className="space-y-4">
              <ReferralSection {...sectionProps} />
              {renderContinueButton(handleCreateProfile, false, true)}
            </div>
          )}

          {/* Step 10: Photos */}
          {currentSection === 'photos' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Your Photo
                </h3>
                <p className="text-gray-600">
                  A profile photo is required to view and connect with matches. Add up to 6 photos.
                </p>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Uploaded Photos */}
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary-500 bg-gray-100">
                    <Image
                      src={photo.preview}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
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

                {/* Add Photo Buttons */}
                {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, index) => (
                  <button
                    key={`empty-${index}`}
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
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
                className="w-full py-3 border-2 border-primary-500 text-primary-600 rounded-full font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload from Device
              </button>

              {/* Photo Visibility Options */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4">
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
              <div className="mt-4 bg-blue-50 rounded-xl p-4">
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
                  className={`w-full py-3.5 rounded-full font-semibold text-lg shadow-lg transition-all ${
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
                    'Complete Registration'
                  )}
                </button>
                {photos.length === 0 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Please upload at least one photo to complete your registration
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
