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
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface FeedProfile extends ProfileData {
  approvalStatus?: string
}

type TabType = 'matches' | 'sent' | 'received'

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
  } | null>(null)
  const [showMatchModal, setShowMatchModal] = useState<FeedProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('matches')
  const [sentInterests, setSentInterests] = useState<any[]>([])
  const [receivedInterests, setReceivedInterests] = useState<any[]>([])
  const [interestsLoading, setInterestsLoading] = useState(false)

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

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(buildApiUrl('/api/matches/auto'))
      const data = await response.json()

      setProfiles(data.freshMatches || [])
      setLikedYouCount(data.stats?.likedYouCount || 0)

      if (data.userStatus) {
        setUserStatus(data.userStatus)
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
      <div className="min-h-screen bg-lavender-50/50 py-6">
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
      <div className="min-h-screen bg-lavender-50/50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Matches</h1>
              <p className="text-gray-600 text-sm">
                {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'} matching your preferences
              </p>
            </div>
            <Link
              href={buildUrl('/reconsider')}
              className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reconsider</span>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Matches</span>
              <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">{profiles.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Sent</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{sentInterests.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Inbox className="h-4 w-4" />
              <span>Received</span>
              {receivedInterests.length > 0 && (
                <span className="bg-pink-100 text-pink-700 text-xs px-1.5 py-0.5 rounded-full">{receivedInterests.length}</span>
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
                  {searchQuery ? 'No Matching Profiles' : 'No More Profiles'}
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : "You've seen all the profiles that match your preferences. Check back later for new matches!"}
                </p>
                <div className="flex justify-center gap-3">
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="btn-secondary text-sm py-2"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <>
                      <Link href={buildUrl('/connections')} className="btn-primary text-sm py-2">
                        View Connections
                      </Link>
                      <Link href={buildUrl('/reconsider')} className="btn-secondary text-sm py-2">
                        Reconsider Passed
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
                      <div className="p-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
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
              <div className="space-y-2">
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
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
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
                          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                        >
                          Accept
                        </button>
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
              <Heart className="h-16 w-16 text-pink-500 mx-auto mb-4 animate-pulse" />
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
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
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
