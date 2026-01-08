'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  User,
  Loader2,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import ProfilePhoto from '@/components/ProfilePhoto'

interface Profile {
  id: string
  gender: string
  dateOfBirth: string | null
  height: string | null
  currentLocation: string | null
  caste: string | null
  qualification: string | null
  occupation: string | null
  dietaryPreference: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  user: {
    name: string
    email?: string
    phone?: string
  }
  interestStatus?: {
    sentByMe: boolean
    receivedFromThem: boolean
    mutual: boolean
  }
}

export default function SearchPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [matchStatus, setMatchStatus] = useState<string | null>(null)
  const [matchMessage, setMatchMessage] = useState<string>('')

  // Get user state
  const hasProfile = (session?.user as any)?.hasProfile || false
  const approvalStatus = (session?.user as any)?.approvalStatus || null

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (session && hasProfile && approvalStatus === 'approved') {
      // Fetch matched profiles for approved users
      fetchMatchedProfiles()
    } else if (!session || !hasProfile) {
      // Fetch public profiles (blurred) for non-logged-in or users without profiles
      fetchPublicProfiles()
    } else {
      // User has profile but not approved - show appropriate message
      setLoading(false)
      setMatchStatus(approvalStatus)
    }
  }, [session, sessionStatus, hasProfile, approvalStatus])

  const fetchMatchedProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/matches/auto')
      const data = await response.json()

      if (data.status) {
        setMatchStatus(data.status)
        setMatchMessage(data.message || '')
        setProfiles([])
      } else {
        setProfiles(data.matches || [])
        setMatchStatus('approved')
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profiles')
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dob: string | null): string => {
    if (!dob) return ''
    // Handle ISO date format (YYYY-MM-DD)
    if (dob.includes('-')) {
      const date = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - date.getFullYear()
      const monthDiff = today.getMonth() - date.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--
      }
      return `${age} yrs`
    }
    // Handle MM/YYYY format
    const parts = dob.split('/')
    if (parts.length >= 2) {
      const year = parseInt(parts[parts.length - 1])
      if (year > 1900 && year < 2020) {
        const age = new Date().getFullYear() - year
        return `${age} yrs`
      }
    }
    return ''
  }

  // Determine what to show based on user state
  const isApproved = session && hasProfile && approvalStatus === 'approved'
  const isPending = session && hasProfile && approvalStatus === 'pending'
  const isRejected = session && hasProfile && approvalStatus === 'rejected'
  const needsProfile = session && !hasProfile
  const isGuest = !session

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isApproved ? 'Your Matches' : 'Browse Profiles'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isApproved
              ? `${profiles.length} profiles match your preferences`
              : 'Find your perfect match'
            }
          </p>
        </div>

        {/* Pending Approval Status */}
        {isPending && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Pending Approval</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your profile is being reviewed by our team. You'll be able to see your matches once approved.
              This usually takes 24-48 hours.
            </p>
          </div>
        )}

        {/* Rejected Status */}
        {isRejected && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Approved</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              Unfortunately, your profile was not approved. Please contact support for more information.
            </p>
            <Link href="/profile/edit" className="btn-primary">
              Update Profile
            </Link>
          </div>
        )}

        {/* Needs Profile Banner */}
        {needsProfile && (
          <div className="mb-6 p-6 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0">
                <Lock className="h-10 w-10 text-primary-600" />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
                <p className="text-gray-600">
                  Create your profile to see your personalized matches and start connecting with compatible profiles.
                </p>
              </div>
              <Link href="/profile/create" className="flex-shrink-0 btn-primary">
                Create Profile
              </Link>
            </div>
          </div>
        )}

        {/* Guest Banner */}
        {isGuest && sessionStatus !== 'loading' && (
          <div className="mb-6 p-6 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0">
                <Lock className="h-10 w-10 text-primary-600" />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900">Sign Up to See Full Profiles</h3>
                <p className="text-gray-600">
                  Create a free account to see complete profile details and start your journey to finding love.
                </p>
              </div>
              <div className="flex-shrink-0 flex gap-2">
                <Link href="/login" className="btn-outline">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary">
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : isPending || isRejected ? null : profiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isApproved ? 'No matches found yet' : 'No profiles available'}
            </h3>
            <p className="text-gray-600">
              {isApproved
                ? 'Check back later as new profiles are added regularly'
                : 'New profiles are being added regularly'
              }
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                calculateAge={calculateAge}
                hasAccess={isApproved}
                isLoggedIn={!!session}
                interestStatus={profile.interestStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileCard({
  profile,
  calculateAge,
  hasAccess,
  isLoggedIn,
  interestStatus,
}: {
  profile: Profile
  calculateAge: (dob: string | null) => string
  hasAccess: boolean
  isLoggedIn: boolean
  interestStatus?: {
    sentByMe: boolean
    receivedFromThem: boolean
    mutual: boolean
  }
}) {
  const [expressing, setExpressing] = useState(false)
  const [localInterestStatus, setLocalInterestStatus] = useState(interestStatus)
  const age = calculateAge(profile.dateOfBirth)

  // Mask name if no access
  const displayName = hasAccess
    ? profile.user.name
    : profile.user.name.split(' ')[0].charAt(0) + '****'

  // Mask location if no access
  const displayLocation = hasAccess
    ? profile.currentLocation
    : profile.currentLocation
      ? profile.currentLocation.split(',').pop()?.trim() + ' area'
      : null

  const handleExpressInterest = async () => {
    if (localInterestStatus?.sentByMe) return

    setExpressing(true)
    try {
      const response = await fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      })

      const data = await response.json()

      if (response.ok) {
        setLocalInterestStatus({
          sentByMe: true,
          receivedFromThem: localInterestStatus?.receivedFromThem || data.mutual,
          mutual: data.mutual,
        })
      }
    } catch (error) {
      console.error('Error expressing interest:', error)
    } finally {
      setExpressing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
      {/* Mutual Interest Badge */}
      {localInterestStatus?.mutual && (
        <div className="absolute top-3 left-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Mutual Match
        </div>
      )}

      {/* Interest Received Badge */}
      {localInterestStatus?.receivedFromThem && !localInterestStatus?.mutual && (
        <div className="absolute top-3 left-3 z-10 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Heart className="h-3 w-3" />
          Interested in you
        </div>
      )}

      {/* Photo */}
      <div className={`h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative ${!hasAccess ? 'overflow-hidden' : ''}`}>
        <ProfilePhoto
          profile={profile}
          name={profile.user.name}
          size="xl"
          blurred={!hasAccess}
          className={!hasAccess ? 'filter blur-sm scale-110' : ''}
        />
        {!hasAccess && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
        )}
      </div>

      {/* Info */}
      <div className={`p-5 ${!hasAccess ? 'relative' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className={`text-lg font-semibold text-gray-900 ${!hasAccess ? 'blur-[3px] select-none' : ''}`}>
              {hasAccess ? profile.user.name : displayName}
            </h3>
            <p className="text-gray-600">
              {age}{age && profile.height ? ', ' : ''}{profile.height || ''}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            profile.gender === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {profile.gender === 'female' ? 'Bride' : 'Groom'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          {(profile.currentLocation || !hasAccess) && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className={!hasAccess ? 'blur-[2px] select-none' : ''}>
                {displayLocation || 'Location hidden'}
              </span>
            </div>
          )}
          {profile.occupation && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
              {profile.occupation}
            </div>
          )}
          {profile.qualification && (
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
              {profile.qualification}
            </div>
          )}
          {profile.caste && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              {profile.caste}
            </div>
          )}
        </div>

        {profile.aboutMe && (
          <p className={`mt-3 text-sm text-gray-600 line-clamp-2 ${!hasAccess ? 'blur-[2px] select-none' : ''}`}>
            {hasAccess ? profile.aboutMe : profile.aboutMe.substring(0, 50) + '...'}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          {hasAccess ? (
            <>
              <Link
                href={`/profile/${profile.id}`}
                className="flex-1 text-center py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                View Profile
              </Link>
              {localInterestStatus?.mutual ? (
                <div className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm">
                  <CheckCircle className="h-4 w-4" />
                </div>
              ) : localInterestStatus?.sentByMe ? (
                <div className="flex items-center justify-center px-4 py-2 bg-gray-400 text-white rounded-lg text-sm">
                  <Heart className="h-4 w-4 fill-current" />
                </div>
              ) : (
                <button
                  onClick={handleExpressInterest}
                  disabled={expressing}
                  className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {expressing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </button>
              )}
            </>
          ) : (
            <Link
              href={isLoggedIn ? '/profile/create' : '/register'}
              className="flex-1 text-center py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              {isLoggedIn ? 'Complete Profile to View' : 'Sign Up to View'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
