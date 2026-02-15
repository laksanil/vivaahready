'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Loader2, Star, Search, ChevronLeft, ChevronRight, MessageSquare, Eye, X, Phone, ExternalLink, Download, ShieldCheck, Users, BarChart3, Copy } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { maskPhone } from '@/lib/phone'

type FeedbackEntry = {
  id: string
  userId: string
  userPhone: string
  userPhoneLast4: string
  userName: string | null
  isVerified: boolean | null
  profileId: string | null
  matchesCount: number | null
  interestsSentCount: number | null
  interestsReceivedCount: number | null
  fromUrl: string | null
  submitUrl: string | null
  userAgent: string | null
  overallStars: number
  primaryIssue: string
  summaryText: string | null
  stepBData: string | null
  nps: number | null
  referralSource: string | null
  wantsFollowup: boolean
  followupContact: string | null
  followupTimeWindow: string | null
  severity: string | null
  issueTags: string | null
  screenshotUrl: string | null
  createdAt: string
}

type Summary = {
  totalFeedbackCount: number
  uniquePhonesCount: number
  verifiedUsersPct: number
  avgStars: number | null
}

const ISSUE_LABELS: Record<string, string> = {
  ease_of_use: 'Ease of Use',
  match_quality: 'Match Quality',
  profile_experience: 'Profile',
  communication: 'Communication',
  technical: 'Technical',
  pricing: 'Pricing',
  trust_safety: 'Trust & Safety',
  other: 'Other',
}

const ISSUE_COLORS: Record<string, string> = {
  ease_of_use: 'bg-blue-100 text-blue-700',
  match_quality: 'bg-purple-100 text-purple-700',
  profile_experience: 'bg-green-100 text-green-700',
  communication: 'bg-yellow-100 text-yellow-800',
  technical: 'bg-red-100 text-red-700',
  pricing: 'bg-orange-100 text-orange-700',
  trust_safety: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
}

function StarDisplay({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value === null || value === undefined) return <span className="text-gray-400 text-sm">-</span>
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{value}/{max}</span>
    </div>
  )
}

function VerifiedBadge({ isVerified }: { isVerified: boolean | null }) {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full" title="Verified user">
        <ShieldCheck className="h-3 w-3" /> Verified
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-xs text-gray-400 px-1.5 py-0.5 rounded-full bg-gray-50">
      Unverified
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      {copied ? <span className="text-xs text-green-600">Copied!</span> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function AdminFeedbackContent() {
  const searchParams = useSearchParams()
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [phoneFilter, setPhoneFilter] = useState(searchParams.get('phone') || '')
  const [issueFilter, setIssueFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(phoneFilter && { phone: phoneFilter }),
        ...(issueFilter && { issue: issueFilter }),
        ...(verifiedFilter && { verified: verifiedFilter }),
      })
      const res = await fetch(`/api/admin/feedback?${params}`)
      const data = await res.json()
      setFeedbacks(data.feedbacks || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || 0)
      if (data.summary) setSummary(data.summary)
    } catch (err) {
      console.error('Failed to fetch feedback:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, phoneFilter, issueFilter, verifiedFilter])

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchFeedbacks()
  }

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(searchQuery && { search: searchQuery }),
        ...(phoneFilter && { phone: phoneFilter }),
        ...(issueFilter && { issue: issueFilter }),
        ...(verifiedFilter && { verified: verifiedFilter }),
      })
      const res = await fetch(`/api/admin/feedback?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const parseJson = (str: string | null): any => {
    if (!str) return null
    try { return JSON.parse(str) } catch { return null }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary-600" />
          User Feedback
        </h1>
        <p className="text-gray-600 mt-1">All structured feedback from the 2-step feedback form.</p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
              <MessageSquare className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalFeedbackCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
              <Users className="h-3.5 w-3.5" /> Unique Users
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.uniquePhonesCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified %
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.verifiedUsersPct}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
              <BarChart3 className="h-3.5 w-3.5" /> Avg Rating
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.avgStars ?? '-'}</p>
          </div>
        </div>
      )}

      {/* Search + Filters + Export */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </form>
        <select
          value={issueFilter}
          onChange={(e) => { setIssueFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Issues</option>
          {Object.entries(ISSUE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={verifiedFilter}
          onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Users</option>
          <option value="true">Verified Only</option>
          <option value="false">Unverified Only</option>
        </select>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      </div>

      {/* Count */}
      <div className="mb-4 text-sm text-gray-600">
        {totalCount} feedback {totalCount === 1 ? 'entry' : 'entries'}{issueFilter || verifiedFilter || searchQuery || phoneFilter ? ' (filtered)' : ''}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No feedback yet</h3>
          <p className="text-gray-500 mt-1">User feedback will appear here once submitted.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">WhatsApp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Issue</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Summary</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">NPS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Follow-up</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{fb.userName || 'Unknown'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700 font-mono">{maskPhone(fb.userPhone)}</span>
                          <CopyButton text={fb.userPhone} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <VerifiedBadge isVerified={fb.isVerified} />
                      </td>
                      <td className="px-4 py-3">
                        <StarDisplay value={fb.overallStars} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ISSUE_COLORS[fb.primaryIssue] || 'bg-gray-100 text-gray-700'}`}>
                          {ISSUE_LABELS[fb.primaryIssue] || fb.primaryIssue}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-gray-700 truncate">{fb.summaryText || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        {fb.nps !== null ? (
                          <span className={`text-sm font-semibold ${fb.nps >= 9 ? 'text-green-600' : fb.nps >= 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {fb.nps}
                          </span>
                        ) : <span className="text-gray-400 text-sm">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {fb.wantsFollowup ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            <Phone className="h-3 w-3" /> Yes
                          </span>
                        ) : <span className="text-gray-400 text-xs">No</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(fb.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedFeedback(fb)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <Link
                            href={`/admin/feedback/${fb.id}`}
                            className="text-gray-600 hover:text-gray-900 text-sm"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedFeedback(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Feedback Details</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatDate(selectedFeedback.createdAt)}
                </p>
              </div>
              <button onClick={() => setSelectedFeedback(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* User Context Card */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">User Context</h3>
                  <VerifiedBadge isVerified={selectedFeedback.isVerified} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedFeedback.userName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">WhatsApp / Phone</p>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-sm font-medium font-mono text-gray-900">{selectedFeedback.userPhone}</p>
                      <CopyButton text={selectedFeedback.userPhone} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">User ID</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-mono text-gray-700 truncate max-w-[180px]">{selectedFeedback.userId}</p>
                      <CopyButton text={selectedFeedback.userId} />
                    </div>
                  </div>
                  {selectedFeedback.profileId && (
                    <div>
                      <p className="text-xs text-gray-500">Profile ID</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-mono text-gray-700 truncate max-w-[180px]">{selectedFeedback.profileId}</p>
                        <CopyButton text={selectedFeedback.profileId} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Matches</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedFeedback.matchesCount ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interests Sent</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedFeedback.interestsSentCount ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interests Received</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedFeedback.interestsReceivedCount ?? '-'}</p>
                  </div>
                </div>
                {/* Drill-down: all feedback from this phone */}
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedFeedback(null)
                      setPhoneFilter(selectedFeedback.userPhone)
                      setPage(1)
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View all feedback from this number
                  </button>
                </div>
              </div>

              {/* Issue Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ISSUE_COLORS[selectedFeedback.primaryIssue] || 'bg-gray-100 text-gray-700'}`}>
                  {ISSUE_LABELS[selectedFeedback.primaryIssue] || selectedFeedback.primaryIssue}
                </span>
              </div>

              {/* Overall + NPS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Overall Rating</h3>
                  <StarDisplay value={selectedFeedback.overallStars} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">NPS Score</h3>
                  {selectedFeedback.nps !== null ? (
                    <span className={`text-lg font-bold ${selectedFeedback.nps >= 9 ? 'text-green-600' : selectedFeedback.nps >= 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {selectedFeedback.nps}/10
                    </span>
                  ) : <span className="text-gray-400">Not provided</span>}
                </div>
              </div>

              {/* Summary */}
              {selectedFeedback.summaryText && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Summary</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{selectedFeedback.summaryText}</p>
                </div>
              )}

              {/* Step B Data */}
              {selectedFeedback.stepBData && (() => {
                const stepB = parseJson(selectedFeedback.stepBData)
                if (!stepB || Object.keys(stepB).length === 0) return null
                return (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Detailed Responses</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {Object.entries(stepB).map(([key, val]) => {
                        if (val === null || val === undefined || val === '') return null
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
                        const display = Array.isArray(val) ? (val as string[]).join(', ') : String(val)
                        return (
                          <div key={key} className="flex flex-col sm:flex-row sm:gap-2">
                            <span className="text-xs font-medium text-gray-600 min-w-[140px]">{label}:</span>
                            <span className="text-sm text-gray-900">{display}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Bug report extras */}
              {selectedFeedback.severity && (
                <div className="flex gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Severity</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${selectedFeedback.severity === 'major' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {selectedFeedback.severity}
                    </span>
                  </div>
                  {selectedFeedback.issueTags && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Issue Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {(parseJson(selectedFeedback.issueTags) || []).map((tag: string) => (
                          <span key={tag} className="inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Screenshot */}
              {selectedFeedback.screenshotUrl && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Screenshot</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedFeedback.screenshotUrl} alt="User screenshot" className="max-w-full rounded-lg border border-gray-200" />
                </div>
              )}

              {/* Referral + Follow-up */}
              <div className="grid grid-cols-2 gap-4">
                {selectedFeedback.referralSource && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Heard About Us</h3>
                    <p className="text-sm text-gray-900">{selectedFeedback.referralSource}</p>
                  </div>
                )}
                {selectedFeedback.wantsFollowup && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Wants Follow-up</h3>
                    <p className="text-sm text-gray-900">{selectedFeedback.followupContact || 'No contact provided'}</p>
                    {selectedFeedback.followupTimeWindow && (
                      <p className="text-xs text-gray-500">{selectedFeedback.followupTimeWindow}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Metadata</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  {selectedFeedback.fromUrl && (
                    <p className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> From: {selectedFeedback.fromUrl}</p>
                  )}
                  {selectedFeedback.userAgent && (
                    <p className="truncate" title={selectedFeedback.userAgent}>UA: {selectedFeedback.userAgent}</p>
                  )}
                  <p className="font-mono">Feedback ID: {selectedFeedback.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <AdminFeedbackContent />
    </Suspense>
  )
}
