'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  User,
  Heart,
  Search,
  Crown,
  Bell,
  Eye,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    profileViews: 0,
    interestsReceived: 0,
    matchesAccepted: 0,
    profileCompleteness: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

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

  const hasProfile = (session.user as any).hasProfile

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your profile
          </p>
        </div>

        {/* Profile Completion Alert */}
        {!hasProfile && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-yellow-500 mt-0.5" />
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-yellow-800">
                  Complete Your Profile
                </h3>
                <p className="text-yellow-700 mt-1">
                  Your profile is incomplete. Complete it now to start receiving curated matches
                  from our team.
                </p>
                <Link
                  href="/profile/create"
                  className="inline-flex items-center mt-4 bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  Complete Profile
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
                <p className="text-sm text-gray-500">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.profileViews}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interests Received</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.interestsReceived}</p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Matches Accepted</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.matchesAccepted}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Profile Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.profileCompleteness}%</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href="/search"
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Search className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Search Profiles</p>
                    <p className="text-sm text-gray-500">Find your perfect match</p>
                  </div>
                </Link>

                <Link
                  href="/matches"
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                    <Heart className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">My Matches</p>
                    <p className="text-sm text-gray-500">View your curated matches</p>
                  </div>
                </Link>

                <Link
                  href="/profile"
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

                <Link
                  href="/pricing"
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                    <Crown className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upgrade Plan</p>
                    <p className="text-sm text-gray-500">Get premium features</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">Start exploring profiles to see activity here</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan</h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Current Plan</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {(session.user as any).subscriptionPlan || 'Free'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Daily Profile Views</span>
                  <span>10</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Interests</span>
                  <span>5</span>
                </div>
              </div>
              <Link
                href="/pricing"
                className="btn-primary w-full text-center text-sm py-2"
              >
                Upgrade to Premium
              </Link>
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
