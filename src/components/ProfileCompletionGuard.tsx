'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

interface ProfileCompletionStatus {
  isComplete: boolean
  hasProfile: boolean
  hasPhone: boolean
  hasPhotos: boolean
  signupStep: number
  profileId: string | null
  reason: string | null
}

/**
 * Component that checks if user has completed their profile
 * and redirects to the appropriate completion page if not.
 *
 * - If signup is incomplete (signupStep < 10), redirect to /profile/complete
 * - If only photos/phone missing, redirect to /profile/photos
 *
 * This runs globally on all pages except explicitly excluded ones.
 */
export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Don't check if not authenticated
    if (sessionStatus === 'loading') return
    if (sessionStatus === 'unauthenticated') {
      setChecked(true)
      return
    }

    // Pages to skip - these should always be accessible without profile completion
    const skipPages = [
      '/profile/photos',
      '/profile/create',
      '/profile/complete',
      '/login',
      '/register',
      '/about',
      '/privacy',
      '/terms',
      '/success-stories',
      '/pricing',
      '/search',
      '/',
    ]

    // Skip admin pages
    if (pathname?.startsWith('/admin')) {
      setChecked(true)
      return
    }

    // Skip explicitly excluded pages
    if (skipPages.includes(pathname || '')) {
      setChecked(true)
      return
    }

    // Skip API routes (they're handled server-side)
    if (pathname?.startsWith('/api')) {
      setChecked(true)
      return
    }

    const checkCompletion = async () => {
      try {
        const res = await fetch('/api/profile/completion-status')
        if (!res.ok) {
          setChecked(true)
          return
        }

        const data: ProfileCompletionStatus = await res.json()

        // Redirect if profile exists but is incomplete
        if (data.hasProfile && !data.isComplete && data.profileId) {
          setIsRedirecting(true)
          // If signup flow not finished (step < 10), redirect to complete profile page
          if (data.signupStep < 10) {
            router.replace(`/profile/complete?profileId=${data.profileId}&step=${data.signupStep}`)
            return
          }
          // Otherwise just missing photos/phone, redirect to photos page
          router.replace(`/profile/photos?profileId=${data.profileId}&fromSignup=true`)
          return
        }

        setChecked(true)
      } catch (error) {
        console.error('Error checking profile completion:', error)
        setChecked(true)
      }
    }

    checkCompletion()
  }, [sessionStatus, router, pathname])

  // Show loading while checking or redirecting to prevent flash of dashboard content
  if (sessionStatus === 'authenticated' && (!checked || isRedirecting)) {
    // Only show loader for protected pages that require completion check
    const protectedPaths = ['/dashboard', '/matches', '/connections', '/messages', '/profile/edit']
    const isProtectedPath = protectedPaths.some(p => pathname?.startsWith(p))

    if (isProtectedPath) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-silver-50 to-silver-100">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
