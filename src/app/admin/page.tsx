'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, UserCheck, Heart, Clock, Ban, AlertTriangle,
  ShieldCheck, ShieldOff, ArrowRight, Loader2, ExternalLink
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
  verified: number
  unverified: number
  recentProfiles: any[]
  // Referral stats
  referralStats?: Record<string, number>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
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
      href: '/admin/profiles?tab=pending',
      description: 'Profiles waiting for approval',
    },
    {
      label: 'Reported Problems',
      count: stats?.pendingReports || 0,
      icon: AlertTriangle,
      color: 'orange',
      href: '/admin/reports',
      description: 'User reports to review',
    },
    {
      label: 'Suspended Profiles',
      count: stats?.suspended || 0,
      icon: Ban,
      color: 'red',
      href: '/admin/profiles?tab=suspended',
      description: 'Currently suspended',
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

  const totalAttention = (stats?.pendingApproval || 0) + (stats?.pendingReports || 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {overviewItems.map((item) => {
            const colors = colorClasses[item.color]
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
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
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
            href="/admin/profiles?tab=pending"
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
            href="/admin/profiles?tab=verified"
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-700">Verified Profiles</span>
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

      {/* Referral Sources */}
      {stats?.referralStats && Object.keys(stats.referralStats).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Sources</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(stats.referralStats).map(([source, count]) => {
                const label = source === 'whatsapp' ? 'WhatsApp' :
                              source === 'instagram' ? 'Instagram' :
                              source === 'facebook' ? 'Facebook' :
                              source === 'linkedin' ? 'LinkedIn' :
                              source === 'youtube' ? 'YouTube' :
                              source === 'google' ? 'Google Search' :
                              source === 'friend' ? 'Friend' :
                              source === 'family' ? 'Family/Relative' :
                              source === 'temple' ? 'Temple/Religious' :
                              source === 'community_event' ? 'Community Event' :
                              source === 'organization' ? 'Organization' :
                              source === 'advertisement' ? 'Advertisement' :
                              source === 'other' ? 'Other' :
                              source === 'unknown' ? 'Not specified' : source
                return (
                  <div key={source} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 capitalize">{label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

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
                      href={adminLinks.profile(profile.id, profile.user?.id)}
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
