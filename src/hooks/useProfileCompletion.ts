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
  reason: 'no_profile' | 'no_phone' | 'no_photos' | null
}

/**
 * Hook to check profile completion status and redirect if incomplete
 *
 * @param options.skipRedirect - If true, don't redirect (useful for pages that show the data)
 * @returns The profile completion status and loading state
 */
export function useProfileCompletion(options?: { skipRedirect?: boolean }) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't check if not authenticated
    if (sessionStatus === 'loading') return
    if (sessionStatus === 'unauthenticated') {
      setLoading(false)
      return
    }

    // Skip check on these pages to prevent redirect loops
    const skipPages = [
      '/profile/photos',
      '/profile/create',
      '/login',
      '/register',
      '/about',
      '/privacy',
      '/terms',
      '/',
    ]

    // Also skip admin pages
    if (pathname?.startsWith('/admin') || skipPages.includes(pathname || '')) {
      setLoading(false)
      return
    }

    const checkCompletion = async () => {
      try {
        const res = await fetch('/api/profile/completion-status')
        if (!res.ok) {
          setLoading(false)
          return
        }

        const data: ProfileCompletionStatus = await res.json()
        setCompletionStatus(data)

        // Redirect if profile is incomplete and skipRedirect is false
        if (!options?.skipRedirect && !data.isComplete && data.hasProfile) {
          // User has a profile but missing phone or photos - redirect to photos page
          router.push(`/profile/photos?profileId=${data.profileId}&fromSignup=true`)
        }
      } catch (error) {
        console.error('Error checking profile completion:', error)
      } finally {
        setLoading(false)
      }
    }

    checkCompletion()
  }, [session, sessionStatus, router, pathname, options?.skipRedirect])

  return { completionStatus, loading }
}
