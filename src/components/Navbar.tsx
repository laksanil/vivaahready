'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Menu, X, User, LogOut, Heart, Users, Settings, MessageCircle, Eye, Trash2, Edit } from 'lucide-react'
import DeleteProfileModal from './DeleteProfileModal'

export function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const viewAsUser = searchParams.get('viewAsUser')
  const [viewedUserName, setViewedUserName] = useState<string | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null)

  // Helper to build URLs with viewAsUser preserved
  const buildUrl = useCallback((path: string) => {
    if (!viewAsUser) return path
    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}viewAsUser=${viewAsUser}`
  }, [viewAsUser])

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

  // Fetch user's profile to get the correct display name (firstName from profile)
  useEffect(() => {
    if (session?.user && !viewAsUser) {
      fetch('/api/profile')
        .then(res => {
          if (res.ok) return res.json()
          return null
        })
        .then(data => {
          if (data?.firstName) {
            setProfileDisplayName(data.firstName)
          }
        })
        .catch(() => {})
    }
  }, [session, viewAsUser])

  // Don't show navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Don't show navbar on photo upload page during signup flow
  const fromSignup = searchParams.get('fromSignup') === 'true'
  if (pathname === '/profile/photos' && fromSignup) {
    return null
  }

  const isAdminViewMode = !!viewAsUser

  return (
    <nav className="bg-primary-600 shadow-md sticky top-0 z-50">
      {/* Admin View Banner */}
      {isAdminViewMode && (
        <div className="bg-purple-600 text-white px-3 sm:px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Eye className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                Viewing as: <strong className="truncate">{viewedUserName || 'Loading...'}</strong>
              </span>
            </div>
            <Link
              href="/admin"
              className="text-xs sm:text-sm bg-white text-purple-600 px-2 sm:px-3 py-1 rounded font-medium hover:bg-purple-50 whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline">← </span>Exit
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href={session ? buildUrl('/dashboard') : "/"} className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <Image
                src="/logo-icon.png"
                alt="VivaahReady"
                width={120}
                height={120}
                className="h-10 w-auto"
                priority
              />
              <div className="flex flex-col">
                <span className="text-white text-xl font-bold tracking-tight">VivaahReady</span>
                <span className="text-white/70 text-[10px] tracking-wider uppercase hidden sm:block">Meaningful Connections</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {(session || isAdminViewMode) && (
              <>
                <Link href={buildUrl('/matches')} className="text-white/90 hover:text-white text-sm font-medium transition-colors px-2">
                  My Matches
                </Link>
                <Link href={buildUrl('/connections')} className="text-white/90 hover:text-white text-sm font-medium transition-colors px-2">
                  Connections
                </Link>
                <Link href={buildUrl('/profile')} className="text-white/90 hover:text-white text-sm font-medium transition-colors px-2">
                  Edit Profile
                </Link>
              </>
            )}
            {(session || isAdminViewMode) && (
              <Link href="/get-verified" className="text-white/90 hover:text-white text-sm font-medium transition-colors px-2">
                Get Verified
              </Link>
            )}
            <Link href="/about" className="text-white/90 hover:text-white text-sm font-medium transition-colors px-2">
              About
            </Link>
            <Link href="/contact" className="text-white/90 hover:text-white text-sm font-medium transition-colors px-2">
              Contact Us
            </Link>

            {status === 'loading' && !isAdminViewMode ? (
              <div className="h-8 w-8 rounded-full bg-white/30 animate-pulse" />
            ) : (session || isAdminViewMode) ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`flex items-center space-x-2 ${isAdminViewMode ? 'text-purple-200' : 'text-white'} hover:text-white/80`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isAdminViewMode ? 'bg-purple-100' : 'bg-white'}`}>
                    {isAdminViewMode ? (
                      <Eye className="h-4 w-4 text-purple-600" />
                    ) : (
                      <User className="h-4 w-4 text-primary-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {isAdminViewMode
                      ? (viewedUserName?.split(' ')[0] || 'Loading...')
                      : (profileDisplayName || session?.user?.name?.split(' ')[0] || 'User')
                    }
                  </span>
                  {isAdminViewMode && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin View</span>
                  )}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg py-1.5 border border-gray-100">
                    <Link
                      href={buildUrl('/dashboard')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      href={buildUrl('/profile')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                    <Link
                      href={buildUrl('/matches')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      My Matches
                    </Link>
                    <Link
                      href={buildUrl('/connections')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Connections
                    </Link>
                    <Link
                      href={buildUrl('/messages')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </Link>
                    {!isAdminViewMode && (
                      <>
                        <hr className="my-1.5 border-gray-100" />
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false)
                            setIsDeleteModalOpen(true)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Profile
                        </button>
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors shadow-sm">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-white/80 p-1"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {(session || isAdminViewMode) && (
              <>
                <Link
                  href={buildUrl('/matches')}
                  className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Matches
                </Link>
                <Link
                  href={buildUrl('/connections')}
                  className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connections
                </Link>
                <Link
                  href={buildUrl('/profile')}
                  className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Edit Profile
                </Link>
              </>
            )}
            {(session || isAdminViewMode) && (
              <Link
                href="/get-verified"
                className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Verified
              </Link>
            )}
            <Link
              href="/about"
              className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </Link>

            {(session || isAdminViewMode) ? (
              <>
                <hr className="my-2 border-gray-100" />
                <Link
                  href={buildUrl('/dashboard')}
                  className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href={buildUrl('/profile')}
                  className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
                {!isAdminViewMode && (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDeleteModalOpen(true)
                      }}
                      className="block w-full text-left text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg"
                    >
                      Delete Profile
                    </button>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <hr className="my-2 border-gray-100" />
                <Link
                  href="/login"
                  className="block bg-primary-600 text-white text-center py-2.5 rounded-lg font-semibold hover:bg-primary-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Profile Modal */}
      <DeleteProfileModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          // Optionally sign out after successful deletion request
        }}
      />
    </nav>
  )
}
