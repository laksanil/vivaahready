'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Download, Trash2, RefreshCw, Ban, UserCheck, ShieldCheck, ImageOff,
  ExternalLink, Eye, Loader2, Users, UserX, Heart, AlertTriangle,
  Check, X, Edit, LayoutDashboard, MessageCircle
} from 'lucide-react'
import { adminLinks } from '@/lib/adminLinks'
import { useToast } from '@/components/Toast'
import {
  AdminTabs,
  AdminSearchFilter,
  AdminTable,
  AdminTableEmpty,
  AdminPagination,
  AdminBadge,
  AdminIconButton,
  AdminModal,
  AdminButton,
  AdminPageHeader,
  AdminEmptyState,
  AdminTableSkeleton,
  AdminConfirmModal,
  formatRelativeDate,
  formatDate,
} from '@/components/admin/AdminComponents'

interface DeletionRequest {
  id: string
  reason: string
  otherReason: string | null
  status: string
  adminNotes: string | null
  createdAt: string
  processedAt: string | null
}

interface Profile {
  id: string | null
  odNumber: string | null
  gender: string | null
  currentLocation: string | null
  occupation: string | null
  isVerified: boolean
  isSuspended: boolean
  suspendedReason: string | null
  approvalStatus: string
  createdAt: string
  photoUrls: string | null
  profileImageUrl: string | null
  drivePhotosLink: string | null
  hasProfile: boolean
  deletionRequest: DeletionRequest | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    lastLogin: string | null
  }
  interestStats?: {
    received: { total: number; pending: number; accepted: number; rejected: number }
    sent: { total: number; pending: number; accepted: number; rejected: number }
  } | null
}

type TabType = 'all' | 'pending' | 'approved' | 'suspended' | 'no_photos' | 'no_profile' | 'deletions'

const REASON_LABELS: Record<string, string> = {
  marriage_vivaahready: 'Marriage Fixed via VivaahReady',
  marriage_other: 'Marriage Fixed via Other Sources',
  no_longer_looking: 'No Longer Looking',
  not_satisfied: 'Not Satisfied with Matches',
  privacy_concerns: 'Privacy Concerns',
  taking_break: 'Taking a Break',
  other: 'Other',
}

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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; profile: Profile | null }>({
    isOpen: false,
    profile: null,
  })
  const [unsuspendConfirmModal, setUnsuspendConfirmModal] = useState<{ isOpen: boolean; profile: Profile | null }>({
    isOpen: false,
    profile: null,
  })
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})

  const tabs = [
    { id: 'all', label: 'All Profiles', count: tabCounts.all },
    { id: 'pending', label: 'Pending', count: tabCounts.pending },
    { id: 'approved', label: 'Approved', count: tabCounts.approved },
    { id: 'suspended', label: 'Suspended', count: tabCounts.suspended },
    { id: 'no_photos', label: 'No Photos', count: tabCounts.no_photos },
    { id: 'no_profile', label: 'No Profile', count: tabCounts.no_profile },
    { id: 'deletions', label: 'Deletions', count: tabCounts.deletions },
  ]

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
      // Update tab counts if returned (only on first page)
      if (data.tabCounts) {
        setTabCounts(data.tabCounts)
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
      showToast('Failed to load profiles. Please refresh the page.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType)
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

  const handleDeleteConfirm = async () => {
    const profile = deleteConfirmModal.profile
    if (!profile || !profile.id) return

    setActionLoading(profile.id)
    try {
      const res = await fetch(`/api/admin/profiles/${profile.id}`, {
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
      setDeleteConfirmModal({ isOpen: false, profile: null })
    }
  }

  const handleSuspend = async () => {
    if (!suspendModal.profile) return

    setActionLoading(suspendModal.profile.user.id)
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

  const handleUnsuspendConfirm = async () => {
    const profile = unsuspendConfirmModal.profile
    if (!profile) return

    setActionLoading(profile.user.id)
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
      setUnsuspendConfirmModal({ isOpen: false, profile: null })
    }
  }

  // Deletion request handlers
  const handleDeletionAction = async (requestId: string, action: 'approve' | 'reject' | 'complete') => {
    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/admin/deletion-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        fetchProfiles()
        setConfirmDelete(null)
        const actionMessages: Record<string, string> = {
          approve: 'Deletion request approved',
          reject: 'Deletion request rejected',
          complete: 'User account deleted',
        }
        showToast(actionMessages[action] || 'Request processed', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to process request', 'error')
      }
    } catch (error) {
      console.error('Failed to process request:', error)
      showToast('Failed to process request', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const hasPhotos = (profile: Profile) => {
    return !!(profile.photoUrls || profile.profileImageUrl || profile.drivePhotosLink)
  }

  const getStatusBadge = (profile: Profile) => {
    if (!profile.hasProfile || profile.approvalStatus === 'no_profile') {
      return <AdminBadge variant="gray">No Profile</AdminBadge>
    }
    if (profile.isSuspended) {
      return <AdminBadge variant="suspended">Suspended</AdminBadge>
    }
    if (profile.approvalStatus === 'approved') {
      return <AdminBadge variant="approved">Approved</AdminBadge>
    }
    if (profile.approvalStatus === 'pending') {
      return <AdminBadge variant="pending">Pending</AdminBadge>
    }
    if (profile.approvalStatus === 'rejected') {
      return <AdminBadge variant="rejected">Rejected</AdminBadge>
    }
    return <AdminBadge variant="gray">{profile.approvalStatus}</AdminBadge>
  }

  const exportToCSV = () => {
    const headers = ['VR ID', 'Name', 'Email', 'Type', 'Status', 'Verified', 'Last Login', 'Created']
    const rows = profiles.map(p => [
      p.odNumber || '-',
      p.user.name,
      p.user.email,
      p.gender === 'female' ? 'Bride' : p.gender === 'male' ? 'Groom' : '-',
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

  const isMarriageReason = (reason: string) => reason === 'marriage_vivaahready' || reason === 'marriage_other'

  // Table headers based on active tab
  const getTableHeaders = () => {
    if (activeTab === 'deletions') {
      return [
        { key: 'user', label: 'User' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status' },
        { key: 'requested', label: 'Requested' },
        { key: 'actions', label: 'Actions' },
      ]
    }
    if (activeTab === 'no_profile') {
      return [
        { key: 'user', label: 'User' },
        { key: 'contact', label: 'Contact' },
        { key: 'lastLogin', label: 'Last Login' },
        { key: 'joined', label: 'Joined' },
        { key: 'actions', label: 'Actions' },
      ]
    }
    return [
      { key: 'vrId', label: 'VR ID' },
      { key: 'user', label: 'User' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'activity', label: 'Activity' },
      { key: 'lastLogin', label: 'Last Login' },
      { key: 'actions', label: 'Actions' },
    ]
  }

  // Render table row based on active tab
  const renderTableRow = (profile: Profile) => {
    const isLoading = actionLoading === profile.user.id || actionLoading === profile.id || (profile.deletionRequest && actionLoading === profile.deletionRequest.id)

    // Deletions tab view
    if (activeTab === 'deletions' && profile.deletionRequest) {
      const req = profile.deletionRequest
      return (
        <tr key={req.id} className="hover:bg-gray-50">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {profile.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{profile.user.name}</div>
                <div className="text-xs text-gray-500">{profile.user.email}</div>
                {profile.odNumber && (
                  <div className="text-xs font-mono text-primary-600">{profile.odNumber}</div>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className={`rounded-lg p-2 ${isMarriageReason(req.reason) ? 'bg-pink-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                {isMarriageReason(req.reason) ? (
                  <Heart className="h-4 w-4 text-pink-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {REASON_LABELS[req.reason] || req.reason}
                </span>
              </div>
              {req.otherReason && (
                <p className="text-xs text-gray-600 mt-1">&quot;{req.otherReason}&quot;</p>
              )}
            </div>
          </td>
          <td className="px-4 py-4">
            <AdminBadge variant={req.status === 'pending' ? 'pending' : req.status === 'approved' ? 'approved' : 'gray'}>
              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
            </AdminBadge>
          </td>
          <td className="px-4 py-4 text-sm text-gray-600">
            {formatDate(req.createdAt)}
          </td>
          <td className="px-4 py-4">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : req.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <AdminButton
                  variant="success"
                  onClick={() => handleDeletionAction(req.id, 'approve')}
                  className="px-3 py-1.5"
                >
                  <Check className="h-4 w-4" />
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  onClick={() => handleDeletionAction(req.id, 'reject')}
                  className="px-3 py-1.5"
                >
                  <X className="h-4 w-4" />
                </AdminButton>
              </div>
            ) : req.status === 'approved' ? (
              confirmDelete === req.id ? (
                <div className="flex items-center gap-2">
                  <AdminButton
                    variant="danger"
                    onClick={() => handleDeletionAction(req.id, 'complete')}
                    className="px-3 py-1.5 text-xs"
                  >
                    Confirm Delete
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </AdminButton>
                </div>
              ) : (
                <AdminButton
                  variant="danger"
                  onClick={() => setConfirmDelete(req.id)}
                  className="px-3 py-1.5"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </AdminButton>
              )
            ) : null}
          </td>
        </tr>
      )
    }

    // No profile tab view
    if (activeTab === 'no_profile') {
      return (
        <tr key={profile.user.id} className="hover:bg-gray-50">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 font-semibold text-sm">
                  {profile.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{profile.user.name}</div>
                <AdminBadge variant="gray">No Profile</AdminBadge>
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="text-sm text-gray-600">{profile.user.email}</div>
            {profile.user.phone && (
              <div className="text-xs text-gray-500">{profile.user.phone}</div>
            )}
          </td>
          <td className="px-4 py-4 text-sm text-gray-600">
            {formatRelativeDate(profile.user.lastLogin)}
          </td>
          <td className="px-4 py-4 text-sm text-gray-600">
            {formatDate(profile.createdAt)}
          </td>
          <td className="px-4 py-4">
            <AdminIconButton
              icon={<Eye className="h-4 w-4" />}
              href={adminLinks.userDetail(profile.user.id)}
              title="View user details"
              variant="purple"
            />
          </td>
        </tr>
      )
    }

    // Default profile view
    return (
      <tr key={profile.id || profile.user.id} className={`hover:bg-gray-50 ${profile.isSuspended ? 'bg-red-50' : ''}`}>
        <td className="px-4 py-3">
          <span className="font-mono text-sm text-gray-600">{profile.odNumber || '-'}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div>
              <a
                href={adminLinks.editProfile(profile.user.id)}
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
          {profile.gender && (
            <AdminBadge variant={profile.gender === 'female' ? 'bride' : 'groom'}>
              {profile.gender === 'female' ? 'Bride' : 'Groom'}
            </AdminBadge>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {getStatusBadge(profile)}
            {profile.isVerified && (
              <span title="Verified">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          {profile.interestStats ? (
            <div className="text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-pink-500" />
                {profile.interestStats.sent.total} sent / {profile.interestStats.received.total} received
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatRelativeDate(profile.user.lastLogin)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <>
                {/* Quick view actions for approved profiles */}
                {profile.hasProfile && profile.approvalStatus === 'approved' && (
                  <>
                    <AdminIconButton
                      icon={<LayoutDashboard className="h-4 w-4" />}
                      href={adminLinks.dashboard(profile.user.id)}
                      title="View Dashboard"
                      variant="purple"
                    />
                    <AdminIconButton
                      icon={<Heart className="h-4 w-4" />}
                      href={adminLinks.matches(profile.user.id)}
                      title="View Matches"
                      variant="pink"
                    />
                    <AdminIconButton
                      icon={<Users className="h-4 w-4" />}
                      href={adminLinks.connections(profile.user.id)}
                      title="View Connections"
                      variant="green"
                    />
                    <AdminIconButton
                      icon={<MessageCircle className="h-4 w-4" />}
                      href={adminLinks.messages(profile.user.id)}
                      title="View Messages"
                      variant="blue"
                    />
                  </>
                )}

                {/* View as User */}
                {profile.hasProfile && (
                  <AdminIconButton
                    icon={<Eye className="h-4 w-4" />}
                    href={adminLinks.matches(profile.user.id)}
                    target="_blank"
                    title="View as this user"
                    variant="purple"
                  />
                )}

                {/* Verify Toggle */}
                {profile.hasProfile && profile.id && (
                  <AdminIconButton
                    icon={<ShieldCheck className="h-4 w-4" />}
                    onClick={() => handleVerify(profile.id!, !profile.isVerified)}
                    title={profile.isVerified ? 'Remove verification' : 'Verify profile'}
                    variant={profile.isVerified ? 'green' : 'gray'}
                  />
                )}

                {/* Suspend/Unsuspend */}
                {profile.hasProfile && (
                  profile.isSuspended ? (
                    <AdminIconButton
                      icon={<UserCheck className="h-4 w-4" />}
                      onClick={() => setUnsuspendConfirmModal({ isOpen: true, profile })}
                      title="Unsuspend"
                      variant="green"
                    />
                  ) : (
                    <AdminIconButton
                      icon={<Ban className="h-4 w-4" />}
                      onClick={() => setSuspendModal({ isOpen: true, profile, reason: '' })}
                      title="Suspend"
                      variant="orange"
                    />
                  )
                )}

                {/* Edit Profile - Uses same edit flow as user */}
                {profile.hasProfile && profile.id && (
                  <AdminIconButton
                    icon={<Edit className="h-4 w-4" />}
                    href={adminLinks.editProfile(profile.user.id)}
                    title="Edit profile"
                    variant="gray"
                  />
                )}

                {/* Delete */}
                {profile.hasProfile && profile.id && (
                  <AdminIconButton
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setDeleteConfirmModal({ isOpen: true, profile })}
                    title="Delete"
                    variant="red"
                  />
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Profiles"
        description="Manage all user profiles and accounts"
        actions={
          <>
            <AdminButton variant="secondary" onClick={fetchProfiles}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </AdminButton>
            <AdminButton variant="secondary" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </AdminButton>
          </>
        }
      />

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        <AdminSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
          placeholder="Search by name, email, VR ID..."
        >
          {activeTab !== 'no_profile' && activeTab !== 'deletions' && (
            <select
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="female">Brides</option>
              <option value="male">Grooms</option>
            </select>
          )}
        </AdminSearchFilter>
      </AdminTabs>

      {loading ? (
        <AdminTableSkeleton rows={10} columns={activeTab === 'deletions' ? 5 : activeTab === 'no_profile' ? 5 : 7} />
      ) : profiles.length === 0 ? (
        <AdminEmptyState
          icon={activeTab === 'deletions' ? <Trash2 className="h-12 w-12" /> : <Users className="h-12 w-12" />}
          title={activeTab === 'deletions' ? 'No deletion requests' : activeTab === 'no_profile' ? 'All users have profiles' : 'No profiles found'}
          description={`No ${activeTab === 'all' ? '' : activeTab.replace('_', ' ')} items to display.`}
        />
      ) : (
        <>
          <AdminTable headers={getTableHeaders()}>
            {profiles.map(renderTableRow)}
          </AdminTable>
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            itemsShown={profiles.length}
            itemLabel={activeTab === 'no_profile' ? 'users' : activeTab === 'deletions' ? 'requests' : 'profiles'}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Suspend Modal */}
      <AdminModal
        isOpen={suspendModal.isOpen}
        onClose={() => setSuspendModal({ isOpen: false, profile: null, reason: '' })}
        title="Suspend Profile"
        icon={<Ban className="h-5 w-5 text-orange-500" />}
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setSuspendModal({ isOpen: false, profile: null, reason: '' })}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={handleSuspend}
              loading={actionLoading === suspendModal.profile?.user.id}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Suspend
            </AdminButton>
          </>
        }
      >
        {suspendModal.profile && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Suspending <span className="font-semibold">{suspendModal.profile.user.name}</span> ({suspendModal.profile.odNumber || 'No VR ID'})
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for suspension
              </label>
              <textarea
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                placeholder="Enter reason..."
                className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
          </>
        )}
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, profile: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Profile"
        message={`Are you sure you want to delete ${deleteConfirmModal.profile?.user.name}'s profile? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={actionLoading === deleteConfirmModal.profile?.id}
        icon={<Trash2 className="h-5 w-5 text-red-500" />}
      />

      {/* Unsuspend Confirmation Modal */}
      <AdminConfirmModal
        isOpen={unsuspendConfirmModal.isOpen}
        onClose={() => setUnsuspendConfirmModal({ isOpen: false, profile: null })}
        onConfirm={handleUnsuspendConfirm}
        title="Unsuspend Profile"
        message={`Are you sure you want to unsuspend ${unsuspendConfirmModal.profile?.user.name}'s profile?`}
        confirmText="Unsuspend"
        confirmVariant="primary"
        isLoading={actionLoading === unsuspendConfirmModal.profile?.user.id}
        icon={<UserCheck className="h-5 w-5 text-green-500" />}
      />
    </div>
  )
}

export default function AdminProfilesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <AdminProfilesContent />
    </Suspense>
  )
}
