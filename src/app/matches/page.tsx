'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
// Using regular img tags for external URLs (Google Drive) due to CORS issues
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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Users,
  Send,
  Inbox,
  Lock,
  CreditCard,
  ZoomIn,
  RotateCcw,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'
import { AlertTriangle } from 'lucide-react'

interface MatchProfile {
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
  gotra: string | null
  dietaryPreference: string | null
  maritalStatus: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  annualIncome: string | null
  familyLocation: string | null
  fatherName: string | null
  motherName: string | null
  siblings: string | null
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
  timeOfBirth: string | null
  manglik: string | null
  raasi: string | null
  nakshatra: string | null
  doshas: string | null
  // Additional fields
  healthInfo: string | null
  anyDisability: string | null
  disabilityDetails: string | null
  bloodGroup: string | null
  fatherOccupation: string | null
  motherOccupation: string | null
  numberOfBrothers: string | null
  numberOfSisters: string | null
  siblingDetails: string | null
  familyType: string | null
  familyValues: string | null
  employerName: string | null
  workingAs: string | null
  livesWithFamily: string | null
  createdBy: string | null
  smoking: string | null
  drinking: string | null
  hobbies: string | null
  interests: string | null
  pets: string | null
  allergiesOrMedical: string | null
  residencyStatus: string | null
  photoVisibility: string | null
  // Partner Preferences
  prefAgeDiff: string | null
  prefHeight: string | null
  prefLocation: string | null
  prefCaste: string | null
  prefDiet: string | null
  prefQualification: string | null
  prefMaritalStatus: string | null
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
  approvalStatus?: string
  interestStatus?: {
    sentByMe: boolean
    receivedFromThem: boolean
    mutual: boolean
  }
  // For sent/received interests
  matchId?: string
  matchStatus?: 'pending' | 'accepted' | 'rejected'
  matchScore?: {
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
  // How well YOU match THEIR preferences
  theirMatchScore?: {
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
}

// Extended MatchProfile for sent/received interests with match status
interface InterestProfile extends MatchProfile {
  matchId: string
  matchStatus: 'pending' | 'accepted' | 'rejected'
}

function MatchesPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewAsUser = searchParams.get('viewAsUser')
  const initialTab = searchParams.get('tab') as 'matches' | 'mutual' | 'received' | 'declined' | 'sent' | null
  const [activeTab, setActiveTab] = useState<'matches' | 'mutual' | 'received' | 'declined' | 'sent'>(initialTab || 'matches')
  const [isAdminView, setIsAdminView] = useState(false)
  const [viewingUserName, setViewingUserName] = useState<string | null>(null)
  const [matchingProfiles, setMatchingProfiles] = useState<MatchProfile[]>([])
  const [mutualMatches, setMutualMatches] = useState<MatchProfile[]>([])
  const [receivedInterests, setReceivedInterests] = useState<InterestProfile[]>([])
  const [declinedInterests, setDeclinedInterests] = useState<InterestProfile[]>([])
  const [sentInterests, setSentInterests] = useState<InterestProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set())
  const [sendingInterest, setSendingInterest] = useState<string | null>(null)
  const [profileStatus, setProfileStatus] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0)
  const [currentReceivedIndex, setCurrentReceivedIndex] = useState(0)
  const [currentDeclinedIndex, setCurrentDeclinedIndex] = useState(0)
  const [currentSentIndex, setCurrentSentIndex] = useState(0)
  const [respondingToInterest, setRespondingToInterest] = useState<string | null>(null)
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean
    recipientId: string
    recipientName: string
    recipientPhoto: string | null
    recipientPhotoUrls: string | null
  }>({
    isOpen: false,
    recipientId: '',
    recipientName: '',
    recipientPhoto: null,
    recipientPhotoUrls: null,
  })
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean
    reportedUserId: string
    reportedUserName: string
  }>({
    isOpen: false,
    reportedUserId: '',
    reportedUserName: '',
  })
  const [userStatus, setUserStatus] = useState<{
    isApproved: boolean
    hasPaid: boolean
    approvalStatus: string
    canExpressInterest: boolean
  } | null>(null)
  const [myProfile, setMyProfile] = useState<{
    id: string
    gender: string
    profileImageUrl: string | null
    photoUrls: string | null
    userName: string
  } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      if (activeTab === 'matches' || activeTab === 'mutual') {
        fetchMatchingProfiles()
      } else {
        fetchInterests()
      }
    }
  }, [session, activeTab])

  const fetchMatchingProfiles = async () => {
    setLoading(true)
    try {
      const url = viewAsUser
        ? `/api/matches/auto?viewAsUser=${viewAsUser}`
        : '/api/matches/auto'
      const response = await fetch(url)
      const data = await response.json()

      if (data.message && !data.matches?.length) {
        setProfileStatus('no_profile')
        setStatusMessage(data.message)
        setMatchingProfiles([])
        setMutualMatches([])
      } else {
        setProfileStatus(null)
        setStatusMessage(null)
        // Use the pre-filtered data from API
        // freshMatches: profiles with no interest relationship (only in Matching Profiles tab)
        // mutualMatches: profiles where both expressed interest (only in Mutual Matches tab)
        setMatchingProfiles(data.freshMatches || [])
        setMutualMatches(data.mutualMatches || [])
        if (data.userStatus) {
          setUserStatus(data.userStatus)
        }
        if (data.myProfile) {
          setMyProfile(data.myProfile)
        }
        // Track admin view
        if (data.isAdminView) {
          setIsAdminView(true)
          setViewingUserName(data.viewingUserName || null)
        }
      }
    } catch (error) {
      console.error('Error fetching matching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInterests = async () => {
    setLoading(true)
    try {
      const viewParam = viewAsUser ? `&viewAsUser=${viewAsUser}` : ''
      const [receivedRes, sentRes, statusRes] = await Promise.all([
        fetch(`/api/matches?type=received${viewParam}`),
        fetch(`/api/matches?type=sent${viewParam}`),
        fetch(`/api/matches/auto${viewAsUser ? `?viewAsUser=${viewAsUser}` : ''}`), // Get user status
      ])
      const [receivedData, sentData, statusData] = await Promise.all([
        receivedRes.json(),
        sentRes.json(),
        statusRes.json(),
      ])
      // Transform the data to include matchId and matchStatus
      const receivedProfiles = (receivedData.matches || []).map((m: any) => ({
        ...m,
        matchId: m.matchId || m.id,
        matchStatus: m.status,
      }))
      const sentProfiles = (sentData.matches || []).map((m: any) => ({
        ...m,
        matchId: m.matchId || m.id,
        matchStatus: m.status,
      }))
      // Separate pending from declined interests
      const pendingReceived = receivedProfiles.filter((p: InterestProfile) => p.matchStatus === 'pending')
      const declinedReceived = receivedProfiles.filter((p: InterestProfile) => p.matchStatus === 'rejected')
      setReceivedInterests(pendingReceived)
      setDeclinedInterests(declinedReceived)
      setSentInterests(sentProfiles)
      if (statusData.userStatus) {
        setUserStatus(statusData.userStatus)
      }
      if (statusData.myProfile) {
        setMyProfile(statusData.myProfile)
      }
      // Track admin view
      if (statusData.isAdminView) {
        setIsAdminView(true)
        setViewingUserName(statusData.viewingUserName || null)
      }
    } catch (error) {
      console.error('Error fetching interests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInterest = async (receiverId: string) => {
    setSendingInterest(receiverId)
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId }),
      })

      if (response.ok) {
        // Refresh the matches to update interest status
        fetchMatchingProfiles()
      }
    } catch (error) {
      console.error('Error sending interest:', error)
    } finally {
      setSendingInterest(null)
    }
  }

  const handleInterestAction = async (matchId: string, action: 'accept' | 'reject' | 'reconsider') => {
    setRespondingToInterest(matchId)
    try {
      const statusMap = {
        accept: 'accepted',
        reject: 'rejected',
        reconsider: 'reconsider', // API handles this specially
      }
      await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[action] }),
      })
      await fetchInterests()
    } catch (error) {
      console.error('Error updating match:', error)
    } finally {
      setRespondingToInterest(null)
    }
  }

  const toggleProfileExpand = (profileId: string) => {
    setExpandedProfiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(profileId)) {
        newSet.delete(profileId)
      } else {
        newSet.add(profileId)
      }
      return newSet
    })
  }

  const getPhotoUrl = (profile: MatchProfile) => {
    return profile.profileImageUrl || null
  }

  const openMessageModal = (profile: MatchProfile) => {
    setMessageModal({
      isOpen: true,
      recipientId: profile.user.id,
      recipientName: profile.user.name,
      recipientPhoto: profile.profileImageUrl,
      recipientPhotoUrls: profile.photoUrls,
    })
  }

  const closeMessageModal = () => {
    setMessageModal({
      isOpen: false,
      recipientId: '',
      recipientName: '',
      recipientPhoto: null,
      recipientPhotoUrls: null,
    })
  }

  const openReportModal = (profile: MatchProfile) => {
    setReportModal({
      isOpen: true,
      reportedUserId: profile.user.id,
      reportedUserName: profile.user.name,
    })
  }

  const closeReportModal = () => {
    setReportModal({
      isOpen: false,
      reportedUserId: '',
      reportedUserName: '',
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin View Banner - Explicit and Prominent */}
        {isAdminView && viewingUserName && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">ADMIN VIEW MODE</h3>
                    <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">VIEWING AS USER</span>
                  </div>
                  <p className="text-purple-100 mt-1">
                    You are viewing <span className="font-bold text-white">{viewingUserName}</span>&apos;s matches dashboard
                  </p>
                  <p className="text-purple-200 text-sm mt-1">
                    This shows EXACTLY what this user sees - same data, same counts, same matches
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/matches"
                  className="px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  ← Back to Admin
                </Link>
                <button
                  onClick={() => window.close()}
                  className="px-4 py-2 text-sm bg-white text-purple-700 font-medium rounded-lg hover:bg-purple-50"
                >
                  Close Tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{isAdminView ? `${viewingUserName}'s Matches` : 'My Matches'}</h1>
          <p className="text-gray-600 mt-1">{isAdminView ? 'Admin view - browsing as this user' : 'Find your perfect match based on your preferences'}</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'matches'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Matching Profiles
            {matchingProfiles.length > 0 && (
              <span className="ml-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                {matchingProfiles.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('mutual')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'mutual'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart className="h-5 w-5 mr-2" />
            Mutual Matches
            {mutualMatches.length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {mutualMatches.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'received'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Inbox className="h-5 w-5 mr-2" />
            Interests Received
            {receivedInterests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {receivedInterests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('declined')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'declined'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <X className="h-5 w-5 mr-2" />
            Declined
            {declinedInterests.length > 0 && (
              <span className="ml-2 bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
                {declinedInterests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'sent'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Send className="h-5 w-5 mr-2" />
            Interests Sent
            {sentInterests.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {sentInterests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : activeTab === 'matches' ? (
          /* Matching Profiles Tab */
          profileStatus ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {profileStatus === 'pending' ? 'Profile Pending Approval' : 'Profile Not Approved'}
              </h3>
              <p className="text-gray-600 mb-6">{statusMessage}</p>
              <Link href="/profile" className="btn-primary inline-block">
                View My Profile
              </Link>
            </div>
          ) : matchingProfiles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matches Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any profiles matching your preferences at this time.
                Check back later as new profiles are added daily.
              </p>
              <Link href="/profile/edit?section=preferences" className="btn-primary inline-block">
                Update Preferences
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment/Approval Banner */}
              {userStatus && !userStatus.canExpressInterest && (
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {!userStatus.hasPaid ? (
                        <CreditCard className="h-10 w-10 text-primary-600" />
                      ) : (
                        <Clock className="h-10 w-10 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {!userStatus.hasPaid
                          ? 'Pay $50 to Express Interest'
                          : 'Profile Pending Approval'}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {!userStatus.hasPaid
                          ? 'You can browse matching profiles, but to express interest and connect with matches, please complete the $50 payment for profile verification.'
                          : 'Your payment has been received. Your profile is pending admin approval. Once approved, you can express interest in matches.'}
                      </p>
                      {!userStatus.hasPaid && (
                        <Link
                          href="/payment"
                          className="inline-flex items-center mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay $50 Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Counter and Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-gray-700">
                  Profile {currentProfileIndex + 1} of {matchingProfiles.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentProfileIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentProfileIndex === 0}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentProfileIndex(prev => Math.min(matchingProfiles.length - 1, prev + 1))}
                    disabled={currentProfileIndex === matchingProfiles.length - 1}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
              </div>

              {/* Single Profile Card - Always expanded */}
              {matchingProfiles[currentProfileIndex] && (
                <MatchingProfileCard
                  key={matchingProfiles[currentProfileIndex].id}
                  profile={matchingProfiles[currentProfileIndex]}
                  isExpanded={true}
                  onToggleExpand={() => {}}
                  onSendInterest={() => handleSendInterest(matchingProfiles[currentProfileIndex].user.id)}
                  isSending={sendingInterest === matchingProfiles[currentProfileIndex].user.id}
                  photoUrl={getPhotoUrl(matchingProfiles[currentProfileIndex])}
                  canExpressInterest={userStatus?.canExpressInterest ?? false}
                  myProfile={myProfile}
                />
              )}

              {/* Bottom Navigation */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentProfileIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentProfileIndex === 0}
                  className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </button>
                <span className="text-gray-500 font-medium">
                  {currentProfileIndex + 1} / {matchingProfiles.length}
                </span>
                <button
                  onClick={() => setCurrentProfileIndex(prev => Math.min(matchingProfiles.length - 1, prev + 1))}
                  disabled={currentProfileIndex === matchingProfiles.length - 1}
                  className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </button>
              </div>
            </div>
          )
        ) : activeTab === 'mutual' ? (
          /* Mutual Matches Tab */
          mutualMatches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Mutual Matches Yet</h3>
              <p className="text-gray-600 mb-6">
                When you and another member both express interest in each other,
                you'll see them here with their contact information.
              </p>
              <button
                onClick={() => setActiveTab('matches')}
                className="btn-primary inline-block"
              >
                Browse Matching Profiles
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Heart className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">You have {mutualMatches.length} mutual match{mutualMatches.length > 1 ? 'es' : ''}!</h3>
                    <p className="text-sm text-green-700">Both of you have expressed interest. Contact information is now visible.</p>
                  </div>
                </div>
              </div>
              {mutualMatches.map((profile) => (
                <MatchingProfileCard
                  key={profile.id}
                  profile={profile}
                  isExpanded={true}
                  onToggleExpand={() => {}}
                  onSendInterest={() => {}}
                  isSending={false}
                  photoUrl={getPhotoUrl(profile)}
                  canExpressInterest={true}
                  myProfile={myProfile}
                  onMessage={() => openMessageModal(profile)}
                  onReport={() => openReportModal(profile)}
                />
              ))}
            </div>
          )
        ) : (
          /* Interests Received/Declined/Sent Tab - Same layout as Matching Profiles */
          (() => {
            const profiles = activeTab === 'received' ? receivedInterests :
                            activeTab === 'declined' ? declinedInterests : sentInterests
            const currentIndex = activeTab === 'received' ? currentReceivedIndex :
                                activeTab === 'declined' ? currentDeclinedIndex : currentSentIndex
            const setCurrentIndex = activeTab === 'received' ? setCurrentReceivedIndex :
                                   activeTab === 'declined' ? setCurrentDeclinedIndex : setCurrentSentIndex

            return profiles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No {activeTab === 'received' ? 'Interests Received' :
                      activeTab === 'declined' ? 'Declined Interests' : 'Interests Sent'} Yet
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'received'
                    ? "When someone expresses interest in your profile, you'll see it here."
                    : activeTab === 'declined'
                    ? "Interests you've declined will appear here. You can reconsider them anytime."
                    : "Express interest in matching profiles to see your sent interests here."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Banner for Received Interests */}
                {activeTab === 'received' && (
                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Heart className="h-6 w-6 text-pink-600" />
                      <div>
                        <h3 className="font-semibold text-pink-800">
                          {profiles.length} pending interest{profiles.length > 1 ? 's' : ''} to review!
                        </h3>
                        <p className="text-sm text-pink-700">
                          Review and accept to connect with them.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Banner for Declined Interests */}
                {activeTab === 'declined' && (
                  <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <X className="h-6 w-6 text-gray-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {profiles.length} declined interest{profiles.length > 1 ? 's' : ''}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Changed your mind? You can reconsider any of these profiles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Counter and Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-gray-700">
                    Profile {currentIndex + 1} of {profiles.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex === 0}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentIndex(Math.min(profiles.length - 1, currentIndex + 1))}
                      disabled={currentIndex === profiles.length - 1}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </button>
                  </div>
                </div>

                {/* Single Profile Card - Always expanded */}
                {profiles[currentIndex] && (
                  <MatchingProfileCard
                    key={profiles[currentIndex].id}
                    profile={profiles[currentIndex]}
                    isExpanded={true}
                    onToggleExpand={() => {}}
                    onSendInterest={() => handleSendInterest(profiles[currentIndex].user.id)}
                    isSending={sendingInterest === profiles[currentIndex].user.id}
                    photoUrl={getPhotoUrl(profiles[currentIndex])}
                    canExpressInterest={userStatus?.canExpressInterest ?? false}
                    myProfile={myProfile}
                    matchId={profiles[currentIndex].matchId}
                    matchStatus={profiles[currentIndex].matchStatus}
                    onAccept={() => handleInterestAction(
                      profiles[currentIndex].matchId!,
                      profiles[currentIndex].matchStatus === 'rejected' ? 'reconsider' : 'accept'
                    )}
                    onReject={() => handleInterestAction(profiles[currentIndex].matchId!, 'reject')}
                    isRespondingToInterest={respondingToInterest === profiles[currentIndex].matchId}
                    viewMode={activeTab === 'declined' ? 'received' : activeTab as 'received' | 'sent'}
                  />
                )}

                {/* Bottom Navigation */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Previous
                  </button>
                  <span className="text-gray-500 font-medium">
                    {currentIndex + 1} / {profiles.length}
                  </span>
                  <button
                    onClick={() => setCurrentIndex(Math.min(profiles.length - 1, currentIndex + 1))}
                    disabled={currentIndex === profiles.length - 1}
                    className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
              </div>
            )
          })()
        )}
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessageModal}
        recipientId={messageModal.recipientId}
        recipientName={messageModal.recipientName}
        recipientPhoto={messageModal.recipientPhoto}
        recipientPhotoUrls={messageModal.recipientPhotoUrls}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        reportedUserId={reportModal.reportedUserId}
        reportedUserName={reportModal.reportedUserName}
      />
    </div>
  )
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <MatchesPageContent />
    </Suspense>
  )
}

interface MatchingProfileCardProps {
  profile: MatchProfile
  isExpanded: boolean
  onToggleExpand: () => void
  onSendInterest: () => void
  isSending: boolean
  photoUrl: string | null
  canExpressInterest: boolean
  myProfile: {
    id: string
    gender: string
    profileImageUrl: string | null
    photoUrls: string | null
    userName: string
  } | null
  // For received interests - accept/reject actions
  matchId?: string
  matchStatus?: 'pending' | 'accepted' | 'rejected'
  onAccept?: () => void
  onReject?: () => void
  isRespondingToInterest?: boolean
  viewMode?: 'match' | 'received' | 'sent'
  // Message handler
  onMessage?: () => void
  // Report handler
  onReport?: () => void
}

function MatchingProfileCard({
  profile,
  isExpanded,
  onToggleExpand,
  onSendInterest,
  isSending,
  photoUrl,
  canExpressInterest,
  myProfile,
  matchId,
  matchStatus,
  onAccept,
  onReject,
  isRespondingToInterest,
  viewMode = 'match',
  onMessage,
  onReport,
}: MatchingProfileCardProps) {
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const interestSent = profile.interestStatus?.sentByMe
  const interestReceived = profile.interestStatus?.receivedFromThem
  const isMutual = profile.interestStatus?.mutual

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Get all photos - from photoUrls or fall back to profileImageUrl
  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const allPhotos = extractedPhotos.length > 0
    ? extractedPhotos
    : (validProfileImageUrl ? [validProfileImageUrl] : [])
  const thumbnails = allPhotos
  const carouselPhotos = allPhotos

  // Photo carousel state
  const [photoIndex, setPhotoIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'preferences'>('details')

  // Get my profile photo URL
  const myPhotoUrl = myProfile?.profileImageUrl || null

  // Gender-specific text
  const pronoun = profile.gender === 'male' ? 'He' : 'She'
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
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Column - Photo & Verification */}
        <div className="lg:w-[380px] flex-shrink-0 flex flex-col">
          {/* Photo Carousel */}
          <div className="relative bg-gray-200 h-[280px]">
            {carouselPhotos.length > 0 && !imageError ? (
              <>
                <img
                  src={carouselPhotos[photoIndex]}
                  alt={profile.user.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
                {/* Zoom Button */}
                <button
                  onClick={() => openLightbox(photoIndex)}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                  title="View full size"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                {/* Photo Counter & Navigation */}
                {carouselPhotos.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev - 1 + carouselPhotos.length) % carouselPhotos.length)}
                      className="hover:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span>{photoIndex + 1} of {carouselPhotos.length}</span>
                    <button
                      onClick={() => setPhotoIndex((prev) => (prev + 1) % carouselPhotos.length)}
                      className="hover:text-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-100">
                <span className="text-5xl font-semibold text-primary-600">
                  {getInitials(profile.user.name)}
                </span>
              </div>
            )}
          </div>

          {/* Verifications Section */}
          <div className="bg-white border border-gray-200 rounded-lg m-4 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800">Verifications</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                {profile.approvalStatus === 'approved' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span className={profile.approvalStatus === 'approved' ? 'text-gray-700' : 'text-gray-400'}>
                  Profile Verified by Admin
                </span>
              </div>
              <div className="flex items-center gap-2">
                {profile.user.emailVerified ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span className={profile.user.emailVerified ? 'text-gray-700' : 'text-gray-400'}>
                  Email Verified
                </span>
              </div>
              <div className="flex items-center gap-2">
                {profile.user.phoneVerified ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span className={profile.user.phoneVerified ? 'text-gray-700' : 'text-gray-400'}>
                  Phone Number Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="flex-1 bg-white">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              {/* Name and Quick Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900">{profile.user.name}</h2>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm text-gray-700">
                  <div>{age ? `${age} yrs` : ''}{profile.height ? `, ${formatHeight(profile.height)}` : ''}</div>
                  <div>{profile.maritalStatus || 'Never Married'}</div>
                  <div>{profile.languagesKnown || 'English'}</div>
                  <div>{profile.currentLocation}</div>
                  <div>{profile.caste ? `Hindu, ${profile.caste}` : 'Hindu'}</div>
                  <div>{profile.occupation?.replace(/_/g, ' ')}</div>
                  <div>{profile.qualification}</div>
                  <div>{profile.familyLocation || profile.citizenship}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center gap-3 ml-6">
                {/* For received interests - show Accept/Reject */}
                {viewMode === 'received' && matchStatus === 'pending' ? (
                  <>
                    <button
                      onClick={onAccept}
                      disabled={isRespondingToInterest || !canExpressInterest}
                      className="flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors">
                        {isRespondingToInterest ? (
                          <Loader2 className="h-7 w-7 text-white animate-spin" />
                        ) : (
                          <Check className="h-7 w-7 text-white" />
                        )}
                      </div>
                      <span className="text-xs text-gray-600 mt-1">Accept</span>
                    </button>
                    <button
                      onClick={onReject}
                      disabled={isRespondingToInterest}
                      className="flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-400 hover:bg-gray-500 flex items-center justify-center transition-colors">
                        <X className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-xs text-gray-600 mt-1">Decline</span>
                    </button>
                  </>
                ) : viewMode === 'received' && matchStatus === 'accepted' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
                      <Check className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Accepted</span>
                  </div>
                ) : viewMode === 'received' && matchStatus === 'rejected' ? (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={onAccept}
                      disabled={isRespondingToInterest}
                      className="flex flex-col items-center"
                      title="Changed your mind? Accept this interest"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors">
                        {isRespondingToInterest ? (
                          <Loader2 className="h-7 w-7 text-white animate-spin" />
                        ) : (
                          <RotateCcw className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <span className="text-xs text-gray-600 mt-1">Reconsider</span>
                    </button>
                  </div>
                ) : viewMode === 'sent' ? (
                  /* For sent interests - show status */
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      matchStatus === 'accepted' ? 'bg-green-600' :
                      matchStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      {matchStatus === 'accepted' ? (
                        <Check className="h-7 w-7 text-white" />
                      ) : matchStatus === 'rejected' ? (
                        <X className="h-7 w-7 text-white" />
                      ) : (
                        <Clock className="h-7 w-7 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">
                      {matchStatus === 'accepted' ? 'Accepted' :
                       matchStatus === 'rejected' ? 'Declined' : 'Pending'}
                    </span>
                  </div>
                ) : isMutual ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
                      <Check className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Connected</span>
                  </div>
                ) : interestSent ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Clock className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Interest Sent</span>
                  </div>
                ) : interestReceived ? (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending || !canExpressInterest}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-pink-500 hover:bg-pink-600 flex items-center justify-center transition-colors">
                      {isSending ? (
                        <Loader2 className="h-7 w-7 text-white animate-spin" />
                      ) : (
                        <Heart className="h-7 w-7 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Likes You - Accept</span>
                  </button>
                ) : !canExpressInterest ? (
                  <Link href="/profile" className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gray-400 hover:bg-gray-500 flex items-center justify-center transition-colors">
                      <Lock className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 mt-1 text-center leading-tight">Get Verified<br/>to Express Interest</span>
                  </Link>
                ) : (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#E91E63] hover:bg-[#C2185B] flex items-center justify-center transition-colors">
                      {isSending ? (
                        <Loader2 className="h-7 w-7 text-white animate-spin" />
                      ) : (
                        <Heart className="h-7 w-7 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Express Interest</span>
                  </button>
                )}

                {onMessage && (
                  <button
                    onClick={onMessage}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors">
                      <MessageCircle className="h-6 w-6 text-gray-500" />
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Message</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'text-[#E8847C] border-[#E8847C]'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Detailed Profile
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'text-[#E8847C] border-[#E8847C]'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Partner Preferences
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[500px] overflow-y-auto">
            {activeTab === 'details' ? (
              /* Detailed Profile Tab */
              <div className="space-y-6">
                {/* About Section */}
                {profile.aboutMe && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 border-l-2 border-gray-100 pl-4 -ml-1">
                      <h3 className="text-lg font-semibold text-[#E8847C] mb-2">About {profile.user.name}</h3>
                      <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
                    </div>
                  </div>
                )}

                {/* Personal Details Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-gray-100 pl-4 -ml-1">
                    <h3 className="text-lg font-semibold text-[#E8847C] mb-3">Personal Details</h3>
                    <div className="space-y-2 text-sm">
                      {profile.dateOfBirth && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Date of Birth</span>
                          <span className="text-gray-800">{(() => {
                            const dob = profile.dateOfBirth
                            if (dob && dob.match(/^\d{4}[-/]\d{2}[-/]\d{2}$/)) {
                              const parts = dob.split(/[-/]/)
                              return `${parts[1]}/${parts[2]}/${parts[0]}`
                            }
                            return dob
                          })()}</span>
                        </div>
                      )}
                      {profile.height && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Height</span>
                          <span className="text-gray-800">{formatHeight(profile.height)}</span>
                        </div>
                      )}
                      {profile.weight && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Weight</span>
                          <span className="text-gray-800">{profile.weight}</span>
                        </div>
                      )}
                      {profile.maritalStatus && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Marital Status</span>
                          <span className="text-gray-800">{profile.maritalStatus}</span>
                        </div>
                      )}
                      {profile.bloodGroup && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Blood Group</span>
                          <span className="text-gray-800">{profile.bloodGroup}</span>
                        </div>
                      )}
                      {profile.dietaryPreference && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Diet</span>
                          <span className="text-gray-800">{profile.dietaryPreference}</span>
                        </div>
                      )}
                      {profile.healthInfo && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Health Info</span>
                          <span className="text-gray-800">{profile.healthInfo}</span>
                        </div>
                      )}
                      {profile.anyDisability && profile.anyDisability !== 'none' && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Disability</span>
                          <span className="text-gray-800">{profile.disabilityDetails || profile.anyDisability}</span>
                        </div>
                      )}
                      {profile.createdBy && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Profile Created By</span>
                          <span className="text-gray-800">{profile.createdBy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Religion & Astro Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-gray-100 pl-4 -ml-1">
                    <h3 className="text-lg font-semibold text-[#E8847C] mb-3">Religion & Astro</h3>
                    <div className="space-y-2 text-sm">
                      {profile.religion && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Religion</span>
                          <span className="text-gray-800">{profile.religion}</span>
                        </div>
                      )}
                      {profile.caste && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Caste</span>
                          <span className="text-gray-800">{profile.caste}</span>
                        </div>
                      )}
                      {profile.gotra && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Gotra</span>
                          <span className="text-gray-800">{profile.gotra}</span>
                        </div>
                      )}
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
                      {profile.timeOfBirth && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Time of Birth</span>
                          <span className="text-gray-800">{profile.timeOfBirth}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-32">Manglik</span>
                        <span className="text-gray-800">
                          {profile.manglik === 'yes' ? 'Yes' : profile.manglik === 'no' ? 'No' : "Don't Know"}
                        </span>
                      </div>
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
                    </div>
                  </div>
                </div>

                {/* Education & Career Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-gray-100 pl-4 -ml-1">
                    <h3 className="text-lg font-semibold text-[#E8847C] mb-3">Education & Career</h3>
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
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-gray-100 pl-4 -ml-1">
                    <h3 className="text-lg font-semibold text-[#E8847C] mb-3">Family Details</h3>
                    <div className="space-y-2 text-sm">
                      {profile.fatherName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Father's Name</span>
                          <span className="text-gray-800">{profile.fatherName}</span>
                        </div>
                      )}
                      {profile.motherName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Mother's Name</span>
                          <span className="text-gray-800">{profile.motherName}</span>
                        </div>
                      )}
                      {profile.siblings && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Siblings</span>
                          <span className="text-gray-800">{profile.siblings}</span>
                        </div>
                      )}
                      {profile.familyLocation && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Family Location</span>
                          <span className="text-gray-800">{profile.familyLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Background Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-gray-100 pl-4 -ml-1">
                    <h3 className="text-lg font-semibold text-[#E8847C] mb-3">Location & Background</h3>
                    <div className="space-y-2 text-sm">
                      {profile.currentLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-500" />
                          <span className="text-gray-800">{profile.currentLocation}{profile.country ? `, ${profile.country}` : ''}</span>
                        </div>
                      )}
                      {(profile.citizenship || profile.grewUpIn) && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-32">Citizenship / Grew Up</span>
                          <span className="text-gray-800">{profile.citizenship || 'Not specified'}{profile.grewUpIn ? ` / ${profile.grewUpIn}` : ''}</span>
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
                          <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">View Profile</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info (only for mutual matches) */}
                {isMutual && profile.user.email && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full border-2 border-green-300 bg-green-50 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 border-l-2 border-green-200 pl-4 -ml-1">
                      <h3 className="text-lg font-semibold text-green-600 mb-2">Contact Information</h3>
                      <p className="text-green-700 text-sm mb-3">You both expressed interest - connect now!</p>
                      <div className="space-y-2 text-sm">
                        {profile.user.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-32">Email</span>
                            <span className="text-gray-800 font-medium">{profile.user.email}</span>
                          </div>
                        )}
                        {profile.user.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-32">Phone</span>
                            <span className="text-gray-800 font-medium">{profile.user.phone}</span>
                          </div>
                        )}
                      </div>
                      {/* Report Problem Button */}
                      {onReport && (
                        <button
                          onClick={onReport}
                          className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Report a Problem
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Partner Preferences Tab - Combined View */
              <div className="space-y-4">
                {/* Header with both photos and match scores */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
                  {/* Their photo and score */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex-shrink-0 mb-2">
                      {photoUrl ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E8847C] shadow-md bg-gray-100">
                          <img
                            src={photoUrl}
                            alt={profile.user.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center border-2 border-[#E8847C] shadow-md">
                          <span className="text-lg font-semibold text-primary-600">
                            {getInitials(profile.user.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{profile.user.name.split(' ')[0]}</span>
                    {profile.theirMatchScore && (
                      <span className="text-xs text-[#E8847C] mt-1">
                        You match {profile.theirMatchScore.totalScore}/{profile.theirMatchScore.maxScore}
                      </span>
                    )}
                  </div>

                  {/* Match indicator */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-1">
                      <Heart className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-xs text-green-600 font-medium">Mutual Match</span>
                  </div>

                  {/* My photo and score */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex-shrink-0 mb-2">
                      {myPhotoUrl ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 shadow-md bg-gray-100">
                          <img
                            src={myPhotoUrl}
                            alt="You"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 shadow-md">
                          <span className="text-lg font-semibold text-blue-600">
                            {getInitials(myProfile?.userName || 'You')}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">You</span>
                    {profile.matchScore && (
                      <span className="text-xs text-blue-600 mt-1">
                        {pronoun} matches {profile.matchScore.totalScore}/{profile.matchScore.maxScore}
                      </span>
                    )}
                  </div>
                </div>

                {/* Combined Preferences Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-2 font-semibold text-gray-600 w-20">Criteria</th>
                        <th className="text-left py-2 px-2 font-semibold text-[#E8847C]">{possessive} Pref</th>
                        <th className="text-center py-2 px-1 font-semibold text-[#E8847C] w-12">
                          <span className="text-xs">You</span>
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-blue-600">Your Pref</th>
                        <th className="text-center py-2 pl-1 font-semibold text-blue-600 w-12">
                          <span className="text-xs">{pronoun}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(profile.theirMatchScore?.criteria || profile.matchScore?.criteria || []).map((criterion: any, index: number) => {
                        const theirCriterion = profile.theirMatchScore?.criteria?.[index]
                        const myCriterion = profile.matchScore?.criteria?.[index]
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-2 pr-2 font-medium text-gray-700">{criterion.name}</td>
                            <td className="py-2 px-2 text-gray-600">{theirCriterion?.seekerPref || "Any"}</td>
                            <td className="py-2 px-1 text-center">
                              {theirCriterion?.matched ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-gray-600">{myCriterion?.seekerPref || "Any"}</td>
                            <td className="py-2 pl-1 text-center">
                              {myCriterion?.matched ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ideal Partner Description */}
                {profile.idealPartnerDesc && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-[#E8847C] text-sm font-medium mb-1">{possessive} Ideal Partner Description</div>
                    <p className="text-gray-700 text-sm">{profile.idealPartnerDesc}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Button */}
            {viewMode === 'received' && matchStatus === 'pending' ? (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={onReject}
                    disabled={isRespondingToInterest}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                    Decline
                  </button>
                  {canExpressInterest ? (
                    <button
                      onClick={onAccept}
                      disabled={isRespondingToInterest}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isRespondingToInterest ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                      Accept Interest
                    </button>
                  ) : (
                    <Link
                      href="/profile"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                      <Lock className="h-5 w-5" />
                      Get Verified to Accept
                    </Link>
                  )}
                </div>
              </div>
            ) : viewMode === 'sent' ? (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg ${
                  matchStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                  matchStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {matchStatus === 'accepted' ? (
                    <><Check className="h-5 w-5" /> Interest Accepted!</>
                  ) : matchStatus === 'rejected' ? (
                    <><X className="h-5 w-5" /> Interest Declined</>
                  ) : (
                    <><Clock className="h-5 w-5" /> Waiting for Response</>
                  )}
                </div>
              </div>
            ) : !isMutual && !interestSent && viewMode === 'match' && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                {canExpressInterest ? (
                  <button
                    onClick={onSendInterest}
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E91E63] hover:bg-[#C2185B] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart className="h-5 w-5" />
                    )}
                    {interestReceived ? 'Accept Interest' : 'Express Interest'}
                  </button>
                ) : (
                  <Link
                    href="/profile"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Lock className="h-5 w-5" />
                    Get Verified to Express Interest
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
              className="absolute left-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70"
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
              className="absolute right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70"
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

interface InterestCardProps {
  match: InterestProfile
  type: 'received' | 'sent'
  onAccept: () => void
  onReject: () => void
  photoUrl: string | null
  canAccept: boolean
}

function InterestCard({ match, type, onAccept, onReject, photoUrl, canAccept }: InterestCardProps) {
  const age = match.dateOfBirth ? calculateAge(match.dateOfBirth) : null

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    accepted: <Check className="h-4 w-4" />,
    rejected: <X className="h-4 w-4" />,
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Photo */}
          {photoUrl ? (
            <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              <img
                src={photoUrl}
                alt={match.user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary-600">
                {getInitials(match.user.name)}
              </span>
            </div>
          )}

          {/* Info */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{match.user.name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[match.matchStatus]}`}>
                {statusIcons[match.matchStatus]}
                <span className="ml-1 capitalize">{match.matchStatus}</span>
              </span>
            </div>
            <p className="text-gray-600">
              {age} yrs{match.height && `, ${formatHeight(match.height)}`}
            </p>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              {match.currentLocation && (
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {match.currentLocation}
                </span>
              )}
              {match.occupation && (
                <span className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {match.occupation.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {type === 'received' && match.matchStatus === 'pending' && (
            canAccept ? (
              <>
                <button
                  onClick={onReject}
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                  title="Reject"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  onClick={onAccept}
                  className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                  title="Accept"
                >
                  <Check className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                <Lock className="h-4 w-4 mr-2" />
                Get Verified to Accept
              </Link>
            )
          )}
          {match.matchStatus === 'accepted' && (
            <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </button>
          )}
          <Link
            href={`/profile/${match.id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
