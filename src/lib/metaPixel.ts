/**
 * Server-side Meta Pixel tracking (no cookies, no client-side pixel)
 * Events are sent from the client to the backend, then forwarded to Meta's Conversions API
 */

import { getUTMParams, UTMParams } from './utm'

interface TrackEventParams {
  event_name: string
  event_id?: string
  utm_params?: UTMParams
  user_data?: {
    em?: string
    ph?: string
    ge?: string
    db?: string
    ln?: string
    fn?: string
    ct?: string
    st?: string
    zp?: string
    country?: string
  }
  custom_data?: {
    value?: number
    currency?: string
    content_name?: string
    content_type?: string
    content_ids?: string[]
  }
  event_source_url?: string
}

/**
 * Track an analytics event via server-side endpoint
 */
export async function trackEvent(params: TrackEventParams): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    // Auto-include UTM params if not explicitly provided
    const utm_params = params.utm_params || getUTMParams()

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        utm_params,
        event_source_url: params.event_source_url || window.location.href,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Failed to track event:', error)
    return false
  }
}

/**
 * Track a page view
 */
export async function pageView() {
  return trackEvent({
    event_name: 'PageView',
    event_id: `pageview-${Date.now()}`,
    custom_data: {
      content_name: document.title,
    },
  })
}

/**
 * Track a purchase/subscription event
 */
export async function trackPurchase(value: number, currency = 'USD') {
  return trackEvent({
    event_name: 'Purchase',
    custom_data: {
      value,
      currency,
    },
  })
}

/**
 * Track a sign-up event
 */
export async function trackSignUp() {
  return trackEvent({
    event_name: 'SignUp',
  })
}

/**
 * Track a view content event (profile, match)
 */
export async function trackViewContent(contentId: string, contentName: string) {
  return trackEvent({
    event_name: 'ViewContent',
    custom_data: {
      content_type: 'product',
      content_ids: [contentId],
      content_name: contentName,
    },
  })
}

export default {
  trackEvent,
  pageView,
  trackPurchase,
  trackSignUp,
  trackViewContent,
}

/**
 * Track a page view
 */
export async function pageView() {
  return trackEvent({
    event_name: 'PageView',
    event_id: `pageview-${Date.now()}`,
    custom_data: {
      content_name: document.title,
    },
  })
}

/**
 * Track a purchase/subscription event
 */
export async function trackPurchase(value: number, currency = 'USD') {
  return trackEvent({
    event_name: 'Purchase',
    custom_data: {
      value,
      currency,
    },
  })
}

/**
 * Track a sign-up event
 */
export async function trackSignUp() {
  return trackEvent({
    event_name: 'SignUp',
  })
}

/**
 * Track a view content event (profile, match)
 */
export async function trackViewContent(contentId: string, contentName: string) {
  return trackEvent({
    event_name: 'ViewContent',
    custom_data: {
      content_type: 'product',
      content_ids: [contentId],
      content_name: contentName,
    },
  })
}

export default {
  trackEvent,
  pageView,
  trackPurchase,
  trackSignUp,
  trackViewContent,
}

