'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Heart,
  Loader2, ShieldAlert, ClipboardCheck, LogOut, AlertTriangle,
  UserPlus, Menu, X, Settings, Megaphone
} from 'lucide-react'
import { ToastProvider } from '@/components/Toast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Skip auth check for login page
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true) // Allow login page to render
      return
    }

    // Check admin auth via API
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check')
        setIsAuthenticated(response.ok)
        if (!response.ok) {
          router.push('/admin/login')
        }
      } catch {
        setIsAuthenticated(false)
        router.push('/admin/login')
      }
    }

    checkAuth()
  }, [pathname, router, isLoginPage])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch {
      setIsLoggingOut(false)
    }
  }

  // Show login page without layout
  if (isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>
  }

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to access the admin panel.</p>
          <Link href="/admin/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">VivaahReady</h1>
          <p className="text-gray-400 text-xs">Admin Panel</p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-40 h-screen bg-gray-900 transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 w-64`}
          role="navigation"
          aria-label="Admin navigation"
        >
          {/* Desktop Header */}
          <div className="hidden md:block p-6">
            <h1 className="text-xl font-bold text-white">VivaahReady</h1>
            <p className="text-gray-400 text-sm">Admin Panel</p>
          </div>

          {/* Mobile: Add padding for header */}
          <div className="md:hidden h-16" />

          <nav className="mt-6" role="menubar">
            <Link
              href="/admin"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" aria-hidden="true" />
              Dashboard
            </Link>
            <Link
              href="/admin/profiles"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/profiles' || pathname.startsWith('/admin/profiles/') && pathname !== '/admin/profiles/create' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <Users className="h-5 w-5 mr-3" aria-hidden="true" />
              Profiles
            </Link>
            <Link
              href="/admin/approvals"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/approvals' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <ClipboardCheck className="h-5 w-5 mr-3" aria-hidden="true" />
              Approvals
            </Link>
            <Link
              href="/admin/reports"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/reports' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <AlertTriangle className="h-5 w-5 mr-3" aria-hidden="true" />
              Reports
            </Link>
            <Link
              href="/admin/matches"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/matches' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <Heart className="h-5 w-5 mr-3" aria-hidden="true" />
              Matches
            </Link>

            <div className="mt-4 mx-4 border-t border-gray-700 pt-4">
              <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tools</p>
            </div>
            <Link
              href="/admin/profiles/create"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/profiles/create' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <UserPlus className="h-5 w-5 mr-3" aria-hidden="true" />
              Create Profile
            </Link>
            <Link
              href="/admin/announcements"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/announcements' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <Megaphone className="h-5 w-5 mr-3" aria-hidden="true" />
              Announcements
            </Link>
            <Link
              href="/admin/settings"
              role="menuitem"
              className={`flex items-center px-6 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/settings' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <Settings className="h-5 w-5 mr-3" aria-hidden="true" />
              Pricing Settings
            </Link>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Logout from admin panel"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  Logout
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  )
}
