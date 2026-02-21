'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, RotateCcw, ArrowLeft, Eye, Trash2 } from 'lucide-react'
import { DirectoryCard } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface DeclinedProfile extends ProfileData {
  declinedAt?: string
  declineSource?: string | null
}

function getSourceLabel(source?: string | null): { label: string; color: string } {
  switch (source) {
    case 'interest_declined':
      return { label: 'Declined Interest', color: 'bg-red-50 text-red-700' }
    case 'interest_withdrawn':
      return { label: 'Withdrew Interest', color: 'bg-amber-50 text-amber-700' }
    case 'connection_withdrawn':
      return { label: 'Withdrew Connection', color: 'bg-orange-50 text-orange-700' }
    case 'matches':
      return { label: 'Passed from Matches', color: 'bg-gray-100 text-gray-600' }
    default:
      return { label: 'Passed', color: 'bg-gray-100 text-gray-600' }
  }
}

function ReconsiderPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [profiles, setProfiles] = useState<DeclinedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [reconsideringUserId, setReconsideringUserId] = useState<string | null>(null)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

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

  const handleBringBack = async (profile: DeclinedProfile) => {
    setReconsideringUserId(profile.userId)
    try {
      // 1) Re-send interest so this profile appears in Sent Interest pile.
      const interestResponse = await fetch(buildApiUrl('/api/interest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      })

      let interestCreatedOrExists = interestResponse.ok
      let requiresVerification = false

      if (!interestResponse.ok) {
        const errorData = await interestResponse.json().catch(() => ({}))
        const errorText = typeof errorData?.error === 'string' ? errorData.error.toLowerCase() : ''

        if (errorData?.requiresVerification) {
          requiresVerification = true
        }

        // Treat "already sent" as success for reconsider flow.
        if (errorText.includes('already') || errorText.includes('expressed interest')) {
          interestCreatedOrExists = true
        }
      }

      if (requiresVerification) {
        router.push(buildUrl('/get-verified'))
        return
      }

      if (!interestCreatedOrExists) {
        return
      }

      // 2) Remove from declined list.
      await fetch(buildApiUrl(`/api/matches/decline?declinedUserId=${profile.userId}`), {
        method: 'DELETE',
      })

      setProfiles((prev) => prev.filter((p) => p.userId !== profile.userId))

      // 3) Take user to Sent Interest pile.
      router.push(buildUrl('/matches?tab=sent'))
    } catch (error) {
      console.error('Error bringing back profile:', error)
    } finally {
      setReconsideringUserId(null)
    }
  }

  const handleRemove = async (profile: DeclinedProfile) => {
    const confirmed = window.confirm('Are you sure you want to remove this profile from the reconsider pile?')
    if (!confirmed) {
      return
    }

    setRemovingUserId(profile.userId)
    try {
      const response = await fetch(buildApiUrl('/api/matches/decline'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declinedUserId: profile.userId }),
      })

      if (!response.ok) {
        return
      }

      setProfiles((prev) => prev.filter((p) => p.userId !== profile.userId))
    } catch (error) {
      console.error('Error removing declined profile from reconsider pile:', error)
    } finally {
      setRemovingUserId(null)
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
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-8">
      <div className="w-full px-4 md:px-8 xl:px-10">
        <Link
          href={buildUrl('/matches')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Matches
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Passed Profiles</h1>
          <p className="text-gray-600 mt-1">
            Changed your mind? Bring these profiles back to your matches.
          </p>
        </div>

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

            <div className="space-y-3">
              {profiles.map((profile) => {
                const sourceInfo = getSourceLabel(profile.declineSource)
                return (
                <div key={profile.id}>
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-xs text-gray-500">
                      {profile.declinedAt ? new Date(profile.declinedAt).toLocaleString() : ''}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceInfo.color}`}>
                      {sourceInfo.label}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-stretch">
                      <div className="flex-1 min-w-0">
                        <DirectoryCard
                          profile={profile}
                          showActions={false}
                          borderless
                        />
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

                        {/* Remove Permanently */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(profile) }}
                          disabled={reconsideringUserId === profile.userId || removingUserId === profile.userId}
                          className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {removingUserId === profile.userId ? (
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                          <span>{removingUserId === profile.userId ? 'Removing' : 'Remove'}</span>
                        </button>

                        {/* Bring Back */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBringBack(profile) }}
                          disabled={reconsideringUserId === profile.userId || removingUserId === profile.userId}
                          className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 text-[11px] sm:text-xs font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {reconsideringUserId === profile.userId ? (
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                          <span>{reconsideringUserId === profile.userId ? 'Bringing' : 'Bring Back'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
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
