'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X, Eye, Clock, User, MapPin, Briefcase, GraduationCap, Loader2 } from 'lucide-react'

interface PendingProfile {
  id: string
  gender: string
  currentLocation: string | null
  occupation: string | null
  qualification: string | null
  caste: string | null
  aboutMe: string | null
  createdAt: string
  user: {
    name: string
    email: string
    phone: string | null
  }
}

export default function AdminApprovalsPage() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchPendingProfiles()
  }, [])

  const fetchPendingProfiles = async () => {
    try {
      const res = await fetch('/api/admin/approve?status=pending')
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (profileId: string) => {
    setActionLoading(profileId)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'approve' }),
      })

      if (res.ok) {
        setProfiles(profiles.filter(p => p.id !== profileId))
      }
    } catch (error) {
      console.error('Error approving profile:', error)
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
        setProfiles(profiles.filter(p => p.id !== profileId))
        setSelectedProfile(null)
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Error rejecting profile:', error)
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve new profile submissions</p>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">All Caught Up!</h3>
          <p className="text-gray-600 mt-1">No pending profiles to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Profile Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      profile.gender === 'female' ? 'bg-pink-100' : 'bg-blue-100'
                    }`}>
                      <User className={`h-5 w-5 ${
                        profile.gender === 'female' ? 'text-pink-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{profile.user.name}</h3>
                      <p className="text-sm text-gray-500">{profile.user.email}</p>
                    </div>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
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

                  {profile.aboutMe && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {profile.aboutMe}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-400">
                    Submitted {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  <Link
                    href={`/profile/${profile.id}`}
                    target="_blank"
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
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
                  <button
                    onClick={() => setSelectedProfile(profile.id)}
                    disabled={actionLoading === profile.id}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Profile</h3>
            <p className="text-sm text-gray-600 mb-4">
              Optionally provide a reason for rejection. This will be stored for reference.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedProfile(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedProfile)}
                disabled={actionLoading === selectedProfile}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === selectedProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
