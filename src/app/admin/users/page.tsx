'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, Users, Eye, Mail, Phone, Calendar, Shield,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle, UserX,
  Heart, MessageCircle, LayoutDashboard, ExternalLink,
  MoreHorizontal, Ban, UserCheck, Trash2, Edit,
} from 'lucide-react'
import { adminLinks } from '@/lib/adminLinks'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  emailVerified: string | null
  phoneVerified: string | null
  lastLogin: string | null
  createdAt: string
  profile: {
    id: string
    odNumber: string | null
    gender: string
    currentLocation: string | null
    occupation: string | null
    approvalStatus: string
    isVerified: boolean
    isSuspended: boolean
    suspendedReason: string | null
    photoUrls: string | null
    profileImageUrl: string | null
  } | null
  subscription: {
    plan: string
    profilePaid: boolean
  } | null
  _count: {
    sentMatches: number
    receivedMatches: number
  }
}

type FilterType = 'all' | 'with_profile' | 'no_profile' | 'approved' | 'pending' | 'suspended'

function AdminUsersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = (searchParams.get('filter') as FilterType) || 'all'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>(initialFilter)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [page, filter])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', filter)
    router.replace(`/admin/users?${params.toString()}`, { scroll: false })
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filter !== 'all' && { filter }),
        ...(searchQuery && { search: searchQuery }),
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString()
  }

  const getStatusBadge = (user: User) => {
    if (!user.profile) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          No Profile
        </span>
      )
    }
    if (user.profile.isSuspended) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          Suspended
        </span>
      )
    }
    if (user.profile.approvalStatus === 'approved') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          Approved
        </span>
      )
    }
    if (user.profile.approvalStatus === 'pending') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
          Pending
        </span>
      )
    }
    if (user.profile.approvalStatus === 'rejected') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          Rejected
        </span>
      )
    }
    return null
  }

  const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Users', icon: <Users className="h-4 w-4" /> },
    { id: 'with_profile', label: 'With Profile', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'no_profile', label: 'No Profile', icon: <UserX className="h-4 w-4" /> },
    { id: 'approved', label: 'Approved', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" /> },
    { id: 'suspended', label: 'Suspended', icon: <Ban className="h-4 w-4" /> },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            Full account access and impersonation capabilities
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, VR ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quick View</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <Link
                              href={adminLinks.userDetail(user.id)}
                              className="font-medium text-gray-900 hover:text-purple-600"
                            >
                              {user.name}
                            </Link>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                            {user.profile?.odNumber && (
                              <div className="text-xs text-purple-600 font-mono mt-1">
                                {user.profile.odNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(user)}
                          {user.profile?.isVerified && (
                            <div className="flex items-center gap-1 text-green-600 text-xs">
                              <Shield className="h-3 w-3" />
                              Verified
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.profile ? (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Heart className="h-4 w-4 text-pink-500" />
                              {user._count.sentMatches} sent / {user._count.receivedMatches} received
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.profile.gender === 'female' ? 'Bride' : 'Groom'} • {user.profile.currentLocation || 'No location'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No profile yet</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div>{formatDate(user.lastLogin)}</div>
                        <div className="text-xs text-gray-400">
                          Joined {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.profile && user.profile.approvalStatus === 'approved' ? (
                          <div className="flex items-center gap-1">
                            <Link
                              href={adminLinks.dashboard(user.id)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                              title="View Dashboard"
                            >
                              <LayoutDashboard className="h-4 w-4" />
                            </Link>
                            <Link
                              href={adminLinks.feed(user.id)}
                              className="p-1.5 text-pink-600 hover:bg-pink-50 rounded"
                              title="View Matches"
                            >
                              <Heart className="h-4 w-4" />
                            </Link>
                            <Link
                              href={adminLinks.connections(user.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="View Connections"
                            >
                              <Users className="h-4 w-4" />
                            </Link>
                            <Link
                              href={adminLinks.messages(user.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="View Messages"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            {user.profile ? 'Not approved' : 'No profile'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={adminLinks.userDetail(user.id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {user.profile && (
                            <Link
                              href={`/admin/profiles/${user.profile.id}/edit`}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit Profile"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
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
                Showing {users.length} of {totalCount} users
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
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <AdminUsersContent />
    </Suspense>
  )
}
