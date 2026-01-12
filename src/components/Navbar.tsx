'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Menu, X, User, LogOut, Heart, Users, Settings, MessageCircle, Eye } from 'lucide-react'

export function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const viewAsUser = searchParams.get('viewAsUser')
  const [viewedUserName, setViewedUserName] = useState<string | null>(null)

  // Fetch viewed user's name when in admin view mode
  useEffect(() => {
    if (viewAsUser) {
      fetch(`/api/user/${viewAsUser}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setViewedUserName(data.name)
          }
        })
        .catch(() => {})
    } else {
      setViewedUserName(null)
    }
  }, [viewAsUser])

  // Don't show navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const isAdminViewMode = !!viewAsUser

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={session ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="font-display text-2xl font-semibold text-gray-900">
                Vivaah<span className="text-primary-600">Ready</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/matches" className="text-gray-600 hover:text-primary-600 transition-colors">
              My Matches
            </Link>
            <Link href="/messages" className="text-gray-600 hover:text-primary-600 transition-colors">
              Messages
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-primary-600 transition-colors">
              About Us
            </Link>

            {status === 'loading' ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`flex items-center space-x-2 ${isAdminViewMode ? 'text-purple-700' : 'text-gray-700'} hover:text-primary-600`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isAdminViewMode ? 'bg-purple-100' : 'bg-primary-100'}`}>
                    {isAdminViewMode ? (
                      <Eye className="h-5 w-5 text-purple-600" />
                    ) : (
                      <User className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                  <span className="font-medium">
                    {isAdminViewMode
                      ? (viewedUserName?.split(' ')[0] || 'Loading...')
                      : session.user.name?.split(' ')[0]
                    }
                  </span>
                  {isAdminViewMode && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin View</span>
                  )}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border">
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                    <Link
                      href="/matches"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      My Matches
                    </Link>
                    <Link
                      href="/messages"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-primary-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-4">
            <Link
              href="/matches"
              className="block text-gray-600 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              My Matches
            </Link>
            <Link
              href="/messages"
              className="block text-gray-600 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Messages
            </Link>
            <Link
              href="/about"
              className="block text-gray-600 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>

            {session ? (
              <>
                <hr />
                <Link
                  href="/dashboard"
                  className="block text-gray-600 hover:text-primary-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block text-gray-600 hover:text-primary-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <hr />
                <Link
                  href="/login"
                  className="block bg-red-500 text-white text-center py-2 rounded-lg hover:bg-red-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
