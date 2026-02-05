'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  User,
  Heart,
  Users,
  Bell,
  Eye,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Clock,
  XCircle,
  Sparkles,
  Shield,
} from 'lucide-react'
import FindMatchModal from '@/components/FindMatchModal'
import VerificationPaymentModal from '@/components/VerificationPaymentModal'
import ReferralCard from '@/components/ReferralCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface DashboardStats {
  // Active stats (current/dynamic)
  interestsReceived: number
  interestsSent: number
  mutualMatches: number
  matchesCount: number
  // Lifetime stats (never decrease - show platform value)
  lifetime: {
    interestsReceived: number
    interestsSent: number
    profileViews: number
    matches: number
  }
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { viewAsUser, buildUrl, buildApiUrl } = useImpersonation()
  const { isAdminView, isAdmin: isAdminAccess, adminChecked } = useAdminViewAccess()
  const [stats, setStats] = useState<DashboardStats>({
    interestsReceived: 0,
    interestsSent: 0,
    mutualMatches: 0,
    matchesCount: 0,
    lifetime: {
      interestsReceived: 0,
      interestsSent: 0,
      profileViews: 0,
      matches: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [hasPaid, setHasPaid] = useState<boolean | null>(null)
  const [impersonatedUser, setImpersonatedUser] = useState<{
    name: string
    profile: { approvalStatus: string } | null
  } | null>(null)
  const [impersonatedLoaded, setImpersonatedLoaded] = useState(false)
  const [profileInfo, setProfileInfo] = useState<{ firstName?: string; odNumber?: string } | null>(null)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)
  // Check for status query param (redirected from profile creation)
  const showPendingMessage = searchParams.get('status') === 'pending'
  const shouldCreateProfile = searchParams.get('createProfile') === 'true'

  // Check if session data is fully loaded (hasProfile will be undefined until JWT callback populates it)
  // This prevents the flash where "Create Profile" modal appears briefly before session data loads
  const sessionDataLoaded = isAdminView || (session?.user && (session.user as any).hasProfile !== undefined)
  const sessionHasProfile = isAdminView
    ? !!impersonatedUser?.profile
    : ((session?.user as any)?.hasProfile || false)
  const sessionApprovalStatus = isAdminView
    ? (impersonatedUser?.profile?.approvalStatus || null)
    : ((session?.user as any)?.approvalStatus || null)
  const pendingFromUrl = showPendingMessage && !sessionApprovalStatus
  const hasProfile = sessionHasProfile || pendingFromUrl
  const approvalStatus = sessionApprovalStatus || (pendingFromUrl ? 'pending' : null)
  const isApproved = hasProfile && approvalStatus === 'approved'
  const isPending = hasProfile && approvalStatus === 'pending'
  const isRejected = hasProfile && approvalStatus === 'rejected'
  const needsProfile = !hasProfile
  const canAccess = !!session || (isAdminView && isAdminAccess)
  const userContextReady = !isAdminView || impersonatedLoaded
  const displayName = (isAdminView ? impersonatedUser?.name : session?.user?.name) || 'User'

  // Admin link is shown based on a simple check - can be enhanced later
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false))
  }, [])

  useEffect(() => {
    let active = true

    if (!isAdminView || !isAdminAccess || !viewAsUser) {
      setImpersonatedUser(null)
      setImpersonatedLoaded(false)
      return () => {}
    }

    setImpersonatedLoaded(false)
    fetch(`/api/admin/users/${viewAsUser}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        setImpersonatedUser(data.user || null)
      })
      .catch(() => {
        if (!active) return
        setImpersonatedUser(null)
      })
      .finally(() => {
        if (!active) return
        setImpersonatedLoaded(true)
      })

    return () => {
      active = false
    }
  }, [isAdminView, isAdminAccess, viewAsUser])

  const [creatingProfile, setCreatingProfile] = useState(false)
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null)

  // Check if we have pending signup data to process (before creatingProfile is set)
  const hasPendingSignupData = typeof window !== 'undefined' && shouldCreateProfile && sessionStorage.getItem('signupFormData') !== null

  // Fetch payment status when user has a pending profile
  useEffect(() => {
    if (!isPending || isAdminView) return

    fetch('/api/payment/status')
      .then(res => res.json())
      .then(data => {
        setHasPaid(data.hasPaid === true)
      })
      .catch(() => setHasPaid(false))
  }, [isPending, isAdminView])

  useEffect(() => {
    if (status === 'unauthenticated') {
      if (!isAdminView) {
        router.push('/login')
      } else if (adminChecked && !isAdminAccess) {
        router.push('/login')
      }
    }
  }, [status, router, isAdminView, adminChecked, isAdminAccess])

  // Check if email verification is required for email/password users
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false)
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView) return

    // Check verification status
    fetch('/api/user/verification-status')
      .then(res => res.json())
      .then(data => {
        // If user has a password (email/password signup) and email is not verified, redirect
        if (data.hasPassword && !data.emailVerified) {
          setEmailVerificationRequired(true)
          router.push('/verify-email')
        }
      })
      .catch(() => {})
  }, [status, isAdminView, router])

  // Check if photo upload is required (profile exists but no photos uploaded)
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView || !hasProfile) return

    fetch('/api/profile/completion-status')
      .then(res => res.json())
      .then(data => {
        // If profile exists but photos not uploaded (signupStep < 9 and no photos), redirect to photos page
        if (data.hasProfile && !data.hasPhotos && data.signupStep < 9) {
          router.push(`/profile/photos?profileId=${data.profileId}&fromSignup=true`)
        }
      })
      .catch(() => {})
  }, [status, isAdminView, hasProfile, router])

  // Handle Google auth callback - create profile from stored form data and go to photos
  useEffect(() => {
    const handleGoogleAuthCallback = async () => {
      if (status !== 'authenticated' || !shouldCreateProfile || !session?.user?.email) return

      // Check if there's stored form data from before Google auth
      const storedFormData = sessionStorage.getItem('signupFormData')
      if (!storedFormData) return

      // Prevent duplicate profile creation
      if (creatingProfile || createdProfileId) return

      setCreatingProfile(true)

      try {
        const formData = JSON.parse(storedFormData)

        // Create profile with stored form data
        const referredBy = sessionStorage.getItem('referredBy') || undefined
        const profileResponse = await fetch('/api/profile/create-from-modal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            ...formData,
            referredBy,
          }),
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setCreatedProfileId(profileData.profileId)

          // Clear the stored form data
          sessionStorage.removeItem('signupFormData')

          // Redirect to profile complete page to continue signup from step 2 (location_education)
          // User has completed step 1 (basics) before Google auth, account creation is not numbered
          // signupStep 2 = location_education is the next step to complete
          router.push(`/profile/complete?profileId=${profileData.profileId}&step=2`)
        } else if (profileResponse.status === 409) {
          // Duplicate profile detected — allow user to confirm
          const data = await profileResponse.json()
          if (data.error === 'duplicate_profile') {
            const confirmed = window.confirm(
              `${data.message}\n\nClick OK to continue creating this profile, or Cancel to go back.`
            )
            if (confirmed) {
              const retryResponse = await fetch('/api/profile/create-from-modal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: session.user.email,
                  ...formData,
                  referredBy,
                  skipDuplicateCheck: true,
                }),
              })
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                setCreatedProfileId(retryData.profileId)
                sessionStorage.removeItem('signupFormData')
                router.push(`/profile/complete?profileId=${retryData.profileId}&step=2`)
              } else {
                sessionStorage.removeItem('signupFormData')
                setShowCreateProfileModal(true)
              }
            } else {
              sessionStorage.removeItem('signupFormData')
            }
          } else {
            sessionStorage.removeItem('signupFormData')
            setShowCreateProfileModal(true)
          }
        } else {
          // If profile creation fails, show the modal to let user complete manually
          sessionStorage.removeItem('signupFormData')
          setShowCreateProfileModal(true)
        }
      } catch (error) {
        console.error('Error creating profile after Google auth:', error)
        sessionStorage.removeItem('signupFormData')
        setShowCreateProfileModal(true)
      } finally {
        setCreatingProfile(false)
      }
    }

    handleGoogleAuthCallback()
  }, [status, shouldCreateProfile, session?.user?.email, creatingProfile, createdProfileId, router])

  // Auto-show create profile modal if user needs to create profile (and not handling Google auth)
  useEffect(() => {
    // Don't show modal if we're handling Google auth callback
    const hasStoredFormData = typeof window !== 'undefined' && sessionStorage.getItem('signupFormData')
    if (hasStoredFormData && shouldCreateProfile) return

    // Don't show modal if user just completed registration (redirected with status=pending)
    // The session might not have updated hasProfile yet, so we trust the URL param
    if (showPendingMessage) return

    // Wait until session data is fully loaded before deciding to show modal
    // This prevents the flash where modal appears briefly before hasProfile is populated
    if (!sessionDataLoaded) return

    if (status === 'authenticated' && needsProfile && (shouldCreateProfile || !showCreateProfileModal)) {
      // Small delay to ensure page is ready
      const timer = setTimeout(() => {
        setShowCreateProfileModal(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [status, needsProfile, shouldCreateProfile, showCreateProfileModal, sessionDataLoaded, showPendingMessage])

  useEffect(() => {
    if (!userContextReady) return
    if (isApproved) {
      fetchStats()
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproved, buildApiUrl, userContextReady])

  // Show welcome banner only once after approval
  useEffect(() => {
    if (!isApproved) return
    const welcomeKey = 'vivaah_welcome_banner_seen'
    const hasSeen = localStorage.getItem(welcomeKey)
    if (!hasSeen) {
      setShowWelcomeBanner(true)
      localStorage.setItem(welcomeKey, 'true')
    }
  }, [isApproved])

  const fetchStats = async () => {
    try {
      // Fetch all stats from the single source of truth API
      const matchesRes = await fetch(buildApiUrl('/api/matches/auto'))
      const matchesData = await matchesRes.json()

      // Extract stats from the API response
      const apiStats = matchesData.stats || {}
      const lifetimeStats = apiStats.lifetime || {}

      setStats({
        // Active stats (current/dynamic)
        interestsReceived: apiStats.interestsReceived?.total || 0,
        interestsSent: apiStats.interestsSent?.total || 0,
        mutualMatches: apiStats.mutualMatches || 0,
        matchesCount: apiStats.potentialMatches || 0,
        // Lifetime stats (never decrease)
        lifetime: {
          interestsReceived: lifetimeStats.interestsReceived || 0,
          interestsSent: lifetimeStats.interestsSent || 0,
          profileViews: lifetimeStats.profileViews || 0,
          matches: lifetimeStats.matches || 0,
        },
      })

      // Capture profile info for display
      if (matchesData.myProfile) {
        setProfileInfo({
          firstName: matchesData.myProfile.firstName,
          odNumber: matchesData.myProfile.odNumber,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loader while:
  // 1. Session is loading
  // 2. Admin view mode checks are pending
  // 3. Session data (hasProfile) is not yet populated from JWT
  // 4. Profile is being created after Google auth (prevents flash of dashboard)
  // 5. Pending signup data waiting to be processed
  const isCreatingOrPendingProfile = creatingProfile || hasPendingSignupData
  if (status === 'loading' || (isAdminView && !adminChecked) || (isAdminView && !userContextReady) || (status === 'authenticated' && !sessionDataLoaded) || isCreatingOrPendingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        {isCreatingOrPendingProfile && <p className="ml-3 text-gray-600">Setting up your profile...</p>}
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profileInfo?.firstName || displayName.split(' ')[0]}!
            {profileInfo?.odNumber && (
              <span className="text-lg font-normal text-gray-500 ml-2">({profileInfo.odNumber})</span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {isApproved
              ? "Here's what's happening with your profile"
              : isPending && hasPaid
              ? 'Your profile is being reviewed'
              : isPending
              ? 'Profile complete. Next step: Get verified.'
              : "Let's get your profile set up"}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {hasProfile && (
              <Link
                href={buildUrl('/profile')}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                View My Profile
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium text-sm bg-gray-100 px-3 py-1 rounded-full"
              >
                <Shield className="h-4 w-4 mr-1" />
                Admin Panel
              </Link>
            )}
            {/* Status Badge */}
            {hasProfile && (
              <>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </span>
                ) : isPending && hasPaid === true ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Paid - Awaiting Approval
                  </span>
                ) : isPending && hasPaid === false ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Approved
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Profile Status Alerts */}
        {needsProfile && !isPending && !isRejected && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-yellow-500 mt-0.5" />
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-yellow-800">
                  Complete Your Profile
                </h3>
                <p className="text-yellow-700 mt-1">
                  Create your profile to start seeing curated matches based on your preferences.
                  It only takes a few minutes!
                </p>
                <button
                  onClick={() => setShowCreateProfileModal(true)}
                  className="inline-flex items-center mt-4 bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  Create Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isPending && hasPaid === true && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-amber-900">
                  Payment Received - Awaiting Admin Approval
                </h3>
                <p className="text-amber-800 mt-1">
                  Thank you for completing verification! Your payment has been received.
                </p>
                <div className="mt-3 bg-amber-100 rounded-lg p-3">
                  <p className="text-sm text-amber-900">
                    <strong>Why can&apos;t I browse matches yet?</strong><br />
                    Our team manually reviews each profile to ensure authenticity and quality.
                    This process typically takes 24-48 hours. You&apos;ll receive an email notification once your profile is approved.
                  </p>
                </div>
                <Link
                  href={buildUrl('/profile/edit')}
                  className="inline-flex items-center mt-4 text-amber-700 hover:text-amber-800 font-medium text-sm"
                >
                  Edit Profile While You Wait
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Not Approved
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              Unfortunately, your profile could not be approved. Please update your profile with complete and accurate information.
            </p>
            <Link href={buildUrl('/profile/edit')} className="btn-primary">
              Update Profile
            </Link>
          </div>
        )}

        {/* Approved User Stats */}
        {isApproved && (
          <>
            {/* Success Banner for new approvals - shows only on first login after approval */}
            {showWelcomeBanner && (
              <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start">
                  <Sparkles className="h-6 w-6 text-green-500 mt-0.5" />
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-green-800">
                      Your Profile is Live!
                    </h3>
                    <p className="text-green-700 mt-1">
                      Your profile has been approved. You can now view your matches and start connecting!
                    </p>
                    <Link
                      href={buildUrl('/matches')}
                      className="inline-flex items-center mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      View Your Matches
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid - Active Stats */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Current Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Link
                  href={buildUrl('/matches?tab=matches')}
                  className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md hover:border-blue-200 border border-transparent transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Your Matches</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {loading ? '...' : stats.matchesCount}
                      </p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                </Link>

                <Link
                  href={buildUrl('/matches?tab=received')}
                  className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md hover:border-pink-200 border border-transparent transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 group-hover:text-pink-600 transition-colors">Interests Received</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {loading ? '...' : stats.interestsReceived}
                      </p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                      <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                    </div>
                  </div>
                </Link>

                <Link
                  href={buildUrl('/matches?tab=sent')}
                  className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md hover:border-purple-200 border border-transparent transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 group-hover:text-purple-600 transition-colors">Interests Sent</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {loading ? '...' : stats.interestsSent}
                      </p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                  </div>
                </Link>

                <Link
                  href={buildUrl('/connections')}
                  className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md hover:border-green-200 border border-transparent transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 group-hover:text-green-600 transition-colors">Connections</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {loading ? '...' : stats.mutualMatches}
                      </p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Lifetime Stats - Simple text display */}
            {(stats.lifetime.interestsReceived > 0 || stats.lifetime.interestsSent > 0 || stats.lifetime.matches > 0) && (
              <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="font-medium text-gray-400">Since you joined:</span>
                <span><span className="font-semibold text-gray-700">{loading ? '...' : stats.lifetime.matches}</span> matches shown</span>
                <span><span className="font-semibold text-gray-700">{loading ? '...' : stats.lifetime.interestsReceived}</span> interests received</span>
                <span><span className="font-semibold text-gray-700">{loading ? '...' : stats.lifetime.interestsSent}</span> interests sent</span>
                <span><span className="font-semibold text-gray-700">{loading ? '...' : stats.lifetime.profileViews}</span> profile views</span>
              </div>
            )}

            {/* Interest Notification */}
            {stats.interestsReceived > 0 && (
              <div className="mb-8 bg-pink-50 border border-pink-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {stats.interestsReceived} {stats.interestsReceived === 1 ? 'person is' : 'people are'} interested in you!
                      </h3>
                      <p className="text-pink-600">
                        Express mutual interest to unlock their contact details.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={buildUrl('/matches')}
                    className="btn-primary text-sm"
                  >
                    My Matches
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <Link
                  href={buildUrl('/matches')}
                  className={`flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${!hasProfile ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">My Matches</p>
                    <p className="text-sm text-gray-500">See profiles matched for you</p>
                  </div>
                </Link>

                {hasProfile ? (
                  <Link
                    href={buildUrl('/profile/edit')}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Edit Profile</p>
                      <p className="text-sm text-gray-500">Update your information</p>
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowCreateProfileModal(true)}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                  >
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create Profile</p>
                      <p className="text-sm text-gray-500">Get started now</p>
                    </div>
                  </button>
                )}

                {isApproved && (
                  <>
                    <Link
                      href={buildUrl('/matches')}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                        <Heart className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Express Interest</p>
                        <p className="text-sm text-gray-500">Visit a profile to express interest</p>
                      </div>
                    </Link>

                    <Link
                      href={buildUrl('/connections')}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Connections</p>
                        <p className="text-sm text-gray-500">View and message your connections</p>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* State-aware guidance section */}
            {isPending && hasPaid === true ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Next</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Profile Submitted</p>
                      <p className="text-sm text-gray-500">Your profile and verification are complete</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Under Review</p>
                      <p className="text-sm text-gray-500">Our team is reviewing your profile (24-48 hours)</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Bell className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Get Notified</p>
                      <p className="text-sm text-gray-400">You&apos;ll receive an email once approved</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Start Matching</p>
                      <p className="text-sm text-gray-400">View matches and express interest</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : isPending && hasPaid === false ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Verification</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Profile Created</p>
                      <p className="text-sm text-gray-500">Your profile details are saved</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Get Verified</p>
                      <p className="text-sm text-gray-500">Complete verification to proceed</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">View Matches</p>
                      <p className="text-sm text-gray-400">See profiles matched for you</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Heart className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Connect</p>
                      <p className="text-sm text-gray-400">Mutual interest unlocks contact details</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-primary w-full mt-4"
                >
                  Get Verified Now
                </button>
              </div>
            ) : needsProfile ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-primary-600 font-semibold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create Your Profile</p>
                      <p className="text-sm text-gray-500">Fill in your details and preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-gray-400 font-semibold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Get Verified</p>
                      <p className="text-sm text-gray-400">Complete verification to proceed</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-gray-400 font-semibold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">View Matches</p>
                      <p className="text-sm text-gray-400">See profiles matched for you</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-gray-400 font-semibold">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Connect</p>
                      <p className="text-sm text-gray-400">Mutual interest unlocks contact details</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions for Profile */}
            {(!hasProfile || (isPending && hasPaid === false) || (hasProfile && !isApproved && hasPaid !== false)) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Step</h2>
                {!hasProfile && (
                  <button
                    onClick={() => setShowCreateProfileModal(true)}
                    className="btn-primary w-full text-center text-sm py-2"
                  >
                    Create Profile
                  </button>
                )}
                {isPending && hasPaid === false && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="btn-primary w-full text-center text-sm py-2"
                  >
                    Get Verified
                  </button>
                )}
                {hasProfile && !isApproved && hasPaid !== false && (
                  <Link
                    href={buildUrl('/profile/edit')}
                    className="btn-outline w-full text-center text-sm py-2 block"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            )}

            {/* Referral */}
            {hasProfile && <ReferralCard />}

            {/* Tips */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-3">Profile Tips</h2>
              <ul className="space-y-2 text-sm text-primary-100">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Add clear, recent photos
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Complete all profile sections
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Write a detailed about section
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Be specific about preferences
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create Profile Modal */}
      <FindMatchModal
        isOpen={showCreateProfileModal}
        onClose={() => setShowCreateProfileModal(false)}
      />

      {/* Verification Payment Modal - shown when pending and not paid */}
      <VerificationPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
      </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
