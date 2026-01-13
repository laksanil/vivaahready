'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'
import MessageModal from '@/components/MessageModal'

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
  dietaryPreference: string | null
  maritalStatus: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  languagesKnown: string | null
  citizenship: string | null
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
  const searchParams = useSearchParams()
  const viewAsUser = searchParams.get('viewAsUser')

  const [connections, setConnections] = useState<ConnectionProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdminView, setIsAdminView] = useState(false)
  const [viewingUserName, setViewingUserName] = useState<string | null>(null)
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchConnections()
    }
  }, [session])

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const url = viewAsUser
        ? `/api/matches/auto?viewAsUser=${viewAsUser}`
        : '/api/matches/auto'
      const response = await fetch(url)
      const data = await response.json()

      setConnections(data.mutualMatches || [])

      if (data.isAdminView) {
        setIsAdminView(true)
        setViewingUserName(data.viewingUserName || null)
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin View Banner */}
        {isAdminView && viewingUserName && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">ADMIN VIEW MODE</h3>
                  <p className="text-purple-100">
                    Viewing as <span className="font-bold text-white">{viewingUserName}</span>
                  </p>
                </div>
              </div>
              <Link
                href="/admin/matches"
                className="px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-600 mt-1">People who liked you back - you can now message them!</p>
        </div>

        {/* No Connections Message */}
        {connections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Connections Yet</h3>
            <p className="text-gray-600 mb-6">
              When you and another member both like each other,
              you&apos;ll see them here with their contact information.
            </p>
            <Link href="/feed" className="btn-primary inline-block">
              Browse Feed
            </Link>
          </div>
        ) : (
          <>
            {/* New Matches Section */}
            {newMatches.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-900">New Matches</h2>
                  <span className="bg-pink-500 text-white text-sm px-3 py-1 rounded-full">
                    {newMatches.length} new
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {newMatches.map((profile) => (
                    <ConnectionCard
                      key={profile.id}
                      profile={profile}
                      onMessage={() => openMessageModal(profile)}
                      isNew
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
                <div className="grid gap-6 md:grid-cols-2">
                  {existingMatches.map((profile) => (
                    <ConnectionCard
                      key={profile.id}
                      profile={profile}
                      onMessage={() => openMessageModal(profile)}
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
    </div>
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
  isNew?: boolean
}

function ConnectionCard({ profile, onMessage, isNew }: ConnectionCardProps) {
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null
  const [photoIndex, setPhotoIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  // Get photos
  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const allPhotos = extractedPhotos.length > 0
    ? extractedPhotos
    : (validProfileImageUrl ? [validProfileImageUrl] : [])

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${isNew ? 'ring-2 ring-pink-500' : ''}`}>
      {/* New Badge */}
      {isNew && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-1 px-4 text-center text-xs font-medium">
          New Match!
        </div>
      )}

      <div className="flex">
        {/* Photo */}
        <div className="w-32 h-40 flex-shrink-0 bg-gray-200 relative">
          {allPhotos.length > 0 && !imageError ? (
            <img
              src={allPhotos[photoIndex]}
              alt={profile.user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100">
              <span className="text-2xl font-semibold text-primary-600">
                {getInitials(profile.user.name)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{profile.user.name}</h3>
              <p className="text-sm text-gray-600">
                {age ? `${age} yrs` : ''}{profile.height ? `, ${formatHeight(profile.height)}` : ''}
              </p>
              <p className="text-sm text-gray-500">{profile.currentLocation}</p>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Connected</span>
            </div>
          </div>

          {/* Contact Info */}
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

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={onMessage}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </button>
            <Link
              href={`/profile/${profile.id}`}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
