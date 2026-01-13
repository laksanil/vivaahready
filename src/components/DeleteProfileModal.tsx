'use client'

import { useState } from 'react'
import { X, AlertTriangle, Heart, Loader2 } from 'lucide-react'

interface DeleteProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const DELETION_REASONS = [
  { value: 'marriage_vivaahready', label: 'Marriage Fixed via VivaahReady' },
  { value: 'marriage_other', label: 'Marriage Fixed via Other Sources' },
  { value: 'no_longer_looking', label: 'No Longer Looking' },
  { value: 'not_satisfied', label: 'Not Satisfied with Matches' },
  { value: 'privacy_concerns', label: 'Privacy Concerns' },
  { value: 'taking_break', label: 'Taking a Break' },
  { value: 'other', label: 'Other' },
]

export default function DeleteProfileModal({ isOpen, onClose, onSuccess }: DeleteProfileModalProps) {
  const [reason, setReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isMarriageReason = reason === 'marriage_vivaahready' || reason === 'marriage_other'

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason')
      return
    }

    if (reason === 'other' && !otherReason.trim()) {
      setError('Please provide a reason')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          otherReason: reason === 'other' ? otherReason.trim() : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (submitted) {
      onSuccess()
    }
    setReason('')
    setOtherReason('')
    setError('')
    setSubmitted(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Delete Profile</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4">
              {isMarriageReason ? (
                <>
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Congratulations!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We wish you a lifetime of happiness and love in your new journey together.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    Your deletion request has been submitted. Our team will process it within 24-48 hours.
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Request Submitted
                  </h3>
                  <p className="text-gray-600">
                    Your deletion request has been submitted. Our team will process it within 24-48 hours. You will receive a confirmation once your profile has been removed.
                  </p>
                </>
              )}

              <button
                onClick={handleClose}
                className="mt-6 btn-primary w-full"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Sorry Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800 mb-1">
                      We&apos;re Sorry to See You Go
                    </h3>
                    <p className="text-sm text-amber-700">
                      We understand that your journey may be taking a different path. Before you leave, please help us improve by sharing your reason for leaving.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for leaving <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value)
                      setError('')
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a reason...</option>
                    {DELETION_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Congratulations for marriage */}
                {isMarriageReason && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-pink-700">
                      <Heart className="h-5 w-5 text-pink-500" />
                      <span className="font-medium">Congratulations on finding your life partner!</span>
                    </div>
                    <p className="text-sm text-pink-600 mt-1">
                      We wish you a lifetime of happiness and love in your new journey together.
                    </p>
                  </div>
                )}

                {/* Other reason text area */}
                {reason === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Please specify <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={otherReason}
                      onChange={(e) => {
                        setOtherReason(e.target.value)
                        setError('')
                      }}
                      rows={3}
                      placeholder="Tell us why you're leaving..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <p className="text-sm text-gray-500">
                  Your profile will be submitted for deletion and our team will process your request within 24-48 hours.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
