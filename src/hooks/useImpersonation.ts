'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Hook for managing admin impersonation state on client pages.
 * Provides utilities for building URLs and fetching with viewAsUser preserved.
 */
export function useImpersonation() {
  const searchParams = useSearchParams()
  const viewAsUser = searchParams.get('viewAsUser')

  /**
   * Build a URL with viewAsUser parameter preserved.
   * Use this for internal navigation links.
   */
  const buildUrl = useCallback((path: string) => {
    if (!viewAsUser) return path
    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}viewAsUser=${viewAsUser}`
  }, [viewAsUser])

  /**
   * Build an API URL with viewAsUser parameter.
   * Use this for fetch calls to API routes.
   */
  const buildApiUrl = useCallback((url: string) => {
    if (!viewAsUser) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}viewAsUser=${viewAsUser}`
  }, [viewAsUser])

  /**
   * Wrapper around fetch that automatically includes viewAsUser.
   * Use this instead of fetch() for API calls that need impersonation support.
   */
  const impersonatedFetch = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    return fetch(buildApiUrl(url), options)
  }, [buildApiUrl])

  return {
    /** The user ID being impersonated, or null if not impersonating */
    viewAsUser,
    /** Whether admin is currently viewing as another user */
    isImpersonating: !!viewAsUser,
    /** Build a navigation URL with viewAsUser preserved */
    buildUrl,
    /** Build an API URL with viewAsUser preserved */
    buildApiUrl,
    /** Fetch wrapper that includes viewAsUser parameter */
    impersonatedFetch,
  }
}
