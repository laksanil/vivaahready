'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Download, RefreshCw, Loader2,
  Inbox, Send,
  Heart, AlertTriangle, Clock, TrendingUp,
  ArrowUpDown, Users, XCircle, Flag, Eye,
  ExternalLink, Star,
} from 'lucide-react'
import { adminLinks } from '@/lib/adminLinks'
import {
  AdminPageHeader,
  AdminTabs,
  AdminSearchFilter,
  AdminStatCard,
  AdminPagination,
  AdminEmptyState,
  AdminButton,
  AdminTableSkeleton,
} from '@/components/admin/AdminComponents'
import { useToast } from '@/components/Toast'

interface ProfileStats {
  id: string
  odNumber: string | null
  gender: string
  currentLocation: string | null
  approvalStatus: string
  isVerified: boolean
  isSuspended: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    lastLogin: string | null
    createdAt: string
  }
  stats: {
    interestsReceived: {
      total: number
      pending: number
      accepted: number
      rejected: number
    }
    interestsSent: {
      total: number
      pending: number
      accepted: number
      rejected: number
    }
    mutualMatches: number
    potentialMatches: number
    declined: number
    reportsFiled: number
    reportsReceived: number
    daysSinceSignup: number
    daysSinceLastLogin: number | null
    // Lifetime stats (never decrease - show platform value)
    lifetime: {
      interestsReceived: number
      interestsSent: number
      profileViews: number
    }
  }
}

interface Summary {
  totalProfiles: number
  activeToday: number
  activeThisWeek: number
  inactive: number
  neverLoggedIn: number
  noInterestsReceived: number
  noMutualMatches: number
  pendingResponses: number
  totalMutualMatches: number
}

type FilterType = 'all' | 'inactive' | 'no_interests' | 'no_matches' | 'pending_response'
type SortField = 'lastLogin' | 'interestsReceived' | 'interestsSent' | 'mutualMatches' | 'createdAt'

const filters: { id: FilterType; label: string; description: string }[] = [
  { id: 'all', label: 'All Profiles', description: 'Show all profiles' },
  { id: 'inactive', label: 'Inactive (7+ days)', description: 'Haven\'t logged in for a week' },
  { id: 'no_interests', label: 'No Interests Received', description: 'May need profile improvement' },
  { id: 'no_matches', label: 'No Mutual Matches', description: 'Haven\'t matched with anyone' },
  { id: 'pending_response', label: 'Pending Responses', description: 'Have interests waiting' },
]

export default function AdminMatchesPage() {
  const { showToast } = useToast()
  const [profiles, setProfiles] = useState<ProfileStats[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortField>('lastLogin')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchMatches()
  }, [page, genderFilter, activeFilter, sortBy, sortOrder])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...(genderFilter && { gender: genderFilter }),
        ...(searchQuery && { search: searchQuery }),
        ...(activeFilter !== 'all' && { filter: activeFilter }),
      })
      const res = await fetch(`/api/admin/matches?${params}`)
      const data = await res.json()
      setProfiles(data.profiles || [])
      setSummary(data.summary || null)
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch matches:', err)
      showToast('Failed to load matches data. Please refresh the page.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchMatches()
  }

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never'
    const date = new Date(lastLogin)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  const getActivityStatus = (daysSinceLastLogin: number | null) => {
    if (daysSinceLastLogin === null) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Never logged in</span>
    }
    if (daysSinceLastLogin === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active today</span>
    }
    if (daysSinceLastLogin <= 7) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Active this week</span>
    }
    if (daysSinceLastLogin <= 30) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Inactive</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Dormant</span>
  }

  const exportToCSV = () => {
    const headers = ['VR ID', 'Name', 'Email', 'Type', 'Received', 'Sent', 'Mutual', 'Lifetime Recv', 'Lifetime Sent', 'Lifetime Views', 'Last Login', 'Status']
    const rows = profiles.map(p => [
      p.odNumber || '-',
      p.user.name,
      p.user.email,
      p.gender === 'female' ? 'Bride' : 'Groom',
      `${p.stats.interestsReceived.total} (${p.stats.interestsReceived.pending}P/${p.stats.interestsReceived.accepted}A/${p.stats.interestsReceived.rejected}R)`,
      `${p.stats.interestsSent.total} (${p.stats.interestsSent.pending}P/${p.stats.interestsSent.accepted}A/${p.stats.interestsSent.rejected}R)`,
      p.stats.mutualMatches,
      p.stats.lifetime?.interestsReceived || 0,
      p.stats.lifetime?.interestsSent || 0,
      p.stats.lifetime?.profileViews || 0,
      p.user.lastLogin ? new Date(p.user.lastLogin).toLocaleDateString() : 'Never',
      p.stats.daysSinceLastLogin === null ? 'Never logged in' : p.stats.daysSinceLastLogin <= 7 ? 'Active' : 'Inactive'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `matches-activity-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Build tabs with counts from summary
  const getFilterCount = (filterId: FilterType): number | undefined => {
    if (!summary) return undefined
    switch (filterId) {
      case 'all': return summary.totalProfiles
      case 'inactive': return summary.inactive
      case 'no_interests': return summary.noInterestsReceived
      case 'no_matches': return summary.noMutualMatches
      case 'pending_response': return summary.pendingResponses
      default: return undefined
    }
  }

  const tabs = filters.map(f => {
    const count = getFilterCount(f.id)
    return {
      id: f.id,
      label: count !== undefined ? `${f.label} (${count})` : f.label
    }
  })

  return (
    <div>
      <AdminPageHeader
        title="Matches & Activity"
        description="Monitor engagement and identify profiles needing attention"
        actions={
          <>
            <AdminButton variant="secondary" onClick={fetchMatches}>
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <AdminStatCard
            label="Active this week"
            value={summary.activeThisWeek}
            icon={<TrendingUp className="h-5 w-5" />}
            color="green"
          />
          <AdminStatCard
            label="Inactive (7+ days)"
            value={summary.inactive}
            icon={<Clock className="h-5 w-5" />}
            color="red"
          />
          <AdminStatCard
            label="No interests received"
            value={summary.noInterestsReceived}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="yellow"
          />
          <AdminStatCard
            label="Total mutual matches"
            value={summary.totalMutualMatches}
            icon={<Heart className="h-5 w-5" />}
            color="pink"
          />
        </div>
      )}

      {/* Filters */}
      <AdminTabs
        tabs={tabs}
        activeTab={activeFilter}
        onTabChange={(id) => { setActiveFilter(id as FilterType); setPage(1); }}
      >
        <AdminSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
          placeholder="Search by name, email, VR ID..."
        >
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="female">Brides</option>
            <option value="male">Grooms</option>
          </select>
        </AdminSearchFilter>
      </AdminTabs>

      {/* Table */}
      {loading ? (
        <AdminTableSkeleton rows={10} columns={9} />
      ) : profiles.length === 0 ? (
        <AdminEmptyState
          icon={<Heart className="h-12 w-12" />}
          title="No Profiles Found"
          description={activeFilter === 'all' ? 'No profiles match your search criteria.' : `No profiles found for the "${activeFilter}" filter.`}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Matches
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('interestsReceived')}
                    >
                      <div className="flex items-center gap-1">
                        <Inbox className="h-3.5 w-3.5" />
                        Received
                        {sortBy === 'interestsReceived' && <ArrowUpDown className="h-3 w-3" />}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('interestsSent')}
                    >
                      <div className="flex items-center gap-1">
                        <Send className="h-3.5 w-3.5" />
                        Sent
                        {sortBy === 'interestsSent' && <ArrowUpDown className="h-3 w-3" />}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('mutualMatches')}
                    >
                      <div className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        Mutual
                        {sortBy === 'mutualMatches' && <ArrowUpDown className="h-3 w-3" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" />
                        Declined
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-1">
                        <Flag className="h-3.5 w-3.5" />
                        Reports
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-amber-600 uppercase bg-amber-50" colSpan={3}>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        Lifetime Stats
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastLogin')}
                    >
                      <div className="flex items-center gap-1">
                        Last Login
                        {sortBy === 'lastLogin' && <ArrowUpDown className="h-3 w-3" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <th colSpan={7}></th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-amber-700">
                      <div className="flex items-center justify-center gap-1">
                        <Inbox className="h-3 w-3" />
                        Recv
                      </div>
                    </th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-amber-700">
                      <div className="flex items-center justify-center gap-1">
                        <Send className="h-3 w-3" />
                        Sent
                      </div>
                    </th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-amber-700">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3 w-3" />
                        Views
                      </div>
                    </th>
                    <th colSpan={2}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50">
                      {/* Profile */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-400">{profile.odNumber || '-'}</span>
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              profile.gender === 'female'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {profile.gender === 'female' ? 'B' : 'G'}
                            </span>
                          </div>
                          <a
                            href={adminLinks.editProfile(profile.user.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                          >
                            {profile.user.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="text-xs text-gray-500">{profile.currentLocation || '-'}</span>
                        </div>
                      </td>
                      {/* Potential Matches */}
                      <td className="px-4 py-3">
                        <a
                          href={adminLinks.matches(profile.user.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          <span className="font-semibold">{profile.stats.potentialMatches}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      {/* Interests Received */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <a
                            href={adminLinks.matches(profile.user.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-900 hover:text-primary-600 hover:underline"
                          >
                            {profile.stats.interestsReceived.total}
                          </a>
                          <div className="flex gap-1 text-xs">
                            <span className="text-yellow-600">{profile.stats.interestsReceived.pending}P</span>
                            <span className="text-green-600">{profile.stats.interestsReceived.accepted}A</span>
                            <span className="text-red-500">{profile.stats.interestsReceived.rejected}R</span>
                          </div>
                        </div>
                      </td>
                      {/* Interests Sent */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <a
                            href={adminLinks.matches(profile.user.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-900 hover:text-primary-600 hover:underline"
                          >
                            {profile.stats.interestsSent.total}
                          </a>
                          <div className="flex gap-1 text-xs">
                            <span className="text-yellow-600">{profile.stats.interestsSent.pending}P</span>
                            <span className="text-green-600">{profile.stats.interestsSent.accepted}A</span>
                            <span className="text-red-500">{profile.stats.interestsSent.rejected}R</span>
                          </div>
                        </div>
                      </td>
                      {/* Mutual Matches */}
                      <td className="px-4 py-3">
                        <a
                          href={adminLinks.connections(profile.user.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-semibold hover:underline ${profile.stats.mutualMatches > 0 ? 'text-pink-600 hover:text-pink-700' : 'text-gray-400'}`}
                        >
                          {profile.stats.mutualMatches}
                        </a>
                      </td>
                      {/* Declined */}
                      <td className="px-4 py-3">
                        <a
                          href={adminLinks.reconsider(profile.user.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-semibold hover:underline ${profile.stats.declined > 0 ? 'text-orange-600 hover:text-orange-700' : 'text-gray-400'}`}
                        >
                          {profile.stats.declined}
                        </a>
                      </td>
                      {/* Reports */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-sm">
                          <Link
                            href={`/admin/reports?userId=${profile.user.id}`}
                            className={`hover:underline ${profile.stats.reportsFiled + profile.stats.reportsReceived > 0 ? 'text-red-600' : 'text-gray-400'}`}
                          >
                            <span className="text-xs">Filed: {profile.stats.reportsFiled}</span>
                            <br />
                            <span className="text-xs">Recv: {profile.stats.reportsReceived}</span>
                          </Link>
                        </div>
                      </td>
                      {/* Lifetime Stats - Received */}
                      <td className="px-2 py-3 text-center bg-amber-50/30">
                        <span className={`font-semibold ${(profile.stats.lifetime?.interestsReceived || 0) > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                          {profile.stats.lifetime?.interestsReceived || 0}
                        </span>
                      </td>
                      {/* Lifetime Stats - Sent */}
                      <td className="px-2 py-3 text-center bg-amber-50/30">
                        <span className={`font-semibold ${(profile.stats.lifetime?.interestsSent || 0) > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                          {profile.stats.lifetime?.interestsSent || 0}
                        </span>
                      </td>
                      {/* Lifetime Stats - Profile Views */}
                      <td className="px-2 py-3 text-center bg-amber-50/30">
                        <span className={`font-semibold ${(profile.stats.lifetime?.profileViews || 0) > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                          {profile.stats.lifetime?.profileViews || 0}
                        </span>
                      </td>
                      {/* Last Login */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-600">{formatLastLogin(profile.user.lastLogin)}</span>
                          {getActivityStatus(profile.stats.daysSinceLastLogin)}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={adminLinks.matches(profile.user.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="View as this user"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={adminLinks.profile(profile.id, profile.user.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                            title="View Profile"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            itemsShown={profiles.length}
            itemLabel="profiles"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <span><strong>P</strong> = Pending</span>
          <span><strong>A</strong> = Accepted</span>
          <span><strong>R</strong> = Rejected</span>
          <span><strong>B</strong> = Bride</span>
          <span><strong>G</strong> = Groom</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <span><strong>Lifetime Stats</strong> = Total historical counts that never decrease (even when interests are withdrawn). Shows platform engagement value to users.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
