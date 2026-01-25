'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface FeedProfile extends ProfileData {
  approvalStatus?: string
}

type TabType = 'matches' | 'sent' | 'received' | 'passed'

function FeedPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
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
  const [hasConnections, setHasConnections] = useState(false)

  const canAccess = !!session || (isAdminView && isAdmin)

  useEffect(() => {
    if (status === 'unauthenticated') {
      if (!isAdminView) {
        router.push('/login')
      } else if (adminChecked && !isAdmin) {
        router.push('/login')
      }
    }
  }, [status, router, isAdminView, adminChecked, isAdmin])

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
      setHasConnections((data.mutualMatches?.length || 0) > 0)

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
              {receivedInterests.length > 0 && (
                <span className="bg-primary-100 text-primary-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{receivedInterests.length}</span>
              )}
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
              {passedProfiles.length > 0 && (
                <span className="bg-gray-200 text-gray-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{passedProfiles.length}</span>
              )}
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
                        <Link href={buildUrl('/connections')} className="btn-primary text-sm py-2">
                          View Connections
                        </Link>
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
                {sentInterests.map((interest) => (
                  <Link
                    key={interest.id}
                    href={buildUrl(`/profile/${interest.receiver?.profile?.id}`)}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{interest.receiver?.name}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {interest.receiver?.profile?.currentLocation || 'Location not specified'}
                          {interest.receiver?.profile?.occupation && ` • ${interest.receiver.profile.occupation}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Sent {new Date(interest.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        interest.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        interest.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {interest.status === 'pending' ? 'Pending' :
                         interest.status === 'accepted' ? 'Accepted' : 'Declined'}
                      </div>
                    </div>
                  </Link>
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
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800">Awaiting Admin Approval</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Your profile is pending verification. Once approved (typically 24-48 hours), you&apos;ll be able to accept interests and connect with matches.
                        </p>
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
                          {interest.sender?.profile?.currentLocation || 'Location not specified'}
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
                            href={buildUrl('/payment')}
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
                          {profile.currentLocation || 'Location not specified'}
                          {profile.occupation && ` • ${profile.occupation}`}
                        </p>
                        {profile.declinedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Passed on {new Date(profile.declinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </Link>
                      <div className="flex gap-2">
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
              <Link
                href={buildUrl('/connections')}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all"
              >
                View Connections
              </Link>
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
