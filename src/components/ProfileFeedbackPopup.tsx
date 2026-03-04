'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import StarRating from '@/components/StarRating'

const STORAGE_KEY = 'vivaah_profile_feedback_given'

interface ProfileFeedbackPopupProps {
  onClose: () => void
}

export default function ProfileFeedbackPopup({ onClose }: ProfileFeedbackPopupProps) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    onClose()
  }

  const handleSubmit = async () => {
    if (stars === 0 || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallStars: stars,
          primaryIssue: 'profile_experience',
          summaryText: comment.trim().slice(0, 140) || null,
          fromUrl: '/dashboard',
          submitUrl: '/dashboard',
          userAgent: navigator.userAgent,
        }),
      })
    } catch {
      // silent — don't block user
    }
    localStorage.setItem(STORAGE_KEY, 'true')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in">
          <div className="text-4xl mb-3">🙏</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Thank you!</h3>
          <p className="text-sm text-gray-500 mb-4">Your feedback helps us improve.</p>
          <button
            onClick={dismiss}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-800">Quick Feedback</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          How easy was it to create your profile?
        </p>

        <div className="flex justify-center mb-4">
          <StarRating value={stars} onChange={setStars} size="lg" label="Profile creation ease" />
        </div>

        {stars > 0 && (
          <>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any thoughts? (optional)"
              maxLength={140}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="flex-1 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </>
        )}

        {stars === 0 && (
          <p className="text-xs text-gray-400 text-center">
            Please select a rating to continue
          </p>
        )}
      </div>
    </div>
  )
}
