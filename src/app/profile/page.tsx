'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Edit,
  Camera,
  Eye,
  Settings,
  Trash2,
  EyeOff,
  ArrowLeft,
  Shield,
  Upload,
  X,
  Star,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Mail,
  Image,
  UserCheck,
} from 'lucide-react'
import ProfileEditModal from '@/components/ProfileEditModal'
import { validateProfilePhoto } from '@/lib/faceDetection'
import { useImpersonation } from '@/hooks/useImpersonation'

interface Profile {
  id: string
  odNumber: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  age: string
  height: string
  weight: string
  maritalStatus: string
  hasChildren: string
  currentLocation: string
  citizenship: string
  linkedinProfile: string
  facebookInstagram: string
  facebook: string
  instagram: string
  caste: string
  gotra: string
  qualification: string
  university: string
  occupation: string
  annualIncome: string
  fatherName: string
  motherName: string
  fatherOccupation: string
  motherOccupation: string
  numberOfBrothers: string
  numberOfSisters: string
  siblingDetails: string
  familyType: string
  familyValues: string
  familyLocation: string
  dietaryPreference: string
  languagesKnown: string
  aboutMe: string
  prefHeight: string
  prefHeightMin: string
  prefHeightMax: string
  prefAgeDiff: string
  prefAgeMin: string
  prefAgeMax: string
  prefLocation: string
  prefCountry: string
  prefDiet: string
  prefCaste: string
  prefQualification: string
  prefIncome: string
  idealPartnerDesc: string
  approvalStatus: string
  photoUrls: string
  profileImageUrl: string
  residencyStatus: string
  grewUpIn: string
  country: string
  livesWithFamily: string
  placeOfBirth: string
  motherTongue: string
  religion: string
  employerName: string
  workingAs: string
  prefGotra: string
  createdBy: string
  healthInfo: string
  anyDisability: string
  disabilityDetails: string
  bloodGroup: string
  placeOfBirthCountry: string
  placeOfBirthState: string
  placeOfBirthCity: string
  manglik: string
  raasi: string
  nakshatra: string
  doshas: string
  smoking: string
  drinking: string
  hobbies: string
  interests: string
  pets: string
  allergiesOrMedical: string
  fitness: string
  community: string
  subCommunity: string
  timeOfBirth: string
  // Religion-specific fields
  maslak: string
  namazPractice: string
  amritdhari: string
  turban: string
  churchAttendance: string
  baptized: string
  // Metadata
  zipCode: string
  openToRelocation: string
  drivePhotosLink: string
  photoVisibility: string
  referralSource: string
  promoCode: string
  isVerified: boolean
  isActive: boolean
  isSuspended: boolean
  profileScore: number
  emailVerified: boolean
  // Additional preference fields
  prefLanguage: string
  prefHobbies: string
  prefSpecificHobbies: string
  prefFitness: string
  prefSpecificFitness: string
  prefInterests: string
  prefSpecificInterests: string
  prefReligion: string
  prefFamilyValues: string
  prefFamilyLocation: string
  prefFamilyLocationCountry: string
  prefLocationList: string
  prefMaritalStatus: string
  prefHasChildren: string
  prefSmoking: string
  prefDrinking: string
  prefGrewUpIn: string
  prefRelocation: string
  prefCommunity: string
  prefSubCommunity: string
  prefMotherTongue: string
  prefPets: string
  prefWorkArea: string
  prefOccupation: string
  prefCitizenship: string
  // Deal-breaker flags
  prefAgeIsDealbreaker: boolean
  prefHeightIsDealbreaker: boolean
  prefMaritalStatusIsDealbreaker: boolean
  prefHasChildrenIsDealbreaker: boolean
  prefCommunityIsDealbreaker: boolean
  prefGotraIsDealbreaker: boolean
  prefDietIsDealbreaker: boolean
  prefSmokingIsDealbreaker: boolean
  prefDrinkingIsDealbreaker: boolean
  prefLocationIsDealbreaker: boolean
  prefCitizenshipIsDealbreaker: boolean
  prefGrewUpInIsDealbreaker: boolean
  prefRelocationIsDealbreaker: boolean
  prefEducationIsDealbreaker: boolean
  prefWorkAreaIsDealbreaker: boolean
  prefIncomeIsDealbreaker: boolean
  prefOccupationIsDealbreaker: boolean
  prefFamilyValuesIsDealbreaker: boolean
  prefFamilyLocationIsDealbreaker: boolean
  prefMotherTongueIsDealbreaker: boolean
  prefSubCommunityIsDealbreaker: boolean
  prefPetsIsDealbreaker: boolean
  prefReligionIsDealbreaker: boolean
  // Contact info
  email: string
  phone: string
  phoneVerified: boolean
}

function ViewProfilePageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminProfileId = searchParams.get('id') // Admin can view any profile with ?id=xxx
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileUserName, setProfileUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'about' | 'preferences'>('about')
  const [editSection, setEditSection] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckDone, setAdminCheckDone] = useState(false) // Track if admin check completed

  // Derived value - true when admin is viewing another user's profile
  // Not using useState to avoid timing issues between isAdmin and isAdminMode
  const isAdminMode = isAdmin && !!adminProfileId
  const isImpersonationMode = !!viewAsUser
  const canAccess = !!session || (isImpersonationMode && isAdmin) || isAdminMode

  // Photo management state
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lightbox state for photo zoom
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Check if current user is admin
  useEffect(() => {
    let active = true
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/check')
        if (active) {
          setIsAdmin(res.ok)
        }
      } catch {
        if (active) {
          setIsAdmin(false)
        }
      } finally {
        if (active) {
          setAdminCheckDone(true)
        }
      }
    }

    checkAdmin()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!isImpersonationMode || !isAdmin || !viewAsUser || adminProfileId) return () => {}

    fetch(`/api/admin/users/${viewAsUser}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        if (data.user?.name) {
          setProfileUserName(data.user.name)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [isImpersonationMode, isAdmin, viewAsUser, adminProfileId])

  const refreshProfile = async () => {
    try {
      const endpoint = isAdminMode ? `/api/admin/profiles/${adminProfileId}` : buildApiUrl('/api/profile')
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        if (isAdminMode && data.user?.name) {
          setProfileUserName(data.user.name)
        }
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err)
    }
  }

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setPhotoUploading(true)
    setPhotoError('')

    try {
      // Validate photo for face detection
      const validation = await validateProfilePhoto(file)
      if (!validation.isValid) {
        throw new Error(validation.message)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profile.id)

      const response = await fetch(buildApiUrl('/api/profile/upload-photo'), {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      // Refresh profile to get updated photos
      await refreshProfile()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setPhotoUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Photo delete handler
  const handlePhotoDelete = async (photoUrl: string) => {
    if (!profile) return

    if (!confirm('Are you sure you want to delete this photo?')) return

    setPhotoError('')

    try {
      const response = await fetch(buildApiUrl('/api/profile/delete-photo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl,
          profileId: isAdminMode ? profile.id : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete photo')
      }

      // Refresh profile to get updated photos
      await refreshProfile()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to delete photo')
    }
  }

  // Set primary photo handler
  const handleSetPrimaryPhoto = async (photoUrl: string) => {
    if (!profile) return

    try {
      const endpoint = isAdminMode ? `/api/admin/profiles/${profile.id}` : buildApiUrl('/api/profile')
      const method = isAdminMode ? 'PATCH' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: photoUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to set primary photo')
      }

      await refreshProfile()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to set primary photo')
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated' && adminCheckDone && !canAccess) {
      router.push('/login')
    }
  }, [status, router, adminCheckDone, canAccess])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // If admin mode, fetch the specific profile via admin API
        const endpoint = (isAdmin && adminProfileId)
          ? `/api/admin/profiles/${adminProfileId}`
          : buildApiUrl('/api/profile')

        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
          // Store the user name for admin mode
          if (isAdmin && adminProfileId && data.user?.name) {
            setProfileUserName(data.user.name)
          }
        } else {
          setError('Profile not found')
        }
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    // Wait for admin check to complete before fetching
    if (!adminCheckDone) return

    // For admin mode with profileId, check if user is admin
    if (adminProfileId) {
      if (isAdmin) {
        fetchProfile()
      } else {
        // Not admin but trying to access with ?id= - show unauthorized
        setLoading(false)
      }
      return
    }

    if (isImpersonationMode) {
      if (isAdmin) {
        fetchProfile()
      } else {
        setLoading(false)
      }
      return
    }

    if (session?.user) {
      // Normal user viewing their own profile
      fetchProfile()
    }
  }, [session, isAdmin, adminProfileId, adminCheckDone, isImpersonationMode, buildApiUrl])

  // Show loading while checking session, admin status, or loading profile
  if (status === 'loading' || loading || ((adminProfileId || isImpersonationMode) && !adminCheckDone)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  // If trying to access with ?id= but not admin, show unauthorized
  if ((adminProfileId || isImpersonationMode) && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">Unauthorized: Admin access required</p>
            <Link href={buildUrl('/profile')} className="btn-primary">
              Go to My Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">{error || 'No profile found'}</p>
            <Link href={buildUrl('/profile/create')} className="btn-primary">
              Create Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const calculateAge = (dob: string) => {
    if (!dob) return null
    const parts = dob.split('/')
    if (parts.length >= 2) {
      const year = parseInt(parts[parts.length - 1])
      if (year > 1900 && year < 2020) {
        return new Date().getFullYear() - year
      }
    }
    const date = new Date(dob)
    if (!isNaN(date.getTime())) {
      const today = new Date()
      let age = today.getFullYear() - date.getFullYear()
      const monthDiff = today.getMonth() - date.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--
      }
      return age
    }
    return null
  }

  const formatHeight = (height: string) => {
    if (!height) return 'Not specified'

    // Check if in ft'in" format (e.g., "5'8"")
    const ftInMatch = height.match(/^(\d)'(\d{1,2})"?$/)
    if (ftInMatch) {
      const feet = parseInt(ftInMatch[1])
      const inches = parseInt(ftInMatch[2])
      const totalInches = feet * 12 + inches
      const cm = Math.round(totalInches * 2.54)
      return `${feet}'${inches}" (${cm} cm)`
    }

    // Check if in "X ft Y in" format (e.g., "5 ft 8 in")
    const ftInWordsMatch = height.match(/^(\d+)\s*ft\s*(\d+)\s*in$/i)
    if (ftInWordsMatch) {
      const feet = parseInt(ftInWordsMatch[1])
      const inches = parseInt(ftInWordsMatch[2])
      const totalInches = feet * 12 + inches
      const cm = Math.round(totalInches * 2.54)
      return `${feet}'${inches}" (${cm} cm)`
    }

    // Check if just feet (e.g., "5 ft" or "6ft")
    const ftOnlyMatch = height.match(/^(\d+)\s*ft$/i)
    if (ftOnlyMatch) {
      const feet = parseInt(ftOnlyMatch[1])
      const totalInches = feet * 12
      const cm = Math.round(totalInches * 2.54)
      return `${feet}'0" (${cm} cm)`
    }

    // Legacy: if stored as cm number (3-digit number like 170), convert to ft'in"
    const h = parseInt(height)
    if (!isNaN(h) && h >= 100 && h <= 250) {
      // Looks like centimeters (100-250 range)
      const feet = Math.floor(h / 30.48)
      const inches = Math.round((h % 30.48) / 2.54)
      return `${feet}'${inches}" (${h} cm)`
    }

    return height
  }

  const formatValue = (value: string | null | undefined) => {
    if (!value) return 'Not specified'
    // Return the exact value stored in DB, only replace underscores for legacy data
    return value.replace(/_/g, ' ')
  }

  const age = calculateAge(profile.dateOfBirth)
  const photoUrl = profile.profileImageUrl || null

  // Get all photos as array (Cloudinary URLs only)
  const rawPhotoUrls = profile.photoUrls ? profile.photoUrls.split(',').filter(url => url.trim().startsWith('http')) : []
  const allPhotos = rawPhotoUrls.map(url => url.trim())
  const canAddMorePhotos = rawPhotoUrls.length < 3

  // Get primary photo URL for comparison
  const primaryPhotoDisplay = profile.profileImageUrl || null

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % allPhotos.length)
  }

  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
  }

  const pronoun = profile.gender === 'male' ? 'Him' : 'Her'
  const genderLabel = profile.gender === 'male' ? 'Groom' : 'Bride'

  // Generate About Me summary based on profile data
  const generateAboutMeSummary = () => {
    const createdBy = profile.createdBy?.toLowerCase() || 'self'
    const isMale = profile.gender === 'male'
    const name = session?.user?.name?.split(' ')[0] || 'I'

    // Relationship terms based on who's filling
    const subjectPronoun = isMale ? 'he' : 'she'
    const objectPronoun = isMale ? 'him' : 'her'
    const possessivePronoun = isMale ? 'his' : 'her'
    const relation = isMale ? 'son' : 'daughter'
    const partnerTerm = isMale ? 'life partner' : 'life partner'

    let intro = ''
    let details: string[] = []
    let closing = ''

    if (createdBy === 'self') {
      intro = "It is a pleasure introducing myself. "

      // Add qualification/career
      if (profile.qualification || profile.occupation) {
        if (profile.qualification && profile.occupation) {
          details.push(`I have completed my ${formatValue(profile.qualification)} and currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
        } else if (profile.occupation) {
          details.push(`I am currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
        } else if (profile.qualification) {
          details.push(`I have completed my ${formatValue(profile.qualification)}.`)
        }
      }

      // Add location
      if (profile.currentLocation) {
        details.push(`I am based in ${profile.currentLocation}.`)
      }

      // Add family background
      if (profile.familyType || profile.familyValues) {
        const familyDesc = profile.familyType ? `${profile.familyType} family` : 'family'
        const valuesDesc = profile.familyValues ? ` with ${profile.familyValues} values` : ''
        details.push(`I come from a ${familyDesc}${valuesDesc}.`)
      }

      // Add lifestyle
      if (profile.hobbies || profile.interests) {
        const hobbiesText = profile.hobbies ? `My hobbies include ${profile.hobbies.toLowerCase()}.` : ''
        details.push(hobbiesText)
      }

      closing = "Although I have a progressive mindset, I have immense respect for our values and traditions. I want my better half to be my best friend for life and rest everything else would fall in place. If you wish to take things forward, feel free to initiate contact."

    } else if (createdBy === 'parent' || createdBy === 'parents') {
      intro = `Hello, here is a quick introduction about our ${relation}. `

      // Add qualification/career
      if (profile.qualification || profile.occupation) {
        if (profile.qualification && profile.occupation) {
          details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} has completed ${possessivePronoun} ${formatValue(profile.qualification)} and is currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
        } else if (profile.occupation) {
          details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is currently working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
        } else if (profile.qualification) {
          details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} has completed ${possessivePronoun} ${formatValue(profile.qualification)}.`)
        }
      }

      // Add location
      if (profile.currentLocation) {
        details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is based in ${profile.currentLocation}.`)
      }

      closing = `As parents, we have taught our ${relation} to respect others and live life with a positive & progressive outlook. We hope to find an understanding partner for ${objectPronoun} with whom ${subjectPronoun} would have a happy life.`

    } else if (createdBy === 'sibling') {
      intro = `Hello, I am introducing my ${isMale ? 'brother' : 'sister'}. `

      if (profile.qualification || profile.occupation) {
        if (profile.occupation) {
          details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is working as ${formatValue(profile.occupation)}${profile.employerName ? ` at ${profile.employerName}` : ''}.`)
        }
        if (profile.qualification) {
          details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} has completed ${possessivePronoun} ${formatValue(profile.qualification)}.`)
        }
      }

      if (profile.currentLocation) {
        details.push(`Currently based in ${profile.currentLocation}.`)
      }

      closing = `We are looking for a compatible partner who shares similar values and interests.`

    } else if (createdBy === 'relative') {
      intro = `Hello, I am introducing my ${isMale ? 'nephew/cousin' : 'niece/cousin'}. `

      if (profile.occupation) {
        details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is working as ${formatValue(profile.occupation)}.`)
      }

      if (profile.currentLocation) {
        details.push(`Based in ${profile.currentLocation}.`)
      }

      closing = `The family is looking for a suitable match with good values and understanding.`

    } else if (createdBy === 'friend') {
      intro = `Hello, I am introducing my friend. `

      if (profile.occupation) {
        details.push(`${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is working as ${formatValue(profile.occupation)}.`)
      }

      if (profile.currentLocation) {
        details.push(`Based in ${profile.currentLocation}.`)
      }

      closing = `${subjectPronoun.charAt(0).toUpperCase() + subjectPronoun.slice(1)} is a wonderful person looking for a compatible life partner.`
    } else {
      // Default to self
      intro = "A brief introduction: "
      if (profile.occupation) {
        details.push(`Working as ${formatValue(profile.occupation)}.`)
      }
      if (profile.currentLocation) {
        details.push(`Based in ${profile.currentLocation}.`)
      }
      closing = "Looking forward to finding a compatible life partner."
    }

    return intro + details.filter(d => d).join(' ') + ' ' + closing
  }

  const aboutMeText = profile.aboutMe || generateAboutMeSummary()

  // Determine the display name - use profile firstName + lastName initial
  // This ensures we show the name from the profile, not the Google Auth name
  const getProfileDisplayName = () => {
    if (profile?.firstName) {
      const lastName = profile.lastName || ''
      if (lastName) {
        return `${profile.firstName} ${lastName.charAt(0).toUpperCase()}.`
      }
      return profile.firstName
    }
    // Fallback to session/admin name if profile name not set
    if (isAdminMode || isImpersonationMode) {
      return profileUserName || 'User'
    }
    return session?.user?.name || 'User'
  }
  const displayName = getProfileDisplayName()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Mode Banner */}
      {isAdminMode && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Admin Mode - Editing {profileUserName}&apos;s Profile</span>
            </div>
            <Link
              href="/admin/approvals"
              className="flex items-center gap-1 text-white/90 hover:text-white text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Name and ID */}
          <div className="bg-gray-700 text-white px-4 py-3 rounded-t-lg -mx-4 -mt-6 mb-6">
            <h1 className="text-xl font-semibold">
              {displayName}
              <span className="text-gray-300 font-normal ml-2">( {profile.odNumber || profile.id.slice(0, 10).toUpperCase()} )</span>
            </h1>
          </div>

          {/* Photo and Quick Stats */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photos Section */}
            <div className="flex-shrink-0">
              {/* Photo Error Message */}
              {photoError && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {photoError}
                </div>
              )}

              {/* Photo Gallery */}
              <div className="flex gap-2">
                {/* Existing Photos */}
                {allPhotos.map((photo, index) => {
                  const isPrimary = photo === primaryPhotoDisplay
                  const rawUrl = rawPhotoUrls[index] // Use raw URL for API calls
                  return (
                    <div key={index} className="relative group">
                      <div
                        className={`w-28 h-36 bg-gray-200 rounded-lg overflow-hidden cursor-pointer ${
                          isPrimary ? 'ring-2 ring-primary-500' : ''
                        }`}
                        onClick={() => openLightbox(index)}
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Fallback for broken images
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-avatar.png'
                          }}
                        />
                      </div>
                      {/* Photo Actions Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                        <button
                          onClick={() => openLightbox(index)}
                          className="p-1.5 bg-white rounded-full text-blue-600 hover:bg-blue-50"
                          title="Zoom photo"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        {!isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryPhoto(rawUrl)}
                            className="p-1.5 bg-white rounded-full text-amber-600 hover:bg-amber-50"
                            title="Set as primary"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePhotoDelete(rawUrl)}
                          className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50"
                          title="Delete photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Primary badge */}
                      {isPrimary && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add Photo Button */}
                {canAddMorePhotos && (
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="w-28 h-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors disabled:opacity-50"
                    >
                      {photoUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mb-1" />
                          <span className="text-xs">Add Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Empty state - no photos */}
                {allPhotos.length === 0 && !canAddMorePhotos && (
                  <div className="w-28 h-36 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Photo hint */}
              <p className="text-xs text-gray-500 mt-2">
                {allPhotos.length}/3 photos {canAddMorePhotos && '- Click to add more'}
              </p>
            </div>

            {/* Profile Info */}
            <div className="flex-1 flex flex-col justify-center">
              {/* About Me at Top */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <p className="text-gray-700 text-sm">{aboutMeText}</p>
              </div>

              {/* Verification Status */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  {profile.emailVerified ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Email Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <XCircle className="h-4 w-4" />
                      Email Not Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {allPhotos.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Photo Uploaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <XCircle className="h-4 w-4" />
                      No Photo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {profile.approvalStatus === 'approved' ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Admin Approved
                    </span>
                  ) : profile.approvalStatus === 'pending' ? (
                    <span className="flex items-center gap-1.5 text-yellow-600 text-sm">
                      <XCircle className="h-4 w-4" />
                      Pending Approval
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-600 text-sm">
                      <XCircle className="h-4 w-4" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Link */}
              <div>
                <Link href={buildUrl(`/profile/${profile.id}`)} className="text-[#00BCD4] hover:underline text-sm flex items-center gap-1">
                  <Eye className="h-4 w-4" /> Preview Public Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'about'
                ? 'bg-[#E91E63] text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            About {pronoun}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-6 py-2 font-medium text-sm rounded-t-lg ml-1 ${
              activeTab === 'preferences'
                ? 'bg-[#E91E63] text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Partner Preferences ❤
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'about' ? (
            <div className="divide-y divide-gray-100">
              {/* Contact Details Section - At the top */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Contact Details</h2>
                  <button onClick={() => setEditSection('contact')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-36">Email</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800 flex items-center gap-2">
                      {profile.email || 'Not specified'}
                      {profile.emailVerified && <span className="text-green-600 text-xs">(Verified)</span>}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Phone</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800 flex items-center gap-2">
                      {profile.phone || 'Not specified'}
                      {profile.phoneVerified && <span className="text-green-600 text-xs">(Verified)</span>}
                    </span>
                  </div>
                  {profile.linkedinProfile && profile.linkedinProfile.trim() !== '' && profile.linkedinProfile !== 'no_linkedin' && (
                    <div className="flex">
                      <span className="text-gray-500 w-36">LinkedIn</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-[#00BCD4] hover:underline">View Profile</a>
                    </div>
                  )}
                  {(profile.instagram || profile.facebookInstagram) && (
                    <div className="flex">
                      <span className="text-gray-500 w-36">Instagram</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.instagram || profile.facebookInstagram}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Basic Info - matches BasicsSection fields */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Basic Info</h2>
                  <button onClick={() => setEditSection('basics')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-36">First Name</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.firstName || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Last Name</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.lastName || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Posted by</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatValue(profile.createdBy) || 'Self'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Gender</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatValue(profile.gender)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Date of Birth</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.dateOfBirth || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Age</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{age || profile.age || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Height</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatHeight(profile.height)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Marital Status</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatValue(profile.maritalStatus)}</span>
                  </div>
                  {profile.maritalStatus !== 'never_married' && (
                    <div className="flex">
                      <span className="text-gray-500 w-36">Children</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{formatValue(profile.hasChildren) || 'Not specified'}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="text-gray-500 w-36">Mother Tongue</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.motherTongue || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Languages Known</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.languagesKnown || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Education & Career (combined location + education - matches create flow) */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Education & Career</h2>
                  <button onClick={() => setEditSection('location_education')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                {/* Location Info */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm mb-4">
                  <div className="flex">
                    <span className="text-gray-500 w-36">Location</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.currentLocation || 'Not specified'}{profile.country ? `, ${profile.country}` : ''}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Grew Up In</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.grewUpIn || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Citizenship</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.citizenship || 'Not specified'}</span>
                  </div>
                  {profile.residencyStatus && (
                    <div className="flex">
                      <span className="text-gray-500 w-36">Residency Status</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{formatValue(profile.residencyStatus)}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="text-gray-500 w-36">Open to Relocation</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatValue((profile as unknown as Record<string, string>).openToRelocation) || 'Not specified'}</span>
                  </div>
                </div>
                {/* Education & Career Info */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-36">Highest Qualification</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatValue(profile.qualification)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">College(s) Attended</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.university || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Working With</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.employerName || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Working As</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatValue(profile.occupation)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Annual Income</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.annualIncome || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Religion & Astro - matches ReligionSection fields */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Religion & Astro</h2>
                  <button onClick={() => setEditSection('religion')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-24">Religion</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.religion || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Community</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{(profile as unknown as Record<string, string>).community || profile.caste || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Sub-Community</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{(profile as unknown as Record<string, string>).subCommunity || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Gothra</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.gotra || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Birth Country</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.placeOfBirthCountry ? (
                      <span className="text-gray-800">{profile.placeOfBirthCountry}</span>
                    ) : (
                      <button onClick={() => setEditSection('religion')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Birth State</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.placeOfBirthState ? (
                      <span className="text-gray-800">{profile.placeOfBirthState}</span>
                    ) : (
                      <button onClick={() => setEditSection('religion')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Birth City</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.placeOfBirthCity ? (
                      <span className="text-gray-800">{profile.placeOfBirthCity}</span>
                    ) : (
                      <button onClick={() => setEditSection('religion')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Manglik</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">
                      {profile.manglik === 'yes' ? 'Yes' : profile.manglik === 'no' ? 'No' : "Don't Know"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Raasi</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.raasi ? (
                      <span className="text-gray-800">{profile.raasi.charAt(0).toUpperCase() + profile.raasi.slice(1).replace(/_/g, ' ')}</span>
                    ) : (
                      <button onClick={() => setEditSection('religion')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Nakshatra</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.nakshatra ? (
                      <span className="text-gray-800">{profile.nakshatra.charAt(0).toUpperCase() + profile.nakshatra.slice(1).replace(/_/g, ' ')}</span>
                    ) : (
                      <button onClick={() => setEditSection('religion')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Doshas</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className={profile.doshas ? "text-gray-800" : "text-[#00BCD4]"}>
                      {profile.doshas ? profile.doshas.charAt(0).toUpperCase() + profile.doshas.slice(1).replace(/_/g, ' ') : 'Not Specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Family - matches FamilySection fields */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Family</h2>
                  <button onClick={() => setEditSection('family')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-36">Lives with Family</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.livesWithFamily === 'yes' ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Family Location</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.familyLocation ? (
                      <span className="text-gray-800">{profile.familyLocation}</span>
                    ) : (
                      <button onClick={() => setEditSection('family')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Family Values</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.familyValues ? (
                      <span className="text-gray-800">{profile.familyValues.charAt(0).toUpperCase() + profile.familyValues.slice(1)}</span>
                    ) : (
                      <button onClick={() => setEditSection('family')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Father&apos;s Name</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.fatherName ? (
                      <span className="text-gray-800">{profile.fatherName}</span>
                    ) : (
                      <button onClick={() => setEditSection('family')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Father&apos;s Occupation</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.fatherOccupation ? (
                      <span className="text-gray-800">{profile.fatherOccupation}</span>
                    ) : (
                      <button onClick={() => setEditSection('family')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Mother&apos;s Name</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.motherName ? (
                      <span className="text-gray-800">{profile.motherName}</span>
                    ) : (
                      <button onClick={() => setEditSection('family')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Mother&apos;s Occupation</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.motherOccupation ? (
                      <span className="text-gray-800">{profile.motherOccupation}</span>
                    ) : (
                      <button onClick={() => setEditSection('family')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">No. of Brothers</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.numberOfBrothers || '0'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">No. of Sisters</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.numberOfSisters || '0'}</span>
                  </div>
                </div>
                {(profile as unknown as Record<string, string>).familyDetails && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Family Details:</span>
                    <span className="text-gray-800 ml-2">{(profile as unknown as Record<string, string>).familyDetails}</span>
                  </div>
                )}
              </div>

              {/* 6. Lifestyle - matches LifestyleSection fields */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Lifestyle</h2>
                  <button onClick={() => setEditSection('lifestyle')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-36">Diet</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{formatValue(profile.dietaryPreference)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Smoking</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.smoking ? (
                      <span className="text-gray-800">{formatValue(profile.smoking)}</span>
                    ) : (
                      <button onClick={() => setEditSection('lifestyle')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Drinking</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.drinking ? (
                      <span className="text-gray-800">{profile.drinking === 'social' ? 'Social Drinker' : formatValue(profile.drinking)}</span>
                    ) : (
                      <button onClick={() => setEditSection('lifestyle')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Pets</span>
                    <span className="text-gray-400 mr-2">:</span>
                    {profile.pets ? (
                      <span className="text-gray-800">{formatValue(profile.pets.replace(/_/g, ' '))}</span>
                    ) : (
                      <button onClick={() => setEditSection('lifestyle')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                    )}
                  </div>
                </div>
                {profile.hobbies && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Hobbies:</span>
                    <span className="text-gray-800 ml-2">{profile.hobbies}</span>
                  </div>
                )}
                {(profile as unknown as Record<string, string>).fitness && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Fitness & Sports:</span>
                    <span className="text-gray-800 ml-2">{(profile as unknown as Record<string, string>).fitness}</span>
                  </div>
                )}
                {profile.interests && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Interests:</span>
                    <span className="text-gray-800 ml-2">{profile.interests}</span>
                  </div>
                )}
              </div>

              {/* 7. About Me - matches AboutMeSection fields */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">About Me</h2>
                  <button onClick={() => setEditSection('aboutme')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                {/* Health & Wellness */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm mb-4 pb-4 border-b border-gray-100">
                  <div className="flex">
                    <span className="text-gray-500 w-28">Blood Group</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.bloodGroup || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-28">Disability</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.anyDisability === 'none' || !profile.anyDisability ? 'None' : formatValue(profile.anyDisability)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-28">Allergies</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">{profile.allergiesOrMedical || 'None'}</span>
                  </div>
                </div>
                {/* About Me text */}
                {profile.aboutMe ? (
                  <div className="mb-4">
                    <p className="text-gray-700">{profile.aboutMe}</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <button onClick={() => setEditSection('aboutme')} className="text-[#00BCD4] hover:underline text-sm">Add your bio</button>
                  </div>
                )}
                {/* Social Links */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm border-t border-gray-100 pt-4">
                  <div className="flex">
                    <span className="text-gray-500 w-36">LinkedIn</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">
                      {profile.linkedinProfile && profile.linkedinProfile.trim() !== '' ? (
                        profile.linkedinProfile === 'no_linkedin' ? 'No LinkedIn' : (
                          <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-[#00BCD4] hover:underline">{profile.linkedinProfile.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '').replace(/\/$/, '') || 'View Profile'}</a>
                        )
                      ) : (
                        <button onClick={() => setEditSection('aboutme')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                      )}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Instagram</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">
                      {profile.instagram || profile.facebookInstagram || (
                        <button onClick={() => setEditSection('aboutme')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                      )}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-36">Facebook</span>
                    <span className="text-gray-400 mr-2">:</span>
                    <span className="text-gray-800">
                      {profile.facebook || (
                        <button onClick={() => setEditSection('aboutme')} className="text-[#00BCD4] hover:underline">Enter Now</button>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Partner Preferences Tab - Split into 2 sections */
            <div className="divide-y divide-gray-100">
              {/* 8. Must-Have Preferences (Deal-breakers) - matches PreferencesPage1Section fields */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Must-Have Preferences (Deal-breakers)</h2>
                  <button onClick={() => setEditSection('preferences_1')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                {/* Age & Height */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Age & Height</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Age Range</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">
                        {profile.prefAgeMin && profile.prefAgeMax
                          ? `${profile.prefAgeMin} - ${profile.prefAgeMax} years`
                          : profile.prefAgeDiff || "Doesn't matter"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Height Range</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">
                        {profile.prefHeightMin && profile.prefHeightMax
                          ? `${profile.prefHeightMin} - ${profile.prefHeightMax}`
                          : profile.prefHeight || "Doesn't matter"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Marital Status */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Marital Status</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Marital Status</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefMaritalStatus ? formatValue(profile.prefMaritalStatus) : "Doesn't matter"}</span>
                    </div>
                    {profile.prefHasChildren && (
                      <div className="flex">
                        <span className="text-gray-500 w-36">Partner&apos;s Children</span>
                        <span className="text-gray-400 mr-2">:</span>
                        <span className="text-gray-800">{formatValue(profile.prefHasChildren)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Religion & Community */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Religion & Community</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Religion</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefReligion ? formatValue(profile.prefReligion) : "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Community</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefCommunity ? formatValue(profile.prefCommunity) : "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Gotra Preference</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefGotra ? formatValue(profile.prefGotra) : "Doesn't matter"}</span>
                    </div>
                  </div>
                </div>
                {/* Lifestyle */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Lifestyle</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Diet</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefDiet ? formatValue(profile.prefDiet) : "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Smoking</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefSmoking ? formatValue(profile.prefSmoking) : "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Drinking</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefDrinking ? formatValue(profile.prefDrinking) : "Doesn't matter"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. Nice-to-Have Preferences (Optional) - matches PreferencesPage2Section fields */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[#E91E63] font-semibold text-lg">Nice-to-Have Preferences (Optional)</h2>
                  <button onClick={() => setEditSection('preferences_2')} className="text-[#00BCD4] text-sm hover:underline flex items-center gap-1">
                    Edit <span className="text-xs">▶</span>
                  </button>
                </div>
                {/* Location */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Preferred Locations</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{(profile as unknown as Record<string, string>).prefLocationList || profile.prefLocation || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Citizenship</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{(profile as unknown as Record<string, string>).prefCitizenship || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Grew Up In</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{formatValue((profile as unknown as Record<string, string>).prefGrewUpIn) || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Open to Relocation</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{formatValue((profile as unknown as Record<string, string>).prefRelocation) || "Doesn't matter"}</span>
                    </div>
                  </div>
                </div>
                {/* Education & Career */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Education & Career</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Min Education</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{formatValue(profile.prefQualification) || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Min Income</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{profile.prefIncome || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Occupations</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{(profile as unknown as Record<string, string>).prefOccupationList || "Doesn't matter"}</span>
                    </div>
                  </div>
                </div>
                {/* Family */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Family Preferences</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Family Values</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{formatValue((profile as unknown as Record<string, string>).prefFamilyValues) || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Family Location</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{(profile as unknown as Record<string, string>).prefFamilyLocationCountry || "Doesn't matter"}</span>
                    </div>
                  </div>
                </div>
                {/* Other */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Other Preferences</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-36">Mother Tongue</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{(profile as unknown as Record<string, string>).prefMotherTongueList || formatValue((profile as unknown as Record<string, string>).prefMotherTongue) || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Sub-Community</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{(profile as unknown as Record<string, string>).prefSubCommunityList || "Doesn't matter"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-36">Pets</span>
                      <span className="text-gray-400 mr-2">:</span>
                      <span className="text-gray-800">{formatValue((profile as unknown as Record<string, string>).prefPets) || "Doesn't matter"}</span>
                    </div>
                  </div>
                </div>
                {/* Notes */}
                {profile.idealPartnerDesc && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h4>
                    <p className="text-gray-700 text-sm">{profile.idealPartnerDesc}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {profile && (
        <ProfileEditModal
          isOpen={editSection !== null}
          onClose={() => setEditSection(null)}
          section={editSection || ''}
          profile={profile as unknown as Record<string, unknown>}
          onSave={refreshProfile}
          apiEndpoint={isAdminMode ? `/api/admin/profiles/${adminProfileId}` : buildApiUrl('/api/profile')}
          httpMethod={isAdminMode ? 'PATCH' : 'PUT'}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxOpen && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation - Previous */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevPhoto()
              }}
              className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* Main Image */}
          <div
            className="max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allPhotos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            {/* Photo counter */}
            <div className="text-center text-white/80 mt-4">
              {lightboxIndex + 1} / {allPhotos.length}
            </div>
          </div>

          {/* Navigation - Next */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextPhoto()
              }}
              className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ViewProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <ViewProfilePageContent />
    </Suspense>
  )
}
