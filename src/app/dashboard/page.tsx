'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  Heart,
  Users,
  Eye,
  Bell,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Clock,
  XCircle,
  Sparkles,
  Shield,
  Target,
  Lightbulb,
  Calendar,
} from 'lucide-react'
import FindMatchModal from '@/components/FindMatchModal'
import VerificationPaymentModal from '@/components/VerificationPaymentModal'
import ReferralCard from '@/components/ReferralCard'
import EngagementRewardsCard from '@/components/EngagementRewardsCard'
import ProfileFeedbackPopup from '@/components/ProfileFeedbackPopup'
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
  const [dbProfileChecked, setDbProfileChecked] = useState(false)
  const [dbHasProfile, setDbHasProfile] = useState<boolean | null>(null)
  const [profileStrength, setProfileStrength] = useState<ProfileStrength | null>(null)
  const [showProfileFeedback, setShowProfileFeedback] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; body: string; url: string | null; read: boolean; createdAt: string }[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  // Event survey state
  const [surveyStep, setSurveyStep] = useState(0) // 0=not shown, 1=interest question, 2=details
  const [surveyLoading, setSurveyLoading] = useState(false)
  const [surveyForm, setSurveyForm] = useState({
    interestLevel: '',
    availability: '',
    duration: '',
    goal: '',
    nameSharing: '',
    frequency: '',
    groupSize: '',
    ageRange: '',
    timeZone: '',
    videoComfort: '',
    suggestions: '',
  })

  // Check for status query param (redirected from profile creation)
  const showPendingMessage = searchParams.get('status') === 'pending'
  const shouldCreateProfile = searchParams.get('createProfile') === 'true'

  // Check if session data is fully loaded (hasProfile will be undefined until JWT callback populates it)
  const sessionDataLoaded = isAdminView || dbProfileChecked || (session?.user && (session.user as any).hasProfile === true)
  const sessionHasProfile = isAdminView
    ? !!impersonatedUser?.profile
    : ((session?.user as any)?.hasProfile || false)
  const sessionApprovalStatus = isAdminView
    ? (impersonatedUser?.profile?.approvalStatus || null)
    : ((session?.user as any)?.approvalStatus || null)
  const pendingFromUrl = showPendingMessage && !sessionApprovalStatus
  const hasProfile = dbHasProfile === true || sessionHasProfile || pendingFromUrl
  const approvalStatus = sessionApprovalStatus || (pendingFromUrl ? 'pending' : null)
  const isApproved = hasProfile && approvalStatus === 'approved'
  const isPending = hasProfile && approvalStatus === 'pending'
  const isRejected = hasProfile && approvalStatus === 'rejected'
  const needsProfile = !hasProfile
  const canAccess = !!session || (isAdminView && isAdminAccess)
  const userContextReady = !isAdminView || impersonatedLoaded
  const displayName = (isAdminView ? impersonatedUser?.name : session?.user?.name) || 'User'

  // Admin link
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false))
  }, [])

  // Check actual profile status from database
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView) return
    if (dbProfileChecked) return

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

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true)
    }, 10000)
    return () => clearTimeout(timer)
  }, [])

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
  useEffect(() => {
    if (status !== 'authenticated' || isAdminView || !hasProfile) return

    fetch('/api/profile/completion-status')
      .then(res => res.json())
      .then(data => {
        if (!data.hasProfile) return

        if (data.signupStep < 8) {
          router.push(`/profile/complete?profileId=${data.profileId}&step=${data.signupStep + 1}`)
          return
        }

        if (!data.hasPhotos && data.signupStep < 10) {
          router.push(`/profile/photos?profileId=${data.profileId}&fromSignup=true`)
        }
      })
      .catch(() => {})
  }, [status, isAdminView, hasProfile, router])

  // Clean up orphaned signupFormData
  useEffect(() => {
    if (
      status === 'authenticated' &&
      dbProfileChecked &&
      dbHasProfile === true &&
      !shouldCreateProfile &&
      typeof window !== 'undefined'
    ) {
      const hasSessionData = sessionStorage.getItem('signupFormData')
      const hasLocalData = localStorage.getItem('signupFormData')
      if (hasSessionData || hasLocalData) {
        console.log('Cleaning up orphaned signupFormData (profile exists)')
        sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
        localStorage.removeItem('signupFormData')
      }
    }
  }, [status, shouldCreateProfile, dbProfileChecked, dbHasProfile])

  // Handle Google auth callback
  useEffect(() => {
    const handleGoogleAuthCallback = async () => {
      if (status !== 'authenticated' || !shouldCreateProfile || !session?.user?.email) return

      const storedFormData = sessionStorage.getItem('signupFormData')
      if (!storedFormData) return

      if (creatingProfile || createdProfileId) return

      setCreatingProfile(true)

      try {
        const formData = JSON.parse(storedFormData)

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
          sessionStorage.removeItem('signupFormData'); localStorage.removeItem('signupFormData')
          router.push(`/profile/complete?profileId=${profileData.profileId}&step=2`)
        } else if (profileResponse.status === 409) {
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

  // Auto-show create profile modal
  useEffect(() => {
    if (showPendingMessage) return
    if (!sessionDataLoaded || !dbProfileChecked) return
    if (dbHasProfile === true) return

    if (status === 'authenticated' && needsProfile && (shouldCreateProfile || !showCreateProfileModal)) {
      const timer = setTimeout(() => {
        setShowCreateProfileModal(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [status, needsProfile, shouldCreateProfile, showCreateProfileModal, sessionDataLoaded, showPendingMessage, dbProfileChecked, dbHasProfile, router])

  // Fetch stats for any user with a profile
  useEffect(() => {
    if (!userContextReady) return
    if (hasProfile) {
      fetchStats()
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProfile, isApproved, buildApiUrl, userContextReady])

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

  // Show profile feedback popup for new users (within 7 days)
  useEffect(() => {
    if (!hasProfile || typeof window === 'undefined') return
    if (localStorage.getItem('vivaah_profile_feedback_given')) return

    if (profileStrength?.memberSince) {
      const createdAt = new Date(profileStrength.memberSince)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      if (createdAt > sevenDaysAgo) {
        setShowProfileFeedback(true)
      }
    }
  }, [hasProfile, profileStrength])

  // Check event survey status
  useEffect(() => {
    if (!hasProfile || typeof window === 'undefined') return

    fetch('/api/event-interest')
      .then(res => res.json())
      .then(data => {
        if (!data.submitted) {
          setSurveyStep(1)
        }
      })
      .catch(() => {})
  }, [hasProfile])

  // Fetch notifications (latest 1 for dashboard)
  useEffect(() => {
    if (!hasProfile) return

    fetch('/api/notifications?limit=1')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setNotifications(data.notifications || [])
          setUnreadNotifCount(data.unreadCount || 0)
        }
      })
      .catch(() => {})
  }, [hasProfile])

  const handleSurveySubmit = async () => {
    if (!surveyForm.interestLevel) return
    setSurveyLoading(true)
    try {
      await fetch('/api/event-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyForm),
      })
      setSurveyStep(0)
    } catch {
      // silent
    } finally {
      setSurveyLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch profile strength for any user with a profile
      const strengthPromise = fetch('/api/profile/strength')
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)

      // Only fetch match stats for approved users
      const matchesPromise = isApproved
        ? fetch(buildApiUrl('/api/matches/auto'))
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        : Promise.resolve(null)

      const [strengthData, matchesData] = await Promise.all([strengthPromise, matchesPromise])

      if (strengthData) {
        setProfileStrength(strengthData)
      }

      if (matchesData) {
        const apiStats = matchesData.stats || {}
        const lifetimeStats = apiStats.lifetime || {}

        setStats({
          interestsReceived: apiStats.interestsReceived?.total || 0,
          interestsSent: apiStats.interestsSent?.total || 0,
          mutualMatches: apiStats.mutualMatches || 0,
          matchesCount: apiStats.potentialMatches || 0,
          lifetime: {
            interestsReceived: lifetimeStats.interestsReceived || 0,
            interestsSent: lifetimeStats.interestsSent || 0,
            profileViews: lifetimeStats.profileViews || 0,
            matches: lifetimeStats.matches || 0,
          },
        })

        if (matchesData.myProfile) {
          setProfileInfo({
            firstName: matchesData.myProfile.firstName,
            odNumber: matchesData.myProfile.odNumber,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Loader
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

        {/* Dashboard content for users with a profile */}
        {hasProfile && (
          <>
            {/* Success Banner for new approvals */}
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

            {/* 1. Event Survey */}
            {surveyStep > 0 && (
              <>
                {surveyStep === 1 && (
                  <div className="mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-xl p-4 sm:p-5 shadow-md">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-white">Singles Meet-Up Events</h3>
                          <p className="text-sm text-purple-100">Would you attend a singles meet-up organized by VivaahReady?</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSurveyForm(f => ({ ...f, interestLevel: 'yes' })); setSurveyStep(2) }}
                        className="px-4 py-2 bg-white text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors"
                      >
                        Interested?
                      </button>
                    </div>
                  </div>
                )}

                {surveyStep === 2 && (
                  <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Zoom Meet-Up Preferences</h3>
                    </div>
                    <p className="text-base text-gray-600 mb-4">Help us plan the perfect virtual meet-up for you:</p>
                    <div className="grid sm:grid-cols-3 gap-4 mb-5">
                      <div>
                        <label className="text-sm text-gray-600 font-medium mb-1.5 block">When are you available?</label>
                        <select
                          value={surveyForm.availability}
                          onChange={e => setSurveyForm(f => ({ ...f, availability: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select availability</option>
                          <option value="weekend_morning">Weekend mornings</option>
                          <option value="weekend_evening">Weekend evenings</option>
                          <option value="weekday_evening">Weekday evenings</option>
                          <option value="flexible">Flexible / Any time</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium mb-1.5 block">What are you looking for?</label>
                        <select
                          value={surveyForm.goal}
                          onChange={e => setSurveyForm(f => ({ ...f, goal: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select goal</option>
                          <option value="matched_profiles">Only profiles that match my criteria</option>
                          <option value="make_friends">Open to making new friends</option>
                          <option value="find_partner">Looking to find a partner</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium mb-1.5 block">Preferred duration</label>
                        <select
                          value={surveyForm.duration}
                          onChange={e => setSurveyForm(f => ({ ...f, duration: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select duration</option>
                          <option value="1_hour">1 hour</option>
                          <option value="1.5_hours">1.5 hours</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!surveyForm.interestLevel) setSurveyForm(f => ({ ...f, interestLevel: 'yes' }))
                        handleSurveySubmit()
                      }}
                      disabled={surveyLoading}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {surveyLoading ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* 2. Profile Strength (with tips) + Engagement side by side */}
            {!loading && (
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Profile Strength + Tips combined */}
                {profileStrength && (
                  <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-primary-500" />
                      <h3 className="text-base font-semibold text-gray-700 uppercase tracking-wide">Profile Strength</h3>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="flex-shrink-0">
                        <svg className="w-28 h-28" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                          <circle
                            cx="60" cy="60" r="52"
                            fill="none"
                            stroke={profileStrength.score >= 80 ? '#22c55e' : profileStrength.score >= 50 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 52}`}
                            strokeDashoffset={`${2 * Math.PI * 52 * (1 - profileStrength.score / 100)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                            className="transition-all duration-1000 ease-out"
                          />
                          <text x="60" y="55" textAnchor="middle" className="text-3xl font-bold" fill="#111827">{profileStrength.score}</text>
                          <text x="60" y="75" textAnchor="middle" className="text-sm" fill="#6b7280">%</text>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        {profileStrength.score >= 80 ? (
                          <p className="text-sm text-green-600 font-medium">Your profile is looking great!</p>
                        ) : profileStrength.tips.length > 0 ? (
                          profileStrength.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-600">{tip}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-amber-600 font-medium">Complete your profile to improve your match visibility</p>
                        )}
                      </div>
                    </div>

                    {/* Profile Tips inside the same card */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Profile Tips</p>
                      <ul className="space-y-1.5 text-sm text-gray-500">
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-primary-400" />
                          Add clear, recent photos
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-primary-400" />
                          Complete all profile sections
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-primary-400" />
                          Write a detailed about section
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-primary-400" />
                          Be specific about preferences
                        </li>
                      </ul>
                    </div>

                    {profileStrength.memberSince && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                        Member since {new Date(profileStrength.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                )}

                {/* Engagement Rewards */}
                <EngagementRewardsCard compact />
              </div>
            )}

            {/* 3. Daily Relationship Tidbit */}
            {(() => {
              const tidbits = [
                'Couples who laugh together stay together. Shared humor builds resilience in relationships.',
                'The average person falls in love 7 times before getting married.',
                'Saying "thank you" to your partner daily strengthens emotional bonds more than grand gestures.',
                'Research shows that couples who cook together report higher relationship satisfaction.',
                'The most successful couples have a 5:1 ratio of positive to negative interactions.',
                'Holding hands reduces stress hormones and increases feelings of security.',
                'Couples who travel together have stronger communication and deeper trust.',
                'Active listening is the #1 predictor of relationship longevity.',
                'Sharing new experiences together releases dopamine, keeping the spark alive.',
                'Partners who maintain their own friendships tend to have healthier relationships.',
                'Small daily acts of kindness matter more than occasional big surprises.',
                'Couples who express gratitude are 50% more likely to stay together long-term.',
                'Having shared goals gives couples a sense of purpose and direction.',
                'The way couples handle conflict matters more than how often they disagree.',
                'Learning your partner\'s love language can transform your relationship.',
                'Couples who exercise together report feeling more in love and satisfied.',
                'A 6-second kiss each day can significantly improve relationship connection.',
                'Writing love notes, even short ones, strengthens emotional intimacy.',
                'Couples who celebrate small wins together build a culture of appreciation.',
                'Eye contact during conversation deepens emotional connection between partners.',
                'Date nights don\'t have to be expensive — consistency matters more than cost.',
                'Vulnerability is the birthplace of love, belonging, and joy.',
                'Couples who learn something new together feel more bonded and excited.',
                'The happiest couples are those who are genuinely friends first.',
                'Sharing a meal without screens increases quality time by 40%.',
                'Successful relationships are built on mutual respect, not perfection.',
                'Asking "How was your day?" and truly listening is a powerful daily ritual.',
                'Surprise gestures, no matter how small, keep romance alive.',
                'Couples who dream together about the future feel more aligned and hopeful.',
                'Forgiveness is not about forgetting — it\'s about choosing the relationship over the grudge.',
                'The strongest relationships are between two people who can be silly together.',
              ]
              const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
              const todayTidbit = tidbits[dayOfYear % tidbits.length]
              return (
                <div className="mb-6 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-xl p-4 sm:p-5 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">Daily Relationship Tidbit</p>
                      <p className="text-sm sm:text-base text-white font-medium leading-relaxed">{todayTidbit}</p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 4. Stats Cards (colored boxes) + Referral */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Link
                    href={buildUrl('/profile')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">Profile Views</p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1">
                          {loading ? '...' : stats.lifetime.profileViews}
                        </p>
                      </div>
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-200/60 rounded-full flex items-center justify-center">
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" />
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={buildUrl('/interest-received')}
                    className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-pink-600 font-medium">Interests Received</p>
                        <p className="text-2xl sm:text-3xl font-bold text-pink-800 mt-1">
                          {loading ? '...' : stats.interestsReceived}
                        </p>
                      </div>
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-pink-200/60 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-pink-700" />
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={buildUrl('/sent-interest')}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-purple-600 font-medium">Interests Sent</p>
                        <p className="text-2xl sm:text-3xl font-bold text-purple-800 mt-1">
                          {loading ? '...' : stats.interestsSent}
                        </p>
                      </div>
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-200/60 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-700" />
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={buildUrl('/connections')}
                    className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-green-600 font-medium">Connections</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-800 mt-1">
                          {loading ? '...' : stats.mutualMatches}
                        </p>
                      </div>
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-200/60 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-700" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Referral */}
              <div>
                <ReferralCard />
              </div>
            </div>

            {/* Interest Notification */}
            {stats.interestsReceived > 0 && (
              <div className="mb-6 bg-pink-50 border border-pink-200 rounded-xl p-6">
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

            {/* 4. Notifications (latest 1) */}
            {notifications.length > 0 && (
              <div className="mb-6">
                {(() => {
                  const notif = notifications[0]
                  return (
                    <Link
                      href={notif.url || '/notifications'}
                      className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${notif.read ? 'bg-white shadow-sm hover:shadow-md' : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'}`}
                    >
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className={`h-5 w-5 ${notif.read ? 'text-gray-500' : 'text-primary-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.body}</p>
                      </div>
                      {unreadNotifCount > 1 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">+{unreadNotifCount - 1}</span>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </Link>
                  )
                })()}
              </div>
            )}

          </>
        )}
      </div>

      {/* Create Profile Modal */}
      <FindMatchModal
        isOpen={showCreateProfileModal}
        onClose={() => setShowCreateProfileModal(false)}
      />

      {/* Verification Payment Modal */}
      <VerificationPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />

      {/* Profile Feedback Popup */}
      {showProfileFeedback && (
        <ProfileFeedbackPopup onClose={() => setShowProfileFeedback(false)} />
      )}
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
