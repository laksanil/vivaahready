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
  UserCheck,
  CreditCard,
  MessageCircle,
  Star,
  Target,
  TrendingUp,
  Lightbulb,
  Calendar,
} from 'lucide-react'
import FindMatchModal from '@/components/FindMatchModal'
import VerificationPaymentModal from '@/components/VerificationPaymentModal'
import ReferralCard from '@/components/ReferralCard'
import EngagementRewardsCard from '@/components/EngagementRewardsCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface DashboardStats {
  // Active stats (current/dynamic)
  interestsReceived: number
  interestsSent: number
  mutualMatches: number
  matchesCount: number
  // Full breakdown for response rate calculations
  sent: { total: number; accepted: number; rejected: number }
  received: { total: number; accepted: number; rejected: number }
  // Lifetime stats (never decrease - show platform value)
  lifetime: {
    interestsReceived: number
    interestsSent: number
    profileViews: number
    matches: number
    connections: number
  }
}

interface ProfileStrength {
  score: number
  sections: { name: string; score: number; weight: number }[]
  tips: string[]
  memberSince: string | null
  approvedDate: string | null
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
    sent: { total: 0, accepted: 0, rejected: 0 },
    received: { total: 0, accepted: 0, rejected: 0 },
    lifetime: {
      interestsReceived: 0,
      interestsSent: 0,
      profileViews: 0,
      matches: 0,
      connections: 0,
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
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; body: string; url: string | null; read: boolean; createdAt: string }[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [profileStrength, setProfileStrength] = useState<ProfileStrength | null>(null)
  const [dbProfileChecked, setDbProfileChecked] = useState(false)
  const [dbHasProfile, setDbHasProfile] = useState<boolean | null>(null)
  // Event interest survey
  const [surveyStep, setSurveyStep] = useState(0) // 0=CTA, 1=form, 2=thank you
  const [surveyDismissed, setSurveyDismissed] = useState(false)
  const [surveyLoading, setSurveyLoading] = useState(false)
  const [surveyForm, setSurveyForm] = useState({
    eventFormat: '',
    preferredCity: '',
    eventType: '',
    budgetRange: '',
    suggestions: '',
  })
  // Check for status query param (redirected from profile creation)
  const showPendingMessage = searchParams.get('status') === 'pending'
  const shouldCreateProfile = searchParams.get('createProfile') === 'true'

  // Check if session data is fully loaded (hasProfile will be undefined until JWT callback populates it)
  // This prevents the flash where "Create Profile" modal appears briefly before session data loads
  // Consider data loaded if: admin view, OR database check is complete, OR hasProfile is defined in JWT
  // IMPORTANT: Wait for database check to complete to prevent showing modal when profile actually exists
  const sessionDataLoaded = isAdminView || dbProfileChecked || (session?.user && (session.user as any).hasProfile === true)
  const sessionHasProfile = isAdminView
    ? !!impersonatedUser?.profile
    : ((session?.user as any)?.hasProfile || false)
  const sessionApprovalStatus = isAdminView
    ? (impersonatedUser?.profile?.approvalStatus || null)
    : ((session?.user as any)?.approvalStatus || null)
  const pendingFromUrl = showPendingMessage && !sessionApprovalStatus
  // Use database check if available (overrides potentially stale JWT value)
  // This prevents the loop where user creates profile but JWT still says hasProfile=false
  const hasProfile = dbHasProfile === true || sessionHasProfile || pendingFromUrl
  const approvalStatus = sessionApprovalStatus || (pendingFromUrl ? 'pending' : null)
  const isApproved = hasProfile && approvalStatus === 'approved'
  const isPending = hasProfile && approvalStatus === 'pending'
  const isRejected = hasProfile && approvalStatus === 'rejected'
  const needsProfile = !hasProfile
  const canAccess = !!session || (isAdminView && isAdminAccess)
  const userContextReady = !isAdminView || impersonatedLoaded
  const displayName = (isAdminView ? impersonatedUser?.name : session?.user?.name) || 'User'
  const sessionUserId = (session?.user as any)?.id || session?.user?.email || null
  const activeUserContextKey = isAdminView
    ? (viewAsUser ? `admin:${viewAsUser}` : null)
    : (sessionUserId ? `user:${sessionUserId}` : null)

  // Admin link is shown based on a simple check - can be enhanced later
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false))
  }, [])

  // Reset user-scoped dashboard state when account/context changes
  // (prevents stale firstName/status from a previously signed-in user)
  useEffect(() => {
    if (!activeUserContextKey) return
    setProfileInfo(null)
    setDbProfileChecked(false)
    setDbHasProfile(null)
  }, [activeUserContextKey])

  // Check actual profile status from database (not just JWT which can be stale)
  // This prevents the loop where user creates profile but JWT still says hasProfile=false
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView) return
    if (dbProfileChecked) return // Only check once

    fetch('/api/user/profile-status')
      .then(res => res.json())
      .then(data => {
        setDbHasProfile(data.hasProfile === true)
        setDbProfileChecked(true)
      })
      .catch(() => {
        setDbProfileChecked(true)
      })
  }, [status, isAdminView, dbProfileChecked])

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
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Safety timeout to prevent infinite loading - if loading takes more than 10 seconds, stop waiting
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true)
    }, 10000)
    return () => clearTimeout(timer)
  }, [])

  // Check if we have pending signup data to process (before creatingProfile is set)
  // Only check this if shouldCreateProfile is true (from URL param) to prevent false positives
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

  // Check if profile is incomplete and redirect to the correct step
  // This handles users who started signup but didn't finish - resume where they left off
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView || !hasProfile) return

    fetch('/api/profile/completion-status')
      .then(res => res.json())
      .then(data => {
        if (!data.hasProfile) return

        // signupStep mapping: 1=basics, 2=location, 3=religion, 4=family, 5=lifestyle, 6=aboutme, 7=prefs1, 8=prefs2, 9+=photos
        // If signup flow is not complete (signupStep < 8), redirect to profile completion at the step where user left off
        if (data.signupStep < 8) {
          // Redirect to profile/complete at the next step (signupStep + 1)
          // Profile data will be fetched and pre-populated on that page
          router.push(`/profile/complete?profileId=${data.profileId}&step=${data.signupStep + 1}`)
          return
        }

        // If profile sections done (signupStep 8) but photos not uploaded, redirect to photos page
        if (!data.hasPhotos && data.signupStep < 10) {
          router.push(`/profile/photos?profileId=${data.profileId}&fromSignup=true`)
        }
      })
      .catch(() => {})
  }, [status, isAdminView, hasProfile, router])

  // Clean up orphaned signupFormData ONLY if user has a completed profile
  // This prevents cleaning up data that's still needed for the Google OAuth flow
  // IMPORTANT: Must wait for database check to complete before cleaning up
  useEffect(() => {
    // Only clean up if:
    // 1. User is authenticated
    // 2. Database check is complete
    // 3. User HAS a profile in the database (signup is complete)
    // 4. Not in the process of creating a profile
    if (
      status === 'authenticated' &&
      dbProfileChecked &&
      dbHasProfile === true &&
      !shouldCreateProfile &&
      typeof window !== 'undefined'
    ) {
      // Check both storages
      const hasSessionData = sessionStorage.getItem('signupFormData')
      const hasLocalData = localStorage.getItem('signupFormData')
      if (hasSessionData || hasLocalData) {
        console.log('Cleaning up orphaned signupFormData (profile exists)')
        sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
        localStorage.removeItem('signupFormData')
      }
    }
  }, [status, shouldCreateProfile, dbProfileChecked, dbHasProfile])

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
        const referredBy = sessionStorage.getItem('referredBy') || document.cookie.match(/referredBy=([^;]+)/)?.[1] || undefined
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
          sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')

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
                sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
                router.push(`/profile/complete?profileId=${retryData.profileId}&step=2`)
              } else {
                sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
                setShowCreateProfileModal(true)
              }
            } else {
              sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
            }
          } else {
            sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
            setShowCreateProfileModal(true)
          }
        } else {
          // If profile creation fails, show the modal to let user complete manually
          sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
          setShowCreateProfileModal(true)
        }
      } catch (error) {
        console.error('Error creating profile after Google auth:', error)
        sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
        setShowCreateProfileModal(true)
      } finally {
        setCreatingProfile(false)
      }
    }

    handleGoogleAuthCallback()
  }, [status, shouldCreateProfile, session?.user?.email, creatingProfile, createdProfileId, router])

  // Auto-show create profile modal if user needs to create profile
  useEffect(() => {
    // ProfileCompletionGuard and login page handle redirecting users to /profile/complete if they have no profile
    // Don't check for stored form data here as it can cause redirect loops

    // Don't show modal if user just completed registration (redirected with status=pending)
    // The session might not have updated hasProfile yet, so we trust the URL param
    if (showPendingMessage) return

    // Wait until session data is fully loaded AND database check is complete
    // This prevents showing the modal when profile actually exists but JWT is stale
    if (!sessionDataLoaded || !dbProfileChecked) return

    // Don't show modal if database confirms profile exists
    if (dbHasProfile === true) return

    if (status === 'authenticated' && needsProfile && (shouldCreateProfile || !showCreateProfileModal)) {
      // Small delay to ensure page is ready
      const timer = setTimeout(() => {
        setShowCreateProfileModal(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [status, needsProfile, shouldCreateProfile, showCreateProfileModal, sessionDataLoaded, showPendingMessage, dbProfileChecked, dbHasProfile, router])

  useEffect(() => {
    if (!userContextReady) return
    if (isApproved) {
      fetchStats()
    } else {
      setProfileInfo(null)
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

  // Fetch recent notifications for dashboard
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView) return
    fetch('/api/notifications?limit=5')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setNotifications(data.notifications || [])
          setUnreadNotifCount(data.unreadCount || 0)
        }
      })
      .catch(() => {})
  }, [status, isAdminView])

  // Check existing event interest survey response
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView) return
    // Check localStorage dismiss
    if (typeof window !== 'undefined' && localStorage.getItem('vivaah_event_survey_dismissed') === 'true') {
      setSurveyDismissed(true)
    }
    fetch('/api/event-interest')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.submitted) {
          setSurveyStep(2)
          if (data.data) {
            setSurveyForm({
              eventFormat: data.data.eventFormat || '',
              preferredCity: data.data.preferredCity || '',
              eventType: data.data.eventType || '',
              budgetRange: data.data.budgetRange || '',
              suggestions: data.data.suggestions || '',
            })
          }
        }
      })
      .catch(() => {})
  }, [status, isAdminView])

  const submitEventSurvey = async () => {
    setSurveyLoading(true)
    try {
      const res = await fetch('/api/event-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interestLevel: 'yes',
          ...surveyForm,
        }),
      })
      if (res.ok) {
        setSurveyStep(2)
      }
    } catch (error) {
      console.error('Error submitting event survey:', error)
    } finally {
      setSurveyLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch stats and profile strength in parallel
      const [matchesRes, strengthRes] = await Promise.all([
        fetch(buildApiUrl('/api/matches/auto')),
        fetch('/api/profile/strength'),
      ])

      const matchesData = await matchesRes.json()

      // Extract stats from the API response
      const apiStats = matchesData.stats || {}
      const lifetimeStats = apiStats.lifetime || {}

      setStats({
        // Active stats - use (total - accepted) to match sidebar which shows pending + rejected
        interestsReceived: (apiStats.interestsReceived?.total || 0) - (apiStats.interestsReceived?.accepted || 0),
        interestsSent: (apiStats.interestsSent?.total || 0) - (apiStats.interestsSent?.accepted || 0),
        mutualMatches: apiStats.mutualMatches || 0,
        matchesCount: apiStats.potentialMatches || 0,
        // Full breakdown for rate calculations
        sent: {
          total: apiStats.interestsSent?.total || 0,
          accepted: apiStats.interestsSent?.accepted || 0,
          rejected: apiStats.interestsSent?.rejected || 0,
        },
        received: {
          total: apiStats.interestsReceived?.total || 0,
          accepted: apiStats.interestsReceived?.accepted || 0,
          rejected: apiStats.interestsReceived?.rejected || 0,
        },
        // Lifetime stats (never decrease)
        lifetime: {
          interestsReceived: lifetimeStats.interestsReceived || 0,
          interestsSent: lifetimeStats.interestsSent || 0,
          profileViews: lifetimeStats.profileViews || 0,
          matches: lifetimeStats.matches || 0,
          connections: lifetimeStats.mutualMatches || 0,
        },
      })

      // Capture profile info for display
      if (matchesData.myProfile) {
        setProfileInfo({
          firstName: matchesData.myProfile.firstName,
          odNumber: matchesData.myProfile.odNumber,
        })
      }

      // Set profile strength
      if (strengthRes.ok) {
        const strengthData = await strengthRes.json()
        setProfileStrength(strengthData)
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
  // Safety: loadingTimeout prevents infinite loading if something goes wrong
  const isCreatingOrPendingProfile = creatingProfile || hasPendingSignupData
  const shouldShowLoader = !loadingTimeout && (
    status === 'loading' ||
    (isAdminView && !adminChecked) ||
    (isAdminView && !userContextReady) ||
    (status === 'authenticated' && !sessionDataLoaded) ||
    isCreatingOrPendingProfile
  )
  if (shouldShowLoader) {
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
        <div className="w-full px-4 md:px-8 xl:px-10">
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
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm">
                    <Clock className="h-4 w-4" />
                    Paid - Awaiting Approval
                  </span>
                ) : isPending && hasPaid !== true ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-sm">
                    <AlertCircle className="h-4 w-4" />
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

            {/* 1. Events & Announcements — Interest Survey */}
            {!surveyDismissed && (
              <div className="mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-xl shadow-lg p-4 sm:p-5 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8" />
                <div className="relative">
                  {surveyStep === 0 && (
                    /* Step 0: Initial CTA */
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">Upcoming Event</p>
                        <h3 className="text-base sm:text-lg font-bold mt-0.5">VivaahReady Mixer — Coming Soon</h3>
                        <p className="text-xs text-white/85 mt-0.5 max-w-md">
                          Meet verified members in person. Help us plan the perfect event for you!
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => setSurveyStep(1)}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-white text-purple-700 rounded-lg font-semibold text-xs hover:bg-white/90 transition-colors shadow-sm"
                        >
                          I&apos;m Interested!
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSurveyDismissed(true)
                            localStorage.setItem('vivaah_event_survey_dismissed', 'true')
                          }}
                          className="text-white/60 hover:text-white/90 text-[10px] underline underline-offset-2"
                        >
                          Not now
                        </button>
                      </div>
                    </div>
                  )}

                  {surveyStep === 1 && (
                    /* Step 1: Inline Survey Form */
                    <div>
                      <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest mb-1">Help Us Plan</p>
                      <h3 className="text-base font-bold">What kind of event would you love?</h3>
                      <div className="mt-3 space-y-3">
                        {/* Event Format */}
                        <div>
                          <p className="text-xs font-medium text-white/80 mb-1.5">Event format</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'in_person', label: 'In-Person' },
                              { value: 'virtual', label: 'Virtual (Zoom)' },
                              { value: 'either', label: 'Either works' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setSurveyForm(f => ({ ...f, eventFormat: opt.value }))}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  surveyForm.eventFormat === opt.value
                                    ? 'bg-white text-purple-700'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preferred City */}
                        {surveyForm.eventFormat !== 'virtual' && (
                          <div>
                            <p className="text-xs font-medium text-white/80 mb-1.5">Preferred city</p>
                            <input
                              type="text"
                              value={surveyForm.preferredCity}
                              onChange={e => setSurveyForm(f => ({ ...f, preferredCity: e.target.value }))}
                              placeholder="e.g., San Francisco, Dallas, New York"
                              className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/20 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/50"
                            />
                          </div>
                        )}

                        {/* Event Type */}
                        <div>
                          <p className="text-xs font-medium text-white/80 mb-1.5">Event type</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'speed_dating', label: 'Speed Dating' },
                              { value: 'social_mixer', label: 'Social Mixer' },
                              { value: 'panel', label: 'Panel + Q&A' },
                              { value: 'activity', label: 'Activity (hiking, cooking)' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setSurveyForm(f => ({ ...f, eventType: opt.value }))}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  surveyForm.eventType === opt.value
                                    ? 'bg-white text-purple-700'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Budget */}
                        <div>
                          <p className="text-xs font-medium text-white/80 mb-1.5">Budget per event</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'free', label: 'Free' },
                              { value: 'under_25', label: 'Under $25' },
                              { value: '25_to_50', label: '$25–50' },
                              { value: 'over_50', label: '$50+' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setSurveyForm(f => ({ ...f, budgetRange: opt.value }))}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  surveyForm.budgetRange === opt.value
                                    ? 'bg-white text-purple-700'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Suggestions */}
                        <div>
                          <p className="text-xs font-medium text-white/80 mb-1.5">Any other ideas? <span className="text-white/50">(optional)</span></p>
                          <textarea
                            value={surveyForm.suggestions}
                            onChange={e => setSurveyForm(f => ({ ...f, suggestions: e.target.value }))}
                            placeholder="E.g., weekend events, vegetarian-only, age groups..."
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/20 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/50 resize-none"
                          />
                        </div>

                        {/* Submit + Back */}
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            onClick={submitEventSurvey}
                            disabled={surveyLoading}
                            className="inline-flex items-center gap-1 px-5 py-2 bg-white text-purple-700 rounded-lg font-semibold text-xs hover:bg-white/90 transition-colors shadow-sm disabled:opacity-60"
                          >
                            {surveyLoading ? 'Submitting...' : 'Submit'}
                          </button>
                          <button
                            onClick={() => setSurveyStep(0)}
                            className="text-white/60 hover:text-white/90 text-xs"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {surveyStep === 2 && (
                    /* Step 2: Thank You */
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-white/90 flex-shrink-0" />
                        <div>
                          <h3 className="text-base font-bold">Thanks for your input!</h3>
                          <p className="text-xs text-white/85 mt-0.5">
                            We&apos;ll notify you when events match your preferences.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSurveyStep(1)}
                        className="text-white/70 hover:text-white text-xs underline underline-offset-2 flex-shrink-0"
                      >
                        Update response
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Profile Strength + Engagement Rewards — 50/50 */}
            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Profile Strength */}
                {profileStrength && (
                  <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-gray-400" />
                      <h3 className="text-base font-semibold text-gray-700 uppercase tracking-wide">Profile Strength</h3>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="flex-shrink-0">
                        <svg className="w-28 h-28" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                          <circle
                            cx="60" cy="60" r="52"
                            fill="none"
                            stroke={profileStrength.score >= 80 ? '#10b981' : profileStrength.score >= 60 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 52}`}
                            strokeDashoffset={`${2 * Math.PI * 52 * (1 - profileStrength.score / 100)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                            className="transition-all duration-1000 ease-out"
                          />
                          <text x="60" y="55" textAnchor="middle" className="text-3xl font-bold" fill="#111827">{profileStrength.score}%</text>
                          <text x="60" y="75" textAnchor="middle" className="text-sm" fill="#6b7280">Complete</text>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        {profileStrength.score >= 90 ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <p className="text-base font-medium">Looking great!</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {profileStrength.tips.slice(0, 2).map((tip, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 leading-snug">{tip}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {profileStrength.memberSince && (
                          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Since {new Date(profileStrength.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Engagement Rewards — compact, matching style */}
                {hasProfile && (
                  <EngagementRewardsCard compact />
                )}
              </div>
            )}

            {/* 3. Lifetime Stats + Referral — side by side */}
            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Lifetime Numbers — original square grid */}
                <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <h3 className="text-base font-semibold text-gray-700 uppercase tracking-wide">Lifetime Numbers</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.sent.total > 0 && (
                      <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-2xl font-bold text-green-700">
                          {Math.round((stats.sent.accepted / stats.sent.total) * 100)}%
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-1">Acceptance Rate</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {stats.sent.accepted} of {stats.sent.total} accepted
                        </p>
                      </div>
                    )}
                    <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-2xl font-bold text-blue-700">{stats.lifetime.profileViews}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">Profile Views</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-pink-50 border border-pink-100">
                      <p className="text-2xl font-bold text-pink-700">{stats.lifetime.interestsReceived}</p>
                      <p className="text-xs text-pink-600 font-medium mt-1">Received</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-violet-50 border border-violet-100">
                      <p className="text-2xl font-bold text-violet-700">{stats.lifetime.interestsSent}</p>
                      <p className="text-xs text-violet-600 font-medium mt-1">Sent</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <p className="text-2xl font-bold text-purple-700">{stats.lifetime.matches}</p>
                      <p className="text-xs text-purple-600 font-medium mt-1">Matches</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-2xl font-bold text-emerald-700">{stats.lifetime.connections}</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">Connections</p>
                    </div>
                  </div>
                </div>

                {/* Referral Card — beside Lifetime Numbers */}
                {hasProfile && (
                  <ReferralCard />
                )}
              </div>
            )}

            {/* 4. Relationship Tidbit */}
            {!loading && (() => {
              const tidbits = [
                { icon: '💡', text: 'Couples who share at least one hobby report 31% higher relationship satisfaction.' },
                { icon: '💬', text: 'The strongest relationships are built on friendship first — shared values matter more than shared interests.' },
                { icon: '🌱', text: 'Successful couples spend an average of 5 hours a week in meaningful conversation.' },
                { icon: '❤️', text: 'Research shows that couples who laugh together stay together — humor is a top predictor of lasting love.' },
                { icon: '🧭', text: 'Aligned life goals are the #1 factor in long-term compatibility, according to relationship experts.' },
                { icon: '🤗', text: 'Small daily gestures of appreciation strengthen bonds more than grand romantic gestures.' },
                { icon: '📖', text: 'Couples who learn something new together build deeper emotional connections over time.' },
                { icon: '🎯', text: 'Knowing your own non-negotiables helps you recognize the right partner when you meet them.' },
                { icon: '✨', text: 'The happiest couples aren\'t perfect — they\'re the ones who communicate openly and forgive often.' },
                { icon: '🌍', text: 'Shared cultural values create a strong foundation, but curiosity about each other\'s differences makes it richer.' },
              ]
              const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % tidbits.length
              const tidbit = tidbits[dayIndex]
              return (
                <div className="mb-4 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 rounded-xl px-4 py-3 flex items-center gap-3 shadow-md">
                  <span className="text-xl flex-shrink-0 bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">{tidbit.icon}</span>
                  <p className="text-xs text-white">
                    <span className="font-bold">Insight:</span> {tidbit.text}
                  </p>
                </div>
              )
            })()}

            {/* Latest Notification */}
            {hasProfile && (
              <div className="bg-white rounded-xl shadow-sm p-4 max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary-600" />
                    <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
                  </div>
                  {unreadNotifCount > 0 && (
                    <span className="bg-primary-100 text-primary-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      {unreadNotifCount} new
                    </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">No notifications yet</p>
                ) : (() => {
                  const n = notifications[0]
                  const iconMap: Record<string, typeof Heart> = {
                    new_interest: Heart,
                    interest_accepted: Users,
                    match_available: Star,
                    profile_approved: UserCheck,
                    payment_confirmed: CreditCard,
                    new_message: MessageCircle,
                    welcome: Bell,
                  }
                  const Icon = iconMap[n.type] || Bell
                  return (
                    <Link
                      href={n.url || '/notifications'}
                      className={`flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${!n.read ? 'bg-primary-50/40' : ''}`}
                    >
                      <div className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${!n.read ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'} line-clamp-1`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {(() => {
                            const diff = Date.now() - new Date(n.createdAt).getTime()
                            const mins = Math.floor(diff / 60000)
                            if (mins < 1) return 'Just now'
                            if (mins < 60) return `${mins}m ago`
                            const hrs = Math.floor(mins / 60)
                            if (hrs < 24) return `${hrs}h ago`
                            const days = Math.floor(hrs / 24)
                            if (days < 7) return `${days}d ago`
                            return new Date(n.createdAt).toLocaleDateString()
                          })()}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="flex-shrink-0 mt-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        </div>
                      )}
                    </Link>
                  )
                })()}
                <Link
                  href="/notifications"
                  className="block text-center text-xs text-primary-600 hover:text-primary-700 font-medium mt-2 pt-2 border-t border-gray-100"
                >
                  View all
                </Link>
              </div>
            )}
          </>
        )}

        {/* Non-approved users: guidance + sidebar layout */}
        {!isApproved && (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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

            {/* Sidebar for non-approved users */}
            <div className="space-y-6">
              {(!hasProfile || (isPending && hasPaid !== true) || (hasProfile && !isApproved && hasPaid === true)) && (
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
                  {isPending && hasPaid !== true && (
                    <Link
                      href="/get-verified"
                      className="btn-primary w-full text-center text-sm py-2 block"
                    >
                      Get Verified
                    </Link>
                  )}
                  {hasProfile && !isApproved && hasPaid === true && (
                    <Link
                      href={buildUrl('/profile/edit')}
                      className="btn-outline w-full text-center text-sm py-2 block"
                    >
                      Edit Profile
                    </Link>
                  )}
                </div>
              )}

              {hasProfile && <ReferralCard />}
            </div>
          </div>
        )}
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
