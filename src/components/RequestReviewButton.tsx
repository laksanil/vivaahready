'use client'

import { useState } from 'react'
import { UserCheck, Loader2, CheckCircle, Mail } from 'lucide-react'

interface RequestReviewButtonProps {
  matchCount: number
  onSuccess?: () => void
}

export function RequestReviewButton({
  matchCount,
  onSuccess,
}: RequestReviewButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only show if user has few matches
  if (matchCount >= 5) {
    return null
  }

  const handleRequest = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/profile/request-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsSubmitted(true)
        onSuccess?.()
      } else {
        setError(data.error || 'Failed to submit request. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="font-semibold text-green-900 mb-1">Request Submitted!</h3>
        <p className="text-sm text-green-700">
          We'll review your profile and send you personalized suggestions within 24-48 hours.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
          <UserCheck className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Get Personalized Help
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Our team can review your profile and preferences to help you find more compatible matches.
            We'll send you personalized suggestions within 24-48 hours.
          </p>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRequest}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Request Profile Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
