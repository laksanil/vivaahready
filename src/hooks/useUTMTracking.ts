/**
 * Hook to initialize UTM tracking on page load
 * Call this in your root layout or page component
 */

'use client'

import { useEffect } from 'react'
import { storeUTMParams, getUTMParams, formatUTMLabel } from '@/lib/utm'

export function useUTMTracking() {
  useEffect(() => {
    // Capture UTM params on first landing
    const params = storeUTMParams()
    
    if (Object.values(params).some((v) => v)) {
      console.debug('UTM tracked:', formatUTMLabel(params))
    }
  }, [])

  return getUTMParams()
}
