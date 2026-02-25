'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  Loader2,
  Eye,
  X,
  Check,
  Flag,
  AlertTriangle,
  Lock,
  Clock,
  MapPin,
  Briefcase,
  Ruler,
  UserMinus,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'
import MessageModal from '@/components/MessageModal'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'
import AdminViewBanner from '@/components/AdminViewBanner'

interface ConnectionProfile {
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
  languagesKnown: string | null
  citizenship: string | null
  grewUpIn: string | null
  religion: string | null
  approvalStatus?: string
  createdAt?: string
  user: {
    id: string
    name: string
    email?: string
    phone?: string
    emailVerified?: string | null
    phoneVerified?: string | null
  }
  matchScore?: {
    percentage: number
  }
  interestStatus?: {
    mutual: boolean
  }
}

interface Conversation {
  partnerId: string
  partnerName: string
  partnerPhoto: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isLastMessageFromMe: boolean
}

interface WithdrawalNotification {
  id: string
  title: string
  body: string
  data?: string | null
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function ConnectionsPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [connections, setConnections] = useState<ConnectionProfile[]>([])
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map())
  const [loading, setLoading] = useState(true)
  const [isApproved, setIsApproved] = useState(true)
  const [hasPaid, setHasPaid] = useState(false)

  // Withdraw state
  const [withdrawConfirm, setWithdrawConfirm] = useState<ConnectionProfile | null>(null)
  const [withdrawingUserId, setWithdrawingUserId] = useState<string | null>(null)

  // Withdrawal notification popup
  const [withdrawalPopups, setWithdrawalPopups] = useState<WithdrawalNotification[]>([])

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
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean
    userId: string
    userName: string
    reason: string
    submitting: boolean
    error: string | null
    success: boolean
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    reason: '',
    submitting: false,
    error: null,
    success: false,
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
      fetchData()
    }
  }, [canAccess, viewAsUser])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [matchesRes, paymentRes, messagesRes, notifRes] = await Promise.all([
        fetch(buildApiUrl('/api/matches/auto')),
        fetch(buildApiUrl('/api/payment/status')),
        fetch(buildApiUrl('/api/messages')),
        fetch(buildApiUrl('/api/notifications?all=true')),
      ])

      const data = await matchesRes.json()
      setConnections(data.mutualMatches || [])
      setIsApproved(data.userStatus?.isApproved ?? true)

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json()
        setHasPaid(paymentData.hasPaid === true)
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        const convMap = new Map<string, Conversation>()
        for (const conv of (messagesData.conversations || [])) {
          convMap.set(conv.partnerId, conv)
        }
        setConversations(convMap)
      }

      // Check for unread withdrawal notifications
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        const withdrawals = (notifData.notifications || []).filter(
          (n: { type: string; read: boolean }) => n.type === 'connection_withdrawn' && !n.read
        )
        setWithdrawalPopups(withdrawals)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawConfirm) return

    const connectionUserId = withdrawConfirm.user.id
    setWithdrawingUserId(connectionUserId)

    try {
      // 1. Withdraw the connection
      const withdrawRes = await fetch(buildApiUrl('/api/connections/withdraw'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionUserId }),
      })

      if (!withdrawRes.ok) return

      // 2. Add to declined/reconsider list
      await fetch(buildApiUrl('/api/matches/decline'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declinedUserId: connectionUserId, source: 'connection_withdrawn' }),
      })

      // 3. Remove from connections list
      setConnections(prev => prev.filter(c => c.user.id !== connectionUserId))
    } catch (error) {
      console.error('Failed to withdraw connection:', error)
    } finally {
      setWithdrawingUserId(null)
      setWithdrawConfirm(null)
    }
  }

  const dismissWithdrawalPopup = useCallback(async (notifId: string) => {
    // Mark as read so it never shows again
    try {
      await fetch(buildApiUrl('/api/notifications/read'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId }),
      })
    } catch { /* ignore */ }
    setWithdrawalPopups(prev => prev.filter(n => n.id !== notifId))
  }, [buildApiUrl])

  const openMessageModal = (profile: ConnectionProfile) => {
    setMessageModal({
      isOpen: true,
      recipientId: profile.user.id,
      recipientName: profile.user.name,
      recipientPhoto: profile.profileImageUrl,
      recipientPhotoUrls: profile.photoUrls,
    })
  }

  const closeMessageModal = () => {
    setMessageModal({
      isOpen: false,
      recipientId: '',
      recipientName: '',
      recipientPhoto: null,
      recipientPhotoUrls: null,
    })
  }

  const openReportModal = (profile: ConnectionProfile) => {
    setReportModal({
      isOpen: true,
      userId: profile.user.id,
      userName: profile.user.name,
      reason: '',
      submitting: false,
      error: null,
      success: false,
    })
  }

  const closeReportModal = () => {
    setReportModal({
      isOpen: false,
      userId: '',
      userName: '',
      reason: '',
      submitting: false,
      error: null,
      success: false,
    })
  }

  const handleSubmitReport = async () => {
    if (!reportModal.reason.trim()) {
      setReportModal(prev => ({ ...prev, error: 'Please provide a reason for reporting' }))
      return
    }

    setReportModal(prev => ({ ...prev, submitting: true, error: null }))

    try {
      const response = await fetch(buildApiUrl('/api/report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: reportModal.userId,
          reason: reportModal.reason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit report')
      }

      setReportModal(prev => ({ ...prev, submitting: false, success: true }))

      setTimeout(() => {
        closeReportModal()
      }, 2000)
    } catch (error) {
      setReportModal(prev => ({
        ...prev,
        submitting: false,
        error: error instanceof Error ? error.message : 'Failed to submit report',
      }))
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
    <>
      {isAdminView && <AdminViewBanner />}
      <div className={`min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-6 ${isAdminView ? 'pt-20' : ''}`}>
        <div className="w-full px-4 md:px-8 xl:px-10">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
            <p className="text-gray-600 text-sm mt-1">
              {connections.length} {connections.length === 1 ? 'connection' : 'connections'} - people who liked you back
            </p>
          </div>

          {/* Withdrawal Notification Popups */}
          {withdrawalPopups.map((notif) => (
            <div
              key={notif.id}
              className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <UserMinus className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-800">{notif.title}</h3>
                  <p className="text-sm text-amber-700 mt-0.5">{notif.body}</p>
                  <p className="text-xs text-amber-500 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                <button
                  onClick={() => dismissWithdrawalPopup(notif.id)}
                  className="flex-shrink-0 p-1 text-amber-400 hover:text-amber-600 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pending Verification Banner */}
          {!isApproved && connections.length > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  {hasPaid ? <Clock className="h-5 w-5 text-amber-600" /> : <Lock className="h-5 w-5 text-amber-600" />}
                </div>
                <div className="flex-1">
                  {hasPaid ? (
                    <>
                      <h3 className="font-semibold text-amber-800">Payment Received - Awaiting Admin Approval</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Thank you for your payment! Your profile is currently under review by our admin team.
                        This typically takes 24-48 hours. Once approved, you&apos;ll have full access to view photos, names, and contact information of your matches.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Approval typically takes 24-48 hours</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-amber-800">Profile Pending Verification</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Complete your profile verification to unlock full access to your connections.
                        Once verified, you&apos;ll be able to see photos, names, and contact information of your matches.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Photos, names, and contact details are blurred until verification</span>
                      </div>
                      <Link
                        href={buildUrl('/get-verified')}
                        className="mt-3 inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Get Verified
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Connections Message */}
          {connections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Connections Yet</h3>
              <p className="text-gray-600 mb-6">
                When you and another member both like each other,
                you&apos;ll see them here with their contact information.
              </p>
              <Link href={buildUrl('/matches')} className="btn-primary inline-block">
                Browse Matches
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700">
                        Profile
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700">
                        Messages
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700">
                        Date Last Received
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold uppercase tracking-wide text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {connections.map((profile) => {
                      const conv = conversations.get(profile.user.id)
                      return (
                        <ConnectionRow
                          key={profile.id}
                          profile={profile}
                          conversation={conv}
                          onMessage={() => openMessageModal(profile)}
                          onReport={() => openReportModal(profile)}
                          onWithdraw={() => setWithdrawConfirm(profile)}
                          isApproved={isApproved}
                          buildUrl={buildUrl}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {connections.map((profile) => {
                  const conv = conversations.get(profile.user.id)
                  return (
                    <ConnectionMobileCard
                      key={profile.id}
                      profile={profile}
                      conversation={conv}
                      onMessage={() => openMessageModal(profile)}
                      onReport={() => openReportModal(profile)}
                      onWithdraw={() => setWithdrawConfirm(profile)}
                      isApproved={isApproved}
                      buildUrl={buildUrl}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={closeMessageModal}
          recipientId={messageModal.recipientId}
          recipientName={messageModal.recipientName}
          recipientPhoto={messageModal.recipientPhoto}
          recipientPhotoUrls={messageModal.recipientPhotoUrls}
        />

        {/* Withdraw Confirmation Modal */}
        {withdrawConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-sm w-full shadow-xl">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <UserMinus className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Withdraw Connection</h3>
                </div>
                <p className="text-gray-600">
                  Are you sure you want to withdraw your connection with{' '}
                  <span className="font-medium">{withdrawConfirm.user.name}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This profile will move to your Reconsider list and {withdrawConfirm.user.name.split(' ')[0]} will be notified.
                </p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setWithdrawConfirm(null)}
                  disabled={withdrawingUserId === withdrawConfirm.user.id}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawingUserId === withdrawConfirm.user.id}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {withdrawingUserId === withdrawConfirm.user.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    'Withdraw'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {reportModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Report User</h3>
                </div>
                <button
                  onClick={closeReportModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {reportModal.success ? (
                <div className="text-center py-6">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-900 font-medium">Report Submitted</p>
                  <p className="text-gray-500 text-sm mt-1">Our team will review this report.</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    Report a problem with <span className="font-medium">{reportModal.userName}</span>.
                    Our team will review your report and take appropriate action.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for reporting
                    </label>
                    <textarea
                      value={reportModal.reason}
                      onChange={(e) => setReportModal(prev => ({ ...prev, reason: e.target.value, error: null }))}
                      placeholder="Please describe the issue..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    />
                  </div>

                  {reportModal.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {reportModal.error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={closeReportModal}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={reportModal.submitting}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {reportModal.submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Flag className="h-4 w-4" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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

// Desktop Table Row
interface ConnectionRowProps {
  profile: ConnectionProfile
  conversation?: Conversation
  onMessage: () => void
  onReport: () => void
  onWithdraw: () => void
  isApproved?: boolean
  buildUrl: (path: string) => string
}

function ConnectionRow({ profile, conversation, onMessage, onReport, onWithdraw, isApproved = true, buildUrl }: ConnectionRowProps) {
  const router = useRouter()
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const [imageError, setImageError] = useState(false)

  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const photoUrl = extractedPhotos.length > 0 ? extractedPhotos[0] : validProfileImageUrl

  const getDisplayName = () => {
    if (isApproved) return profile.user.name
    const firstName = profile.user.name?.split(' ')[0] || ''
    return `${firstName.charAt(0)}${'*'.repeat(5)}`
  }

  return (
    <tr
      className="align-top hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => router.push(buildUrl(`/profile/${profile.id}`))}
    >
      {/* Profile Column */}
      <td className="px-6 py-4">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative">
            {photoUrl && !imageError ? (
              <img
                src={photoUrl}
                alt={isApproved ? profile.user.name : 'Connection'}
                className={`w-full h-full object-cover ${!isApproved ? 'blur-md' : ''}`}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 ${!isApproved ? 'blur-sm' : ''}`}>
                <span className="text-lg font-semibold text-primary-600">
                  {getInitials(profile.user.name)}
                </span>
              </div>
            )}
            {!isApproved && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Lock className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <h3 className={`text-sm font-bold text-gray-900 ${!isApproved ? 'blur-sm select-none' : ''}`}>
              {getDisplayName()}{age ? `, ${age}` : ''}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
              {profile.height && (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3 text-gray-400" />
                  {formatHeight(profile.height)}
                </span>
              )}
              {profile.currentLocation && (
                <span className={`flex items-center gap-1 ${!isApproved ? 'blur-sm select-none' : ''}`}>
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {isApproved ? profile.currentLocation : '********'}
                </span>
              )}
            </div>
            {profile.occupation && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                <Briefcase className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{profile.occupation.replace(/_/g, ' ')}</span>
              </div>
            )}
            {(profile.religion || profile.community || profile.caste) && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {profile.religion || 'Hindu'}{(profile.community || profile.caste) ? ` - ${profile.community || profile.caste}` : ''}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Messages Column */}
      <td className="px-6 py-4">
        {conversation ? (
          <div className="max-w-[250px]">
            <div className="flex items-center gap-2">
              <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {conversation.isLastMessageFromMe && (
                  <span className="text-gray-400">You: </span>
                )}
                {conversation.lastMessage}
              </p>
              {conversation.unreadCount > 0 && (
                <span className="flex-shrink-0 bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No messages yet</p>
        )}
      </td>

      {/* Date Last Received Column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {conversation ? (
          <div>
            <p className="text-sm text-gray-800">
              {new Date(conversation.lastMessageTime).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {timeAgo(conversation.lastMessageTime)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">-</p>
        )}
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {isApproved ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onMessage() }}
                className="flex items-center gap-1.5 bg-primary-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </button>
              <Link
                href={buildUrl(`/profile/${profile.id}`)}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); onWithdraw() }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Withdraw connection"
              >
                <UserMinus className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReport() }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Report"
              >
                <Flag className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-gray-100 text-gray-500 py-2 px-3 rounded-lg text-sm">
              <Lock className="h-4 w-4" />
              Verify to unlock
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// Mobile Card View
interface ConnectionMobileCardProps {
  profile: ConnectionProfile
  conversation?: Conversation
  onMessage: () => void
  onReport: () => void
  onWithdraw: () => void
  isApproved?: boolean
  buildUrl: (path: string) => string
}

function ConnectionMobileCard({ profile, conversation, onMessage, onReport, onWithdraw, isApproved = true, buildUrl }: ConnectionMobileCardProps) {
  const router = useRouter()
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const [imageError, setImageError] = useState(false)

  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const photoUrl = extractedPhotos.length > 0 ? extractedPhotos[0] : validProfileImageUrl

  const getDisplayName = () => {
    if (isApproved) return profile.user.name
    const firstName = profile.user.name?.split(' ')[0] || ''
    return `${firstName.charAt(0)}${'*'.repeat(5)}`
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => router.push(buildUrl(`/profile/${profile.id}`))}
    >
      <div className="flex items-stretch">
        {/* Photo */}
        <div className="flex-shrink-0 w-24 h-auto min-h-[120px] bg-gray-100 rounded-l-lg overflow-hidden relative">
          {photoUrl && !imageError ? (
            <img
              src={photoUrl}
              alt={isApproved ? profile.user.name : 'Connection'}
              className={`w-full h-full object-cover ${!isApproved ? 'blur-md' : ''}`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 ${!isApproved ? 'blur-sm' : ''}`}>
              <span className="text-xl font-semibold text-primary-600">
                {getInitials(profile.user.name)}
              </span>
            </div>
          )}
          {!isApproved && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Lock className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          {/* Name + Badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`text-sm font-bold text-gray-900 truncate ${!isApproved ? 'blur-sm select-none' : ''}`}>
              {getDisplayName()}{age ? `, ${age}` : ''}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600">Connected</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-2">
            {profile.height && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3 text-gray-400" />
                {formatHeight(profile.height)}
              </span>
            )}
            {profile.currentLocation && (
              <span className={`flex items-center gap-1 ${!isApproved ? 'blur-sm select-none' : ''}`}>
                <MapPin className="h-3 w-3 text-gray-400" />
                {isApproved ? profile.currentLocation : '********'}
              </span>
            )}
          </div>

          {/* Message Preview */}
          {conversation ? (
            <div className="mb-2 px-2 py-1.5 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <p className={`text-xs truncate ${conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                  {conversation.isLastMessageFromMe && (
                    <span className="text-gray-400">You: </span>
                  )}
                  {conversation.lastMessage}
                </p>
                {conversation.unreadCount > 0 && (
                  <span className="flex-shrink-0 bg-primary-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 pl-5">
                {timeAgo(conversation.lastMessageTime)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic mb-2">No messages yet</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isApproved ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onMessage() }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 text-white py-2 px-2 rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message
                </button>
                <Link
                  href={buildUrl(`/profile/${profile.id}`)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2 px-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Profile
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); onWithdraw() }}
                  className="flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Withdraw"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReport() }}
                  className="flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Report"
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 py-2 px-3 rounded-lg text-xs">
                <Lock className="h-3.5 w-3.5" />
                Verify to unlock
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
