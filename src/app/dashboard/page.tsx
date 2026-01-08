'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  User,
  Heart,
  Search,
  Bell,
  Eye,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Clock,
  XCircle,
  Sparkles,
} from 'lucide-react'

interface DashboardStats {
  interestsReceived: number
  interestsSent: number
  mutualMatches: number
  matchesCount: number
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<DashboardStats>({
    interestsReceived: 0,
    interestsSent: 0,
    mutualMatches: 0,
    matchesCount: 0,
  })
  const [loading, setLoading] = useState(true)

  const hasProfile = (session?.user as any)?.hasProfile || false
  const approvalStatus = (session?.user as any)?.approvalStatus || null
  const isApproved = hasProfile && approvalStatus === 'approved'
  const isPending = hasProfile && approvalStatus === 'pending'
  const isRejected = hasProfile && approvalStatus === 'rejected'
  const needsProfile = !hasProfile

  // Check for status query param (redirected from profile creation)
  const showPendingMessage = searchParams.get('status') === 'pending'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (isApproved) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [isApproved])

  const fetchStats = async () => {
    try {
      // Fetch interests received
      const receivedRes = await fetch('/api/interest?type=received')
      const receivedData = await receivedRes.json()

      // Fetch interests sent
      const sentRes = await fetch('/api/interest?type=sent')
      const sentData = await sentRes.json()

      // Count mutual matches
      const mutualCount = (receivedData.interests || []).filter(
        (i: any) => i.status === 'accepted'
      ).length

      // Fetch matches count
      const matchesRes = await fetch('/api/matches/auto')
      const matchesData = await matchesRes.json()

      setStats({
        interestsReceived: (receivedData.interests || []).length,
        interestsSent: (sentData.interests || []).length,
        mutualMatches: mutualCount,
        matchesCount: matchesData.total || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            {isApproved
              ? "Here's what's happening with your profile"
              : isPending
              ? 'Your profile is being reviewed'
              : "Let's get your profile set up"}
          </p>
        </div>

        {/* Profile Status Alerts */}
        {(needsProfile || showPendingMessage) && !isPending && !isRejected && (
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
                <Link
                  href="/profile/create"
                  className="inline-flex items-center mt-4 bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  Create Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Pending Approval
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Thank you for creating your profile! Our team is reviewing it to ensure quality matches.
              You'll be notified once your profile is approved. This usually takes 24-48 hours.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex items-center mt-6 text-yellow-700 hover:text-yellow-800 font-medium"
            >
              Edit Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
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
            <Link href="/profile/edit" className="btn-primary">
              Update Profile
            </Link>
          </div>
        )}

        {/* Approved User Stats */}
        {isApproved && (
          <>
            {/* Success Banner for new approvals */}
            {stats.mutualMatches === 0 && stats.interestsReceived === 0 && (
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
                      href="/search"
                      className="inline-flex items-center mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      View Your Matches
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Your Matches</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stats.matchesCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Interests Received</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stats.interestsReceived}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Interests Sent</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stats.interestsSent}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Mutual Matches</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? '...' : stats.mutualMatches}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

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
                    href="/search"
                    className="btn-primary text-sm"
                  >
                    View Matches
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href="/search"
                  className={`flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${!isApproved ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Search className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Matches</p>
                    <p className="text-sm text-gray-500">See profiles matched for you</p>
                  </div>
                </Link>

                <Link
                  href={hasProfile ? '/profile/edit' : '/profile/create'}
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {hasProfile ? 'Edit Profile' : 'Create Profile'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {hasProfile ? 'Update your information' : 'Get started now'}
                    </p>
                  </div>
                </Link>

                {isApproved && (
                  <>
                    <div
                      className="flex items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                        <Heart className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Express Interest</p>
                        <p className="text-sm text-gray-500">Visit a profile to express interest</p>
                      </div>
                    </div>

                    <div
                      className="flex items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Mutual Matches</p>
                        <p className="text-sm text-gray-500">Contact info unlocked on mutual match</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-primary-600 font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Complete Your Profile</p>
                    <p className="text-sm text-gray-500">Fill in your details and preferences</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-primary-600 font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Profile Review</p>
                    <p className="text-sm text-gray-500">Our team reviews your profile for quality</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-primary-600 font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Matched Profiles</p>
                    <p className="text-sm text-gray-500">See profiles that match your preferences</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-primary-600 font-semibold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Express Interest</p>
                    <p className="text-sm text-gray-500">When both express interest, contact details are revealed!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Status</h2>
              <div className="flex items-center mb-4">
                {isApproved ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-700 font-medium">Approved</span>
                  </>
                ) : isPending ? (
                  <>
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-700 font-medium">Pending Review</span>
                  </>
                ) : isRejected ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-700 font-medium">Not Approved</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-500 font-medium">No Profile</span>
                  </>
                )}
              </div>
              {!hasProfile && (
                <Link
                  href="/profile/create"
                  className="btn-primary w-full text-center text-sm py-2"
                >
                  Create Profile
                </Link>
              )}
              {hasProfile && !isApproved && (
                <Link
                  href="/profile/edit"
                  className="btn-outline w-full text-center text-sm py-2"
                >
                  Edit Profile
                </Link>
              )}
            </div>

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
