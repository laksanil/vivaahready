'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface ProfileCompletionStatus {
  isComplete: boolean
  hasProfile: boolean
  hasPhone: boolean
  hasPhotos: boolean
  profileId: string | null
}

/**
 * Component that checks if user has completed their profile
 * (has both phone and photos) and redirects to the photos page if not.
 *
 * This runs globally on all pages except explicitly excluded ones.
 */
export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Don't check if not authenticated
    if (sessionStatus === 'loading') return
    if (sessionStatus === 'unauthenticated') {
      setChecked(true)
      return
    }

    // Pages to skip - these should always be accessible
    const skipPages = [
      '/profile/photos',
      '/profile/create',
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

        // Redirect if:
        // 1. User has a profile (hasProfile is true)
        // 2. Profile is incomplete (missing phone or photos)
        if (data.hasProfile && !data.isComplete && data.profileId) {
          router.push(`/profile/photos?profileId=${data.profileId}&fromSignup=true`)
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

  // Always render children - the redirect happens asynchronously
  // This prevents flash of content before redirect
  return <>{children}</>
}
