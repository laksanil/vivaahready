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
    <div className="min-h-screen bg-gray-50 py-4">
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
    isDealbreaker?: boolean
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

  // Helper to format field values
  const formatValue = (val: string | null | undefined) => {
    if (!val) return null
    return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
      {/* Compact Header with Photo and Key Info */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4">
        <div className="flex gap-4">
          {/* Small Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 bg-gray-200 overflow-hidden border-2 border-white shadow-lg">
              {(carouselPhotos.length > 0 || photoUrl) && !imageError ? (
                <img
                  src={carouselPhotos.length > 0 ? carouselPhotos[photoIndex] : (photoUrl || '')}
                  alt={profile.user.name}
                  className="w-full h-full object-cover cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={() => openLightbox(photoIndex)}
                  onError={(e) => {
                    if (photoUrl && e.currentTarget.src !== photoUrl) {
                      e.currentTarget.src = photoUrl
                    } else {
                      setImageError(true)
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100">
                  <span className="text-2xl font-semibold text-primary-600">
                    {getInitials(profile.user.name)}
                  </span>
                </div>
              )}
            </div>
            {/* Photo navigation dots */}
            {carouselPhotos.length > 1 && (
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
                <h2 className="text-xl font-bold truncate">{profile.user.name}</h2>
                <div className="text-sm text-white/90 mt-0.5">
                  {age ? `${age} yrs` : ''}{profile.height ? ` • ${profile.height}` : ''}{profile.maritalStatus ? ` • ${formatValue(profile.maritalStatus)}` : ''}
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isMutual ? (
                  <>
                    <div className="w-8 h-8 bg-green-500 flex items-center justify-center" title="Connected">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-8 h-8 bg-white/20 flex items-center justify-center hover:bg-white/30 cursor-pointer" title="Message">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                  </>
                ) : interestSent ? (
                  <div className="w-8 h-8 bg-yellow-500 flex items-center justify-center" title="Interest Sent">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                ) : interestReceived ? (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending || !canExpressInterest}
                    className="w-8 h-8 bg-green-500 hover:bg-green-600 flex items-center justify-center"
                    title="Accept Interest"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Heart className="h-4 w-4 text-white" />}
                  </button>
                ) : !canExpressInterest ? (
                  <Link href={buildUrl('/profile')} className="w-8 h-8 bg-white/20 flex items-center justify-center" title="Get Verified to Like">
                    <Lock className="h-4 w-4 text-white" />
                  </Link>
                ) : (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 flex items-center justify-center"
                    title="Like"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Heart className="h-4 w-4 text-white" />}
                  </button>
                )}
                <button onClick={onReport} className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Report">
                  <Flag className="h-3.5 w-3.5 text-white/70" />
                </button>
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
                  <GraduationCap className="w-3 h-3" />{profile.qualification}
                </span>
              )}
              {profile.community && (
                <span className="text-xs bg-white/20 px-2 py-0.5">
                  {profile.religion || 'Hindu'}, {profile.community}
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
      <div className="p-4 space-y-4">
        {/* Match Comparison - Compact */}
        {theirMatchScore && yourMatchScore && isLoggedIn && profile.userId !== viewerUserId && (
          <div className="bg-gray-50 border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">Compatibility</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-primary-600 font-semibold">You match {possessivePronoun.toLowerCase()}: {theirMatchScore.totalScore}/{theirMatchScore.maxScore}</span>
                <span className="text-gray-400">|</span>
                <span className="text-primary-600 font-semibold">{pronoun} matches yours: {yourMatchScore.totalScore}/{yourMatchScore.maxScore}</span>
              </div>
            </div>
            {/* Compact Criteria Table */}
            {(() => {
              const theirDealbreakers = theirMatchScore.criteria.filter(c => c.isDealbreaker && c.seekerPref !== "Doesn't matter")
              const yourDealbreakers = yourMatchScore.criteria.filter(c => c.isDealbreaker && c.seekerPref !== "Doesn't matter")
              const allCriteriaNames = Array.from(new Set([...theirDealbreakers.map(c => c.name), ...yourDealbreakers.map(c => c.name)]))
              if (allCriteriaNames.length === 0) return null
              return (
                <div className="text-xs">
                  <div className="grid grid-cols-12 gap-1 py-1 border-b border-gray-300 font-semibold text-gray-500">
                    <div className="col-span-2">Criteria</div>
                    <div className="col-span-3 text-center">{possessivePronoun} Pref</div>
                    <div className="col-span-2 text-center">You</div>
                    <div className="col-span-3 text-center">Your Pref</div>
                    <div className="col-span-2 text-center">{pronoun}</div>
                  </div>
                  {allCriteriaNames.map((name, idx) => {
                    const theirCrit = theirDealbreakers.find(c => c.name === name)
                    const yourCrit = yourDealbreakers.find(c => c.name === name)
                    return (
                      <div key={idx} className={`grid grid-cols-12 gap-1 py-1.5 ${idx !== allCriteriaNames.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="col-span-2 font-medium text-gray-700 truncate">{name}</div>
                        <div className="col-span-3 text-center text-gray-600 truncate">{theirCrit?.seekerPref || '-'}</div>
                        <div className="col-span-2 flex justify-center">
                          {theirCrit ? (
                            theirCrit.matched ? (
                              <span className="w-5 h-5 bg-green-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></span>
                            ) : (
                              <span className="w-5 h-5 bg-red-400 flex items-center justify-center"><X className="h-3 w-3 text-white" /></span>
                            )
                          ) : <span className="text-gray-300">-</span>}
                        </div>
                        <div className="col-span-3 text-center text-gray-600 truncate">{yourCrit?.seekerPref || '-'}</div>
                        <div className="col-span-2 flex justify-center">
                          {yourCrit ? (
                            yourCrit.matched ? (
                              <span className="w-5 h-5 bg-green-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></span>
                            ) : (
                              <span className="w-5 h-5 bg-red-400 flex items-center justify-center"><X className="h-3 w-3 text-white" /></span>
                            )
                          ) : <span className="text-gray-300">-</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* About */}
        {profile.aboutMe && (
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800 mb-1">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{profile.aboutMe}</p>
          </div>
        )}

        {/* Two Column Grid for Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Details */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Personal</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              {profile.height && <><span className="text-gray-500">Height</span><span className="text-gray-800">{profile.height}</span></>}
              {profile.weight && <><span className="text-gray-500">Weight</span><span className="text-gray-800">{profile.weight}</span></>}
              {profile.maritalStatus && <><span className="text-gray-500">Marital</span><span className="text-gray-800">{formatValue(profile.maritalStatus)}</span></>}
              {profile.hasChildren && profile.maritalStatus !== 'never_married' && <><span className="text-gray-500">Children</span><span className="text-gray-800">{formatValue(profile.hasChildren)}</span></>}
              {profile.dietaryPreference && <><span className="text-gray-500">Diet</span><span className="text-gray-800">{profile.dietaryPreference}</span></>}
              {profile.bloodGroup && <><span className="text-gray-500">Blood</span><span className="text-gray-800">{profile.bloodGroup}</span></>}
              {profile.smoking && <><span className="text-gray-500">Smoking</span><span className="text-gray-800">{formatValue(profile.smoking)}</span></>}
              {profile.drinking && <><span className="text-gray-500">Drinking</span><span className="text-gray-800">{formatValue(profile.drinking)}</span></>}
            </div>
          </div>

          {/* Religion & Background */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Background</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              {profile.religion && <><span className="text-gray-500">Religion</span><span className="text-gray-800">{profile.religion}</span></>}
              {profile.community && <><span className="text-gray-500">Community</span><span className="text-gray-800">{profile.community}</span></>}
              {profile.subCommunity && <><span className="text-gray-500">Sub-Community</span><span className="text-gray-800">{profile.subCommunity}</span></>}
              {profile.gotra && <><span className="text-gray-500">Gotra</span><span className="text-gray-800">{profile.gotra}</span></>}
              {profile.motherTongue && <><span className="text-gray-500">Mother Tongue</span><span className="text-gray-800">{profile.motherTongue}</span></>}
              {profile.manglik && <><span className="text-gray-500">Manglik</span><span className="text-gray-800">{profile.manglik === 'yes' ? 'Yes' : profile.manglik === 'no' ? 'No' : "Don't Know"}</span></>}
            </div>
          </div>

          {/* Education & Career */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Career</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              {profile.qualification && <><span className="text-gray-500">Education</span><span className="text-gray-800">{profile.qualification}</span></>}
              {profile.university && <><span className="text-gray-500">University</span><span className="text-gray-800">{profile.university}</span></>}
              {profile.occupation && <><span className="text-gray-500">Occupation</span><span className="text-gray-800">{formatValue(profile.occupation)}</span></>}
              {profile.employerName && <><span className="text-gray-500">Employer</span><span className="text-gray-800">{profile.employerName}</span></>}
              {profile.annualIncome && <><span className="text-gray-500">Income</span><span className="text-gray-800">{profile.annualIncome}</span></>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Location</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              {profile.currentLocation && <><span className="text-gray-500">Current</span><span className="text-gray-800">{profile.currentLocation}</span></>}
              {profile.grewUpIn && <><span className="text-gray-500">Grew Up In</span><span className="text-gray-800">{profile.grewUpIn}</span></>}
              {profile.citizenship && <><span className="text-gray-500">Citizenship</span><span className="text-gray-800">{profile.citizenship}</span></>}
              {profile.residencyStatus && <><span className="text-gray-500">Residency</span><span className="text-gray-800">{profile.residencyStatus}</span></>}
              {profile.openToRelocation && <><span className="text-gray-500">Relocate</span><span className="text-gray-800">{formatValue(profile.openToRelocation)}</span></>}
            </div>
          </div>
        </div>

        {/* Family Details */}
        {(profile.fatherName || profile.motherName || profile.numberOfBrothers || profile.numberOfSisters || profile.familyType || profile.familyValues) && (
          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Family</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
              {profile.fatherName && <><span className="text-gray-500">Father</span><span className="text-gray-800">{profile.fatherName}</span></>}
              {profile.fatherOccupation && <><span className="text-gray-500">Father's Work</span><span className="text-gray-800">{profile.fatherOccupation}</span></>}
              {profile.motherName && <><span className="text-gray-500">Mother</span><span className="text-gray-800">{profile.motherName}</span></>}
              {profile.motherOccupation && <><span className="text-gray-500">Mother's Work</span><span className="text-gray-800">{profile.motherOccupation}</span></>}
              {(profile.numberOfBrothers || profile.numberOfSisters) && (
                <><span className="text-gray-500">Siblings</span><span className="text-gray-800">{profile.numberOfBrothers ? `${profile.numberOfBrothers}B` : ''}{profile.numberOfBrothers && profile.numberOfSisters ? ', ' : ''}{profile.numberOfSisters ? `${profile.numberOfSisters}S` : ''}</span></>
              )}
              {profile.familyType && <><span className="text-gray-500">Family Type</span><span className="text-gray-800">{formatValue(profile.familyType)}</span></>}
              {profile.familyValues && <><span className="text-gray-500">Values</span><span className="text-gray-800">{formatValue(profile.familyValues)}</span></>}
              {profile.familyLocation && <><span className="text-gray-500">Family Location</span><span className="text-gray-800">{profile.familyLocation}</span></>}
            </div>
          </div>
        )}

        {/* Lifestyle - Hobbies, Interests */}
        {(profile.hobbies || profile.interests || profile.fitness) && (
          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Interests</h3>
            <div className="flex flex-wrap gap-1">
              {profile.hobbies?.split(', ').map((h, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-200">{h}</span>
              ))}
              {profile.interests?.split(', ').map((h, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200">{h}</span>
              ))}
              {profile.fitness?.split(', ').map((h, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* Partner Preferences - Compact */}
        {(profile.prefAgeDiff || profile.prefHeight || profile.prefLocation || profile.prefCaste || profile.prefDiet || profile.prefQualification) && (
          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">{possessivePronoun} Partner Preferences</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
              {profile.prefAgeDiff && <><span className="text-gray-500">Age</span><span className="text-gray-800">{profile.prefAgeDiff}</span></>}
              {profile.prefHeight && <><span className="text-gray-500">Height</span><span className="text-gray-800">{profile.prefHeight}</span></>}
              {profile.prefLocation && <><span className="text-gray-500">Location</span><span className="text-gray-800">{profile.prefLocation}</span></>}
              {profile.prefCaste && <><span className="text-gray-500">Caste</span><span className="text-gray-800">{profile.prefCaste}</span></>}
              {profile.prefGotra && <><span className="text-gray-500">Gotra</span><span className="text-gray-800">{profile.prefGotra}</span></>}
              {profile.prefDiet && <><span className="text-gray-500">Diet</span><span className="text-gray-800">{profile.prefDiet}</span></>}
              {profile.prefQualification && <><span className="text-gray-500">Education</span><span className="text-gray-800">{profile.prefQualification}</span></>}
              {profile.prefIncome && <><span className="text-gray-500">Income</span><span className="text-gray-800">{profile.prefIncome}</span></>}
            </div>
          </div>
        )}

        {/* Ideal Partner Description */}
        {profile.idealPartnerDesc && (
          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">{possessivePronoun} Ideal Partner</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{profile.idealPartnerDesc}</p>
          </div>
        )}

        {/* Contact Info (only for mutual matches) */}
        {isMutual && profile.user.email && (
          <div className="bg-green-50 border border-green-200 p-3 mt-2">
            <h3 className="text-xs font-bold text-green-700 mb-1">Contact Information - You're Connected!</h3>
            <div className="flex flex-wrap gap-4 text-xs">
              {profile.user.email && <span><strong>Email:</strong> {profile.user.email}</span>}
              {profile.user.phone && <span><strong>Phone:</strong> {profile.user.phone}</span>}
            </div>
          </div>
        )}
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
