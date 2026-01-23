'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  Phone,
  ZoomIn,
  X,
  Check,
  Sparkles,
  Flag,
  AlertTriangle,
  Lock,
  Clock,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl, maskPhone } from '@/lib/utils'
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

function ConnectionsPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { viewAsUser, buildApiUrl, buildUrl } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [connections, setConnections] = useState<ConnectionProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isApproved, setIsApproved] = useState(true) // Default to true, will be updated from API
  const [hasPaid, setHasPaid] = useState(false)
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
      // Track user's approval status
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

      // Auto-close after success
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

  // Separate new matches (last 7 days) from existing
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const newMatches = connections.filter(c => {
    const createdAt = c.createdAt ? new Date(c.createdAt) : null
    return createdAt && createdAt > sevenDaysAgo
  })

  const existingMatches = connections.filter(c => {
    const createdAt = c.createdAt ? new Date(c.createdAt) : null
    return !createdAt || createdAt <= sevenDaysAgo
  })

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
      <div className={`min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-8 ${isAdminView ? 'pt-20' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-600 mt-1">People who liked you back - you can now message them!</p>
        </div>

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
                      href={buildUrl('/payment')}
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
            {/* New Matches Section */}
            {newMatches.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-primary-500" />
                  <h2 className="text-xl font-bold text-gray-900">New Matches</h2>
                  <span className="bg-primary-600 text-white text-sm px-3 py-1 rounded-full">
                    {newMatches.length} new
                  </span>
                </div>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {newMatches.map((profile) => (
                    <ConnectionCard
                      key={profile.id}
                      profile={profile}
                      onMessage={() => openMessageModal(profile)}
                      onReport={() => openReportModal(profile)}
                      isNew
                      isApproved={isApproved}
                      buildUrl={buildUrl}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Connections Section */}
            {existingMatches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {newMatches.length > 0 ? 'All Connections' : 'Your Connections'}
                </h2>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {existingMatches.map((profile) => (
                    <ConnectionCard
                      key={profile.id}
                      profile={profile}
                      onMessage={() => openMessageModal(profile)}
                      onReport={() => openReportModal(profile)}
                      isApproved={isApproved}
                      buildUrl={buildUrl}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Show new matches in All Connections if there are no existing */}
            {existingMatches.length === 0 && newMatches.length > 0 && (
              <div className="text-center text-gray-500 mt-4">
                <p>All your connections are new! Keep connecting to grow your matches.</p>
              </div>
            )}
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

// Connection Card Component
interface ConnectionCardProps {
  profile: ConnectionProfile
  onMessage: () => void
  onReport: () => void
  isNew?: boolean
  isApproved?: boolean
  buildUrl: (path: string) => string
}

function ConnectionCard({ profile, onMessage, onReport, isNew, isApproved = true, buildUrl }: ConnectionCardProps) {
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const [photoIndex, setPhotoIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  // Get photos
  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const allPhotos = extractedPhotos.length > 0
    ? extractedPhotos
    : (validProfileImageUrl ? [validProfileImageUrl] : [])

  // Helper to blur text for unapproved users
  const blurText = (text: string | null | undefined) => {
    if (!text) return null
    if (isApproved) return text
    // Return blurred placeholder
    return '••••••••'
  }

  // Helper to get blurred name (show first letter only)
  const getDisplayName = () => {
    if (isApproved) return profile.user.name
    const firstName = profile.user.name?.split(' ')[0] || ''
    return `${firstName.charAt(0)}${'•'.repeat(5)}`
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${isNew ? 'ring-2 ring-primary-500' : ''}`}>
      {/* New Badge */}
      {isNew && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-1 px-4 text-center text-xs font-medium">
          New Match!
        </div>
      )}

      <div className="flex flex-col sm:flex-row">
        {/* Photo */}
        <div className="w-full h-48 sm:w-28 sm:h-36 md:w-32 md:h-40 flex-shrink-0 bg-gray-200 relative">
          {allPhotos.length > 0 && !imageError ? (
            <img
              src={allPhotos[photoIndex]}
              alt={isApproved ? profile.user.name : 'Connection'}
              className={`w-full h-full object-cover ${!isApproved ? 'blur-lg' : ''}`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-primary-100 ${!isApproved ? 'blur-lg' : ''}`}>
              <span className="text-2xl font-semibold text-primary-600">
                {getInitials(profile.user.name)}
              </span>
            </div>
          )}
          {/* Lock overlay for unverified */}
          {!isApproved && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white/90 p-2 rounded-full">
                <Lock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-semibold text-gray-900 ${!isApproved ? 'blur-sm select-none' : ''}`}>
                {getDisplayName()}
              </h3>
              <p className="text-sm text-gray-600">
                {age ? `${age} yrs` : ''}{profile.height ? `, ${formatHeight(profile.height)}` : ''}
              </p>
              <p className={`text-sm text-gray-500 ${!isApproved ? 'blur-sm select-none' : ''}`}>
                {isApproved ? profile.currentLocation : '••••••••'}
              </p>
              {isApproved && (profile.grewUpIn || profile.citizenship) && (
                <p className="text-xs text-gray-400 mt-1">
                  {profile.grewUpIn && `Grew up in ${profile.grewUpIn}`}
                  {profile.grewUpIn && profile.citizenship && ' • '}
                  {profile.citizenship && `${profile.citizenship}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Connected</span>
            </div>
          </div>

          {/* Contact Info - Hidden for unverified users */}
          {isApproved ? (
            <div className="mt-3 space-y-1">
              {profile.user.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${profile.user.email}`} className="text-primary-600 hover:underline">
                    {profile.user.email}
                  </a>
                </div>
              )}
              {profile.user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${profile.user.phone}`} className="text-primary-600 hover:underline">
                    {profile.user.phone}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lock className="h-4 w-4" />
                <span className="select-none">XXXXXX@XXX.XXX</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lock className="h-4 w-4" />
                <span className="select-none">{maskPhone(profile.user.phone)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            {isApproved ? (
              <>
                {/* Message Button */}
                <div className="group relative flex-1">
                  <button
                    onClick={onMessage}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Message
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">Send Message</div>
                      <div className="text-gray-300">Start a conversation</div>
                    </div>
                  </div>
                </div>
                {/* View Profile Button */}
                <div className="group relative">
                  <Link
                    href={buildUrl(`/profile/${profile.id}`)}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">View Profile</div>
                      <div className="text-gray-300">See full details</div>
                    </div>
                  </div>
                </div>
                {/* Report Button */}
                <div className="group relative">
                  <button
                    onClick={onReport}
                    className="flex items-center justify-center p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">Report Profile</div>
                      <div className="text-gray-300">Flag inappropriate behavior</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 py-2.5 px-3 rounded-lg text-sm">
                <Lock className="h-5 w-5" />
                Verify to unlock
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
