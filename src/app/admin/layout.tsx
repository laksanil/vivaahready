'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Heart,
  Loader2, ShieldAlert, ClipboardCheck, LogOut, AlertTriangle,
  UserPlus, Trash2
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    return <>{children}</>
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
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <h1 className="text-xl font-bold text-white">VivaahReady</h1>
            <p className="text-gray-400 text-sm">Admin Panel</p>
          </div>

          <nav className="mt-6">
            <Link
              href="/admin"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            <Link
              href="/admin/approvals"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/approvals' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <ClipboardCheck className="h-5 w-5 mr-3" />
              Approvals
            </Link>
            <Link
              href="/admin/profiles"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/profiles' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              Profiles
            </Link>
            <Link
              href="/admin/matches"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/matches' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <Heart className="h-5 w-5 mr-3" />
              Matches
            </Link>
            <Link
              href="/admin/reports"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/reports' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <AlertTriangle className="h-5 w-5 mr-3" />
              Reports
            </Link>
            <Link
              href="/admin/deletions"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/deletions' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <Trash2 className="h-5 w-5 mr-3" />
              Deletion Requests
            </Link>

            <div className="mt-4 mx-4 border-t border-gray-700 pt-4">
              <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tools</p>
            </div>
            <Link
              href="/admin/profiles/create"
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === '/admin/profiles/create' ? 'bg-gray-800 text-white' : ''
              }`}
            >
              <UserPlus className="h-5 w-5 mr-3" />
              Create Profile
            </Link>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-5 w-5" />
                  Logout
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
