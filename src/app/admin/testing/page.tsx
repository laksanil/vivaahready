'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Users,
  MapPin,
  Home,
  Heart,
  MessageCircle,
  Search,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'

interface RealUser {
  id: string
  odNumber: string | null
  gender: string
  name: string
  email: string
  approvalStatus: string
  currentLocation: string | null
}

const QA_CHECKLIST = [
  'Homepage loads correctly',
  'Google OAuth works',
  'Email/password login works',
  'Profile creation saves all fields',
  'Photo upload works',
  'Matches display correctly',
  'Match percentage calculates properly',
  'Like/Pass buttons work',
  'Mutual match modal appears',
  'Messaging works between matched users',
  'Profile visibility rules work',
  'Admin approval flow works',
  'Mobile responsive design',
  'Error states display properly',
  'Loading states show correctly',
]

export default function AdminTestingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // View as User state
  const [realUsers, setRealUsers] = useState<RealUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<'all' | 'male' | 'female'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // QA Checklist state
  const [showChecklist, setShowChecklist] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        setIsAdmin(true)
        fetchRealUsers()
      } else {
        router.push('/admin/login')
      }
    } catch {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchRealUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/profiles?limit=100')
      const data = await response.json()
      if (data.profiles) {
        setRealUsers(data.profiles.map((p: any) => ({
          id: p.user.id,
          odNumber: p.odNumber,
          gender: p.gender,
          name: p.user.name,
          email: p.user.email,
          approvalStatus: p.approvalStatus,
          currentLocation: p.currentLocation,
        })))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const filteredUsers = realUsers.filter(u => {
    const matchesGender = userFilter === 'all' || u.gender === userFilter
    const matchesSearch = !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.odNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesGender && matchesSearch
  })

  const toggleChecklistItem = (index: number) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedItems(newChecked)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Eye className="h-7 w-7 text-purple-600" />
          Testing Sandbox
        </h1>
        <p className="text-gray-500 mt-1">View the app as any user to test their experience</p>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-800">Admin Testing Mode</h3>
          <p className="text-sm text-amber-700 mt-1">
            Select a user below to view the app exactly as they would see it.
            Use the Quick Links to navigate to different pages while maintaining the user context.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Links (opens in new tab)</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/feed', label: 'Feed', icon: Heart },
            { href: '/dashboard', label: 'Dashboard', icon: Home },
            { href: '/connections', label: 'Connections', icon: Users },
            { href: '/search', label: 'Search', icon: Search },
            { href: '/messages', label: 'Messages', icon: MessageCircle },
            { href: '/profile', label: 'My Profile', icon: User },
          ].map((link) => {
            const Icon = link.icon
            const url = selectedUserId ? `${link.href}?viewAsUser=${selectedUserId}` : link.href
            return (
              <Link
                key={link.href}
                href={url}
                target="_blank"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedUserId
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => !selectedUserId && e.preventDefault()}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                {selectedUserId && <ExternalLink className="h-3 w-3" />}
              </Link>
            )
          })}
        </div>
        {!selectedUserId && (
          <p className="text-xs text-gray-400 mt-2">Select a user below to enable quick links</p>
        )}
      </div>

      {/* User Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select User to View As</h2>
            <p className="text-sm text-gray-500">{filteredUsers.length} users available</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
              />
            </div>
            {/* Gender Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Users</option>
              <option value="female">Brides Only</option>
              <option value="male">Grooms Only</option>
            </select>
            {/* Refresh */}
            <button
              onClick={fetchRealUsers}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                  selectedUserId === user.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      user.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                    }`}>
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.odNumber || 'No VR ID'}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.approvalStatus === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : user.approvalStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.approvalStatus}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.currentLocation || 'Location not set'}
                </div>
                {selectedUserId === user.id && (
                  <div className="mt-4 pt-4 border-t border-purple-200 flex gap-2">
                    <Link
                      href={`/feed?viewAsUser=${user.id}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                    >
                      <Heart className="h-4 w-4" />
                      View Matches
                    </Link>
                    <Link
                      href={`/dashboard?viewAsUser=${user.id}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                    >
                      <Home className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredUsers.length === 0 && !loadingUsers && (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* QA Checklist (Collapsible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setShowChecklist(!showChecklist)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div>
            <h3 className="font-semibold text-gray-900">QA Checklist</h3>
            <p className="text-sm text-gray-500">
              {checkedItems.size} of {QA_CHECKLIST.length} items completed
            </p>
          </div>
          {showChecklist ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showChecklist && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {QA_CHECKLIST.map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    checkedItems.has(idx)
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.has(idx)}
                    onChange={() => toggleChecklistItem(idx)}
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                  />
                  <span className={`text-sm ${checkedItems.has(idx) ? 'text-green-700' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
            {checkedItems.size === QA_CHECKLIST.length && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg text-center">
                <span className="text-green-700 font-medium">All QA checks completed!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
