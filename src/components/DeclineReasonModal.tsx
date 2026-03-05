'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface DeclineReasonModalProps {
  profileName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export default function DeclineReasonModal({ profileName, onConfirm, onCancel }: DeclineReasonModalProps) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Pass on {profileName}?</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Your feedback helps us refine your matches and show you better-suited profiles.
        </p>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="What didn't feel like a fit? (optional)"
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            {reason.trim() ? 'Submit & Pass' : 'Skip & Pass'}
          </button>
        </div>
      </div>
    </div>
  )
}
