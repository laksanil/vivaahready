'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Send,
  Loader2,
  Clock,
  XCircle,
  Search,
  AlertTriangle,
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface SentInterest {
  id: string
  status: string
  createdAt: string
  receiver: {
    id: string
    name: string
    profile: {
      id: string
      gender: string
      dateOfBirth: string | null
      height: string | null
      currentLocation: string | null
      country: string | null
      grewUpIn: string | null
      citizenship: string | null
      occupation: string | null
      qualification: string | null
      profileImageUrl: string | null
      photoUrls: string | null
      odNumber: string | null
    } | null
  }
}

function toProfileData(interest: SentInterest): ProfileData {
  const p = interest.receiver?.profile
  return {
    id: p?.id || '',
    userId: interest.receiver?.id || '',
    odNumber: p?.odNumber || null,
    gender: p?.gender || '',
    dateOfBirth: p?.dateOfBirth || null,
    height: p?.height || null,
    currentLocation: p?.currentLocation || null,
    country: p?.country || null,
    occupation: p?.occupation || null,
    qualification: p?.qualification || null,
    caste: null,
    community: null,
    subCommunity: null,
    gotra: null,
    dietaryPreference: null,
    maritalStatus: null,
    hasChildren: null,
    aboutMe: null,
    photoUrls: p?.photoUrls || null,
    profileImageUrl: p?.profileImageUrl || null,
    annualIncome: null,
    familyLocation: null,
    languagesKnown: null,
    religion: null,
    hobbies: null,
    fitness: null,
    interests: null,
    grewUpIn: p?.grewUpIn || null,
    citizenship: p?.citizenship || null,
    user: { id: interest.receiver?.id || '', name: interest.receiver?.name || '' },
  }
}

function SentInterestContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [interests, setInterests] = useState<SentInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [withdrawConfirm, setWithdrawConfirm] = useState<SentInterest | null>(null)
  const [withdrawReason, setWithdrawReason] = useState('')

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
      fetchSentInterests()
    }
  }, [canAccess, viewAsUser])

  const fetchSentInterests = async () => {
    setLoading(true)
    try {
      const res = await fetch(buildApiUrl('/api/interest?type=sent'))
      if (res.ok) {
        const data = await res.json()
        setInterests(data.interests || [])
      }
    } catch (error) {
      console.error('Error fetching sent interests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (interest: SentInterest) => {
    const reason = withdrawReason.trim()
    setWithdrawConfirm(null)
    setWithdrawReason('')
    setWithdrawingId(interest.id)
    try {
      await fetch(buildApiUrl('/api/interest'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId: interest.id, action: 'withdraw', ...(reason ? { reason } : {}) }),
      })
      setInterests(prev => prev.filter(i => i.id !== interest.id))
    } catch (error) {
      console.error('Error withdrawing interest:', error)
    } finally {
      setWithdrawingId(null)
    }
  }

  // Filter by search query (name, VR ID, or qualification)
  const filteredInterests = interests.filter(interest => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = interest.receiver?.name?.toLowerCase() || ''
    const vrId = interest.receiver?.profile?.odNumber?.toLowerCase() || ''
    const qualification = interest.receiver?.profile?.qualification?.toLowerCase() || ''
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

  if (!canAccess) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Sent Interest</h1>
            <p className="text-gray-600 text-sm">
              {interests.length} {interests.length === 1 ? 'interest' : 'interests'} sent
            </p>
          </div>

          {/* Search Bar */}
          {interests.length > 0 && (
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

        {interests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <Send className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sent Interests</h3>
            <p className="text-gray-600 mb-6 text-sm">
              When you express interest in someone, they&apos;ll appear here.
            </p>
            <Link href={buildUrl('/matches')} className="btn-primary inline-block text-sm py-2 px-4">
              Browse Matches
            </Link>
          </div>
        ) : filteredInterests.length === 0 ? (
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
            {filteredInterests.map(interest => (
              <div key={interest.id} className="relative">
                <DirectoryCard
                  profile={toProfileData(interest)}
                  showActions={false}
                />
                {/* Status badge and action overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {interest.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                  ) : interest.status === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                      <XCircle className="h-3 w-3" /> Declined
                    </span>
                  ) : null}
                </div>
                {interest.status === 'pending' && (
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setWithdrawConfirm(interest) }}
                      disabled={withdrawingId === interest.id}
                      className="text-xs text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium shadow-sm"
                    >
                      {withdrawingId === interest.id ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      ) : (
                        'Withdraw'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {withdrawConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setWithdrawConfirm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
              Withdraw Interest?
            </h3>
            <p className="text-center text-gray-600 text-sm mb-4">
              Are you sure you want to withdraw your interest in <span className="font-semibold">{withdrawConfirm.receiver?.name}</span>? This action cannot be undone.
            </p>
            <p className="text-xs text-gray-500 mb-2">Your feedback helps us refine your matches.</p>
            <textarea
              value={withdrawReason}
              onChange={e => setWithdrawReason(e.target.value)}
              placeholder="What didn't feel like a fit? (optional)"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setWithdrawConfirm(null); setWithdrawReason('') }}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdraw(withdrawConfirm)}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SentInterestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <SentInterestContent />
    </Suspense>
  )
}
