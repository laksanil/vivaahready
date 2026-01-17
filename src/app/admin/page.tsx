'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, UserCheck, Heart, Clock, Ban, AlertTriangle, Trash2,
  ShieldCheck, ShieldOff, ArrowRight, Loader2, ExternalLink, UserPlus,
  RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react'
import { adminLinks } from '@/lib/adminLinks'

interface Stats {
  totalProfiles: number
  brides: number
  grooms: number
  totalMatches: number
  pendingMatches: number
  // Attention required stats
  pendingApproval: number
  suspended: number
  pendingReports: number
  pendingDeletions: number
  verified: number
  unverified: number
  usersWithoutProfile: number
  recentProfiles: any[]
  // Referral stats
  referralStats?: Record<string, number>
  // Trend data
  trends?: {
    todayProfiles: number
    yesterdayProfiles: number
    todayMatches: number
    yesterdayMatches: number
  }
  // Oldest pending info
  oldestPending?: {
    approval: { date: string; daysSince: number } | null
    report: { date: string; daysSince: number } | null
    deletion: { date: string; daysSince: number } | null
  }
}

// Referral source labels and colors
const REFERRAL_CONFIG: Record<string, { label: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  instagram: { label: 'Instagram', color: '#E4405F' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  google: { label: 'Google Search', color: '#4285F4' },
  friend: { label: 'Friend', color: '#8B5CF6' },
  family: { label: 'Family', color: '#EC4899' },
  temple: { label: 'Temple/Religious', color: '#F59E0B' },
  community_event: { label: 'Community Event', color: '#10B981' },
  organization: { label: 'Organization', color: '#6366F1' },
  advertisement: { label: 'Advertisement', color: '#EF4444' },
  other: { label: 'Other', color: '#6B7280' },
  unknown: { label: 'Not specified', color: '#9CA3AF' },
}

// Simple SVG Pie Chart component
function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return null

  let cumulativePercent = 0
  const size = 200
  const center = size / 2
  const radius = 80

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent)
    const y = Math.sin(2 * Math.PI * percent)
    return [center + x * radius, center + y * radius]
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((item, index) => {
        if (item.value === 0) return null
        const percent = item.value / total
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent)
        cumulativePercent += percent
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent)
        const largeArcFlag = percent > 0.5 ? 1 : 0

        const pathData = [
          `M ${center} ${center}`,
          `L ${startX} ${startY}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          'Z',
        ].join(' ')

        return (
          <path
            key={index}
            d={pathData}
            fill={item.color}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{`${item.label}: ${item.value} (${(percent * 100).toFixed(1)}%)`}</title>
          </path>
        )
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchStats(true)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchStats = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true)
    }
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ''
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Updated just now'
    if (diffMins === 1) return 'Updated 1 minute ago'
    if (diffMins < 60) return `Updated ${diffMins} minutes ago`
    return `Updated at ${lastUpdated.toLocaleTimeString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const attentionItems = [
    {
      label: 'Pending Approvals',
      count: stats?.pendingApproval || 0,
      icon: Clock,
      color: 'yellow',
      href: '/admin/approvals',
      description: 'Profiles waiting for approval',
      oldestDays: stats?.oldestPending?.approval?.daysSince,
    },
    {
      label: 'Reported Problems',
      count: stats?.pendingReports || 0,
      icon: AlertTriangle,
      color: 'orange',
      href: '/admin/reports',
      description: 'User reports to review',
      oldestDays: stats?.oldestPending?.report?.daysSince,
    },
    {
      label: 'Deletion Requests',
      count: stats?.pendingDeletions || 0,
      icon: Trash2,
      color: 'red',
      href: '/admin/profiles?tab=deletions',
      description: 'Account deletions pending',
      oldestDays: stats?.oldestPending?.deletion?.daysSince,
    },
  ]

  const overviewItems = [
    {
      label: 'Total Profiles',
      count: stats?.totalProfiles || 0,
      icon: Users,
      color: 'blue',
      href: '/admin/profiles',
    },
    {
      label: 'Brides',
      count: stats?.brides || 0,
      icon: UserCheck,
      color: 'pink',
      href: '/admin/profiles?gender=female',
    },
    {
      label: 'Grooms',
      count: stats?.grooms || 0,
      icon: UserCheck,
      color: 'indigo',
      href: '/admin/profiles?gender=male',
    },
    {
      label: 'Total Matches',
      count: stats?.totalMatches || 0,
      icon: Heart,
      color: 'red',
      href: '/admin/matches',
    },
    {
      label: 'Verified',
      count: stats?.verified || 0,
      icon: ShieldCheck,
      color: 'green',
      href: '/admin/profiles?tab=verified',
    },
    {
      label: 'Unverified',
      count: stats?.unverified || 0,
      icon: ShieldOff,
      color: 'gray',
      href: '/admin/profiles?tab=unverified',
    },
  ]

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', iconBg: 'bg-yellow-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-700', iconBg: 'bg-pink-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
    green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-700', iconBg: 'bg-gray-100' },
  }

  const totalAttention = (stats?.pendingApproval || 0) + (stats?.pendingReports || 0) + (stats?.pendingDeletions || 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">{formatLastUpdated()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            Auto-refresh
          </label>
          {/* Manual refresh button */}
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Attention Required Section */}
      {totalAttention > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Requires Your Attention</h2>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
              {totalAttention}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {attentionItems.map((item) => {
              const colors = colorClasses[item.color]
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${colors.bg} rounded-xl p-5 border-2 border-transparent hover:border-${item.color}-300 transition-all group`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`${colors.iconBg} p-2 rounded-lg`}>
                          <item.icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <span className={`text-3xl font-bold ${colors.text}`}>{item.count}</span>
                      </div>
                      <p className={`font-medium ${colors.text} mt-2`}>{item.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      {/* Oldest pending badge */}
                      {item.oldestDays !== null && item.oldestDays !== undefined && item.count > 0 && (
                        <p className={`text-xs mt-2 ${item.oldestDays > 3 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          Oldest: {item.oldestDays === 0 ? 'Today' : item.oldestDays === 1 ? '1 day' : `${item.oldestDays} days`}
                        </p>
                      )}
                    </div>
                    <ArrowRight className={`h-5 w-5 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          {stats?.trends && (
            <div className="flex items-center gap-4 text-sm">
              {stats.trends.todayProfiles > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  {stats.trends.todayProfiles} new today
                </span>
              )}
              {stats.trends.todayMatches > 0 && (
                <span className="flex items-center gap-1 text-pink-600">
                  <Heart className="h-4 w-4" />
                  {stats.trends.todayMatches} matches today
                </span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {overviewItems.map((item) => {
            const colors = colorClasses[item.color]
            // Calculate trend for profiles and matches
            let trend = null
            if (item.label === 'Total Profiles' && stats?.trends) {
              const diff = stats.trends.todayProfiles - stats.trends.yesterdayProfiles
              if (diff !== 0) {
                trend = { diff, isPositive: diff > 0 }
              }
            } else if (item.label === 'Total Matches' && stats?.trends) {
              const diff = stats.trends.todayMatches - stats.trends.yesterdayMatches
              if (diff !== 0) {
                trend = { diff, isPositive: diff > 0 }
              }
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3">
                  <div className={`${colors.iconBg} p-2 rounded-lg`}>
                    <item.icon className={`h-4 w-4 ${colors.text}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                      {trend && (
                        <span className={`flex items-center text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {trend.isPositive ? '+' : ''}{trend.diff}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/approvals"
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-gray-700">Review Approvals</span>
          </Link>
          <Link
            href="/admin/reports"
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-gray-700">View Reports</span>
          </Link>
          <Link
            href="/admin/profiles/create"
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <UserPlus className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-700">Create Profile</span>
          </Link>
          <Link
            href="/admin/profiles?tab=suspended"
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <Ban className="h-5 w-5 text-red-600" />
            <span className="font-medium text-gray-700">Suspended Profiles</span>
          </Link>
        </div>
      </div>

      {/* Referral Sources with Pie Chart */}
      {stats?.referralStats && Object.keys(stats.referralStats).length > 0 && (() => {
        // Prepare data for pie chart
        const pieData = Object.entries(stats.referralStats)
          .map(([source, count]) => ({
            source,
            label: REFERRAL_CONFIG[source]?.label || source,
            value: count,
            color: REFERRAL_CONFIG[source]?.color || '#9CA3AF',
          }))
          .sort((a, b) => b.value - a.value)

        const total = pieData.reduce((sum, item) => sum + item.value, 0)

        return (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Sources</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Pie Chart */}
                <div className="flex-shrink-0">
                  <PieChart data={pieData} />
                </div>

                {/* Legend */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {pieData.map(({ source, label, value, color }) => {
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                      return (
                        <div key={source} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                            <p className="text-xs text-gray-500">{value} ({percent}%)</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">{total}</span> total profiles with referral data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Recent Profiles */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Profiles</h2>
          <Link href="/admin/profiles" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VR ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats?.recentProfiles?.map((profile: any) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-600">{profile.odNumber || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={adminLinks.editProfile(profile.user?.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                    >
                      {profile.user?.name || 'N/A'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      profile.gender === 'female'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {profile.gender === 'female' ? 'Bride' : 'Groom'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {profile.currentLocation || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      profile.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      profile.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {profile.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
