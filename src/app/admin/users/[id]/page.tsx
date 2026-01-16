'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, User, Mail, Phone, Calendar, Shield,
  Loader2, Heart, Users, MessageCircle, LayoutDashboard,
  Eye, Edit, CheckCircle, XCircle, Clock, Ban,
  ExternalLink, RotateCcw, MapPin, Briefcase, GraduationCap,
  Sparkles, AlertTriangle, Trash2, UserCheck,
} from 'lucide-react'
import { adminLinks } from '@/lib/adminLinks'
import { formatHeight, calculateAge, extractPhotoUrls, isValidImageUrl, getInitials } from '@/lib/utils'

interface UserDetail {
  id: string
  name: string
  email: string
  phone: string | null
  emailVerified: string | null
  phoneVerified: string | null
  lastLogin: string | null
  createdAt: string
  mustChangePassword: boolean
  profile: {
    id: string
    odNumber: string | null
    gender: string
    dateOfBirth: string | null
    age: string | null
    height: string | null
    currentLocation: string | null
    occupation: string | null
    qualification: string | null
    community: string | null
    caste: string | null
    religion: string | null
    approvalStatus: string
    isVerified: boolean
    isSuspended: boolean
    suspendedReason: string | null
    suspendedAt: string | null
    photoUrls: string | null
    profileImageUrl: string | null
    aboutMe: string | null
    referralSource: string | null
    createdBy: string | null
  } | null
  subscription: {
    plan: string
    profilePaid: boolean
    expiresAt: string | null
  } | null
  _count: {
    sentMatches: number
    receivedMatches: number
    reportsFiled: number
    reportsReceived: number
  }
}

interface MatchStats {
  potentialMatches: number
  mutualMatches: number
  likedYouCount: number
  interestsSent: { total: number; pending: number; accepted: number; rejected: number }
  interestsReceived: { total: number; pending: number; accepted: number; rejected: number }
  declined: number
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      // Fetch user details
      const userRes = await fetch(`/api/admin/users/${userId}`)
      const userData = await userRes.json()

      if (!userRes.ok) {
        console.error('Failed to fetch user:', userData.error || 'Unknown error', 'Status:', userRes.status)
        throw new Error(userData.error || 'User not found')
      }

      setUser(userData.user)

      // If user has approved profile, fetch their match stats
      if (userData.user?.profile?.approvalStatus === 'approved') {
        const matchRes = await fetch(`/api/matches/auto?viewAsUser=${userId}`)
        const matchData = await matchRes.json()
        setMatchStats(matchData.stats || null)
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!user?.profile) return
    setActionLoading('verify')
    try {
      await fetch(`/api/admin/profiles/${user.profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !user.profile.isVerified }),
      })
      fetchUserDetails()
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async () => {
    if (!user?.profile) return
    const reason = prompt('Enter reason for suspension:')
    if (!reason) return

    setActionLoading('suspend')
    try {
      await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'suspend',
          reason,
        }),
      })
      fetchUserDetails()
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsuspend = async () => {
    if (!user?.profile) return
    if (!confirm('Unsuspend this user?')) return

    setActionLoading('unsuspend')
    try {
      await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'unsuspend',
        }),
      })
      fetchUserDetails()
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
        {error && (
          <p className="text-gray-600 text-sm mb-4">Error: {error}</p>
        )}
        <p className="text-gray-500 text-xs mb-4">User ID: {userId}</p>
        <Link href="/admin/users" className="text-purple-600 hover:underline">
          Back to Users
        </Link>
      </div>
    )
  }

  const photos = user.profile ? extractPhotoUrls(user.profile.photoUrls) : []
  const validProfileImageUrl = user.profile && isValidImageUrl(user.profile.profileImageUrl) ? user.profile.profileImageUrl : null
  const allPhotos = photos.length > 0 ? photos : (validProfileImageUrl ? [validProfileImageUrl] : [])
  const age = user.profile?.dateOfBirth ? calculateAge(user.profile.dateOfBirth) : user.profile?.age

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
          <p className="text-gray-600 text-sm">Complete account overview and management</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Photo */}
            <div className="aspect-square bg-gray-100 relative">
              {allPhotos.length > 0 ? (
                <img
                  src={allPhotos[0]}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100">
                  <span className="text-6xl font-bold text-purple-300">
                    {getInitials(user.name)}
                  </span>
                </div>
              )}
              {user.profile?.isVerified && (
                <div className="absolute top-3 right-3 bg-green-500 text-white p-2 rounded-full">
                  <Shield className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              {user.profile?.odNumber && (
                <p className="text-purple-600 font-mono text-sm">{user.profile.odNumber}</p>
              )}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Mail className="h-4 w-4" />
                  {user.email}
                  {user.emailVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                    {user.phoneVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {user.profile?.isSuspended && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    Suspended
                  </span>
                )}
                {user.profile?.approvalStatus === 'approved' && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Approved
                  </span>
                )}
                {user.profile?.approvalStatus === 'pending' && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                )}
                {user.profile?.approvalStatus === 'rejected' && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    Rejected
                  </span>
                )}
                {!user.profile && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    No Profile
                  </span>
                )}
                {user.profile?.gender && (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    user.profile.gender === 'female'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.profile.gender === 'female' ? 'Bride' : 'Groom'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Admin Actions</h3>
            <div className="space-y-2">
              {user.profile && (
                <>
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading === 'verify'}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                      user.profile.isVerified
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {actionLoading === 'verify' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        {user.profile.isVerified ? 'Remove Verification' : 'Verify Profile'}
                      </>
                    )}
                  </button>

                  {user.profile.isSuspended ? (
                    <button
                      onClick={handleUnsuspend}
                      disabled={actionLoading === 'unsuspend'}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                    >
                      {actionLoading === 'unsuspend' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Unsuspend User
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSuspend}
                      disabled={actionLoading === 'suspend'}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200"
                    >
                      {actionLoading === 'suspend' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Ban className="h-4 w-4" />
                          Suspend User
                        </>
                      )}
                    </button>
                  )}

                  <Link
                    href={adminLinks.editProfile(user.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login</span>
                <span className="text-gray-900">{formatDate(user.lastLogin)}</span>
              </div>
              {user.subscription && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan</span>
                    <span className="text-gray-900 capitalize">{user.subscription.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment</span>
                    <span className={user.subscription.profilePaid ? 'text-green-600' : 'text-gray-400'}>
                      {user.subscription.profilePaid ? 'Paid' : 'Not Paid'}
                    </span>
                  </div>
                </>
              )}
              {user.profile?.referralSource && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Referral</span>
                  <span className="text-gray-900">{user.profile.referralSource}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - View As User & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* View As User Quick Links */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">View As {user.name}</h3>
                <p className="text-purple-200 text-sm">
                  Click any button to see exactly what this user sees
                </p>
              </div>
            </div>

            {user.profile?.approvalStatus === 'approved' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link
                  href={adminLinks.dashboard(user.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <LayoutDashboard className="h-6 w-6" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <Link
                  href={adminLinks.matches(user.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <Heart className="h-6 w-6" />
                  <span className="text-sm font-medium">My Matches</span>
                </Link>
                <Link
                  href={adminLinks.connections(user.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm font-medium">Connections</span>
                </Link>
                <Link
                  href={adminLinks.myProfile(user.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <User className="h-6 w-6" />
                  <span className="text-sm font-medium">Profile</span>
                </Link>
                <Link
                  href={adminLinks.reconsider(user.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <RotateCcw className="h-6 w-6" />
                  <span className="text-sm font-medium">Reconsider</span>
                </Link>
                <Link
                  href={adminLinks.messages(user.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-sm font-medium">Messages</span>
                </Link>
              </div>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
                <p className="text-purple-100">
                  {user.profile
                    ? 'Profile not approved - limited view available'
                    : 'User has not created a profile yet'}
                </p>
                {user.profile && (
                  <Link
                    href={adminLinks.dashboard(user.id)}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    View Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Match Stats */}
          {matchStats && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{matchStats.potentialMatches}</p>
                  <p className="text-sm text-blue-700">Potential Matches</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-pink-600">{matchStats.likedYouCount}</p>
                  <p className="text-sm text-pink-700">Liked Them</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{matchStats.mutualMatches}</p>
                  <p className="text-sm text-green-700">Mutual Matches</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-gray-600">{matchStats.declined}</p>
                  <p className="text-sm text-gray-700">Declined</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Interests Sent */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Interests Sent</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-medium">{matchStats.interestsSent.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600">Pending</span>
                      <span className="font-medium">{matchStats.interestsSent.pending}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Accepted</span>
                      <span className="font-medium">{matchStats.interestsSent.accepted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Rejected</span>
                      <span className="font-medium">{matchStats.interestsSent.rejected}</span>
                    </div>
                  </div>
                </div>

                {/* Interests Received */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Interests Received</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-medium">{matchStats.interestsReceived.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600">Pending</span>
                      <span className="font-medium">{matchStats.interestsReceived.pending}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Accepted</span>
                      <span className="font-medium">{matchStats.interestsReceived.accepted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Rejected</span>
                      <span className="font-medium">{matchStats.interestsReceived.rejected}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Details */}
          {user.profile && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {age && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{age} years old</span>
                    </div>
                  )}
                  {user.profile.height && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{formatHeight(user.profile.height)}</span>
                    </div>
                  )}
                  {user.profile.currentLocation && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{user.profile.currentLocation}</span>
                    </div>
                  )}
                  {user.profile.occupation && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{user.profile.occupation}</span>
                    </div>
                  )}
                  {user.profile.qualification && (
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{user.profile.qualification}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {user.profile.religion && (
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{user.profile.religion}</span>
                    </div>
                  )}
                  {user.profile.community && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{user.profile.community}</span>
                    </div>
                  )}
                  {user.profile.caste && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{user.profile.caste}</span>
                    </div>
                  )}
                </div>
              </div>

              {user.profile.aboutMe && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">About</h4>
                  <p className="text-gray-600 text-sm">{user.profile.aboutMe}</p>
                </div>
              )}

              {user.profile.isSuspended && user.profile.suspendedReason && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-1">Suspension Reason</h4>
                  <p className="text-red-700 text-sm">{user.profile.suspendedReason}</p>
                  {user.profile.suspendedAt && (
                    <p className="text-red-600 text-xs mt-2">
                      Suspended on {formatDate(user.profile.suspendedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Photo Gallery */}
          {allPhotos.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos ({allPhotos.length})</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {allPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
