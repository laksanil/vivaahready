'use client'

import Link from 'next/link'
import { Lock, UserPlus, LogIn } from 'lucide-react'

interface BlurredOverlayProps {
  type: 'not-logged-in' | 'no-profile'
  className?: string
}

export default function BlurredOverlay({ type, className = '' }: BlurredOverlayProps) {
  const isLoggedIn = type === 'no-profile'

  return (
    <div
      className={`
        absolute inset-0 z-10
        bg-gradient-to-t from-white/95 via-white/80 to-transparent
        flex flex-col items-center justify-end pb-6 px-4
        ${className}
      `}
    >
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-3">
          <Lock className="w-6 h-6 text-primary-600" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isLoggedIn ? 'Complete Your Profile' : 'Sign In to View'}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          {isLoggedIn
            ? 'Create your profile to see full details and connect with matches'
            : 'Sign in or create an account to view profiles and find your match'}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {isLoggedIn ? (
            <Link
              href="/profile/create"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Complete Profile
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Smaller inline blur message for card views
export function BlurBadge({ type }: { type: 'not-logged-in' | 'no-profile' }) {
  const isLoggedIn = type === 'no-profile'

  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent">
      <Link
        href={isLoggedIn ? '/profile/create' : '/login'}
        className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        <Lock className="w-4 h-4" />
        {isLoggedIn ? 'Complete profile to view' : 'Sign in to view'}
      </Link>
    </div>
  )
}
