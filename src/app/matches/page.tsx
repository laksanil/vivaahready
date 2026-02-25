'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Loader2,
  Sparkles,
  Search,
  Eye,
  Flag,
  UserMinus,
  X,
  Lock,
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import { NearMatchesSection } from '@/components/NearMatchCard'
import ReportModal from '@/components/ReportModal'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'
import { EDUCATION_LEVEL_OPTIONS, FIELD_OF_STUDY_OPTIONS, QUALIFICATION_TO_NEW_FIELDS } from '@/lib/constants'

interface FeedProfile extends ProfileData {
  approvalStatus?: string
}

interface InterestProfile extends FeedProfile {
  matchId?: string
  matchStatus?: string
  status?: string
  createdAt?: string
}

type MatchesView = 'matches' | 'sent' | 'received'

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
  const [educationLevelFilter, setEducationLevelFilter] = useState('')
  const [fieldOfStudyFilter, setFieldOfStudyFilter] = useState('')
  const [hasPaid, setHasPaid] = useState(false)
  const [nearMatches, setNearMatches] = useState<any[]>([])
  const [showNearMatches, setShowNearMatches] = useState(false)
  const [, setMyPreferences] = useState<any>(null)
  const [sentInterests, setSentInterests] = useState<InterestProfile[]>([])
  const [receivedInterests, setReceivedInterests] = useState<InterestProfile[]>([])
  const [interestsLoading, setInterestsLoading] = useState(false)
  const [interestActionId, setInterestActionId] = useState<string | null>(null)
  const [withdrawConfirmInterest, setWithdrawConfirmInterest] = useState<InterestProfile | null>(null)
  const [withdrawingSentId, setWithdrawingSentId] = useState<string | null>(null)
  const [reportProfile, setReportProfile] = useState<{ userId: string; userName: string } | null>(null)

  const tabParam = searchParams.get('tab')
  const activeView: MatchesView = tabParam === 'sent' || tabParam === 'received' ? tabParam : 'matches'

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
    }
  }, [canAccess, viewAsUser])

  useEffect(() => {
    if (!canAccess || activeView === 'matches') return

    let isCancelled = false

    const fetchInterestProfiles = async () => {
      setInterestsLoading(true)
      try {
        const response = await fetch(buildApiUrl(`/api/matches?type=${activeView}`))
        const data = response.ok ? await response.json() : { matches: [] }
        const interestMatches: InterestProfile[] = Array.isArray(data.matches) ? data.matches : []
        if (isCancelled) return

        if (activeView === 'sent') {
          setSentInterests(interestMatches)
        } else {
          setReceivedInterests(interestMatches)
        }
      } catch (error) {
        console.error(`Error fetching ${activeView} interests:`, error)
        if (isCancelled) return
        if (activeView === 'sent') {
          setSentInterests([])
        } else {
          setReceivedInterests([])
        }
      } finally {
        if (!isCancelled) {
          setInterestsLoading(false)
        }
      }
    }

    fetchInterestProfiles()
    return () => {
      isCancelled = true
    }
  }, [canAccess, activeView, buildApiUrl, viewAsUser])

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
        body: JSON.stringify({ declinedUserId: profile.userId, source: 'matches' }),
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

  const handleReceivedInterestAction = async (profile: InterestProfile, action: 'accept' | 'reject') => {
    if (!profile.matchId) return
    setInterestActionId(profile.matchId)
    try {
      const response = await fetch(buildApiUrl('/api/interest'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId: profile.matchId, action }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (data?.requiresVerification) {
          router.push(buildUrl('/get-verified'))
          return
        }
        return
      }

      setReceivedInterests((prev) => prev.filter((item) => item.matchId !== profile.matchId))
      if (action === 'accept') {
        router.push(buildUrl('/connections'))
      } else if (action === 'reject' && profile.userId) {
        // Add declined profile to reconsider/passed pile
        await fetch(buildApiUrl('/api/matches/decline'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ declinedUserId: profile.userId, source: 'interest_declined' }),
        })
      }
    } catch (error) {
      console.error(`Failed to ${action} received interest:`, error)
    } finally {
      setInterestActionId(null)
    }
  }

  const handleWithdrawSentInterest = async () => {
    if (!withdrawConfirmInterest?.matchId) return

    const interest = withdrawConfirmInterest
    const matchId = interest.matchId!
    setWithdrawingSentId(matchId)

    try {
      const withdrawResponse = await fetch(buildApiUrl('/api/interest'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId: matchId, action: 'withdraw' }),
      })

      if (!withdrawResponse.ok) {
        return
      }

      // API now handles adding withdrawn interests to Passed/Reconsider.

      setSentInterests((prev) => prev.filter((item) => item.matchId !== matchId))
    } catch (error) {
      console.error('Failed to withdraw sent interest:', error)
    } finally {
      setWithdrawingSentId(null)
      setWithdrawConfirmInterest(null)
    }
  }

  // Resolve education fields from new system or legacy qualification
  const getResolvedEducation = (p: FeedProfile | InterestProfile) => {
    if (p.educationLevel) {
      return { educationLevel: p.educationLevel, fieldOfStudy: p.fieldOfStudy || null }
    }
    if (p.qualification) {
      const mapped = QUALIFICATION_TO_NEW_FIELDS[p.qualification]
      if (mapped) return { educationLevel: mapped.educationLevel, fieldOfStudy: mapped.fieldOfStudy || null }
    }
    return { educationLevel: null, fieldOfStudy: null }
  }

  const matchesSearchQuery = (p: FeedProfile | InterestProfile) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.user.name.toLowerCase().includes(query) ||
      p.currentLocation?.toLowerCase().includes(query) ||
      p.occupation?.toLowerCase().includes(query) ||
      p.qualification?.toLowerCase().includes(query) ||
      p.educationLevel?.replace(/_/g, ' ').toLowerCase().includes(query) ||
      p.fieldOfStudy?.replace(/_/g, ' ').toLowerCase().includes(query) ||
      p.major?.toLowerCase().includes(query) ||
      p.university?.toLowerCase().includes(query) ||
      p.caste?.toLowerCase().includes(query) ||
      p.community?.toLowerCase().includes(query) ||
      p.subCommunity?.toLowerCase().includes(query)
    )
  }

  const matchesFilters = (p: FeedProfile | InterestProfile) => {
    if (!matchesSearchQuery(p)) return false
    if (educationLevelFilter || fieldOfStudyFilter) {
      const resolved = getResolvedEducation(p)
      if (educationLevelFilter && resolved.educationLevel !== educationLevelFilter) return false
      if (fieldOfStudyFilter && resolved.fieldOfStudy !== fieldOfStudyFilter) return false
    }
    return true
  }

  const hasActiveFilters = !!educationLevelFilter || !!fieldOfStudyFilter

  // Filter profiles by search + education filters
  const filteredProfiles = profiles.filter(matchesFilters)

  // Separate profiles into "liked you" and "discover"
  const likedYouProfiles = filteredProfiles.filter((p) => p.theyLikedMeFirst)
  const discoverProfiles = filteredProfiles.filter((p) => !p.theyLikedMeFirst)
  const currentInterestProfiles = activeView === 'sent' ? sentInterests : receivedInterests
  const filteredInterestProfiles = currentInterestProfiles.filter(matchesFilters)

  if (status === 'loading' || loading || (isAdminView && !adminChecked)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-6">
        <div className="w-full px-4 md:px-8 xl:px-10">
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
        <div className="w-full px-4 md:px-8 xl:px-10">
          {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeView === 'sent'
                ? 'Sent Interest'
                : activeView === 'received'
                ? 'Interest Received'
                : 'My Matches'}
            </h1>
            <p className="text-gray-600 text-sm">
              {activeView === 'sent'
                ? `${sentInterests.length} ${sentInterests.length === 1 ? 'interest' : 'interests'} you sent`
                : activeView === 'received'
                ? `${receivedInterests.length} ${receivedInterests.length === 1 ? 'interest' : 'interests'} received`
                : `${filteredProfiles.length !== profiles.length ? `${filteredProfiles.length} of ` : ''}${profiles.length} ${profiles.length === 1 ? 'profile' : 'profiles'} matching your preferences`}
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
              placeholder="Search by name, location, occupation, university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Education Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <select
              value={educationLevelFilter}
              onChange={(e) => setEducationLevelFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">All Education Levels</option>
              {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={fieldOfStudyFilter}
              onChange={(e) => setFieldOfStudyFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">All Fields of Study</option>
              {FIELD_OF_STUDY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => { setEducationLevelFilter(''); setFieldOfStudyFilter('') }}
                className="text-sm text-primary-600 hover:text-primary-700 px-2 py-2 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {activeView !== 'matches' ? (
          interestsLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <DirectoryCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredInterestProfiles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || hasActiveFilters
                  ? 'No Matching Profiles'
                  : activeView === 'sent'
                  ? 'No Sent Interests Yet'
                  : 'No Received Interests Yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                {searchQuery || hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : activeView === 'sent'
                  ? 'Profiles you express interest in will appear here.'
                  : 'When someone expresses interest in you, it will appear here.'}
              </p>
              {(searchQuery || hasActiveFilters) ? (
                <button
                  onClick={() => { setSearchQuery(''); setEducationLevelFilter(''); setFieldOfStudyFilter('') }}
                  className="btn-secondary text-sm py-2"
                >
                  Clear Search & Filters
                </button>
              ) : (
                <Link href={buildUrl('/matches')} className="btn-primary text-sm py-2">
                  Browse Matches
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInterestProfiles.map((profile) => (
                <div key={profile.matchId || profile.id}>
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-xs text-gray-500">
                      {activeView === 'sent' ? 'Sent' : 'Received'}{' '}
                      {profile.createdAt ? new Date(profile.createdAt).toLocaleString() : ''}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {profile.matchStatus || profile.status || 'pending'}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-stretch">
                      <div className="flex-1 min-w-0">
                        {activeView === 'received' ? (
                          <DirectoryCard
                            profile={{ ...profile, theyLikedMeFirst: true }}
                            showActions={false}
                            borderless
                            isRestricted={!userStatus?.isApproved}
                            hasPaid={hasPaid}
                          />
                        ) : (
                          <DirectoryCard
                            profile={profile}
                            showActions={false}
                            borderless
                            isRestricted={!userStatus?.isApproved}
                            hasPaid={hasPaid}
                          />
                        )}
                      </div>

                      {/* Action Column */}
                      <div className="w-28 sm:w-36 flex flex-col justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 border-l border-gray-100">
                        {/* View Profile */}
                        <Link
                          href={buildUrl(`/profile/${profile.id}`)}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>View</span>
                        </Link>

                        {activeView === 'received' ? (
                          <>
                            {/* Accept */}
                            {userStatus?.canAcceptInterest ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReceivedInterestAction(profile, 'accept') }}
                                disabled={interestActionId === profile.matchId}
                                className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {interestActionId === profile.matchId ? (
                                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                ) : (
                                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                )}
                                <span>Accept</span>
                              </button>
                            ) : (
                              <Link
                                href={buildUrl('/get-verified')}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Verify</span>
                              </Link>
                            )}

                            {/* Decline */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReceivedInterestAction(profile, 'reject') }}
                              disabled={interestActionId === profile.matchId}
                              className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {interestActionId === profile.matchId ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                              <span>Decline</span>
                            </button>
                          </>
                        ) : (
                          /* Withdraw */
                          <button
                            onClick={(e) => { e.stopPropagation(); setWithdrawConfirmInterest(profile) }}
                            disabled={withdrawingSentId === profile.matchId}
                            className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-red-600 hover:text-white hover:bg-red-500 bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {withdrawingSentId === profile.matchId ? (
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            ) : (
                              <UserMinus className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                            <span>Withdraw</span>
                          </button>
                        )}

                        {/* Report */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setReportProfile({ userId: profile.userId, userName: profile.user?.name || 'User' }) }}
                          className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {(searchQuery || hasActiveFilters) ? 'No Matching Profiles' : 'No Matches Found'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              {searchQuery || hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : "Sorry, we do not have matches that fit your criteria yet. Try editing your partner preferences and changing your deal breakers to see more profiles."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {(searchQuery || hasActiveFilters) ? (
                <button
                  onClick={() => { setSearchQuery(''); setEducationLevelFilter(''); setFieldOfStudyFilter('') }}
                  className="btn-secondary text-sm py-2"
                >
                  Clear Search & Filters
                </button>
              ) : (
                <Link
                  href={buildUrl('/profile?tab=preferences&edit=preferences_1')}
                  className="btn-secondary text-sm py-2"
                >
                  Edit Partner Preferences
                </Link>
              )}
            </div>

            {/* Near Matches Section for 0 exact matches */}
            {!searchQuery && !hasActiveFilters && (
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

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportProfile}
        onClose={() => setReportProfile(null)}
        reportedUserId={reportProfile?.userId || ''}
        reportedUserName={reportProfile?.userName || ''}
      />

      {withdrawConfirmInterest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Withdraw Interest</h3>
              <p className="text-gray-600">
                Are you sure you want to withdraw your interest in{' '}
                <span className="font-medium">{withdrawConfirmInterest.user?.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This profile will move to your Passed list.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setWithdrawConfirmInterest(null)}
                disabled={withdrawingSentId === withdrawConfirmInterest.matchId}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawSentInterest}
                disabled={withdrawingSentId === withdrawConfirmInterest.matchId}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawingSentId === withdrawConfirmInterest.matchId ? (
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
