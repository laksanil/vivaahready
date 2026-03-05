'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Inbox,
  Loader2,
  Search,
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import DeclineReasonModal from '@/components/DeclineReasonModal'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface ReceivedInterest {
  id: string
  status: string
  createdAt: string
  sender: {
    id: string
    name: string
    email: string | null
    phone: string | null
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

function toProfileData(interest: ReceivedInterest): ProfileData {
  const p = interest.sender?.profile
  return {
    id: p?.id || '',
    userId: interest.sender?.id || '',
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
    theyLikedMeFirst: true,
    user: { id: interest.sender?.id || '', name: interest.sender?.name || '' },
  }
}

function InterestReceivedContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [interests, setInterests] = useState<ReceivedInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingDecline, setPendingDecline] = useState<ReceivedInterest | null>(null)

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
      fetchReceivedInterests()
    }
  }, [canAccess, viewAsUser])

  const fetchReceivedInterests = async () => {
    setLoading(true)
    try {
      const res = await fetch(buildApiUrl('/api/interest?type=received&status=pending'))
      if (res.ok) {
        const data = await res.json()
        setInterests(data.interests || [])
      }
    } catch (error) {
      console.error('Error fetching received interests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (interest: ReceivedInterest) => {
    setActionId(interest.id)
    try {
      await fetch(buildApiUrl('/api/interest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: interest.sender.profile?.id }),
      })
      setInterests(prev => prev.filter(i => i.id !== interest.id))
    } catch (error) {
      console.error('Error accepting interest:', error)
    } finally {
      setActionId(null)
    }
  }

  const handleDecline = (interest: ReceivedInterest) => {
    setPendingDecline(interest)
  }

  const confirmDecline = async (reason: string) => {
    if (!pendingDecline) return
    const interest = pendingDecline
    setPendingDecline(null)
    setActionId(interest.id)
    try {
      await fetch(buildApiUrl('/api/interest'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId: interest.id, action: 'reject', ...(reason ? { reason } : {}) }),
      })
      setInterests(prev => prev.filter(i => i.id !== interest.id))
    } catch (error) {
      console.error('Error declining interest:', error)
    } finally {
      setActionId(null)
    }
  }

  // Filter by search query (name, VR ID, or qualification)
  const filteredInterests = interests.filter(interest => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = interest.sender?.name?.toLowerCase() || ''
    const vrId = interest.sender?.profile?.odNumber?.toLowerCase() || ''
    const qualification = interest.sender?.profile?.qualification?.toLowerCase() || ''
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
            <h1 className="text-2xl font-bold text-gray-900">Interest Received</h1>
            <p className="text-gray-600 text-sm">
              {interests.length} pending {interests.length === 1 ? 'interest' : 'interests'}
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
            <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Interests</h3>
            <p className="text-gray-600 mb-6 text-sm">
              When someone expresses interest in you, they&apos;ll appear here.
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
              <DirectoryCard
                key={interest.id}
                profile={toProfileData(interest)}
                onLike={() => handleAccept(interest)}
                onPass={() => handleDecline(interest)}
                isLoading={actionId === interest.id}
                canLike={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {pendingDecline && (
        <DeclineReasonModal
          profileName={pendingDecline.sender?.name || 'this profile'}
          onConfirm={confirmDecline}
          onCancel={() => setPendingDecline(null)}
        />
      )}
    </div>
  )
}

export default function InterestReceivedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <InterestReceivedContent />
    </Suspense>
  )
}
