'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import {
  Shield,
  Eye,
  X,
  ArrowLeft,
  User,
  Heart,
  Users,
  MessageCircle,
  RotateCcw,
  LayoutDashboard,
  Settings,
  ChevronDown,
} from 'lucide-react'

interface AdminViewBannerProps {
  userName?: string
  userId?: string
}

export default function AdminViewBanner({ userName, userId }: AdminViewBannerProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const viewAsUser = searchParams.get('viewAsUser') || userId
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewingUserName, setViewingUserName] = useState(userName || '')
  const [showNav, setShowNav] = useState(false)

  useEffect(() => {
    // Check if current user is admin
    fetch('/api/admin/check')
      .then(res => {
        if (res.ok) {
          setIsAdmin(true)
          // If we have viewAsUser but no userName, fetch the user's name
          if (viewAsUser && !userName) {
            fetch(`/api/admin/profiles?userId=${viewAsUser}`)
              .then(res => res.json())
              .then(data => {
                if (data.profiles?.[0]?.user?.name) {
                  setViewingUserName(data.profiles[0].user.name)
                }
              })
              .catch(() => {})
          }
        }
      })
      .catch(() => setIsAdmin(false))
  }, [viewAsUser, userName])

  // Don't show if not impersonating or not admin
  if (!viewAsUser || !isAdmin) return null

  // Build URL with viewAsUser preserved
  const buildUrl = (path: string) => {
    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}viewAsUser=${viewAsUser}`
  }

  // Navigation items for quick access
  const navItems = [
    { label: 'Dashboard', href: buildUrl('/dashboard'), icon: LayoutDashboard },
    { label: 'My Matches', href: buildUrl('/matches'), icon: Heart },
    { label: 'Connections', href: buildUrl('/connections'), icon: Users },
    { label: 'Profile', href: buildUrl('/profile'), icon: User },
    { label: 'Reconsider', href: buildUrl('/reconsider'), icon: RotateCcw },
    { label: 'Messages', href: buildUrl('/messages'), icon: MessageCircle },
  ]

  // Highlight current page
  const isActive = (href: string) => {
    const basePath = href.split('?')[0]
    return pathname === basePath
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Main Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left side - Admin info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm uppercase tracking-wide">Admin View</span>
              </div>
              <div className="h-6 w-px bg-white/30" />
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100">Viewing as</span>
                <span className="font-semibold">{viewingUserName || 'User'}</span>
              </div>
            </div>

            {/* Center - Quick Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* Mobile nav dropdown */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setShowNav(!showNav)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20"
                >
                  Navigate
                  <ChevronDown className={`h-4 w-4 transition-transform ${showNav ? 'rotate-180' : ''}`} />
                </button>
                {showNav && (
                  <div className="absolute top-full right-0 mt-1 bg-gray-900 rounded-lg shadow-xl py-2 min-w-[160px]">
                    {navItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setShowNav(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm ${
                          isActive(item.href)
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Back to Admin */}
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
