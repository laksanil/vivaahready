'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Loader2,
  Sparkles,
  Search,
  Eye,
  Zap,
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import { NearMatchesSection } from '@/components/NearMatchCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface FeedProfile extends ProfileData {
  approvalStatus?: string
}

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
  const [passedProfiles, setPassedProfiles] = useState<any[]>([])
  const [hasPaid, setHasPaid] = useState(false)
  const [hasConnections, setHasConnections] = useState(false)
  const [nearMatches, setNearMatches] = useState<any[]>([])
  const [showNearMatches, setShowNearMatches] = useState(false)

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
      fetchPassedProfiles()
    }
  }, [canAccess, viewAsUser])

  const fetchPassedProfiles = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/matches/decline'))
      const data = await response.json()
      setPassedProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching passed profiles:', error)
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
      setNearMatches(data.nearMatches || [])
      setShowNearMatches(data.showNearMatches || false)

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
    const odNumber = p.odNumber?.toLowerCase() || ''
    return (
      p.user.name.toLowerCase().includes(query) ||
      odNumber.includes(query) ||
      p.currentLocation?.toLowerCase().includes(query) ||
      p.occupation?.toLowerCase().includes(query) ||
      p.qualification?.toLowerCase().includes(query) ||
      p.caste?.toLowerCase().includes(query) ||
      p.community?.toLowerCase().includes(query) ||
      p.subCommunity?.toLowerCase().includes(query)
    )
  })

  // Separate spotlight (engagement-boosted) profiles, then liked-you and discover
  const spotlightProfiles = filteredProfiles.filter((p) => p.engagementBoostActive)
  const spotlightIds = new Set(spotlightProfiles.map((p) => p.id))
  const nonSpotlight = filteredProfiles.filter((p) => !spotlightIds.has(p.id))
  const likedYouProfiles = nonSpotlight.filter((p) => p.theyLikedMeFirst)
  const discoverProfiles = nonSpotlight.filter((p) => !p.theyLikedMeFirst)

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


          {/* Search Bar */}
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, VR ID, location, occupation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
        </div>

        {/* Matches Content */}
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
                        <Link
                          href={buildUrl('/connections')}
                          className="btn-primary text-sm py-2"
                        >
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
                {/* Spotlight Section — engagement-boosted profiles */}
                {spotlightProfiles.length > 0 && (
                  <section className="relative rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-4 shadow-lg overflow-hidden">
                    {/* Spotlight glow effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-5 w-5 text-yellow-300" />
                        <h2 className="text-lg font-bold text-white">
                          Spotlight
                        </h2>
                        <span className="text-xs text-purple-200 ml-1">Boosted Profiles</span>
                      </div>
                      <div className="space-y-2">
                        {spotlightProfiles.map((profile) => (
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
                    </div>
                  </section>
                )}

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
              {showMatchModal.odNumber && (
                <>
                  <br />
                  <span className="text-sm">
                    <span className="font-semibold text-gray-700">VR ID:</span> {showMatchModal.odNumber}
                  </span>
                </>
              )}
              <span className="block mt-1">You can now message them.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMatchModal(null)
                  router.push(buildUrl('/connections'))
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
