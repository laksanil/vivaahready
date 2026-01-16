'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  User,
  Loader2,
  RotateCcw,
  ArrowLeft,
  X,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface DeclinedProfile {
  id: string
  userId: string
  gender: string
  dateOfBirth: string | null
  height: string | null
  currentLocation: string | null
  occupation: string | null
  qualification: string | null
  caste: string | null
  community: string | null
  subCommunity: string | null
  dietaryPreference: string | null
  maritalStatus: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  grewUpIn: string | null
  citizenship: string | null
  declinedAt?: string
  user: {
    id: string
    name: string
    email?: string
  }
}

function ReconsiderPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [profiles, setProfiles] = useState<DeclinedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [reconsidering, setReconsidering] = useState<string | null>(null)

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
      fetchDeclinedProfiles()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, buildApiUrl])

  const fetchDeclinedProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(buildApiUrl('/api/matches/decline'))
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching declined profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReconsider = async (declinedUserId: string) => {
    setReconsidering(declinedUserId)
    try {
      await fetch(buildApiUrl(`/api/matches/decline?declinedUserId=${declinedUserId}`), {
        method: 'DELETE',
      })
      // Remove from local state
      setProfiles(prev => prev.filter(p => p.userId !== declinedUserId))
    } catch (error) {
      console.error('Error reconsidering profile:', error)
    } finally {
      setReconsidering(null)
    }
  }

  if (status === 'loading' || loading || (isAdminView && !adminChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={buildUrl('/matches')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Matches
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Passed Profiles</h1>
          <p className="text-gray-600 mt-1">
            Changed your mind? Bring these profiles back to your matches.
          </p>
        </div>

        {/* No Profiles Message */}
        {profiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <RotateCcw className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Passed Profiles</h3>
            <p className="text-gray-600 mb-6">
              You haven&apos;t passed on any profiles yet.
              When you do, they&apos;ll appear here for reconsideration.
            </p>
            <Link href={buildUrl('/matches')} className="btn-primary inline-block">
              Browse Matches
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              {profiles.length} passed profile{profiles.length !== 1 ? 's' : ''}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <ReconsiderCard
                  key={profile.id}
                  profile={profile}
                  onReconsider={() => handleReconsider(profile.userId)}
                  isReconsidering={reconsidering === profile.userId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ReconsiderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <ReconsiderPageContent />
    </Suspense>
  )
}

// Reconsider Card Component
interface ReconsiderCardProps {
  profile: DeclinedProfile
  onReconsider: () => void
  isReconsidering: boolean
}

function ReconsiderCard({ profile, onReconsider, isReconsidering }: ReconsiderCardProps) {
  const { buildUrl } = useImpersonation()
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const [imageError, setImageError] = useState(false)

  // Get photo
  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const photo = extractedPhotos[0] || validProfileImageUrl

  // Format declined date
  const declinedDate = profile.declinedAt
    ? new Date(profile.declinedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Photo */}
      <div className="relative h-48 bg-gray-200">
        {photo && !imageError ? (
          <img
            src={photo}
            alt={profile.user.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100">
            <span className="text-4xl font-semibold text-primary-600">
              {getInitials(profile.user.name)}
            </span>
          </div>
        )}

        {/* Passed overlay */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <X className="h-3 w-3" />
          Passed
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{profile.user.name}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {age ? `${age} yrs` : ''}{profile.height ? `, ${formatHeight(profile.height)}` : ''}
        </p>
        <p className="text-sm text-gray-500">{profile.currentLocation}</p>
        {(profile.grewUpIn || profile.citizenship) && (
          <p className="text-xs text-gray-400 mt-1">
            {profile.grewUpIn && `Grew up in ${profile.grewUpIn}`}
            {profile.grewUpIn && profile.citizenship && ' • '}
            {profile.citizenship && `${profile.citizenship}`}
          </p>
        )}

        {declinedDate && (
          <p className="text-xs text-gray-400 mt-2">
            Passed on {declinedDate}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onReconsider}
            disabled={isReconsidering}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isReconsidering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Bring Back
          </button>
          <Link
            href={buildUrl(`/profile/${profile.id}`)}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
