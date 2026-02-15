'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Copy, Loader2, Phone, ShieldCheck } from 'lucide-react'

type FeedbackDetail = {
  id: string
  userId: string
  userPhone: string
  userName: string | null
  isVerified: boolean | null
  profileId: string | null
  matchesCount: number | null
  interestsSentCount: number | null
  interestsReceivedCount: number | null
  primaryIssue: string
  summaryText: string | null
  stepBData: string | null
  createdAt: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      {copied ? <span className="text-xs text-green-600">Copied!</span> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export default function AdminFeedbackDetailPage() {
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/admin/feedback/${params.id}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to fetch feedback detail')
          return
        }
        setFeedback(data.feedback || null)
      } catch {
        setError('Failed to fetch feedback detail')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      load()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="p-6">
        <Link href="/admin/feedback" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Feedback
        </Link>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {error || 'Feedback not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Link href="/admin/feedback" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Feedback
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feedback Details</h1>
        <p className="text-sm text-gray-500 mt-1">{new Date(feedback.createdAt).toLocaleString()}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase">User Context</h2>
          {feedback.isVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Unverified
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-sm text-gray-900">{feedback.userName || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">WhatsApp / Phone</p>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-mono text-gray-900">{feedback.userPhone}</span>
              <CopyButton text={feedback.userPhone} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">User ID</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-700">{feedback.userId}</span>
              <CopyButton text={feedback.userId} />
            </div>
          </div>
          {feedback.profileId && (
            <div>
              <p className="text-xs text-gray-500">Profile ID</p>
              <p className="text-sm font-mono text-gray-700">{feedback.profileId}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500">Matches</p>
            <p className="text-sm font-semibold text-gray-900">{feedback.matchesCount ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Interests Sent</p>
            <p className="text-sm font-semibold text-gray-900">{feedback.interestsSentCount ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Interests Received</p>
            <p className="text-sm font-semibold text-gray-900">{feedback.interestsReceivedCount ?? '-'}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <Link
            href={`/admin/feedback?phone=${encodeURIComponent(feedback.userPhone)}`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all feedback from this number
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <div>
          <p className="text-xs text-gray-500">Primary Issue</p>
          <p className="text-sm text-gray-900">{feedback.primaryIssue}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Summary</p>
          <p className="text-sm text-gray-900">{feedback.summaryText || '-'}</p>
        </div>
      </div>
    </div>
  )
}
