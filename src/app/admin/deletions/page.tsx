'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2, Check, X, AlertTriangle, Heart, User, Mail, Phone, MapPin } from 'lucide-react'

interface DeletionRequest {
  id: string
  userId: string
  reason: string
  otherReason: string | null
  status: string
  adminNotes: string | null
  processedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    profile: {
      id: string
      odNumber: string | null
      gender: string
      currentLocation: string | null
    } | null
  } | null
}

const REASON_LABELS: Record<string, string> = {
  marriage_vivaahready: 'Marriage Fixed via VivaahReady',
  marriage_other: 'Marriage Fixed via Other Sources',
  no_longer_looking: 'No Longer Looking',
  not_satisfied: 'Not Satisfied with Matches',
  privacy_concerns: 'Privacy Concerns',
  taking_break: 'Taking a Break',
  other: 'Other',
}

export default function AdminDeletionsPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/deletion-requests?status=${filter}`)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch deletion requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'complete', notes?: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/admin/deletion-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNotes: notes }),
      })

      if (response.ok) {
        fetchRequests()
        setConfirmDelete(null)
      }
    } catch (error) {
      console.error('Failed to process request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Completed</span>
      default:
        return null
    }
  }

  const isMarriageReason = (reason: string) => reason === 'marriage_vivaahready' || reason === 'marriage_other'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deletion Requests</h1>
        <p className="text-gray-600 mt-1">
          Manage profile deletion requests from users.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Trash2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deletion requests</h3>
          <p className="text-gray-500">
            {filter === 'all' ? 'There are no deletion requests yet.' : `No ${filter} deletion requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* User info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {request.user?.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.user?.profile?.odNumber || 'No VR ID'}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      {request.user?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {request.user.email}
                        </div>
                      )}
                      {request.user?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {request.user.phone}
                        </div>
                      )}
                      {request.user?.profile?.currentLocation && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {request.user.profile.currentLocation}
                        </div>
                      )}
                    </div>

                    {/* Reason */}
                    <div className={`rounded-lg p-4 ${isMarriageReason(request.reason) ? 'bg-pink-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {isMarriageReason(request.reason) ? (
                          <Heart className="h-4 w-4 text-pink-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="font-medium text-gray-900">
                          {REASON_LABELS[request.reason] || request.reason}
                        </span>
                      </div>
                      {request.otherReason && (
                        <p className="text-sm text-gray-600 mt-2">
                          &quot;{request.otherReason}&quot;
                        </p>
                      )}
                    </div>

                    {/* Admin notes if any */}
                    {request.adminNotes && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium text-gray-700">Admin Notes:</span>{' '}
                        <span className="text-gray-600">{request.adminNotes}</span>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="mt-3 text-xs text-gray-400">
                      Requested: {new Date(request.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {request.processedAt && (
                        <> • Processed: {new Date(request.processedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}</>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={processingId === request.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(request.id, 'reject')}
                          disabled={processingId === request.id}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <>
                        {confirmDelete === request.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700 mb-2">
                              This will permanently delete the user and all their data. This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(request.id, 'complete')}
                                disabled={processingId === request.id}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                {processingId === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(request.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Profile
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
