'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Loader2,
  RotateCcw,
  Sparkles,
  Search,
  Send,
  Inbox,
  Users,
  Clock,
  Eye,
  XCircle,
  MessageCircle,
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import MessageModal from '@/components/MessageModal'
import { NearMatchesSection } from '@/components/NearMatchCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface FeedProfile extends ProfileData {
  approvalStatus?: string
}

type TabType = 'matches' | 'sent' | 'received' | 'connections' | 'passed'

function FeedPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [profiles, setProfiles] = useState<FeedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null)
  const [, setLikedYouCount] = useState(0)
  const [userStatus, setUserStatus] = useState<{
    isApproved: boolean
    canExpressInterest: boolean
    canAcceptInterest?: boolean
  } | null>(null)
  const [showMatchModal, setShowMatchModal] = useState<FeedProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('matches')
  const [sentInterests, setSentInterests] = useState<any[]>([])
  const [receivedInterests, setReceivedInterests] = useState<any[]>([])
  const [passedProfiles, setPassedProfiles] = useState<any[]>([])
  const [interestsLoading, setInterestsLoading] = useState(false)
  const [passedLoading, setPassedLoading] = useState(false)
  const [reconsidering, setReconsidering] = useState<string | null>(null)
  const [hasPaid, setHasPaid] = useState(false)
  const [connections, setConnections] = useState<FeedProfile[]>([])
  const [hasConnections, setHasConnections] = useState(false)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [messageRecipient, setMessageRecipient] = useState<{ id: string; name: string; photo?: string | null } | null>(null)
  const [nearMatches, setNearMatches] = useState<any[]>([])
  const [showNearMatches, setShowNearMatches] = useState(false)
  const [myPreferences, setMyPreferences] = useState<any>(null)
  const [withdrawConfirmInterest, setWithdrawConfirmInterest] = useState<any | null>(null)
  const [withdrawingSentId, setWithdrawingSentId] = useState<string | null>(null)

  const canAccess = !!session || (isAdminView && isAdmin)

  // Read tab from URL query param
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['matches', 'sent', 'received', 'connections', 'passed'].includes(tab)) {
      setActiveTab(tab as TabType)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'unauthenticated') {
      if (!isAdminView) {
        router.push('/login')
      } else if (adminChecked && !isAdmin) {
        router.push('/login')
      }
    }
  }, [status, router, isAdminView, adminChecked, isAdmin])

  // Check if photo upload is required (profile exists but no photos uploaded)
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView) return

    fetch('/api/profile/completion-status')
      .then(res => res.json())
      .then(data => {
        // If profile exists but photos not uploaded, redirect to photos page
        if (data.hasProfile && !data.hasPhotos && data.signupStep < 9) {
          router.push(`/profile/photos?profileId=${data.profileId}&fromSignup=true`)
        }
      })
      .catch(() => {})
  }, [status, isAdminView, router])

  useEffect(() => {
    if (canAccess) {
      fetchProfiles()
      fetchInterests()
      fetchPassedProfiles()
    }
  }, [canAccess, viewAsUser])

  const fetchInterests = async () => {
    setInterestsLoading(true)
    try {
      const [sentRes, receivedRes] = await Promise.all([
        fetch(buildApiUrl('/api/interest?type=sent')),
        fetch(buildApiUrl('/api/interest?type=received&status=pending'))
      ])

      if (sentRes.ok) {
        const sentData = await sentRes.json()
        setSentInterests(sentData.interests || [])
      }

      if (receivedRes.ok) {
        const receivedData = await receivedRes.json()
        setReceivedInterests(receivedData.interests || [])
      }
    } catch (error) {
      console.error('Error fetching interests:', error)
    } finally {
      setInterestsLoading(false)
    }
  }

  const fetchPassedProfiles = async () => {
    setPassedLoading(true)
    try {
      const response = await fetch(buildApiUrl('/api/matches/decline'))
      const data = await response.json()
      setPassedProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching passed profiles:', error)
    } finally {
      setPassedLoading(false)
    }
  }

  const handleReconsider = async (declinedUserId: string) => {
    setReconsidering(declinedUserId)
    try {
      await fetch(buildApiUrl(`/api/matches/decline?declinedUserId=${declinedUserId}`), {
        method: 'DELETE',
      })
      setPassedProfiles(prev => prev.filter(p => p.userId !== declinedUserId))
      // Refresh profiles to show the reconsidered one
      fetchProfiles()
    } catch (error) {
      console.error('Error reconsidering profile:', error)
    } finally {
      setReconsidering(null)
    }
  }

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const [matchesRes, paymentRes] = await Promise.all([
        fetch(buildApiUrl('/api/matches/auto')),
        fetch(buildApiUrl('/api/payment/status'))
      ])

      const data = await matchesRes.json()

      setProfiles(data.freshMatches || [])
      setLikedYouCount(data.stats?.likedYouCount || 0)
      setConnections(data.mutualMatches || [])
      setHasConnections((data.mutualMatches?.length || 0) > 0)
      setNearMatches(data.nearMatches || [])
      setShowNearMatches(data.showNearMatches || false)
      setMyPreferences(data.myProfile || null)

      if (data.userStatus) {
        setUserStatus(data.userStatus)
      }

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json()
        setHasPaid(paymentData.hasPaid === true)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (profile: FeedProfile) => {
    setLoadingProfileId(profile.id)

    try {
      const response = await fetch(buildApiUrl('/api/interest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      })

      const data = await response.json()

      if (response.ok) {
        // Check if it's a mutual match
        if (data.mutual || profile.theyLikedMeFirst) {
          setShowMatchModal(profile)
        }
        // Remove profile from list
        removeProfile(profile.id)
        // Refresh interests count
        fetchInterests()
      }
    } catch (error) {
      console.error('Error sending like:', error)
    } finally {
      setLoadingProfileId(null)
    }
  }

  const handlePass = async (profile: FeedProfile) => {
    setLoadingProfileId(profile.id)

    try {
      await fetch(buildApiUrl('/api/matches/decline'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declinedUserId: profile.userId }),
      })
      removeProfile(profile.id)
    } catch (error) {
      console.error('Error passing profile:', error)
    } finally {
      setLoadingProfileId(null)
    }
  }

  const removeProfile = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId))
  }

  const handleWithdrawInterest = async (connection: FeedProfile) => {
    if (!connection.userId) return
    setWithdrawingId(connection.id)

    try {
      // Add to declined list so they appear in Passed tab
      await fetch(buildApiUrl('/api/matches/decline'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declinedUserId: connection.userId }),
      })

      // Remove from local connections state
      setConnections((prev) => prev.filter((c) => c.id !== connection.id))
      setHasConnections(connections.length > 1)
      // Refresh passed profiles so the withdrawn connection appears there
      fetchPassedProfiles()
    } catch (error) {
      console.error('Error withdrawing interest:', error)
    } finally {
      setWithdrawingId(null)
    }
  }

  const handleWithdrawSentInterest = async () => {
    if (!withdrawConfirmInterest) return

    const interest = withdrawConfirmInterest
    setWithdrawingSentId(interest.id)

    try {
      // Call the withdraw API to remove the interest
      await fetch(buildApiUrl('/api/interest'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId: interest.id, action: 'withdraw' }),
      })

      // Add to declined list so they appear in Passed tab
      if (interest.receiver?.id) {
        await fetch(buildApiUrl('/api/matches/decline'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ declinedUserId: interest.receiver.id }),
        })
      }

      // Remove from local sent interests state
      setSentInterests((prev) => prev.filter((i) => i.id !== interest.id))

      // Refresh passed profiles so the withdrawn interest appears there
      fetchPassedProfiles()
    } catch (error) {
      console.error('Error withdrawing sent interest:', error)
    } finally {
      setWithdrawingSentId(null)
      setWithdrawConfirmInterest(null)
    }
  }

  // Filter profiles by search
  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.user.name.toLowerCase().includes(query) ||
      p.currentLocation?.toLowerCase().includes(query) ||
      p.occupation?.toLowerCase().includes(query) ||
      p.qualification?.toLowerCase().includes(query) ||
      p.caste?.toLowerCase().includes(query) ||
      p.community?.toLowerCase().includes(query) ||
      p.subCommunity?.toLowerCase().includes(query)
    )
  })

  // Separate profiles into "liked you" and "discover"
  const likedYouProfiles = filteredProfiles.filter((p) => p.theyLikedMeFirst)
  const discoverProfiles = filteredProfiles.filter((p) => !p.theyLikedMeFirst)

  if (status === 'loading' || loading || (isAdminView && !adminChecked)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <DirectoryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">My Matches</h1>
            <p className="text-gray-600 text-sm">
              {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'} matching your preferences
            </p>
          </div>

          {/* Verification Banner for unpaid/unapproved users */}
          {!hasPaid && !userStatus?.isApproved && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Eye className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900">Get Verified to See Full Profiles</h3>
                    <p className="text-sm text-primary-700 mt-0.5">
                      Unlock photos, names, and send interests to your matches.
                    </p>
                  </div>
                </div>
                <Link
                  href={buildUrl('/get-verified')}
                  className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Get Verified
                </Link>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0.5 sm:gap-1 p-1 bg-gray-100 rounded-lg mb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Matches</span>
              <span className="bg-primary-100 text-primary-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{profiles.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Sent</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{sentInterests.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Inbox className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Received</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{receivedInterests.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'connections'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Heart className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Connections</span>
              <span className="bg-green-100 text-green-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{connections.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('passed')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'passed'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <RotateCcw className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Passed</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{passedProfiles.length}</span>
            </button>
          </div>

          {/* Search Bar - only show on matches tab */}
          {activeTab === 'matches' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location, occupation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'matches' && (
          <>
            {/* No Profiles Message */}
            {filteredProfiles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No Matching Profiles' : 'No Matches Found'}
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : "Sorry, we do not have matches that fit your criteria yet. Try editing your partner preferences and changing your deal breakers to see more profiles."}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="btn-secondary text-sm py-2"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <>
                      {hasConnections && (
                        <button
                          onClick={() => setActiveTab('connections')}
                          className="btn-primary text-sm py-2"
                        >
                          View Connections
                        </button>
                      )}
                      {passedProfiles.length > 0 && (
                        <Link href={buildUrl('/reconsider')} className="btn-secondary text-sm py-2">
                          Reconsider Passed
                        </Link>
                      )}
                      <Link
                        href={buildUrl('/profile?tab=preferences&edit=preferences_1')}
                        className="btn-secondary text-sm py-2"
                      >
                        Edit Partner Preferences
                      </Link>
                    </>
                  )}
                </div>

                {/* Near Matches Section for 0 exact matches */}
                {!searchQuery && (
                  <NearMatchesSection
                    nearMatches={nearMatches}
                    showNearMatches={showNearMatches}
                    isVerified={userStatus?.isApproved ?? false}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Liked You Section */}
                {likedYouProfiles.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        They Like You ({likedYouProfiles.length})
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {likedYouProfiles.map((profile) => (
                        <DirectoryCard
                          key={profile.id}
                          profile={profile}
                          onLike={() => handleLike(profile)}
                          onPass={() => handlePass(profile)}
                          isLoading={loadingProfileId === profile.id}
                          canLike={userStatus?.canExpressInterest ?? false}
                          isRestricted={!userStatus?.isApproved}
                          hasPaid={hasPaid}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Discover Section */}
                {discoverProfiles.length > 0 && (
                  <section>
                    {likedYouProfiles.length > 0 && (
                      <h2 className="text-lg font-bold text-gray-900 mb-3">
                        Discover More ({discoverProfiles.length})
                      </h2>
                    )}
                    <div className="space-y-2">
                      {discoverProfiles.map((profile) => (
                        <DirectoryCard
                          key={profile.id}
                          profile={profile}
                          onLike={() => handleLike(profile)}
                          onPass={() => handlePass(profile)}
                          isLoading={loadingProfileId === profile.id}
                          canLike={userStatus?.canExpressInterest ?? false}
                          isRestricted={!userStatus?.isApproved}
                          hasPaid={hasPaid}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Near Matches Section - Show when user has < 3 exact matches */}
                <NearMatchesSection
                  nearMatches={nearMatches}
                  showNearMatches={showNearMatches}
                  isVerified={userStatus?.isApproved ?? false}
                />
              </div>
            )}
          </>
        )}

        {/* Sent Interests Tab */}
        {activeTab === 'sent' && (
          <div>
            {interestsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <DirectoryCardSkeleton key={i} />
                ))}
              </div>
            ) : sentInterests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <Send className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interests Sent</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  When you express interest in someone, they will appear here.
                </p>
                <button
                  onClick={() => setActiveTab('matches')}
                  className="btn-primary text-sm py-2"
                >
                  Browse Matches
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Verification Prompt when someone accepted your interest */}
                {!userStatus?.isApproved && sentInterests.some(i => i.status === 'accepted') && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-3">
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900">Someone accepted your interest!</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Great news! A match is waiting to connect with you. Get verified to view their profile and start messaging.
                        </p>
                        <Link
                          href={buildUrl('/get-verified')}
                          className="inline-flex items-center mt-2 text-sm font-medium text-green-700 hover:text-green-800"
                        >
                          Get Verified Now →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                {/* Verification Prompt for pending interests (only if no accepted interests shown above) */}
                {!userStatus?.isApproved && sentInterests.some(i => i.status === 'pending') && !sentInterests.some(i => i.status === 'accepted') && (
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4 mb-3">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary-900">Get verified to connect faster</h4>
                        <p className="text-sm text-primary-700 mt-1">
                          Your interests are waiting! Once you&apos;re verified, matches can accept and you can start messaging.
                        </p>
                        <Link
                          href={buildUrl('/get-verified')}
                          className="inline-flex items-center mt-2 text-sm font-medium text-primary-700 hover:text-primary-800"
                        >
                          Get Verified Now →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                {sentInterests.map((interest) => (
                  <div
                    key={interest.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        href={buildUrl(`/profile/${interest.receiver?.profile?.id}`)}
                        className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
                      >
                        {interest.receiver?.profile?.profileImageUrl ? (
                          <img
                            src={interest.receiver.profile.profileImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-semibold">
                            {interest.receiver?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <Link
                        href={buildUrl(`/profile/${interest.receiver?.profile?.id}`)}
                        className="flex-1 min-w-0"
                      >
                        <h3 className="font-semibold text-gray-900 truncate">{interest.receiver?.name}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {[interest.receiver?.profile?.currentLocation, interest.receiver?.profile?.country].filter(Boolean).join(', ') || 'Location not specified'}
                          {interest.receiver?.profile?.occupation && ` • ${interest.receiver.profile.occupation}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Sent {new Date(interest.createdAt).toLocaleDateString()}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          interest.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          interest.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {interest.status === 'pending' ? 'Pending' :
                           interest.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </div>
                        {interest.status === 'pending' && (
                          <button
                            onClick={() => setWithdrawConfirmInterest(interest)}
                            disabled={withdrawingSentId === interest.id}
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors disabled:opacity-50"
                          >
                            {withdrawingSentId === interest.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Withdraw'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Received Interests Tab */}
        {activeTab === 'received' && (
          <div>
            {interestsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <DirectoryCardSkeleton key={i} />
                ))}
              </div>
            ) : receivedInterests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Interests</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  When someone expresses interest in you, they will appear here.
                </p>
                <button
                  onClick={() => setActiveTab('matches')}
                  className="btn-primary text-sm py-2"
                >
                  Browse Matches
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Verification Required Banner */}
                {!userStatus?.isApproved && receivedInterests.length > 0 && (
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4 mb-2">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary-900">Get verified to view photos and accept</h4>
                        <p className="text-sm text-primary-700 mt-1">
                          See full photos, names, LinkedIn profiles, and accept interests.
                        </p>
                        <Link
                          href={buildUrl('/get-verified')}
                          className="inline-flex items-center mt-2 text-sm font-medium text-primary-700 hover:text-primary-800"
                        >
                          Get Verified Now →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                {receivedInterests.map((interest) => (
                  <div
                    key={interest.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        href={buildUrl(`/profile/${interest.sender?.profile?.id}`)}
                        className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
                      >
                        {interest.sender?.profile?.profileImageUrl ? (
                          <img
                            src={interest.sender.profile.profileImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-semibold">
                            {interest.sender?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <Link href={buildUrl(`/profile/${interest.sender?.profile?.id}`)} className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{interest.sender?.name}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {[interest.sender?.profile?.currentLocation, interest.sender?.profile?.country].filter(Boolean).join(', ') || 'Location not specified'}
                          {interest.sender?.profile?.occupation && ` • ${interest.sender.profile.occupation}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Received {new Date(interest.createdAt).toLocaleDateString()}
                        </p>
                      </Link>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <div className="group relative">
                            <button
                              onClick={async () => {
                                if (!userStatus?.isApproved) return
                                try {
                                  const res = await fetch(buildApiUrl('/api/interest'), {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ interestId: interest.id, action: 'accept' })
                                  })
                                  if (res.ok) {
                                    fetchInterests()
                                  }
                                } catch (err) {
                                  console.error('Error accepting interest:', err)
                                }
                              }}
                              disabled={!userStatus?.isApproved}
                              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                userStatus?.isApproved
                                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Accept
                            </button>
                            {!userStatus?.isApproved && (
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg max-w-[200px]">
                                  <div className="font-semibold">Verification Required</div>
                                  <div className="text-gray-300">Get verified to accept interests</div>
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(buildApiUrl('/api/interest'), {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ interestId: interest.id, action: 'reject' })
                                })
                                if (res.ok) {
                                  fetchInterests()
                                }
                              } catch (err) {
                                console.error('Error declining interest:', err)
                              }
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                          >
                            Decline
                          </button>
                        </div>
                        {!userStatus?.isApproved && (
                          <Link
                            href={buildUrl('/get-verified')}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Get verified to accept →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <DirectoryCardSkeleton key={i} />
                ))}
              </div>
            ) : connections.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connections Yet</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  When you and someone both express interest, they&apos;ll appear here as a connection.
                </p>
                <button
                  onClick={() => setActiveTab('matches')}
                  className="btn-primary text-sm py-2"
                >
                  Browse Matches
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Link href={buildUrl(`/profile/${connection.id}`)} className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 ring-2 ring-green-400 ring-offset-2">
                          {connection.profileImageUrl ? (
                            <img
                              src={connection.profileImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-semibold">
                              {connection.user?.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{connection.user?.name}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            {[connection.currentLocation, connection.country].filter(Boolean).join(', ') || 'Location not specified'}
                            {connection.occupation && ` • ${connection.occupation}`}
                          </p>
                          {connection.matchScore && (
                            <p className="text-xs text-green-600 mt-1">
                              {connection.matchScore.percentage}% match
                            </p>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Connected
                        </span>
                        <div className="group relative">
                          <button
                            onClick={() => handleWithdrawInterest(connection)}
                            disabled={withdrawingId === connection.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Withdraw Interest"
                          >
                            {withdrawingId === connection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                          <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                              Withdraw Interest
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passed Profiles Tab */}
        {activeTab === 'passed' && (
          <div>
            {passedLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <DirectoryCardSkeleton key={i} />
                ))}
              </div>
            ) : passedProfiles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <RotateCcw className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Passed Profiles</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  You haven&apos;t passed on any profiles yet. When you do, they&apos;ll appear here.
                </p>
                <button
                  onClick={() => setActiveTab('matches')}
                  className="btn-primary text-sm py-2"
                >
                  Browse Matches
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {passedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        href={buildUrl(`/profile/${profile.id}`)}
                        className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
                      >
                        {profile.profileImageUrl ? (
                          <img
                            src={profile.profileImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-semibold">
                            {profile.user?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <Link href={buildUrl(`/profile/${profile.id}`)} className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{profile.user?.name}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {[profile.currentLocation, profile.country].filter(Boolean).join(', ') || 'Location not specified'}
                          {profile.occupation && ` • ${profile.occupation}`}
                        </p>
                        {profile.declinedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Passed on {new Date(profile.declinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </Link>
                      <div className="flex gap-2">
                        {/* View Messages Button */}
                        <div className="group relative">
                          <button
                            onClick={() => setMessageRecipient({
                              id: profile.userId,
                              name: profile.user?.name || 'Unknown',
                              photo: profile.profileImageUrl,
                            })}
                            className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-800 transition-colors"
                          >
                            <MessageCircle className="h-5 w-5" />
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                              View Messages
                            </div>
                          </div>
                        </div>
                        {/* Reconsider Button */}
                        <div className="group relative">
                          <button
                            onClick={() => handleReconsider(profile.userId)}
                            disabled={reconsidering === profile.userId}
                            className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {reconsidering === profile.userId ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-5 w-5" />
                            )}
                            Bring Back
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                              <div className="font-semibold">Reconsider Profile</div>
                              <div className="text-gray-300">Add back to your matches</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Match Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full animate-in zoom-in-95">
            <div className="relative">
              <Heart className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-pulse" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute top-0 right-1/4 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">It&apos;s a Match!</h2>
            <p className="text-gray-600 mb-6">
              You and <span className="font-semibold">{showMatchModal.user.name}</span> liked each other!
              You can now message them.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMatchModal(null)
                  setActiveTab('connections')
                }}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all"
              >
                View Connections
              </button>
              <button
                onClick={() => setShowMatchModal(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal for viewing messages from Passed tab */}
      {messageRecipient && (
        <MessageModal
          isOpen={!!messageRecipient}
          onClose={() => setMessageRecipient(null)}
          recipientId={messageRecipient.id}
          recipientName={messageRecipient.name}
          recipientPhoto={messageRecipient.photo}
        />
      )}

      {/* Withdraw Interest Confirmation Modal */}
      {withdrawConfirmInterest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Withdraw Interest</h3>
              <p className="text-gray-600">
                Are you sure you want to withdraw your interest in{' '}
                <span className="font-medium">{withdrawConfirmInterest.receiver?.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                They will be moved to your Passed list.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setWithdrawConfirmInterest(null)}
                disabled={withdrawingSentId === withdrawConfirmInterest.id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawSentInterest}
                disabled={withdrawingSentId === withdrawConfirmInterest.id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawingSentId === withdrawConfirmInterest.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <FeedPageContent />
    </Suspense>
  )
}
