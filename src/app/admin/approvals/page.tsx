'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X, Eye, Clock, User, MapPin, Briefcase, GraduationCap, Loader2, RefreshCw, Linkedin, Instagram, Camera, ZoomIn, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { adminLinks } from '@/lib/adminLinks'
import { extractPhotoUrls } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import { AdminTabs, AdminPageHeader, AdminEmptyState, AdminButton, AdminBadge, AdminModal } from '@/components/admin/AdminComponents'

interface PendingProfile {
  id: string
  gender: string
  currentLocation: string | null
  occupation: string | null
  qualification: string | null
  caste: string | null
  aboutMe: string | null
  createdAt: string
  rejectionReason?: string | null
  linkedinProfile: string | null
  facebookInstagram: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  drivePhotosLink: string | null
  referralSource: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  }
}

type TabType = 'pending' | 'rejected'

export default function AdminApprovalsPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([])
  const [rejectedProfiles, setRejectedProfiles] = useState<PendingProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [photoModal, setPhotoModal] = useState<{ isOpen: boolean; photos: string[]; currentIndex: number; profileName: string }>({
    isOpen: false,
    photos: [],
    currentIndex: 0,
    profileName: ''
  })

  const openPhotoModal = (profile: PendingProfile) => {
    const photos = extractPhotoUrls(profile.photoUrls)
    if (photos.length > 0) {
      setPhotoModal({
        isOpen: true,
        photos,
        currentIndex: 0,
        profileName: profile.user.name
      })
    }
  }

  const closePhotoModal = () => {
    setPhotoModal({ isOpen: false, photos: [], currentIndex: 0, profileName: '' })
  }

  const nextPhoto = () => {
    setPhotoModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }))
  }

  const prevPhoto = () => {
    setPhotoModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length
    }))
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const [pendingRes, rejectedRes] = await Promise.all([
        fetch('/api/admin/approve?status=pending'),
        fetch('/api/admin/approve?status=rejected')
      ])
      const pendingData = await pendingRes.json()
      const rejectedData = await rejectedRes.json()
      setPendingProfiles(pendingData.profiles || [])
      setRejectedProfiles(rejectedData.profiles || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  // Keep for backwards compatibility
  const profiles = activeTab === 'pending' ? pendingProfiles : rejectedProfiles
  const setProfiles = activeTab === 'pending' ? setPendingProfiles : setRejectedProfiles

  const handleApprove = async (profileId: string) => {
    setActionLoading(profileId)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'approve' }),
      })

      if (res.ok) {
        // Remove from whichever list it's in
        setPendingProfiles(prev => prev.filter(p => p.id !== profileId))
        setRejectedProfiles(prev => prev.filter(p => p.id !== profileId))
        showToast('Profile approved successfully', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to approve profile', 'error')
      }
    } catch (error) {
      console.error('Error approving profile:', error)
      showToast('Failed to approve profile', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (profileId: string) => {
    setActionLoading(profileId)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          action: 'reject',
          rejectionReason: rejectionReason || undefined
        }),
      })

      if (res.ok) {
        // Find the profile being rejected
        const rejectedProfile = pendingProfiles.find(p => p.id === profileId)
        // Remove from pending
        setPendingProfiles(prev => prev.filter(p => p.id !== profileId))
        // Add to rejected list with reason
        if (rejectedProfile) {
          setRejectedProfiles(prev => [...prev, { ...rejectedProfile, rejectionReason }])
        }
        setSelectedProfile(null)
        setRejectionReason('')
        showToast('Profile rejected', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to reject profile', 'error')
      }
    } catch (error) {
      console.error('Error rejecting profile:', error)
      showToast('Failed to reject profile', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingProfiles.length },
    { id: 'rejected', label: 'Rejected', count: rejectedProfiles.length },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Profile Approvals"
        description="Review and manage profile submissions"
        actions={
          <AdminButton variant="secondary" onClick={fetchProfiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </AdminButton>
        }
      />

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabType)}
      />

      {profiles.length === 0 ? (
        <AdminEmptyState
          icon={activeTab === 'pending' ? <Check className="h-12 w-12" /> : <X className="h-12 w-12" />}
          title={activeTab === 'pending' ? 'All Caught Up!' : 'No Rejected Profiles'}
          description={activeTab === 'pending' ? 'No pending profiles to review.' : 'There are no rejected profiles at the moment.'}
        />
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => {
            const photoUrl = profile.profileImageUrl || null

            return (
            <div key={profile.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Photo Thumbnail */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center relative group ${
                      profile.gender === 'female' ? 'bg-pink-50' : 'bg-blue-50'
                    } ${photoUrl ? 'cursor-pointer' : ''}`}
                    onClick={() => photoUrl && openPhotoModal(profile)}
                  >
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={profile.user.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {/* Zoom overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                        {/* Photo count badge */}
                        {(() => {
                          const photos = extractPhotoUrls(profile.photoUrls)
                          return photos.length > 1 ? (
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                              +{photos.length - 1}
                            </div>
                          ) : null
                        })()}
                      </>
                    ) : (
                      <>
                        <Camera className={`h-8 w-8 ${
                          profile.gender === 'female' ? 'text-pink-300' : 'text-blue-300'
                        }`} />
                        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                          No Photo
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <a
                        href={adminLinks.editProfile(profile.user.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                      >
                        {profile.user.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-gray-500">{profile.user.email}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {profile.gender === 'female' ? 'Bride' : 'Groom'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                    {profile.currentLocation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {profile.currentLocation}
                      </div>
                    )}
                    {profile.occupation && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        {profile.occupation}
                      </div>
                    )}
                    {profile.qualification && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        {profile.qualification}
                      </div>
                    )}
                    {profile.caste && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-gray-400" />
                        {profile.caste}
                      </div>
                    )}
                  </div>

                  {/* LinkedIn and Social Media */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {profile.linkedinProfile && (
                      <a
                        href={profile.linkedinProfile.startsWith('http') ? profile.linkedinProfile : `https://${profile.linkedinProfile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {profile.facebookInstagram && (
                      <a
                        href={profile.facebookInstagram.startsWith('http') ? profile.facebookInstagram : `https://instagram.com/${profile.facebookInstagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-pink-600 hover:text-pink-800 hover:underline"
                      >
                        <Instagram className="h-4 w-4" />
                        {profile.facebookInstagram.includes('instagram') || profile.facebookInstagram.startsWith('@') ? 'Instagram' : 'Social'}
                      </a>
                    )}
                  </div>

                  {profile.aboutMe && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {profile.aboutMe}
                    </p>
                  )}

                  {/* Show rejection reason for rejected profiles */}
                  {activeTab === 'rejected' && profile.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Rejection reason:</span> {profile.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Referral Source Badge */}
                  {profile.referralSource && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700">
                      <span className="font-medium">Referred by:</span>
                      <span>
                        {profile.referralSource === 'whatsapp' ? 'WhatsApp' :
                         profile.referralSource === 'linkedin' ? 'LinkedIn' :
                         profile.referralSource === 'youtube' ? 'YouTube' :
                         profile.referralSource === 'google' ? 'Google Search' :
                         profile.referralSource === 'family' ? 'Family/Relative' :
                         profile.referralSource === 'temple' ? 'Temple/Religious' :
                         profile.referralSource === 'community_event' ? 'Community Event' :
                         profile.referralSource.charAt(0).toUpperCase() + profile.referralSource.slice(1)}
                      </span>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-gray-400">
                    Submitted {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  <a
                    href={adminLinks.profile(profile.id, profile.user.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View as User
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    onClick={() => handleApprove(profile.id)}
                    disabled={actionLoading === profile.id}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === profile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                  {activeTab === 'pending' && (
                    <button
                      onClick={() => setSelectedProfile(profile.id)}
                      disabled={actionLoading === profile.id}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Rejection Modal */}
      <AdminModal
        isOpen={!!selectedProfile}
        onClose={() => { setSelectedProfile(null); setRejectionReason(''); }}
        title="Reject Profile"
        icon={<X className="h-5 w-5 text-red-500" />}
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => { setSelectedProfile(null); setRejectionReason(''); }}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => selectedProfile && handleReject(selectedProfile)}
              loading={actionLoading === selectedProfile}
              className="flex-1"
            >
              Confirm Rejection
            </AdminButton>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Optionally provide a reason for rejection. This will be stored for reference.
        </p>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={3}
        />
      </AdminModal>

      {/* Photo Zoom Modal */}
      {photoModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={closePhotoModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closePhotoModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Profile name */}
            <div className="absolute -top-12 left-0 text-white text-lg font-medium">
              {photoModal.profileName} ({photoModal.currentIndex + 1}/{photoModal.photos.length})
            </div>

            {/* Main image */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img
                src={photoModal.photos[photoModal.currentIndex]}
                alt={`Photo ${photoModal.currentIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                referrerPolicy="no-referrer"
              />

              {/* Navigation arrows */}
              {photoModal.photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {photoModal.photos.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {photoModal.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setPhotoModal(prev => ({ ...prev, currentIndex: index }))}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === photoModal.currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
