'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Camera, Upload, Trash2, CheckCircle, Loader2, ArrowLeft, Phone, Shield, Clock, Users, Sparkles, AlertCircle, ChevronDown, Heart } from 'lucide-react'
import Link from 'next/link'
import { useFaceDetection } from '@/hooks/useFaceDetection'

// Country codes for phone number
const countryCodes = [
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
]

function PhotosUploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { validatePhoto, isLoading: isValidatingPhoto } = useFaceDetection()

  const profileId = searchParams.get('profileId')
  const fromSignup = searchParams.get('fromSignup') === 'true'

  const [photos, setPhotos] = useState<{ file: File; preview: string; validated: boolean }[]>([])
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (!profileId && status === 'authenticated') {
      // If no profileId provided, redirect to dashboard
      router.push('/dashboard')
    }
  }, [profileId, status, router])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setPhotoError('')

    for (const file of Array.from(files)) {
      if (photos.length >= 3) break

      // Validate photo (includes face detection)
      const result = await validatePhoto(file)

      if (!result.isValid) {
        setPhotoError(result.message)
        continue
      }

      setPhotos((prev) => {
        if (prev.length >= 3) return prev
        return [...prev, {
          file,
          preview: URL.createObjectURL(file),
          validated: true
        }]
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
    setPhotoError('')
  }

  const handlePhotoSubmit = async () => {
    if (!profileId) {
      setError('Profile not found. Please try again.')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number to continue.')
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
      // Save phone number with country code to user profile
      const fullPhoneNumber = `${selectedCountry.code}${phoneNumber.trim()}`
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      })

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

      // Redirect to dashboard with success message
      router.push('/dashboard?status=pending')
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          {!fromSignup && (
            <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {fromSignup ? 'Almost Done! Add Your Contact & Photos' : 'Update Contact & Photos'}
          </h1>
          <p className="text-gray-600 mt-1">
            A phone number and profile photo are required to view and connect with matches.
          </p>
        </div>

        {/* Welcome Message - Only show during signup */}
        {fromSignup && (
          <div className="mb-6 bg-gradient-to-r from-primary-50 via-pink-50 to-purple-50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome to VivaahReady!
                </h2>
                <p className="text-gray-700">
                  Congratulations on taking the first step towards meaningful connections! We&apos;re honored to be your partner in this beautiful journey of finding your life companion.
                </p>
                <p className="text-gray-600 mt-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary-500" />
                  <span>Just a few more details, and you&apos;ll be all set to discover curated matches handpicked just for you.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Phone Number Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contact Number</h3>
                <p className="text-sm text-gray-500">Required for profile verification</p>
              </div>
            </div>

            {/* Phone Input with Country Code */}
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center gap-2 px-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors min-w-[120px]"
                >
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span className="text-gray-700 font-medium">{selectedCountry.code}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
                </button>

                {showCountryDropdown && (
                  <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {countryCodes.map((country, index) => (
                      <button
                        key={`${country.code}-${country.country}-${index}`}
                        onClick={() => {
                          setSelectedCountry(country)
                          setShowCountryDropdown(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                          selectedCountry.code === country.code && selectedCountry.country === country.country
                            ? 'bg-primary-50'
                            : ''
                        }`}
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-gray-700">{country.country}</span>
                        <span className="text-gray-500 ml-auto">{country.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone Number Input */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Phone number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-medium">Required *</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">Your phone number will only be shared with verified matches</p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              SMS verification is available for US numbers only
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Photo Upload Section */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload Your Photos
            </h3>
            <p className="text-gray-600">
              Add up to 3 photos. Your first photo will be your primary profile picture.
            </p>
          </div>

          {/* Photo Error */}
          {photoError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Photo Grid - 3 slots */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Uploaded Photos */}
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
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
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

            {/* Add Photo Buttons - up to 3 total */}
            {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, index) => (
              <button
                key={`empty-${index}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={isValidatingPhoto}
                className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                  isValidatingPhoto
                    ? 'border-gray-300 bg-gray-100 cursor-wait'
                    : photos.length === 0 && index === 0
                    ? 'border-primary-400 bg-primary-50 hover:bg-primary-100'
                    : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                {isValidatingPhoto && photos.length === 0 && index === 0 ? (
                  <Loader2 className="h-6 w-6 mb-1 text-primary-500 animate-spin" />
                ) : (
                  <Upload className={`h-6 w-6 mb-1 ${photos.length === 0 && index === 0 ? 'text-primary-500' : 'text-gray-400'}`} />
                )}
                <span className={`text-xs ${photos.length === 0 && index === 0 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                  {isValidatingPhoto ? 'Checking...' : photos.length === 0 && index === 0 ? 'Add Photo *' : 'Add Photo'}
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
            disabled={isValidatingPhoto}
            className="w-full py-3 border-2 border-primary-500 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidatingPhoto ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Validating Photo...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload from Device
              </>
            )}
          </button>

          {/* Photo Privacy Announcement */}
          <div className="mt-6 bg-gradient-to-r from-primary-50 to-blue-50 p-5 rounded-lg border border-primary-100">
            <div className="flex items-start gap-3 mb-3">
              <Shield className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">Your Photos Are Protected</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Your photos will <strong>only be visible to admin-verified profiles</strong>. At VivaahReady, we prioritize your privacy and security to ensure a safe and genuine matrimonial experience.
                </p>
              </div>
            </div>
          </div>

          {/* Why Photos Matter */}
          <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h4 className="font-semibold text-gray-900 mb-3">Why Photos Are Essential</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>Saves time</strong> — Clear photos help potential matches make informed decisions quickly, reducing unnecessary back-and-forth</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>Builds trust</strong> — A recent photograph establishes credibility and shows you&apos;re serious about finding a life partner</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>Better matches</strong> — Profiles with photos receive significantly more interest and faster responses</span>
              </li>
            </ul>
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

          {/* Privacy Commitment */}
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <strong>Our Privacy Commitment:</strong> Your photos are stored securely and are never shared with third parties. Access is strictly limited to verified members of our platform. We employ industry-standard encryption and security measures to protect your personal images. By uploading photos, you confirm they are recent photographs of yourself and consent to their display to verified members only.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handlePhotoSubmit}
              disabled={loading || photos.length === 0 || !phoneNumber.trim() || isValidatingPhoto}
              className={`w-full py-3.5 rounded-lg font-semibold text-lg shadow-lg transition-all ${
                !loading && photos.length > 0 && phoneNumber.trim() && !isValidatingPhoto
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
            {(photos.length === 0 || !phoneNumber.trim()) && (
              <p className="text-center text-sm text-gray-500 mt-2">
                {!phoneNumber.trim() && photos.length === 0
                  ? 'Please enter your phone number and upload at least one photo'
                  : !phoneNumber.trim()
                  ? 'Please enter your phone number'
                  : 'Please upload at least one photo'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PhotosUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <PhotosUploadContent />
    </Suspense>
  )
}
