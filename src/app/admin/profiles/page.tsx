'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, Download, Trash2,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Loader2, RefreshCw, Ban, UserCheck, Clock, ShieldCheck, ImageOff, ExternalLink, Eye
} from 'lucide-react'
import { adminLinks } from '@/lib/adminLinks'
import { useToast } from '@/components/Toast'

interface Profile {
  id: string
  odNumber: string | null
  gender: string
  currentLocation: string | null
  isVerified: boolean
  isSuspended: boolean
  suspendedReason: string | null
  approvalStatus: string
  createdAt: string
  photoUrls: string | null
  profileImageUrl: string | null
  drivePhotosLink: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    lastLogin: string | null
  }
}

type TabType = 'all' | 'pending' | 'approved' | 'suspended' | 'no_photos'

const tabs: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All Profiles' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'no_photos', label: 'No Photos' },
]

function AdminProfilesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const initialTab = (searchParams.get('tab') as TabType) || 'all'

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [suspendModal, setSuspendModal] = useState<{ isOpen: boolean; profile: Profile | null; reason: string }>({
    isOpen: false,
    profile: null,
    reason: '',
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [page, genderFilter, activeTab])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', activeTab)
    router.replace(`/admin/profiles?${params.toString()}`, { scroll: false })
  }, [activeTab])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(genderFilter && { gender: genderFilter }),
        ...(searchQuery && { search: searchQuery }),
        ...(activeTab !== 'all' && { filter: activeTab }),
      })
      const res = await fetch(`/api/admin/profiles?${params}`)
      const data = await res.json()
      setProfiles(data.profiles || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProfiles()
  }

  const handleVerify = async (profileId: string, verified: boolean) => {
    setActionLoading(profileId)
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: verified }),
      })
      if (res.ok) {
        fetchProfiles()
        showToast(verified ? 'Profile verified' : 'Verification removed', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update profile', 'error')
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      showToast('Failed to update profile', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (profileId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s profile? This cannot be undone.`)) return

    setActionLoading(profileId)
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchProfiles()
        showToast('Profile deleted', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to delete profile', 'error')
      }
    } catch (err) {
      console.error('Failed to delete profile:', err)
      showToast('Failed to delete profile', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async () => {
    if (!suspendModal.profile) return

    setActionLoading(suspendModal.profile.id)
    try {
      const response = await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: suspendModal.profile.user.id,
          action: 'suspend',
          reason: suspendModal.reason || 'Suspended by admin',
        }),
      })

      if (response.ok) {
        fetchProfiles()
        setSuspendModal({ isOpen: false, profile: null, reason: '' })
        showToast('Profile suspended', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to suspend profile', 'error')
      }
    } catch (err) {
      console.error('Failed to suspend profile:', err)
      showToast('Failed to suspend profile', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsuspend = async (profile: Profile) => {
    if (!confirm(`Unsuspend ${profile.user.name}?`)) return

    setActionLoading(profile.id)
    try {
      const res = await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.user.id,
          action: 'unsuspend',
        }),
      })
      if (res.ok) {
        fetchProfiles()
        showToast('Profile unsuspended', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to unsuspend profile', 'error')
      }
    } catch (err) {
      console.error('Failed to unsuspend profile:', err)
      showToast('Failed to unsuspend profile', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never'
    const date = new Date(lastLogin)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (profile: Profile) => {
    if (profile.isSuspended) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Suspended</span>
    }
    if (profile.approvalStatus === 'approved') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Approved</span>
    }
    if (profile.approvalStatus === 'pending') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{profile.approvalStatus}</span>
  }

  const hasPhotos = (profile: Profile) => {
    return !!(profile.photoUrls || profile.profileImageUrl || profile.drivePhotosLink)
  }

  const exportToCSV = () => {
    const headers = ['VR ID', 'Name', 'Email', 'Type', 'Status', 'Verified', 'Last Login', 'Created']
    const rows = profiles.map(p => [
      p.odNumber || '-',
      p.user.name,
      p.user.email,
      p.gender === 'female' ? 'Bride' : 'Groom',
      p.isSuspended ? 'Suspended' : p.approvalStatus,
      p.isVerified ? 'Yes' : 'No',
      p.user.lastLogin ? new Date(p.user.lastLogin).toLocaleDateString() : 'Never',
      new Date(p.createdAt).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profiles-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProfiles}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, VR ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </form>

            <select
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="female">Brides</option>
              <option value="male">Grooms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No profiles found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">VR ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className={`hover:bg-gray-50 ${profile.isSuspended ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600">{profile.odNumber || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <a
                              href={adminLinks.profile(profile.id, profile.user.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                            >
                              {profile.user.name}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <div className="text-xs text-gray-500">{profile.user.email}</div>
                          </div>
                          {!hasPhotos(profile) && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs" title="No photos uploaded">
                              <ImageOff className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          profile.gender === 'female'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {profile.gender === 'female' ? 'Bride' : 'Groom'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(profile)}
                      </td>
                      <td className="px-4 py-3">
                        {profile.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatLastLogin(profile.user.lastLogin)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {actionLoading === profile.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {/* View as User */}
                              <a
                                href={adminLinks.feed(profile.user.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-purple-500 hover:bg-purple-50 rounded"
                                title="View as this user"
                              >
                                <Eye className="h-4 w-4" />
                              </a>

                              {/* Verify Toggle */}
                              <button
                                onClick={() => handleVerify(profile.id, !profile.isVerified)}
                                className={`p-1.5 rounded ${profile.isVerified
                                  ? 'text-green-500 hover:bg-green-50'
                                  : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                                title={profile.isVerified ? 'Remove verification' : 'Verify profile'}
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </button>

                              {/* Suspend/Unsuspend */}
                              {profile.isSuspended ? (
                                <button
                                  onClick={() => handleUnsuspend(profile)}
                                  className="p-1.5 text-green-500 hover:bg-green-50 rounded"
                                  title="Unsuspend"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSuspendModal({ isOpen: true, profile, reason: '' })}
                                  className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                  title="Suspend"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(profile.id, profile.user.name)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                Showing {profiles.length} of {totalCount} profiles
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Suspend Modal */}
      {suspendModal.isOpen && suspendModal.profile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Suspend Profile</h2>
              </div>
              <button
                onClick={() => setSuspendModal({ isOpen: false, profile: null, reason: '' })}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Suspending <span className="font-semibold">{suspendModal.profile.user.name}</span> ({suspendModal.profile.odNumber || 'No VR ID'})
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for suspension
                </label>
                <textarea
                  value={suspendModal.reason}
                  onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                  placeholder="Enter reason..."
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSuspendModal({ isOpen: false, profile: null, reason: '' })}
                  className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={actionLoading === suspendModal.profile.id}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {actionLoading === suspendModal.profile.id ? 'Suspending...' : 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminProfilesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <AdminProfilesContent />
    </Suspense>
  )
}
