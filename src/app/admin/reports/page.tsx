'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  RefreshCw,
  User,
  Filter,
} from 'lucide-react'

interface Report {
  id: string
  reporterId: string
  reportedUserId: string
  reason: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  adminNotes: string | null
  actionTaken: string | null
  createdAt: string
  reviewedAt: string | null
  reporter: {
    id: string
    name: string
    email: string
    profile: {
      id: string
      gender: string
      profileImageUrl: string | null
    } | null
  }
  reportedUser: {
    id: string
    name: string
    email: string
    profile: {
      id: string
      gender: string
      profileImageUrl: string | null
      isSuspended: boolean
      suspendedReason: string | null
    } | null
  }
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [actionModal, setActionModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  useEffect(() => {
    checkAuthAndFetch()
  }, [statusFilter])

  const checkAuthAndFetch = async () => {
    try {
      const authRes = await fetch('/api/admin/check')
      if (!authRes.ok) {
        router.push('/admin/login')
        return
      }
      fetchReports()
    } catch {
      router.push('/admin/login')
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const url = statusFilter === 'all'
        ? '/api/admin/reports'
        : `/api/admin/reports?status=${statusFilter}`

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch reports')

      const data = await response.json()
      setReports(data)
    } catch (err) {
      setError('Failed to load reports')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReport = async () => {
    if (!selectedReport || !newStatus) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: newStatus,
          adminNotes,
          actionTaken,
        }),
      })

      if (!response.ok) throw new Error('Failed to update report')

      // If action is to suspend, also call suspend API
      if (actionTaken === 'suspended' && selectedReport.reportedUser.profile) {
        await fetch('/api/admin/suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: selectedReport.reportedUser.profile.id,
            action: 'suspend',
            reason: suspendReason || `Suspended due to report: ${selectedReport.reason.substring(0, 100)}`,
          }),
        })
      }

      setActionModal(false)
      setSelectedReport(null)
      setAdminNotes('')
      setActionTaken('')
      setNewStatus('')
      setSuspendReason('')
      fetchReports()
    } catch (err) {
      console.error(err)
      alert('Failed to update report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuspendProfile = async (profileId: string, action: 'suspend' | 'unsuspend') => {
    if (!confirm(`Are you sure you want to ${action} this profile?`)) return

    try {
      const response = await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          action,
          reason: action === 'suspend' ? 'Suspended by admin from reports page' : undefined,
        }),
      })

      if (!response.ok) throw new Error(`Failed to ${action} profile`)

      fetchReports()
    } catch (err) {
      console.error(err)
      alert(`Failed to ${action} profile`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>
      case 'reviewed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" /> Reviewed</span>
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</span>
      case 'dismissed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" /> Dismissed</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reported Problems</h1>
            <p className="text-gray-600">Review and manage user reports</p>
          </div>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <div className="flex gap-2">
              {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600">
              {statusFilter === 'all'
                ? 'No user reports have been submitted yet.'
                : `No ${statusFilter} reports found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      <span className="text-sm text-gray-500">{formatDate(report.createdAt)}</span>
                    </div>
                    {report.reportedUser.profile?.isSuspended && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Ban className="w-3 h-3 mr-1" /> Suspended
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-4">
                    {/* Reporter */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Reported By</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{report.reporter.name}</p>
                          <p className="text-sm text-gray-500">{report.reporter.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reported User */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Reported User</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{report.reportedUser.name}</p>
                          <p className="text-sm text-gray-500">{report.reportedUser.email}</p>
                        </div>
                        {report.reportedUser.profile && (
                          <Link
                            href={`/admin/profiles/${report.reportedUser.profile.id}/edit`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            View Profile
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Report Reason */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Report Reason:</p>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                      {report.reason}
                    </div>
                  </div>

                  {/* Admin Notes (if any) */}
                  {report.adminNotes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Admin Notes:</p>
                      <div className="bg-blue-50 rounded-lg p-4 text-gray-700">
                        {report.adminNotes}
                      </div>
                    </div>
                  )}

                  {/* Action Taken (if any) */}
                  {report.actionTaken && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Action Taken:</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {report.actionTaken}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedReport(report)
                        setNewStatus(report.status)
                        setAdminNotes(report.adminNotes || '')
                        setActionTaken(report.actionTaken || '')
                        setActionModal(true)
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      Review & Update
                    </button>

                    {report.reportedUser.profile && (
                      report.reportedUser.profile.isSuspended ? (
                        <button
                          onClick={() => handleSuspendProfile(report.reportedUser.profile!.id, 'unsuspend')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Unsuspend Profile
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendProfile(report.reportedUser.profile!.id, 'suspend')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                        >
                          <Ban className="h-4 w-4" />
                          Suspend Profile
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Action Modal */}
      {actionModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Review Report</h2>
              <p className="text-sm text-gray-500">Update the status and add notes for this report</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No action</option>
                  <option value="warned">Warned user</option>
                  <option value="suspended">Suspended profile</option>
                  <option value="dismissed">Dismissed - no issue found</option>
                </select>
              </div>

              {actionTaken === 'suspended' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Suspension Reason</label>
                  <input
                    type="text"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Reason for suspension..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                  placeholder="Add notes about this report..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setActionModal(false)
                  setSelectedReport(null)
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateReport}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
