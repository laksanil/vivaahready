/**
 * UTM Parameter utilities
 * Captures and manages campaign tracking across user session
 */

export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  utm_id?: string
}

const UTM_STORAGE_KEY = 'vivaah_utm_params'

/**
 * Parse UTM parameters from current URL
 */
export function parseUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_id: params.get('utm_id') || undefined,
  }
}

/**
 * Store UTM params in localStorage for persistence across pages
 */
export function storeUTMParams(params: UTMParams = parseUTMParams()): UTMParams {
  if (typeof window === 'undefined') return params

  // Only store if at least one UTM param exists
  const hasUTM = Object.values(params).some((v) => v)
  if (hasUTM) {
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params))
    } catch (e) {
      console.error('Failed to store UTM params:', e)
    }
  }

  return params
}

/**
 * Retrieve stored UTM params from localStorage
 */
export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error('Failed to retrieve UTM params:', e)
    return {}
  }
}

/**
 * Get UTM params from URL or storage (URL takes precedence)
 */
export function getUTMParams(): UTMParams {
  const urlParams = parseUTMParams()
  const hasURLUTM = Object.values(urlParams).some((v) => v)

  // If URL has UTM, store and return it
  if (hasURLUTM) {
    return storeUTMParams(urlParams)
  }

  // Otherwise return stored params
  return getStoredUTMParams()
}

/**
 * Clear stored UTM params
 */
export function clearUTMParams(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(UTM_STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear UTM params:', e)
  }
}

/**
 * Format UTM params for display (e.g., "google / cpc / signup")
 */
export function formatUTMLabel(params: UTMParams): string {
  const parts = [params.utm_source, params.utm_medium, params.utm_campaign].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : 'direct'
}
