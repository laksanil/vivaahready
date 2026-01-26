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
import VerificationPaymentModal from '@/components/VerificationPaymentModal'
import MessageModal from '@/components/MessageModal'
import { calculateAge, getInitials, extractPhotoUrls, maskPhone } from '@/lib/utils'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface ProfileData {
  id: string
  userId: string
  odNumber: string | null
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
  prefAgeMin: string | null
  prefAgeMax: string | null
  prefHeight: string | null
  prefHeightMin: string | null
  prefHeightMax: string | null
  prefLocation: string | null
  prefCaste: string | null
  prefDiet: string | null
  prefQualification: string | null
  prefGotra: string | null
  prefIncome: string | null
  prefLanguage: string | null
  prefCountry: string | null
  prefCommunity: string | null
  prefSubCommunity: string | null
  prefMaritalStatus: string | null
  prefSmoking: string | null
  prefDrinking: string | null
  prefReligion: string | null
  prefMotherTongue: string | null
  prefCitizenship: string | null
  prefGrewUpIn: string | null
  prefRelocation: string | null
  prefWorkArea: string | null
  prefOccupation: string | null
  prefFamilyValues: string | null
  prefFamilyLocation: string | null
  prefPets: string | null
  // Deal-breaker flags
  prefAgeIsDealbreaker: boolean
  prefHeightIsDealbreaker: boolean
  prefMaritalStatusIsDealbreaker: boolean
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
    canAcceptInterest?: boolean
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
      isDealbreaker?: boolean
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
      isDealbreaker?: boolean
    }[]
  } | null>(null)
  const [matchProfiles, setMatchProfiles] = useState<{
    myProfile: { profileImageUrl: string | null; gender: string; name: string; hobbies?: string | null; fitness?: string | null; interests?: string | null }
    theirProfile: { profileImageUrl: string | null; gender: string; name: string }
  } | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [blockedByDealbreaker, setBlockedByDealbreaker] = useState(false)
  const [matchScoreChecked, setMatchScoreChecked] = useState(false)

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

        // Check if blocked due to deal-breaker violations
        if (data.blocked) {
          setBlockedByDealbreaker(true)
          setMatchScoreChecked(true)
          return
        }

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
      // Ignore errors - allow viewing if check fails
    } finally {
      setMatchScoreChecked(true)
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

  // Show loading while: auth loading, profile loading, admin check pending, or match score check pending
  const isOwnProfile = profile?.userId === viewerUserId
  const needsMatchScoreCheck = canAccess && profile && !isOwnProfile && !matchScoreChecked

  if (status === 'loading' || loading || (isAdminView && !adminChecked) || needsMatchScoreCheck) {
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
          <Link href={buildUrl('/matches')} className="text-primary-600 hover:underline">
            Back to Matches
          </Link>
        </div>
      </div>
    )
  }

  // Block access if deal-breaker preferences don't match (either direction)
  if (blockedByDealbreaker && profile.userId !== viewerUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="h-8 w-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">Profile Not Available</h1>
            <p className="text-gray-600 mb-6">
              This profile cannot be viewed because your preferences or their preferences have deal-breaker conflicts that don't match.
            </p>
            <Link
              href={buildUrl('/matches')}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Matches
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const canExpressInterest = userStatus?.canExpressInterest ?? false
  const canAcceptInterest = userStatus?.canAcceptInterest ?? false

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-primary-600 font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          {/* Admin Edit Link */}
          {isAdmin && (
            <Link
              href={`/admin/profiles/${profile.id}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm"
            >
              Admin: Edit
            </Link>
          )}
        </div>

        {/* Profile Card - Same as MatchingProfileCard */}
        <ProfileCard
          profile={profile}
          onSendInterest={handleSendInterest}
          isSending={sendingInterest}
          canExpressInterest={canExpressInterest}
          canAcceptInterest={canAcceptInterest}
          theirMatchScore={theirMatchScore}
          yourMatchScore={yourMatchScore}
          matchProfiles={matchProfiles}
          viewerUserId={viewerUserId}
          isLoggedIn={canAccess}
          viewerIsApproved={userStatus?.isApproved ?? false}
          onReport={() => setShowReportModal(true)}
          onOpenPayment={() => setShowPaymentModal(true)}
          onMessage={() => setShowMessageModal(true)}
          buildUrl={buildUrl}
        />

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={profile.userId}
          reportedUserName={profile.user.name}
        />

        {/* Verification Payment Modal */}
        <VerificationPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />

        {/* Message Modal */}
        {profile && (
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            recipientId={profile.userId}
            recipientName={profile.user.name}
            recipientPhoto={profile.profileImageUrl}
          />
        )}
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
    isDealbreaker?: boolean
  }[]
}

interface MatchProfilesData {
  myProfile: { profileImageUrl: string | null; gender: string; name: string; hobbies?: string | null; fitness?: string | null; interests?: string | null }
  theirProfile: { profileImageUrl: string | null; gender: string; name: string }
}

interface ProfileCardProps {
  profile: ProfileData
  onSendInterest: () => void
  isSending: boolean
  canExpressInterest: boolean
  canAcceptInterest?: boolean
  theirMatchScore?: MatchScoreData | null
  yourMatchScore?: MatchScoreData | null
  matchProfiles?: MatchProfilesData | null
  viewerUserId?: string | null
  isLoggedIn?: boolean
  viewerIsApproved?: boolean
  onReport?: () => void
  onOpenPayment?: () => void
  onMessage?: () => void
  buildUrl: (path: string) => string
}

function ProfileCard({
  profile,
  onSendInterest,
  isSending,
  canExpressInterest,
  canAcceptInterest = false,
  theirMatchScore,
  onReport,
  onOpenPayment,
  onMessage,
  yourMatchScore,
  matchProfiles,
  buildUrl,
  viewerUserId,
  isLoggedIn,
  viewerIsApproved = false,
}: ProfileCardProps) {
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const interestSent = profile.interestStatus?.sentByMe
  const interestReceived = profile.interestStatus?.receivedFromThem
  const isMutual = profile.interestStatus?.mutual

  // Determine if sensitive info should be shown
  // Only show clear contact info for: own profile OR mutual match
  // Non-approved users and even approved users should see masked info until mutual
  const isOwnProfile = viewerUserId === profile.userId
  const showClear = isOwnProfile || isMutual

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const thumbnails = extractPhotoUrls(profile.photoUrls)

  // Photo carousel state
  const [photoIndex, setPhotoIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const carouselPhotos = extractPhotoUrls(profile.photoUrls)
  const photoUrl = profile.profileImageUrl || null

  // Gender-specific text
  const pronoun = profile.gender === 'male' ? 'He' : 'She'
  const possessivePronoun = profile.gender === 'male' ? 'His' : 'Her'

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

  // Helper to format field values - return exact DB value, only replace underscores for legacy data
  const formatValue = (val: string | null | undefined) => {
    if (!val) return null
    return val.replace(/_/g, ' ')
  }

  // Helper to format education/qualification with proper labels
  const formatEducation = (val: string | null | undefined) => {
    if (!val) return null
    const educationMap: Record<string, string> = {
      'high_school': 'High School Diploma',
      'associates': "Associate's Degree (AA, AS)",
      'bachelors_arts': 'Bachelor of Arts (BA)',
      'bachelors_science': 'Bachelor of Science (BS)',
      'bachelors_eng': 'Bachelor of Engineering (BE, BSE)',
      'bachelors_cs': 'Bachelor of Science - Computer Science (BS CS)',
      'bba': 'Bachelor of Business Administration (BBA)',
      'bfa': 'Bachelor of Fine Arts (BFA)',
      'bsn': 'Bachelor of Science in Nursing (BSN)',
      'masters_arts': 'Master of Arts (MA)',
      'masters_science': 'Master of Science (MS)',
      'masters_eng': 'Master of Engineering (MEng)',
      'masters_cs': 'Master of Science - Computer Science (MS CS)',
      'mba': 'Master of Business Administration (MBA)',
      'mfa': 'Master of Fine Arts (MFA)',
      'mph': 'Master of Public Health (MPH)',
      'msw': 'Master of Social Work (MSW)',
      'md': 'Doctor of Medicine (MD)',
      'do': 'Doctor of Osteopathic Medicine (DO)',
      'dds': 'Doctor of Dental Surgery (DDS, DMD)',
      'pharmd': 'Doctor of Pharmacy (PharmD)',
      'jd': 'Juris Doctor (JD) - Law',
      'cpa': 'Certified Public Accountant (CPA)',
      'phd': 'Doctor of Philosophy (PhD)',
      'edd': 'Doctor of Education (EdD)',
      'psyd': 'Doctor of Psychology (PsyD)',
      'other': 'Other',
    }
    return educationMap[val] || formatValue(val)
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm">
      {/* Compact Header with Photo and Key Info */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4">
        <div className="flex gap-4">
          {/* Small Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 bg-gray-200 overflow-hidden border-2 border-white shadow-lg relative group">
              {(carouselPhotos.length > 0 || photoUrl) && !imageError ? (
                <>
                  <img
                    src={carouselPhotos.length > 0 ? carouselPhotos[photoIndex] : (photoUrl || '')}
                    alt={viewerIsApproved ? profile.user.name : 'Profile'}
                    className={`w-full h-full object-cover ${viewerIsApproved ? 'cursor-pointer' : 'blur-lg'}`}
                    referrerPolicy="no-referrer"
                    onClick={() => viewerIsApproved && openLightbox(photoIndex)}
                    onError={(e) => {
                      if (photoUrl && e.currentTarget.src !== photoUrl) {
                        e.currentTarget.src = photoUrl
                      } else {
                        setImageError(true)
                      }
                    }}
                  />
                  {/* Lock overlay for non-approved viewers */}
                  {!viewerIsApproved && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-white/90 p-2 rounded-full">
                        <Lock className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  )}
                  {/* Zoom icon overlay - only for approved viewers */}
                  {viewerIsApproved && (
                    <div
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={() => openLightbox(photoIndex)}
                    >
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {/* Carousel navigation arrows - only for approved viewers */}
                  {viewerIsApproved && carouselPhotos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev - 1 + carouselPhotos.length) % carouselPhotos.length) }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-8 bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev + 1) % carouselPhotos.length) }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-8 bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="h-4 w-4 text-white" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-primary-100 ${!viewerIsApproved ? 'blur-lg' : ''}`}>
                  <span className="text-2xl font-semibold text-primary-600">
                    {getInitials(profile.user.name)}
                  </span>
                </div>
              )}
            </div>
            {/* Photo navigation dots - only for approved viewers */}
            {viewerIsApproved && carouselPhotos.length > 1 && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                {carouselPhotos.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPhotoIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full ${idx === photoIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Name and Key Info */}
          <div className="flex-1 min-w-0 text-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold truncate">{viewerIsApproved ? profile.user.name : (profile.odNumber || 'Profile')}</h2>
                <div className="text-sm text-white/90 mt-0.5">
                  {age ? `${age} yrs` : ''}{profile.height ? ` • ${profile.height}` : ''}{profile.maritalStatus ? ` • ${formatValue(profile.maritalStatus)}` : ''}
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isMutual ? (
                  <>
                    <div className="group relative">
                      <div className="w-11 h-11 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                          <div className="font-semibold mb-1">Connected!</div>
                          <div className="text-gray-300">You both expressed mutual interest</div>
                        </div>
                      </div>
                    </div>
                    <div className="group relative">
                      <button
                        onClick={onMessage}
                        className="w-11 h-11 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 cursor-pointer shadow-lg transition-colors"
                      >
                        <MessageCircle className="h-6 w-6 text-white" />
                      </button>
                      <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                          <div className="font-semibold mb-1">Send Message</div>
                          <div className="text-gray-300">Start a conversation with your match</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : interestSent ? (
                  <div className="group relative">
                    <div className="w-11 h-11 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                        <div className="font-semibold mb-1">Interest Sent</div>
                        <div className="text-gray-300">Waiting for them to respond</div>
                      </div>
                    </div>
                  </div>
                ) : interestReceived ? (
                  canAcceptInterest ? (
                    <div className="group relative">
                      <button
                        onClick={onSendInterest}
                        disabled={isSending}
                        className="w-11 h-11 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center shadow-lg transition-colors"
                      >
                        {isSending ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Heart className="h-6 w-6 text-white" />}
                      </button>
                      <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                          <div className="font-semibold mb-1">Accept Interest</div>
                          <div className="text-gray-300">They&apos;re interested! Click to connect</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <button
                        onClick={onOpenPayment}
                        className="w-11 h-11 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center shadow-lg transition-colors"
                      >
                        <Heart className="h-6 w-6 text-white" />
                      </button>
                      <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                          <div className="font-semibold mb-1">They&apos;re Interested!</div>
                          <div className="text-gray-300">Get verified to accept and connect</div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="group relative">
                    <button
                      onClick={onSendInterest}
                      disabled={isSending}
                      className="w-11 h-11 bg-white/20 hover:bg-pink-500 rounded-lg flex items-center justify-center shadow-lg transition-colors"
                    >
                      {isSending ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Heart className="h-6 w-6 text-white" />}
                    </button>
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                        <div className="font-semibold mb-1">Express Interest</div>
                        <div className="text-gray-300">Let them know you&apos;re interested</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="group relative">
                  <button onClick={onReport} className="w-11 h-11 bg-white/10 hover:bg-red-500/80 rounded-lg flex items-center justify-center shadow-lg transition-colors">
                    <Flag className="h-5 w-5 text-white/70 group-hover:text-white" />
                  </button>
                  <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      <div className="font-semibold mb-1">Report Profile</div>
                      <div className="text-gray-300">Flag inappropriate content or behavior</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Quick Info Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.currentLocation && (
                <span className="text-xs bg-white/20 px-2 py-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{profile.currentLocation}
                </span>
              )}
              {profile.occupation && (
                <span className="text-xs bg-white/20 px-2 py-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />{formatValue(profile.occupation)}
                </span>
              )}
              {profile.qualification && (
                <span className="text-xs bg-white/20 px-2 py-0.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />{formatEducation(profile.qualification)}
                </span>
              )}
              {profile.community && (
                <span className="text-xs bg-white/20 px-2 py-0.5">
                  {profile.religion || 'Hindu'}, {profile.community}{profile.subCommunity ? ` (${profile.subCommunity})` : ''}
                </span>
              )}
            </div>
            {/* Verification Badges */}
            <div className="flex gap-1 mt-2">
              <span className={`text-[10px] px-1.5 py-0.5 ${profile.approvalStatus === 'approved' ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white/70'}`}>
                {profile.approvalStatus === 'approved' ? '✓ Verified' : 'Pending'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 ${profile.user.emailVerified ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white/70'}`}>
                {profile.user.emailVerified ? '✓ Email' : 'Email'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 ${profile.user.phoneVerified ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white/70'}`}>
                {profile.user.phoneVerified ? '✓ Phone' : 'Phone'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Single Page Layout */}
      <div className="p-4 space-y-5">
        {/* About */}
        {profile.aboutMe && (
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-800 mb-2">About</h3>
            <p className="text-base text-gray-600 leading-relaxed">{profile.aboutMe}</p>
          </div>
        )}

        {/* Verification CTA - Show when user received interest but needs verification to accept */}
        {!canAcceptInterest && isLoggedIn && profile.userId !== viewerUserId && !isMutual && interestReceived && (
          <div className="bg-gradient-to-r from-green-50 to-accent-50 border border-green-100 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">This person is interested in you!</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Complete your profile verification to accept their interest and unlock full access to contact details.
                </p>
                <button
                  onClick={onOpenPayment}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Accept Interest — Get Verified
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Details Section - Masked until mutual match or own profile */}
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-800">Contact Details</h3>
            {!showClear && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {isMutual ? 'Contact Shared' : 'Connect to Reveal'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex">
              <span className="text-gray-500 w-24">Email</span>
              <span className="text-gray-400 mr-2">:</span>
              <span className="text-gray-800 flex items-center gap-1">
                {showClear ? (profile.user.email || 'Not specified') : 'XXXXXX@XXX.XXX'}
                {showClear && profile.user.emailVerified && <span className="text-green-600 text-xs">(Verified)</span>}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-24">Phone</span>
              <span className="text-gray-400 mr-2">:</span>
              <span className="text-gray-800 flex items-center gap-1">
                {showClear ? (profile.user.phone || 'Not specified') : maskPhone(profile.user.phone)}
                {showClear && profile.user.phoneVerified && <span className="text-green-600 text-xs">(Verified)</span>}
              </span>
            </div>
            {profile.linkedinProfile && profile.linkedinProfile.trim() !== '' && profile.linkedinProfile !== 'no_linkedin' && (
              <div className="flex">
                <span className="text-gray-500 w-24">LinkedIn</span>
                <span className="text-gray-400 mr-2">:</span>
                {showClear ? (
                  <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">View Profile</a>
                ) : (
                  <span className="text-gray-400">XXXXXXXXXX</span>
                )}
              </div>
            )}
            {(profile.instagram || profile.facebookInstagram) && (
              <div className="flex">
                <span className="text-gray-500 w-24">Instagram</span>
                <span className="text-gray-400 mr-2">:</span>
                <span className="text-gray-800">{showClear ? (profile.instagram || profile.facebookInstagram) : 'XXXXXXXXXX'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Grid for Details - Organized to match Edit Profile sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BASIC INFO Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Basic Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {age && <><span className="text-gray-500">Age</span><span className="text-gray-800">{age} years</span></>}
              {profile.height && <><span className="text-gray-500">Height</span><span className="text-gray-800">{profile.height}</span></>}
              {profile.maritalStatus && <><span className="text-gray-500">Marital Status</span><span className="text-gray-800">{formatValue(profile.maritalStatus)}</span></>}
              {profile.hasChildren && profile.maritalStatus !== 'never_married' && <><span className="text-gray-500">Children</span><span className="text-gray-800">{formatValue(profile.hasChildren)}</span></>}
              {profile.motherTongue && <><span className="text-gray-500">Mother Tongue</span><span className="text-gray-800">{profile.motherTongue}</span></>}
              {profile.languagesKnown && <><span className="text-gray-500">Languages</span><span className="text-gray-800">{profile.languagesKnown}</span></>}
              {profile.createdBy && <><span className="text-gray-500">Profile By</span><span className="text-gray-800">{formatValue(profile.createdBy)}</span></>}
            </div>
          </div>

          {/* LOCATION Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {profile.currentLocation && <><span className="text-gray-500">Current</span><span className="text-gray-800">{profile.currentLocation}</span></>}
              {profile.grewUpIn && <><span className="text-gray-500">Grew Up In</span><span className="text-gray-800">{profile.grewUpIn}</span></>}
              {profile.citizenship && <><span className="text-gray-500">Citizenship</span><span className="text-gray-800">{profile.citizenship}</span></>}
              {profile.residencyStatus && <><span className="text-gray-500">Residency</span><span className="text-gray-800">{profile.residencyStatus}</span></>}
              {profile.openToRelocation && <><span className="text-gray-500">Relocate</span><span className="text-gray-800">{formatValue(profile.openToRelocation)}</span></>}
            </div>
          </div>

          {/* RELIGION & BACKGROUND Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Religion & Background</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {profile.religion && <><span className="text-gray-500">Religion</span><span className="text-gray-800">{profile.religion}</span></>}
              {profile.community && <><span className="text-gray-500">Community</span><span className="text-gray-800">{profile.community}</span></>}
              {profile.subCommunity && <><span className="text-gray-500">Sub-Community</span><span className="text-gray-800">{profile.subCommunity}</span></>}
              {profile.gotra && <><span className="text-gray-500">Gotra</span><span className="text-gray-800">{profile.gotra}</span></>}
            </div>
          </div>

          {/* ASTRO DETAILS - Hindu specific */}
          {profile.religion === 'Hindu' && (profile.manglik || profile.raasi || profile.nakshatra || profile.doshas || profile.placeOfBirth || profile.placeOfBirthCity) && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Astro Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {profile.manglik && <><span className="text-gray-500">Manglik</span><span className="text-gray-800">{profile.manglik === 'yes' ? 'Yes' : profile.manglik === 'no' ? 'No' : "Don't Know"}</span></>}
                {profile.raasi && <><span className="text-gray-500">Raasi</span><span className="text-gray-800">{profile.raasi}</span></>}
                {profile.nakshatra && <><span className="text-gray-500">Nakshatra</span><span className="text-gray-800">{profile.nakshatra}</span></>}
                {profile.doshas && <><span className="text-gray-500">Doshas</span><span className="text-gray-800">{profile.doshas}</span></>}
                {(profile.placeOfBirthCity || profile.placeOfBirthState || profile.placeOfBirth) && (
                  <><span className="text-gray-500">Birth Place</span><span className="text-gray-800">{profile.placeOfBirthCity || profile.placeOfBirth}{profile.placeOfBirthState ? `, ${profile.placeOfBirthState}` : ''}</span></>
                )}
              </div>
            </div>
          )}

          {/* Muslim-specific fields */}
          {profile.religion === 'Muslim' && (profile.maslak || profile.namazPractice) && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Religious Practice</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {profile.maslak && <><span className="text-gray-500">Maslak</span><span className="text-gray-800">{profile.maslak}</span></>}
                {profile.namazPractice && <><span className="text-gray-500">Namaz</span><span className="text-gray-800">{profile.namazPractice}</span></>}
              </div>
            </div>
          )}

          {/* Sikh-specific fields */}
          {profile.religion === 'Sikh' && (profile.amritdhari || profile.turban) && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Religious Practice</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {profile.amritdhari && <><span className="text-gray-500">Amritdhari</span><span className="text-gray-800">{profile.amritdhari}</span></>}
                {profile.turban && <><span className="text-gray-500">Turban</span><span className="text-gray-800">{profile.turban}</span></>}
              </div>
            </div>
          )}

          {/* Christian-specific fields */}
          {profile.religion === 'Christian' && (profile.churchAttendance || profile.baptized) && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Religious Practice</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {profile.churchAttendance && <><span className="text-gray-500">Church Attendance</span><span className="text-gray-800">{profile.churchAttendance}</span></>}
                {profile.baptized && <><span className="text-gray-500">Baptized</span><span className="text-gray-800">{profile.baptized}</span></>}
              </div>
            </div>
          )}

          {/* EDUCATION & CAREER Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Education & Career</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {profile.qualification && <><span className="text-gray-500">Education</span><span className="text-gray-800">{formatEducation(profile.qualification)}</span></>}
              {profile.university && <><span className="text-gray-500">University</span><span className="text-gray-800">{profile.university}</span></>}
              {profile.occupation && <><span className="text-gray-500">Occupation</span><span className="text-gray-800">{formatValue(profile.occupation)}</span></>}
              {profile.employerName && <><span className="text-gray-500">Employer</span><span className="text-gray-800">{profile.employerName}</span></>}
              {profile.annualIncome && <><span className="text-gray-500">Income</span><span className="text-gray-800">{profile.annualIncome}</span></>}
            </div>
          </div>

          {/* LIFESTYLE Section - Diet, Smoking, Drinking, Pets */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Lifestyle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {profile.dietaryPreference && <><span className="text-gray-500">Diet</span><span className="text-gray-800">{profile.dietaryPreference}</span></>}
              {profile.smoking && <><span className="text-gray-500">Smoking</span><span className="text-gray-800">{formatValue(profile.smoking)}</span></>}
              {profile.drinking && <><span className="text-gray-500">Drinking</span><span className="text-gray-800">{formatValue(profile.drinking)}</span></>}
              {profile.pets && <><span className="text-gray-500">Pets</span><span className="text-gray-800">{formatValue(profile.pets)}</span></>}
            </div>
          </div>
        </div>

        {/* Family Details */}
        {(profile.fatherName || profile.motherName || profile.numberOfBrothers || profile.numberOfSisters || profile.familyType || profile.familyValues) && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-3">Family</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              {profile.fatherName && <><span className="text-gray-500">Father</span><span className="text-gray-800">{showClear ? profile.fatherName : 'XXXXXXXX'}</span></>}
              {profile.fatherOccupation && <><span className="text-gray-500">Father&apos;s Work</span><span className="text-gray-800">{profile.fatherOccupation}</span></>}
              {profile.motherName && <><span className="text-gray-500">Mother</span><span className="text-gray-800">{showClear ? profile.motherName : 'XXXXXXXX'}</span></>}
              {profile.motherOccupation && <><span className="text-gray-500">Mother&apos;s Work</span><span className="text-gray-800">{profile.motherOccupation}</span></>}
              {(profile.numberOfBrothers || profile.numberOfSisters) && (
                <><span className="text-gray-500">Siblings</span><span className="text-gray-800">{profile.numberOfBrothers ? `${profile.numberOfBrothers}B` : ''}{profile.numberOfBrothers && profile.numberOfSisters ? ', ' : ''}{profile.numberOfSisters ? `${profile.numberOfSisters}S` : ''}</span></>
              )}
              {profile.familyType && <><span className="text-gray-500">Family Type</span><span className="text-gray-800">{formatValue(profile.familyType)}</span></>}
              {profile.familyValues && <><span className="text-gray-500">Values</span><span className="text-gray-800">{formatValue(profile.familyValues)}</span></>}
              {profile.familyLocation && <><span className="text-gray-500">Family Location</span><span className="text-gray-800">{profile.familyLocation}</span></>}
            </div>
          </div>
        )}

        {/* Lifestyle - Hobbies, Interests, Fitness Comparison */}
        {(profile.hobbies || profile.interests || profile.fitness || matchProfiles?.myProfile?.hobbies || matchProfiles?.myProfile?.interests || matchProfiles?.myProfile?.fitness) && isLoggedIn && profile.userId !== viewerUserId && matchProfiles && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-3">Interests & Hobbies Comparison</h3>
            <div className="bg-gray-50 border border-gray-200 p-4">
              <div className="grid grid-cols-12 gap-2 text-sm">
                <div className="col-span-2 font-semibold text-gray-500"></div>
                <div className="col-span-5 font-semibold text-gray-500 text-center">You</div>
                <div className="col-span-5 font-semibold text-gray-500 text-center">{pronoun}</div>
              </div>
              {/* Hobbies Row */}
              <div className="grid grid-cols-12 gap-2 text-sm py-2 border-t border-gray-200 mt-2">
                <div className="col-span-2 font-medium text-gray-700">Hobbies</div>
                <div className="col-span-5">
                  <div className="flex flex-wrap gap-1">
                    {matchProfiles.myProfile?.hobbies?.split(', ').filter((h: string) => h).map((h: string, i: number) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${
                        profile.hobbies?.toLowerCase().includes(h.toLowerCase())
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{h}</span>
                    )) || <span className="text-gray-400">Not specified</span>}
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="flex flex-wrap gap-1">
                    {profile.hobbies?.split(', ').filter(h => h).map((h, i) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${
                        matchProfiles.myProfile?.hobbies?.toLowerCase().includes(h.toLowerCase())
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{h}</span>
                    )) || <span className="text-gray-400">Not specified</span>}
                  </div>
                </div>
              </div>
              {/* Fitness Row */}
              <div className="grid grid-cols-12 gap-2 text-sm py-2 border-t border-gray-200">
                <div className="col-span-2 font-medium text-gray-700">Fitness</div>
                <div className="col-span-5">
                  <div className="flex flex-wrap gap-1">
                    {matchProfiles.myProfile?.fitness?.split(', ').filter((h: string) => h).map((h: string, i: number) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${
                        profile.fitness?.toLowerCase().includes(h.toLowerCase())
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{h}</span>
                    )) || <span className="text-gray-400">Not specified</span>}
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="flex flex-wrap gap-1">
                    {profile.fitness?.split(', ').filter(h => h).map((h, i) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${
                        matchProfiles.myProfile?.fitness?.toLowerCase().includes(h.toLowerCase())
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{h}</span>
                    )) || <span className="text-gray-400">Not specified</span>}
                  </div>
                </div>
              </div>
              {/* Interests Row */}
              <div className="grid grid-cols-12 gap-2 text-sm py-2 border-t border-gray-200">
                <div className="col-span-2 font-medium text-gray-700">Interests</div>
                <div className="col-span-5">
                  <div className="flex flex-wrap gap-1">
                    {matchProfiles.myProfile?.interests?.split(', ').filter((h: string) => h).map((h: string, i: number) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${
                        profile.interests?.toLowerCase().includes(h.toLowerCase())
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{h}</span>
                    )) || <span className="text-gray-400">Not specified</span>}
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="flex flex-wrap gap-1">
                    {profile.interests?.split(', ').filter(h => h).map((h, i) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${
                        matchProfiles.myProfile?.interests?.toLowerCase().includes(h.toLowerCase())
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{h}</span>
                    )) || <span className="text-gray-400">Not specified</span>}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-green-300 rounded"></span> Common interests</span>
              </p>
            </div>
          </div>
        )}

        {/* Lifestyle - Hobbies, Interests (for own profile or when not logged in) */}
        {(profile.hobbies || profile.interests || profile.fitness) && (!isLoggedIn || profile.userId === viewerUserId) && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies?.split(', ').map((h, i) => (
                <span key={i} className="text-sm px-2 py-1 bg-primary-50 text-primary-700 border border-primary-200">{h}</span>
              ))}
              {profile.interests?.split(', ').map((h, i) => (
                <span key={i} className="text-sm px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200">{h}</span>
              ))}
              {profile.fitness?.split(', ').map((h, i) => (
                <span key={i} className="text-sm px-2 py-1 bg-green-50 text-green-700 border border-green-200">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* Unified Compatibility Table - Shows all preferences with deal-breaker indicators */}
        {theirMatchScore && yourMatchScore && isLoggedIn && profile.userId !== viewerUserId && (
          <div className="border-t border-gray-100 pt-4">
            <div className="bg-gray-50 border border-gray-200 p-4">
              {/* Header with Profile Pictures Side by Side */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-gray-800">Compatibility</h3>
                  {/* Profile Pictures Side by Side */}
                  {matchProfiles && (
                    <div className="flex items-center">
                      {/* Your Photo */}
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200 relative z-10">
                        {matchProfiles.myProfile.profileImageUrl ? (
                          <img
                            src={matchProfiles.myProfile.profileImageUrl}
                            alt="You"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 font-semibold text-sm">
                            {matchProfiles.myProfile.name?.charAt(0) || 'Y'}
                          </div>
                        )}
                      </div>
                      {/* Heart Icon in between */}
                      <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center -mx-1.5 z-20 border-2 border-white">
                        <Heart className="w-3 h-3 text-white fill-white" />
                      </div>
                      {/* Their Photo - blur if not approved */}
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200 relative z-10">
                        {matchProfiles.theirProfile.profileImageUrl ? (
                          <img
                            src={matchProfiles.theirProfile.profileImageUrl}
                            alt={matchProfiles.theirProfile.name}
                            className={`w-full h-full object-cover ${profile.approvalStatus !== 'approved' ? 'blur-sm' : ''}`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 font-semibold text-sm ${profile.approvalStatus !== 'approved' ? 'blur-sm' : ''}`}>
                            {matchProfiles.theirProfile.name?.charAt(0) || '?'}
                          </div>
                        )}
                        {/* Lock overlay for non-approved profiles */}
                        {profile.approvalStatus !== 'approved' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Lock className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-primary-600 font-semibold">You match {possessivePronoun.toLowerCase()}: {theirMatchScore.totalScore}/{theirMatchScore.maxScore}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-primary-600 font-semibold">{pronoun} matches yours: {yourMatchScore.totalScore}/{yourMatchScore.maxScore}</span>
                </div>
              </div>
              {/* Combined Criteria Table - Deal-breakers and Nice-to-haves */}
              {(() => {
                // Get all criteria (deal-breakers shown with indicator, nice-to-haves in grey)
                const theirAllCriteria = theirMatchScore.criteria.filter(c => c.seekerPref !== "Doesn't matter")
                const yourAllCriteria = yourMatchScore.criteria.filter(c => c.seekerPref !== "Doesn't matter")
                const allCriteriaNames = Array.from(new Set([...theirAllCriteria.map(c => c.name), ...yourAllCriteria.map(c => c.name)]))

                if (allCriteriaNames.length === 0) return <p className="text-sm text-gray-500 italic">No specific preferences set</p>

                return (
                  <div className="text-sm">
                    <div className="grid grid-cols-12 gap-2 py-2 border-b border-gray-300 font-semibold text-gray-600">
                      <div className="col-span-2">Criteria</div>
                      <div className="col-span-3 text-center">{possessivePronoun} Pref</div>
                      <div className="col-span-2 text-center">You</div>
                      <div className="col-span-3 text-center">Your Pref</div>
                      <div className="col-span-2 text-center">{pronoun}</div>
                    </div>
                    {allCriteriaNames.map((name, idx) => {
                      const theirCrit = theirAllCriteria.find(c => c.name === name)
                      const yourCrit = yourAllCriteria.find(c => c.name === name)
                      const theirIsDealbreaker = theirCrit?.isDealbreaker
                      const yourIsDealbreaker = yourCrit?.isDealbreaker

                      // Style preferences with colored backgrounds
                      const theirIsNiceToHave = theirCrit && !theirIsDealbreaker
                      const yourIsNiceToHave = yourCrit && !yourIsDealbreaker

                      // Determine row background based on preference type
                      const getTheirPrefStyle = () => {
                        if (theirIsDealbreaker) return 'bg-red-50 text-gray-700'
                        if (theirIsNiceToHave) return 'bg-blue-50 text-gray-700'
                        return 'text-gray-700'
                      }
                      const getYourPrefStyle = () => {
                        if (yourIsDealbreaker) return 'bg-red-50 text-gray-700'
                        if (yourIsNiceToHave) return 'bg-blue-50 text-gray-700'
                        return 'text-gray-700'
                      }

                      return (
                        <div
                          key={idx}
                          className={`grid grid-cols-12 gap-2 py-2 ${idx !== allCriteriaNames.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <div className="col-span-2 font-medium text-gray-700 truncate flex items-center gap-1">
                            {name}
                          </div>
                          <div className={`col-span-3 text-center truncate flex items-center justify-center gap-1 px-1 rounded ${getTheirPrefStyle()}`}>
                            {theirCrit?.seekerPref || '-'}
                            {theirIsDealbreaker && <span className="text-red-500 font-bold text-xs" title="Deal-breaker">*</span>}
                          </div>
                          <div className="col-span-2 flex justify-center">
                            {theirCrit ? (
                              theirCrit.matched ? (
                                <span className="w-6 h-6 bg-green-500 flex items-center justify-center rounded-sm"><Check className="h-4 w-4 text-white" /></span>
                              ) : (
                                <span className={`w-6 h-6 ${theirIsDealbreaker ? 'bg-red-500' : 'bg-gray-300'} flex items-center justify-center rounded-sm`}><X className="h-4 w-4 text-white" /></span>
                              )
                            ) : <span className="text-gray-300">-</span>}
                          </div>
                          <div className={`col-span-3 text-center truncate flex items-center justify-center gap-1 px-1 rounded ${getYourPrefStyle()}`}>
                            {yourCrit?.seekerPref || '-'}
                            {yourIsDealbreaker && <span className="text-red-500 font-bold text-xs" title="Deal-breaker">*</span>}
                          </div>
                          <div className="col-span-2 flex justify-center">
                            {yourCrit ? (
                              yourCrit.matched ? (
                                <span className="w-6 h-6 bg-green-500 flex items-center justify-center rounded-sm"><Check className="h-4 w-4 text-white" /></span>
                              ) : (
                                <span className={`w-6 h-6 ${yourIsDealbreaker ? 'bg-red-500' : 'bg-gray-300'} flex items-center justify-center rounded-sm`}><X className="h-4 w-4 text-white" /></span>
                              )
                            ) : <span className="text-gray-300">-</span>}
                          </div>
                        </div>
                      )
                    })}
                    <div className="mt-3 pt-2 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="bg-red-50 px-1.5 py-0.5 rounded text-gray-700">*</span> = Deal-breaker (Must have)</span>
                      <span className="flex items-center gap-1"><span className="bg-blue-50 px-1.5 py-0.5 rounded text-gray-700">Blue</span> = Nice to have (Flexible)</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Ideal Partner Description */}
        {profile.idealPartnerDesc && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">{possessivePronoun} Ideal Partner</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{profile.idealPartnerDesc}</p>
          </div>
        )}

        {/* Contact Info (only for mutual matches) */}
        {isMutual && profile.user.email && (
          <div className="bg-green-50 border border-green-200 p-4 mt-3">
            <h3 className="text-sm font-bold text-green-700 mb-2">Contact Information - You're Connected!</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {profile.user.email && <span><strong>Email:</strong> {profile.user.email}</span>}
              {profile.user.phone && <span><strong>Phone:</strong> {profile.user.phone}</span>}
            </div>
          </div>
        )}
      </div>
      {/* Photo Lightbox Modal - Only for approved viewers */}
      {lightboxOpen && thumbnails.length > 0 && viewerIsApproved && (
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
