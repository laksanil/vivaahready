'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  X,
  Check,
  Clock,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Lock,
  ZoomIn,
  ArrowLeft,
  Flag,
} from 'lucide-react'
import ReportModal from '@/components/ReportModal'
import { calculateAge, getInitials, extractPhotoUrls } from '@/lib/utils'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface ProfileData {
  id: string
  userId: string
  gender: string
  dateOfBirth: string | null
  placeOfBirth: string | null
  height: string | null
  weight: string | null
  currentLocation: string | null
  occupation: string | null
  qualification: string | null
  university: string | null
  caste: string | null
  community: string | null
  subCommunity: string | null
  gotra: string | null
  dietaryPreference: string | null
  maritalStatus: string | null
  hasChildren: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  annualIncome: string | null
  familyLocation: string | null
  fatherName: string | null
  motherName: string | null
  fatherOccupation: string | null
  motherOccupation: string | null
  numberOfBrothers: string | null
  numberOfSisters: string | null
  siblingDetails: string | null
  familyType: string | null
  familyValues: string | null
  languagesKnown: string | null
  motherTongue: string | null
  linkedinProfile: string | null
  facebookInstagram: string | null
  facebook: string | null
  instagram: string | null
  citizenship: string | null
  grewUpIn: string | null
  country: string | null
  idealPartnerDesc: string | null
  religion: string | null
  placeOfBirthCountry: string | null
  placeOfBirthState: string | null
  placeOfBirthCity: string | null
  // Hindu-specific
  manglik: string | null
  raasi: string | null
  nakshatra: string | null
  doshas: string | null
  // Muslim-specific
  maslak: string | null
  namazPractice: string | null
  // Sikh-specific
  amritdhari: string | null
  turban: string | null
  // Christian-specific
  churchAttendance: string | null
  baptized: string | null
  healthInfo: string | null
  anyDisability: string | null
  disabilityDetails: string | null
  bloodGroup: string | null
  employerName: string | null
  workingAs: string | null
  livesWithFamily: string | null
  familyLocationCountry: string | null
  familyDetails: string | null
  openToRelocation: string | null
  createdBy: string | null
  smoking: string | null
  drinking: string | null
  hobbies: string | null
  fitness: string | null
  interests: string | null
  pets: string | null
  allergiesOrMedical: string | null
  residencyStatus: string | null
  approvalStatus: string
  prefAgeDiff: string | null
  prefHeight: string | null
  prefLocation: string | null
  prefCaste: string | null
  prefDiet: string | null
  prefQualification: string | null
  prefGotra: string | null
  prefIncome: string | null
  prefLanguage: string | null
  prefCountry: string | null
  user: {
    id: string
    name: string
    email?: string
    phone?: string
    emailVerified?: string | null
    phoneVerified?: string | null
  }
  interestStatus?: {
    sentByMe: boolean
    receivedFromThem: boolean
    mutual: boolean
  }
}

export default function ProfileViewPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin: isAdminAccess, adminChecked } = useAdminViewAccess()
  // In admin view mode, use viewAsUser as the viewer's ID; otherwise use session user ID
  const viewerUserId = viewAsUser || session?.user?.id
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingInterest, setSendingInterest] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userStatus, setUserStatus] = useState<{
    isApproved: boolean
    canExpressInterest: boolean
  } | null>(null)
  const [myProfile, setMyProfile] = useState<any>(null)
  const [theirMatchScore, setTheirMatchScore] = useState<{
    totalScore: number
    maxScore: number
    percentage: number
    criteria: {
      name: string
      matched: boolean
      seekerPref: string | null
      candidateValue: string | null
    }[]
  } | null>(null)
  const [yourMatchScore, setYourMatchScore] = useState<{
    totalScore: number
    maxScore: number
    percentage: number
    criteria: {
      name: string
      matched: boolean
      seekerPref: string | null
      candidateValue: string | null
    }[]
  } | null>(null)
  const [matchProfiles, setMatchProfiles] = useState<{
    myProfile: { profileImageUrl: string | null; gender: string; name: string }
    theirProfile: { profileImageUrl: string | null; gender: string; name: string }
  } | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)

  const canAccess = !!session || (isAdminView && isAdminAccess)

  useEffect(() => {
    fetchProfile()
    checkAdminStatus()
    if (canAccess) {
      fetchUserStatus()
    }
  }, [params.id, buildApiUrl, canAccess])

  const fetchProfile = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/profile/${params.id}`))
      if (!response.ok) {
        if (response.status === 404) {
          setError('Profile not found')
        } else {
          setError('Failed to load profile')
        }
        return
      }
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        setIsAdmin(true)
      }
    } catch (err) {
      // Not admin
    }
  }

  const fetchUserStatus = async () => {
    if (!canAccess) return
    try {
      // Pass viewAsUser parameter for admin view mode
      const response = await fetch(buildApiUrl('/api/matches/auto'))
      if (response.ok) {
        const data = await response.json()
        if (data.userStatus) {
          setUserStatus(data.userStatus)
        }
        if (data.myProfile) {
          setMyProfile(data.myProfile)
        }
      }
    } catch (err) {
      // Ignore
    }
  }

  // Fetch match score when viewing another profile
  const fetchMatchScore = async () => {
    if (!canAccess || !profile) return
    try {
      // Pass viewAsUser parameter for admin view mode
      const response = await fetch(buildApiUrl(`/api/profile/${params.id}/match-score`))
      if (response.ok) {
        const data = await response.json()
        setTheirMatchScore(data.theirMatchScore)
        setYourMatchScore(data.yourMatchScore)
        if (data.myProfile && data.theirProfile) {
          setMatchProfiles({
            myProfile: data.myProfile,
            theirProfile: data.theirProfile
          })
        }
      }
    } catch (err) {
      // Ignore
    }
  }

  useEffect(() => {
    if (profile && canAccess) {
      fetchMatchScore()
    }
  }, [profile, canAccess, viewAsUser])

  const handleSendInterest = async () => {
    if (!profile || !canAccess) return
    setSendingInterest(true)
    try {
      const response = await fetch(buildApiUrl('/api/matches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: profile.userId }),
      })

      if (response.ok) {
        // Refresh profile to update interest status
        fetchProfile()
      }
    } catch (error) {
      console.error('Error sending interest:', error)
    } finally {
      setSendingInterest(false)
    }
  }

  if (status === 'loading' || loading || (isAdminView && !adminChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Profile not found'}</h2>
          <Link href={buildUrl('/feed')} className="text-primary-600 hover:underline">
            Back to Matches
          </Link>
        </div>
      </div>
    )
  }

  const canExpressInterest = userStatus?.canExpressInterest ?? false

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        {/* Admin Edit Link */}
        {isAdmin && (
          <div className="mb-4">
            <Link
              href={`/admin/profiles/${profile.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            >
              <span className="font-medium">Admin: Edit This Profile</span>
            </Link>
          </div>
        )}

        {/* Profile Card - Same as MatchingProfileCard */}
        <ProfileCard
          profile={profile}
          onSendInterest={handleSendInterest}
          isSending={sendingInterest}
          canExpressInterest={canExpressInterest}
          theirMatchScore={theirMatchScore}
          yourMatchScore={yourMatchScore}
          matchProfiles={matchProfiles}
          viewerUserId={viewerUserId}
          isLoggedIn={canAccess}
          onReport={() => setShowReportModal(true)}
          buildUrl={buildUrl}
        />

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={profile.userId}
          reportedUserName={profile.user.name}
        />
      </div>
    </div>
  )
}

interface MatchScoreData {
  totalScore: number
  maxScore: number
  percentage: number
  criteria: {
    name: string
    matched: boolean
    seekerPref: string | null
    candidateValue: string | null
  }[]
}

interface MatchProfilesData {
  myProfile: { profileImageUrl: string | null; gender: string; name: string }
  theirProfile: { profileImageUrl: string | null; gender: string; name: string }
}

interface ProfileCardProps {
  profile: ProfileData
  onSendInterest: () => void
  isSending: boolean
  canExpressInterest: boolean
  theirMatchScore?: MatchScoreData | null
  yourMatchScore?: MatchScoreData | null
  matchProfiles?: MatchProfilesData | null
  viewerUserId?: string | null
  isLoggedIn?: boolean
  onReport?: () => void
  buildUrl: (path: string) => string
}

function ProfileCard({
  profile,
  onSendInterest,
  isSending,
  canExpressInterest,
  theirMatchScore,
  onReport,
  yourMatchScore,
  matchProfiles,
  buildUrl,
  viewerUserId,
  isLoggedIn,
}: ProfileCardProps) {
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const interestSent = profile.interestStatus?.sentByMe
  const interestReceived = profile.interestStatus?.receivedFromThem
  const isMutual = profile.interestStatus?.mutual

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const thumbnails = extractPhotoUrls(profile.photoUrls)

  // Photo carousel state
  const [photoIndex, setPhotoIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const carouselPhotos = extractPhotoUrls(profile.photoUrls)
  const photoUrl = profile.profileImageUrl || null

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'preferences'>('details')

  // Gender-specific text
  const pronoun = profile.gender === 'male' ? 'He' : 'She'
  const possessivePronoun = profile.gender === 'male' ? 'His' : 'Her'
  const possessive = profile.gender === 'male' ? 'His' : 'Her'

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % thumbnails.length)
  }

  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + thumbnails.length) % thumbnails.length)
  }

  return (
    <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Column - Photo & Compact Info */}
        <div className="lg:w-[320px] flex-shrink-0 flex flex-col">
          {/* Photo Carousel - Taller */}
          <div className="relative bg-gray-100 h-[400px]">
            {(carouselPhotos.length > 0 || photoUrl) && !imageError ? (
              <>
                <img
                  src={carouselPhotos.length > 0 ? carouselPhotos[photoIndex] : (photoUrl || '')}
                  alt={profile.user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (photoUrl && e.currentTarget.src !== photoUrl) {
                      e.currentTarget.src = photoUrl
                    } else {
                      setImageError(true)
                    }
                  }}
                />
                {/* Zoom Button */}
                <button
                  onClick={() => openLightbox(photoIndex)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white transition-colors"
                  title="View full size"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                {/* Photo Counter & Navigation */}
                {carouselPhotos.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/60 text-white px-2 py-1 text-xs">
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev - 1 + carouselPhotos.length) % carouselPhotos.length)}
                      className="hover:text-gray-300"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <span>{photoIndex + 1}/{carouselPhotos.length}</span>
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev + 1) % carouselPhotos.length)}
                      className="hover:text-gray-300"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-50">
                <span className="text-5xl font-semibold text-primary-600">
                  {getInitials(profile.user.name)}
                </span>
              </div>
            )}
          </div>

          {/* Compact Verification Badges */}
          <div className="flex items-center justify-center gap-1 py-2 px-2 bg-gray-50 border-t border-gray-200">
            <div className={`flex items-center gap-1 px-2 py-0.5 text-xs ${profile.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {profile.approvalStatus === 'approved' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              <span>Verified</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 text-xs ${profile.user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {profile.user.emailVerified ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              <span>Email</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 text-xs ${profile.user.phoneVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {profile.user.phoneVerified ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              <span>Phone</span>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="flex-1 bg-white border-l border-gray-200 flex flex-col">
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
            <div className="flex items-center justify-between gap-4">
              {/* Name and Key Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{profile.user.name}</h2>
                  <span className="text-sm text-gray-600 flex-shrink-0">{age ? `${age} yrs` : ''}{profile.height ? ` • ${profile.height}` : ''}</span>
                </div>
                {/* Quick Info Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                  <span>{profile.currentLocation}</span>
                  <span>{profile.occupation?.replace(/_/g, ' ')}</span>
                  <span>{profile.community ? `${profile.religion || 'Hindu'}, ${profile.community}` : (profile.religion || 'Hindu')}</span>
                </div>
              </div>

              {/* Action Buttons - Horizontal */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isMutual ? (
                  <>
                    <div className="w-10 h-10 bg-green-600 flex items-center justify-center" title="Connected">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 border-2 border-primary-300 flex items-center justify-center hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors" title="Message">
                      <MessageCircle className="h-5 w-5 text-primary-600" />
                    </div>
                  </>
                ) : interestSent ? (
                  <div className="w-10 h-10 bg-yellow-500 flex items-center justify-center" title="Interest Sent">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                ) : interestReceived ? (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending || !canExpressInterest}
                    className="w-10 h-10 bg-primary-600 hover:bg-primary-700 flex items-center justify-center transition-colors"
                    title="Likes You - Accept"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Heart className="h-5 w-5 text-white" />
                    )}
                  </button>
                ) : !canExpressInterest ? (
                  <Link href={buildUrl('/profile')} className="w-10 h-10 bg-gray-400 hover:bg-gray-500 flex items-center justify-center transition-colors" title="Get Verified to Like">
                    <Lock className="h-5 w-5 text-white" />
                  </Link>
                ) : (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending}
                    className="w-10 h-10 bg-primary-600 hover:bg-primary-700 flex items-center justify-center transition-colors"
                    title="Like"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Heart className="h-5 w-5 text-white" />
                    )}
                  </button>
                )}
                <button
                  onClick={onReport}
                  className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
                  title="Report this profile"
                >
                  <Flag className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'details'
                  ? 'text-white bg-primary-600'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'preferences'
                  ? 'text-white bg-primary-600'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
              }`}
            >
              Partner Preferences
            </button>
          </div>

          {/* Tab Content - Full height with scroll */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'details' ? (
              /* Detailed Profile Tab */
              <div className="space-y-4">
                {/* About Section */}
                {profile.aboutMe && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">About</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{profile.aboutMe}</p>
                    </div>
                  </div>
                )}

                {/* Personal Details Section */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {profile.height && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Height:</span>
                          <span className="text-gray-800">{profile.height}</span>
                        </div>
                      )}
                      {profile.weight && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Weight:</span>
                          <span className="text-gray-800">{profile.weight}</span>
                        </div>
                      )}
                      {profile.maritalStatus && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Marital:</span>
                          <span className="text-gray-800">{profile.maritalStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      )}
                      {profile.hasChildren && profile.maritalStatus !== 'never_married' && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Children:</span>
                          <span className="text-gray-800">{profile.hasChildren.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      )}
                      {profile.bloodGroup && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Blood:</span>
                          <span className="text-gray-800">{profile.bloodGroup}</span>
                        </div>
                      )}
                      {profile.dietaryPreference && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Diet:</span>
                          <span className="text-gray-800">{profile.dietaryPreference}</span>
                        </div>
                      )}
                      {profile.healthInfo && (
                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-gray-500">Health:</span>
                          <span className="text-gray-800">{profile.healthInfo}</span>
                        </div>
                      )}
                      {profile.anyDisability && profile.anyDisability !== 'none' && (
                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-gray-500">Disability:</span>
                          <span className="text-gray-800">{profile.disabilityDetails || profile.anyDisability}</span>
                        </div>
                      )}
                      {profile.allergiesOrMedical && (
                        <div className="flex items-start gap-1 col-span-2">
                          <span className="text-gray-500 flex-shrink-0">Allergies:</span>
                          <span className="text-gray-800">{profile.allergiesOrMedical}</span>
                        </div>
                      )}
                      {profile.createdBy && (
                        <div className="flex items-center gap-1 col-span-2">
                          <span className="text-gray-500">Created By:</span>
                          <span className="text-gray-800">{profile.createdBy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Religion & Background Section */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-primary-200 pl-4 -ml-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Religion & Background</h3>
                    <div className="space-y-2 text-sm">
                      {profile.religion && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Religion</span>
                          <span className="text-gray-800">{profile.religion}</span>
                        </div>
                      )}
                      {profile.community && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Community</span>
                          <span className="text-gray-800">{profile.community}</span>
                        </div>
                      )}
                      {profile.subCommunity && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Sub-Community</span>
                          <span className="text-gray-800">{profile.subCommunity}</span>
                        </div>
                      )}

                      {/* Hindu/Jain specific: Gotra */}
                      {(profile.religion === 'Hindu' || profile.religion === 'Jain') && profile.gotra && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Gotra</span>
                          <span className="text-gray-800">{profile.gotra}</span>
                        </div>
                      )}

                      {/* Muslim specific fields */}
                      {profile.religion === 'Muslim' && (
                        <>
                          {profile.maslak && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Maslak</span>
                              <span className="text-gray-800">{profile.maslak.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                          )}
                          {profile.namazPractice && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Namaz</span>
                              <span className="text-gray-800">{profile.namazPractice.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Sikh specific fields */}
                      {profile.religion === 'Sikh' && (
                        <>
                          {profile.amritdhari && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Amritdhari</span>
                              <span className="text-gray-800">{profile.amritdhari.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                          )}
                          {profile.turban && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Turban</span>
                              <span className="text-gray-800">{profile.turban === 'yes' ? 'Yes, wears turban' : 'No'}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Christian specific fields */}
                      {profile.religion === 'Christian' && (
                        <>
                          {profile.churchAttendance && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Church</span>
                              <span className="text-gray-800">{profile.churchAttendance.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                          )}
                          {profile.baptized && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Baptized</span>
                              <span className="text-gray-800">{profile.baptized === 'yes' ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Birth place - shown for all */}
                      {profile.placeOfBirthCountry && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Birth Country</span>
                          <span className="text-gray-800">{profile.placeOfBirthCountry}</span>
                        </div>
                      )}
                      {profile.placeOfBirthState && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Birth State</span>
                          <span className="text-gray-800">{profile.placeOfBirthState}</span>
                        </div>
                      )}
                      {profile.placeOfBirthCity && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Birth City</span>
                          <span className="text-gray-800">{profile.placeOfBirthCity}</span>
                        </div>
                      )}

                      {/* Hindu-specific astrology fields */}
                      {profile.religion === 'Hindu' && (
                        <>
                          {profile.manglik && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Manglik</span>
                              <span className="text-gray-800">
                                {profile.manglik === 'yes' ? 'Yes' : profile.manglik === 'no' ? 'No' : "Don't Know"}
                              </span>
                            </div>
                          )}
                          {profile.raasi && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Raasi</span>
                              <span className="text-gray-800">{profile.raasi.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                          )}
                          {profile.nakshatra && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Nakshatra</span>
                              <span className="text-gray-800">{profile.nakshatra.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                          )}
                          {profile.doshas && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-32">Doshas</span>
                              <span className="text-gray-800">{profile.doshas.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education & Career Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-primary-200 pl-4 -ml-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Education & Career</h3>
                    <div className="space-y-2 text-sm">
                      {profile.qualification && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Qualification</span>
                          <span className="text-gray-800">{profile.qualification}</span>
                        </div>
                      )}
                      {profile.university && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">University</span>
                          <span className="text-gray-800">{profile.university}</span>
                        </div>
                      )}
                      {profile.occupation && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Occupation</span>
                          <span className="text-gray-800">{profile.occupation.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {profile.workingAs && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Working As</span>
                          <span className="text-gray-800">{profile.workingAs}</span>
                        </div>
                      )}
                      {profile.employerName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Employer</span>
                          <span className="text-gray-800">{profile.employerName}</span>
                        </div>
                      )}
                      {profile.annualIncome && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Annual Income</span>
                          <span className="text-gray-800">{profile.annualIncome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Family Details Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-primary-200 pl-4 -ml-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Family Details</h3>
                    <div className="space-y-2 text-sm">
                      {profile.fatherName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Father's Name</span>
                          <span className="text-gray-800">{profile.fatherName}</span>
                        </div>
                      )}
                      {profile.fatherOccupation && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Father's Occupation</span>
                          <span className="text-gray-800">{profile.fatherOccupation}</span>
                        </div>
                      )}
                      {profile.motherName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Mother's Name</span>
                          <span className="text-gray-800">{profile.motherName}</span>
                        </div>
                      )}
                      {profile.motherOccupation && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Mother's Occupation</span>
                          <span className="text-gray-800">{profile.motherOccupation}</span>
                        </div>
                      )}
                      {(profile.numberOfBrothers || profile.numberOfSisters) && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Siblings</span>
                          <span className="text-gray-800">
                            {profile.numberOfBrothers && `${profile.numberOfBrothers} Brother(s)`}
                            {profile.numberOfBrothers && profile.numberOfSisters && ', '}
                            {profile.numberOfSisters && `${profile.numberOfSisters} Sister(s)`}
                          </span>
                        </div>
                      )}
                      {profile.siblingDetails && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Sibling Details</span>
                          <span className="text-gray-800">{profile.siblingDetails}</span>
                        </div>
                      )}
                      {profile.familyType && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Family Type</span>
                          <span className="text-gray-800">{profile.familyType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      )}
                      {profile.familyValues && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Family Values</span>
                          <span className="text-gray-800">{profile.familyValues.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      )}
                      {profile.familyLocation && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Family Location</span>
                          <span className="text-gray-800">{profile.familyLocation}</span>
                        </div>
                      )}
                      {profile.familyLocationCountry && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Family Country</span>
                          <span className="text-gray-800">{profile.familyLocationCountry}</span>
                        </div>
                      )}
                      {profile.livesWithFamily && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Lives With Family</span>
                          <span className="text-gray-800">{profile.livesWithFamily === 'yes' ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                      {profile.familyDetails && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-32 flex-shrink-0">Family Details</span>
                          <span className="text-gray-800">{profile.familyDetails}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Background Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-primary-200 pl-4 -ml-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Location & Background</h3>
                    <div className="space-y-2 text-sm">
                      {profile.currentLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-500" />
                          <span className="text-gray-800">{profile.currentLocation}{profile.country ? `, ${profile.country}` : ''}</span>
                        </div>
                      )}
                      {profile.grewUpIn && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Grew Up In</span>
                          <span className="text-gray-800">{profile.grewUpIn}</span>
                        </div>
                      )}
                      {profile.citizenship && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Citizenship</span>
                          <span className="text-gray-800">{profile.citizenship}</span>
                        </div>
                      )}
                      {profile.residencyStatus && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Residency Status</span>
                          <span className="text-gray-800">{profile.residencyStatus}</span>
                        </div>
                      )}
                      {profile.openToRelocation && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Open to Relocate</span>
                          <span className="text-gray-800">{profile.openToRelocation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      )}
                      {profile.motherTongue && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Mother Tongue</span>
                          <span className="text-gray-800">{profile.motherTongue}</span>
                        </div>
                      )}
                      {profile.languagesKnown && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Languages Known</span>
                          <span className="text-gray-800">{profile.languagesKnown}</span>
                        </div>
                      )}
                      {profile.linkedinProfile && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">LinkedIn</span>
                          <a href={profile.linkedinProfile.startsWith('http') ? profile.linkedinProfile : `https://${profile.linkedinProfile}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">View Profile</a>
                        </div>
                      )}
                      {profile.instagram && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Instagram</span>
                          <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">@{profile.instagram.replace('@', '').replace('https://instagram.com/', '')}</a>
                        </div>
                      )}
                      {profile.facebook && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Facebook</span>
                          <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">View Profile</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lifestyle Section */}
                {(profile.smoking || profile.drinking || profile.hobbies || profile.fitness || profile.interests || profile.pets) && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 border-l-2 border-primary-200 pl-4 -ml-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Lifestyle</h3>
                      <div className="space-y-4 text-sm">
                        {/* Smoking & Drinking Row */}
                        {(profile.smoking || profile.drinking) && (
                          <div className="flex flex-wrap gap-4">
                            {profile.smoking && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Smoking:</span>
                                <span className="text-gray-800">{profile.smoking.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </div>
                            )}
                            {profile.drinking && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Drinking:</span>
                                <span className="text-gray-800">{profile.drinking.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Hobbies as pills */}
                        {profile.hobbies && (
                          <div>
                            <span className="text-gray-500 block mb-2">Hobbies</span>
                            <div className="flex flex-wrap gap-2">
                              {profile.hobbies.split(', ').map((hobby, idx) => (
                                <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 text-sm border border-primary-200">
                                  {hobby}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Fitness as pills */}
                        {profile.fitness && (
                          <div>
                            <span className="text-gray-500 block mb-2">Fitness & Sports</span>
                            <div className="flex flex-wrap gap-2">
                              {profile.fitness.split(', ').map((fit, idx) => (
                                <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-sm border border-green-200">
                                  {fit}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Interests as pills */}
                        {profile.interests && (
                          <div>
                            <span className="text-gray-500 block mb-2">Interests</span>
                            <div className="flex flex-wrap gap-2">
                              {profile.interests.split(', ').map((interest, idx) => (
                                <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm border border-purple-200">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Pets */}
                        {profile.pets && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Pets:</span>
                            <span className="text-gray-800">{profile.pets.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Info (only for mutual matches) */}
                {isMutual && profile.user.email && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-600 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 border-l-2 border-green-300 pl-4 -ml-1 bg-green-50 py-3 -my-1">
                      <h3 className="text-lg font-bold text-green-700 mb-2">Contact Information</h3>
                      <p className="text-green-600 text-sm mb-3 font-medium">You both expressed interest - connect now!</p>
                      <div className="space-y-2 text-sm">
                        {profile.user.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 w-32">Email</span>
                            <span className="text-gray-900 font-medium">{profile.user.email}</span>
                          </div>
                        )}
                        {profile.user.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 w-32">Phone</span>
                            <span className="text-gray-900 font-medium">{profile.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Partner Preferences Tab */
              <div className="space-y-8">
                {/* Section 1: What THEY are looking for (how well YOU match THEIR preferences) */}
                <div className="bg-white border border-gray-200 overflow-hidden">
                  <div className="bg-primary-600 px-4 py-3">
                    <h3 className="text-lg font-bold text-white">What {pronoun} Is Looking For</h3>
                  </div>

                  <div className="p-4">
                    {/* Match Score Header with Photos */}
                    {theirMatchScore && isLoggedIn && profile.userId !== viewerUserId && matchProfiles && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          {/* Their Photo */}
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 overflow-hidden border-2 border-primary-600">
                              {matchProfiles.theirProfile.profileImageUrl ? (
                                <img
                                  src={matchProfiles.theirProfile.profileImageUrl}
                                  alt={matchProfiles.theirProfile.name || 'Profile'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <User className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 mt-1 font-medium">{matchProfiles.theirProfile.name?.split(' ')[0]}</span>
                          </div>

                          {/* Match Score Badge */}
                          <div className="flex-1 flex justify-center">
                            <div className="px-4 py-2 bg-green-50 border border-green-300">
                              <span className="text-sm text-gray-700">
                                You match <span className="font-bold text-green-600">{theirMatchScore.totalScore}/{theirMatchScore.maxScore}</span> of {possessivePronoun} Preferences
                              </span>
                            </div>
                          </div>

                          {/* Your Photo */}
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 overflow-hidden border-2 border-blue-500">
                              {matchProfiles.myProfile.profileImageUrl ? (
                                <img
                                  src={matchProfiles.myProfile.profileImageUrl}
                                  alt="You"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <User className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 mt-1 font-medium">You</span>
                          </div>
                        </div>

                        {/* Column Headers */}
                        <div className="flex justify-between text-sm text-gray-500 mb-2 px-1 border-b pb-2">
                          <span className="font-medium">{possessivePronoun} Preferences</span>
                          <span className="font-medium">You match</span>
                        </div>
                      </div>
                    )}

                    {/* Preference Comparison Table */}
                    <div className="divide-y divide-gray-200">
                      {theirMatchScore && theirMatchScore.criteria.length > 0 ? (
                        theirMatchScore.criteria.map((criterion, index) => (
                          <div key={index} className="flex justify-between items-center py-3">
                            <div className="flex-1">
                              <div className="text-gray-900 text-sm font-semibold">{criterion.name}</div>
                              <div className="text-gray-600 text-sm mt-0.5">{criterion.seekerPref}</div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              {criterion.matched ? (
                                <div className="w-7 h-7 bg-green-500 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 text-lg">-</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          {profile.prefAgeDiff && (
                            <div className="flex justify-between items-center py-3">
                              <div>
                                <div className="text-primary-600 text-sm">Age</div>
                                <div className="text-gray-800 text-sm mt-0.5">{profile.prefAgeDiff}</div>
                              </div>
                            </div>
                          )}
                          {profile.prefHeight && (
                            <div className="flex justify-between items-center py-3">
                              <div>
                                <div className="text-primary-600 text-sm">Height</div>
                                <div className="text-gray-800 text-sm mt-0.5">{profile.prefHeight}</div>
                              </div>
                            </div>
                          )}
                          {profile.prefLocation && (
                            <div className="flex justify-between items-center py-3">
                              <div>
                                <div className="text-primary-600 text-sm">Location</div>
                                <div className="text-gray-800 text-sm mt-0.5">{profile.prefLocation}</div>
                              </div>
                            </div>
                          )}
                          {profile.prefCaste && (
                            <div className="flex justify-between items-center py-3">
                              <div>
                                <div className="text-primary-600 text-sm">Caste</div>
                                <div className="text-gray-800 text-sm mt-0.5">{profile.prefCaste}</div>
                              </div>
                            </div>
                          )}
                          {profile.prefGotra && (
                            <div className="flex justify-between items-center py-3">
                              <div>
                                <div className="text-primary-600 text-sm">Gotra</div>
                                <div className="text-gray-800 text-sm mt-0.5">{profile.prefGotra}</div>
                              </div>
                            </div>
                          )}
                          {profile.prefDiet && (
                            <div className="flex justify-between items-center py-3">
                              <div>
                                <div className="text-primary-600 text-sm">Diet</div>
                                <div className="text-gray-800 text-sm mt-0.5">{profile.prefDiet}</div>
                              </div>
                            </div>
                          )}
                          {profile.prefQualification && (
                            <div className="flex justify-between items-center py-3">
                              <div>
                                <div className="text-primary-600 text-sm">Education</div>
                                <div className="text-gray-800 text-sm mt-0.5">{profile.prefQualification}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: What YOU are looking for (how well THEY match YOUR preferences) */}
                {yourMatchScore && isLoggedIn && profile.userId !== viewerUserId && matchProfiles && (
                  <div className="bg-white border border-gray-200 overflow-hidden">
                    <div className="bg-blue-600 px-4 py-3">
                      <h3 className="text-lg font-bold text-white">What You Are Looking For</h3>
                    </div>

                    <div className="p-4">
                      {/* Match Score Header with Photos */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          {/* Your Photo */}
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 overflow-hidden border-2 border-blue-500">
                              {matchProfiles.myProfile.profileImageUrl ? (
                                <img
                                  src={matchProfiles.myProfile.profileImageUrl}
                                  alt="You"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <User className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 mt-1 font-medium">You</span>
                          </div>

                          {/* Match Score Badge */}
                          <div className="flex-1 flex justify-center">
                            <div className="px-4 py-2 bg-green-50 border border-green-300">
                              <span className="text-sm text-gray-700">
                                {pronoun} matches <span className="font-bold text-green-600">{yourMatchScore.totalScore}/{yourMatchScore.maxScore}</span> of Your Preferences
                              </span>
                            </div>
                          </div>

                          {/* Their Photo */}
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 overflow-hidden border-2 border-primary-600">
                              {matchProfiles.theirProfile.profileImageUrl ? (
                                <img
                                  src={matchProfiles.theirProfile.profileImageUrl}
                                  alt={matchProfiles.theirProfile.name || 'Profile'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <User className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 mt-1 font-medium">{matchProfiles.theirProfile.name?.split(' ')[0]}</span>
                          </div>
                        </div>

                        {/* Column Headers */}
                        <div className="flex justify-between text-sm text-gray-500 mb-2 px-1 border-b pb-2">
                          <span className="font-medium">Your Preferences</span>
                          <span className="font-medium">{pronoun} matches</span>
                        </div>
                      </div>

                      {/* Preference Comparison Table */}
                      <div className="divide-y divide-gray-200">
                        {yourMatchScore.criteria.map((criterion, index) => (
                          <div key={index} className="flex justify-between items-center py-3">
                            <div className="flex-1">
                              <div className="text-gray-900 text-sm font-semibold">{criterion.name}</div>
                              <div className="text-gray-600 text-sm mt-0.5">{criterion.seekerPref}</div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              {criterion.matched ? (
                                <div className="w-7 h-7 bg-green-500 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 text-lg">-</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ideal Partner Description */}
                {profile.idealPartnerDesc && (
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-gray-900 text-sm font-bold mb-2">{possessivePronoun} Ideal Partner Description</div>
                    <p className="text-gray-700 text-sm leading-relaxed">{profile.idealPartnerDesc}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Button */}
            {!isMutual && !interestSent && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                {canExpressInterest ? (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart className="h-5 w-5" />
                    )}
                    {interestReceived ? 'Like Back' : 'Like'}
                  </button>
                ) : (
                  <Link
                    href={buildUrl('/profile')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors"
                  >
                    <Lock className="h-5 w-5" />
                    Get Verified to Like
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxOpen && thumbnails.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </button>

          {/* Photo counter */}
          <div className="absolute top-4 left-4 text-white text-sm">
            {lightboxIndex + 1} / {thumbnails.length}
          </div>

          {/* Previous button */}
          {thumbnails.length > 1 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 p-2 bg-primary-600/80 hover:bg-primary-600"
              onClick={(e) => {
                e.stopPropagation()
                prevPhoto()
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Main image */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={thumbnails[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Next button */}
          {thumbnails.length > 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 p-2 bg-primary-600/80 hover:bg-primary-600"
              onClick={(e) => {
                e.stopPropagation()
                nextPhoto()
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
