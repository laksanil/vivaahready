'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  RotateCcw,
  ArrowLeft,
  Search,
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface DeclinedProfile {
  id: string
  userId: string
  gender: string
  dateOfBirth: string | null
  height: string | null
  currentLocation: string | null
  country: string | null
  occupation: string | null
  qualification: string | null
  caste: string | null
  community: string | null
  subCommunity: string | null
  gotra: string | null
  dietaryPreference: string | null
  maritalStatus: string | null
  hasChildren: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  annualIncome: string | null
  familyLocation: string | null
  languagesKnown: string | null
  religion: string | null
  hobbies: string | null
  fitness: string | null
  interests: string | null
  grewUpIn: string | null
  citizenship: string | null
  odNumber: string | null
  declinedAt?: string
  declineReason?: string | null
  user: {
    id: string
    name: string
    email?: string
  }
}

function toProfileData(profile: DeclinedProfile): ProfileData {
  return {
    id: profile.id,
    userId: profile.userId,
    odNumber: profile.odNumber || null,
    gender: profile.gender,
    dateOfBirth: profile.dateOfBirth,
    height: profile.height,
    currentLocation: profile.currentLocation,
    country: profile.country || null,
    occupation: profile.occupation,
    qualification: profile.qualification,
    caste: profile.caste,
    community: profile.community,
    subCommunity: profile.subCommunity,
    gotra: profile.gotra || null,
    dietaryPreference: profile.dietaryPreference,
    maritalStatus: profile.maritalStatus,
    hasChildren: profile.hasChildren || null,
    aboutMe: profile.aboutMe,
    photoUrls: profile.photoUrls,
    profileImageUrl: profile.profileImageUrl,
    annualIncome: profile.annualIncome || null,
    familyLocation: profile.familyLocation || null,
    languagesKnown: profile.languagesKnown || null,
    religion: profile.religion || null,
    hobbies: profile.hobbies || null,
    fitness: profile.fitness || null,
    interests: profile.interests || null,
    grewUpIn: profile.grewUpIn,
    citizenship: profile.citizenship,
    user: { id: profile.user.id, name: profile.user.name },
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
  const [searchQuery, setSearchQuery] = useState('')

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
      setProfiles(prev => prev.filter(p => p.userId !== declinedUserId))
    } catch (error) {
      console.error('Error reconsidering profile:', error)
    } finally {
      setReconsidering(null)
    }
  }

  // Filter by search query (name, VR ID, or qualification)
  const filteredProfiles = profiles.filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = p.user?.name?.toLowerCase() || ''
    const vrId = p.odNumber?.toLowerCase() || ''
    const qualification = p.qualification?.toLowerCase() || ''
    return name.includes(query) || vrId.includes(query) || qualification.includes(query)
  })

  if (status === 'loading' || loading || (isAdminView && !adminChecked)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
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
        {/* Back Link */}
        <Link
          href={buildUrl('/matches')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Matches
        </Link>

        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Passed Profiles</h1>
            <p className="text-gray-600 text-sm">
              {profiles.length} passed {profiles.length === 1 ? 'profile' : 'profiles'} - bring them back to your matches
            </p>
          </div>

          {/* Search Bar */}
          {profiles.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, VR ID, qualification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          )}
        </div>

        {profiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <RotateCcw className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Passed Profiles</h3>
            <p className="text-gray-600 mb-6 text-sm">
              You haven&apos;t passed on any profiles yet.
              When you do, they&apos;ll appear here for reconsideration.
            </p>
            <Link href={buildUrl('/matches')} className="btn-primary inline-block text-sm py-2 px-4">
              Browse Matches
            </Link>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Results</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Try adjusting your search terms.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn-secondary text-sm py-2"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProfiles.map((profile) => (
              <div key={profile.id}>
                <div className="relative">
                  <DirectoryCard
                    profile={toProfileData(profile)}
                    showActions={false}
                  />
                  {/* Bring Back button */}
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={() => handleReconsider(profile.userId)}
                      disabled={reconsidering === profile.userId}
                      className="inline-flex items-center gap-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50"
                    >
                      {reconsidering === profile.userId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Bring Back
                    </button>
                  </div>
                </div>
                {/* Decline reason below the card */}
                {profile.declineReason && (
                  <div className="mt-1 px-3 pb-1">
                    <p className="text-xs text-gray-500">
                      <span className="text-gray-400">Your reason:</span>{' '}
                      <span className="text-gray-600 font-medium">&ldquo;{profile.declineReason}&rdquo;</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
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
