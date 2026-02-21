'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Heart, Bell,
  User, Settings, Shield, Menu, X, LogOut,
  Send, Inbox, RotateCcw, Headphones, Coffee,
} from 'lucide-react'
import DeleteProfileModal from './DeleteProfileModal'

// Pages where sidebar should appear (authenticated user pages)
const SIDEBAR_PATHS = [
  '/dashboard', '/matches', '/connections', '/notifications',
  '/admin-messages', '/profile', '/settings', '/feedback',
  '/reconsider', '/search', '/get-verified', '/verify',
  '/verify-email', '/community',
]

export function isSidebarPage(pathname: string | null): boolean {
  if (!pathname) return false
  return SIDEBAR_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

interface NavItem {
  icon: typeof Heart
  label: string
  href: string
  countKey?: 'matches' | 'sent' | 'received' | 'connections' | 'reconsider' | 'notifications'
  match?: (pathname: string, searchParams?: URLSearchParams | null) => boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: '',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', match: p => p === '/dashboard' },
    ],
  },
  {
    label: 'Matching',
    items: [
      {
        icon: Users, label: 'My Matches', href: '/matches', countKey: 'matches',
        match: (p, sp) => p === '/matches' && sp?.get('tab') !== 'sent' && sp?.get('tab') !== 'received',
      },
      { icon: Send, label: 'Sent Interest', href: '/matches?tab=sent', countKey: 'sent', match: (p, sp) => p === '/matches' && sp?.get('tab') === 'sent' },
      { icon: Inbox, label: 'Interest Received', href: '/matches?tab=received', countKey: 'received', match: (p, sp) => p === '/matches' && sp?.get('tab') === 'received' },
      { icon: Heart, label: 'Connections', href: '/connections', countKey: 'connections', match: p => p === '/connections' || p.startsWith('/connections/') },
      { icon: RotateCcw, label: 'Reconsider', href: '/reconsider', countKey: 'reconsider', match: p => p === '/reconsider' },
    ],
  },
  {
    label: 'Engage',
    items: [
      { icon: Coffee, label: 'Community Forum', href: '/community', match: p => p === '/community' || p.startsWith('/community/') },
      { icon: Bell, label: 'Notifications', href: '/notifications', countKey: 'notifications', match: p => p === '/notifications' },
      { icon: Headphones, label: 'Support Messages', href: '/admin-messages', match: p => p === '/admin-messages' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: User, label: 'My Profile', href: '/profile', match: p => p === '/profile' || p.startsWith('/profile/') },
      { icon: Shield, label: 'Get Verified', href: '/get-verified', match: p => p === '/get-verified' },
      { icon: Settings, label: 'Settings', href: '/settings', match: p => p === '/settings' },
    ],
  },
]

export default function UserSidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const viewAsUser = searchParams.get('viewAsUser')
  const isAdminViewMode = !!viewAsUser
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null)
  const [navCounts, setNavCounts] = useState({
    matches: 0,
    sent: 0,
    received: 0,
    connections: 0,
    reconsider: 0,
    notifications: 0,
  })

  // Build URLs preserving viewAsUser
  const buildUrl = useCallback((path: string) => {
    if (!viewAsUser) return path
    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}viewAsUser=${viewAsUser}`
  }, [viewAsUser])

  const buildApiUrl = useCallback((path: string) => {
    if (!viewAsUser) return path
    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}viewAsUser=${viewAsUser}`
  }, [viewAsUser])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Fetch profile display name
  useEffect(() => {
    if (session?.user && !viewAsUser) {
      fetch('/api/profile')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.firstName) setProfileDisplayName(data.firstName)
        })
        .catch(() => {})
    }
  }, [session, viewAsUser])

  // Fetch sidebar counts: matches, sent, received, connections, reconsider, notifications
  const fetchNavCounts = useCallback(async () => {
    try {
      const [autoRes, sentRes, receivedRes, reconsiderRes, notificationsRes] = await Promise.all([
        fetch(buildApiUrl('/api/matches/auto')),
        fetch(buildApiUrl('/api/matches?type=sent')),
        fetch(buildApiUrl('/api/matches?type=received')),
        fetch(buildApiUrl('/api/matches/decline')),
        fetch(buildApiUrl('/api/notifications?limit=1')),
      ])

      let matches = 0
      let connections = 0
      let sent = 0
      let received = 0
      let reconsider = 0
      let notifications = 0

      if (autoRes.ok) {
        const autoData = await autoRes.json()
        matches = Array.isArray(autoData.freshMatches) ? autoData.freshMatches.length : 0
        connections = Array.isArray(autoData.mutualMatches) ? autoData.mutualMatches.length : 0
      }

      if (sentRes.ok) {
        const sentData = await sentRes.json()
        sent = Array.isArray(sentData.matches) ? sentData.matches.length : 0
      }

      if (receivedRes.ok) {
        const receivedData = await receivedRes.json()
        received = Array.isArray(receivedData.matches) ? receivedData.matches.length : 0
      }

      if (reconsiderRes.ok) {
        const reconsiderData = await reconsiderRes.json()
        reconsider = Array.isArray(reconsiderData.profiles) ? reconsiderData.profiles.length : 0
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json()
        notifications = typeof notificationsData.unreadCount === 'number' ? notificationsData.unreadCount : 0
      }

      setNavCounts({ matches, sent, received, connections, reconsider, notifications })
    } catch {
      // Silent failure keeps sidebar usable
    }
  }, [buildApiUrl])

  useEffect(() => {
    if (status === 'loading') return
    if (!session && !isAdminViewMode) return
    fetchNavCounts()
    const interval = setInterval(fetchNavCounts, 30000)
    return () => clearInterval(interval)
  }, [status, session, isAdminViewMode, fetchNavCounts, pathname])

  // Don't render on public pages, admin pages, or when not authenticated
  if (!isSidebarPage(pathname)) return null
  if (pathname?.startsWith('/admin/') || pathname === '/admin') return null
  if (status === 'loading') return null
  if (!session && !isAdminViewMode) return null

  const displayName = profileDisplayName || session?.user?.name?.split(' ')[0] || 'User'

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar toggle button - fixed in the header area */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-3 right-3 z-50 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar - sits below the header on desktop (top-16 = 64px) */}
      <aside
        className={`fixed left-0 z-30 bg-primary-600 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 w-64 flex flex-col
          top-16 h-[calc(100vh-4rem)]`}
      >

        {/* Main Nav with sections */}
        <nav className="flex-1 mt-2 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {/* Section divider + label */}
              {section.label && (
                <div className="px-6 pt-4 pb-1.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{section.label}</p>
                </div>
              )}
              {section.items.map(item => {
                const isActive = item.match ? item.match(pathname || '', searchParams) : pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={buildUrl(item.href)}
                    className={`flex items-center px-6 py-2.5 text-white/90 hover:bg-white/10 transition-colors relative ${
                      isActive ? 'bg-white/20 text-white font-semibold' : ''
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                    {item.countKey && navCounts[item.countKey] > 0 && (
                      <span className="ml-auto text-[11px] bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">
                        {navCounts[item.countKey]}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer: User info + actions */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-white/50 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isAdminViewMode && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white/90 rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            )}
            {isAdminViewMode && (
              <Link
                href="/admin"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white/90 rounded-lg hover:bg-white/20 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Back to Admin
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Delete Profile Modal */}
      <DeleteProfileModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {}}
      />
    </>
  )
}
