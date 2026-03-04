'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  Loader2,
  Sparkles,
  Clock,
  Eye,
  Search,
  AlertTriangle,
  Flag,
  XCircle,
} from 'lucide-react'
import { DirectoryCard, DirectoryCardSkeleton } from '@/components/DirectoryCard'
import { ProfileData } from '@/components/ProfileCard'
import MessageModal from '@/components/MessageModal'
import ReportModal from '@/components/ReportModal'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'
import AdminViewBanner from '@/components/AdminViewBanner'

interface ConnectionProfile extends ProfileData {
  approvalStatus?: string
  createdAt?: string
}

function ConnectionsPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [connections, setConnections] = useState<ConnectionProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isApproved, setIsApproved] = useState(true)
  const [hasPaid, setHasPaid] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [withdrawConfirm, setWithdrawConfirm] = useState<ConnectionProfile | null>(null)
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean
    userId: string
    userName: string
  }>({ isOpen: false, userId: '', userName: '' })
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean
    recipientId: string
    recipientName: string
    recipientPhoto: string | null
    recipientPhotoUrls: string | null
  }>({
    isOpen: false,
    recipientId: '',
    recipientName: '',
    recipientPhoto: null,
    recipientPhotoUrls: null,
  })

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
      fetchConnections()
    }
  }, [canAccess, viewAsUser])

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const [matchesRes, paymentRes] = await Promise.all([
        fetch(buildApiUrl('/api/matches/auto')),
        fetch(buildApiUrl('/api/payment/status'))
      ])

      const data = await matchesRes.json()
      setConnections(data.mutualMatches || [])
      setIsApproved(data.userStatus?.isApproved ?? true)

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json()
        setHasPaid(paymentData.hasPaid === true)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (profile: ConnectionProfile) => {
    setWithdrawConfirm(null)
    setWithdrawingId(profile.user.id)
    try {
      await fetch(buildApiUrl('/api/interest'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.user.id, action: 'withdraw' }),
      })
      setConnections(prev => prev.filter(c => c.user.id !== profile.user.id))
    } catch (error) {
      console.error('Error withdrawing connection:', error)
    } finally {
      setWithdrawingId(null)
    }
  }

  // Filter by search query (name, VR ID, or qualification)
  const filteredConnections = connections.filter(c => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = c.user?.name?.toLowerCase() || ''
    const odNumber = c.odNumber?.toLowerCase() || ''
    const qualification = c.qualification?.toLowerCase() || ''
    return name.includes(query) || odNumber.includes(query) || qualification.includes(query)
  })

  // Separate new matches (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const newMatches = filteredConnections.filter(c => {
    const createdAt = c.createdAt ? new Date(c.createdAt) : null
    return createdAt && createdAt > sevenDaysAgo
  })

  const existingMatches = filteredConnections.filter(c => {
    const createdAt = c.createdAt ? new Date(c.createdAt) : null
    return !createdAt || createdAt <= sevenDaysAgo
  })

  const renderConnectionCard = (profile: ConnectionProfile) => (
    <div key={profile.id}>
      <DirectoryCard
        profile={profile}
        showActions={false}
        isRestricted={!isApproved}
        hasPaid={hasPaid}
      />
      {/* Action bar below card */}
      <div className="flex items-center justify-between bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg px-3 py-2 -mt-1">
        <button
          onClick={(e) => { e.stopPropagation(); setReportModal({ isOpen: true, userId: profile.user.id, userName: profile.user.name }) }}
          className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded transition-colors font-medium"
        >
          <Flag className="h-3.5 w-3.5" />
          Report a Problem
        </button>
        <div className="flex items-center gap-1.5">
          {isApproved && (
            <button
              onClick={() => setMessageModal({
                isOpen: true,
                recipientId: profile.user.id,
                recipientName: profile.user.name,
                recipientPhoto: profile.profileImageUrl,
                recipientPhotoUrls: profile.photoUrls,
              })}
              className="inline-flex items-center gap-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Message
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setWithdrawConfirm(profile) }}
            disabled={withdrawingId === profile.user.id}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium shadow-sm"
          >
            {withdrawingId === profile.user.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Withdraw
          </button>
        </div>
      </div>
    </div>
  )

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
    <>
      {isAdminView && <AdminViewBanner />}
      <div className={`min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-6 ${isAdminView ? 'pt-20' : ''}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
              <p className="text-gray-600 text-sm">
                {connections.length} {connections.length === 1 ? 'connection' : 'connections'} - people who liked you back
              </p>
            </div>

            {/* Search Bar */}
            {connections.length > 0 && (
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

          {/* Verification Banner */}
          {!isApproved && connections.length > 0 && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    {hasPaid ? <Clock className="h-5 w-5 text-primary-600" /> : <Eye className="h-5 w-5 text-primary-600" />}
                  </div>
                  <div>
                    {hasPaid ? (
                      <>
                        <h3 className="font-semibold text-primary-900">Awaiting Admin Approval</h3>
                        <p className="text-sm text-primary-700 mt-0.5">
                          Your payment was received. Approval typically takes 24-48 hours.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-primary-900">Get Verified to See Full Profiles</h3>
                        <p className="text-sm text-primary-700 mt-0.5">
                          Unlock photos, names, and contact information of your connections.
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {!hasPaid && (
                  <Link
                    href={buildUrl('/get-verified')}
                    className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Get Verified
                  </Link>
                )}
              </div>
            </div>
          )}

          {connections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connections Yet</h3>
              <p className="text-gray-600 mb-6 text-sm">
                When you and another member both like each other, they&apos;ll appear here.
              </p>
              <Link href={buildUrl('/matches')} className="btn-primary inline-block text-sm py-2 px-4">
                Browse Matches
              </Link>
            </div>
          ) : filteredConnections.length === 0 ? (
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
            <div className="space-y-6">
              {/* New Matches */}
              {newMatches.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      New Connections ({newMatches.length})
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {newMatches.map(renderConnectionCard)}
                  </div>
                </section>
              )}

              {/* All Connections */}
              {existingMatches.length > 0 && (
                <section>
                  {newMatches.length > 0 && (
                    <h2 className="text-lg font-bold text-gray-900 mb-3">
                      All Connections ({existingMatches.length})
                    </h2>
                  )}
                  <div className="space-y-2">
                    {existingMatches.map(renderConnectionCard)}
                  </div>
                </section>
              )}
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
                Withdraw Connection?
              </h3>
              <p className="text-center text-gray-600 text-sm mb-6">
                Are you sure you want to withdraw your connection with <span className="font-semibold">{withdrawConfirm.user?.name}</span>? This will remove the mutual match.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setWithdrawConfirm(null)}
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

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
          recipientId={messageModal.recipientId}
          recipientName={messageModal.recipientName}
          recipientPhoto={messageModal.recipientPhoto}
          recipientPhotoUrls={messageModal.recipientPhotoUrls}
        />

        {/* Report Modal */}
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
          reportedUserId={reportModal.userId}
          reportedUserName={reportModal.userName}
        />
      </div>
    </>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <ConnectionsPageContent />
    </Suspense>
  )
}
