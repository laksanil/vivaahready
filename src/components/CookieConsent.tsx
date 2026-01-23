'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the notice
    const dismissed = localStorage.getItem('cookie-notice-dismissed')
    if (!dismissed) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setShowBanner(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismissNotice = () => {
    localStorage.setItem('cookie-notice-dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 pr-8">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-900">We respect your privacy.</span>{' '}
              We only use essential cookies to keep you signed in — no tracking, no ads, no third-party analytics.{' '}
              <Link href="/privacy" className="text-primary-600 hover:underline font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={dismissNotice}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
          <button
            onClick={dismissNotice}
            className="absolute top-3 right-3 md:hidden p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close notice"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
