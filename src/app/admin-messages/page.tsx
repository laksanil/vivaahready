'use client'

import { useState, useEffect, Fragment, Suspense, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, Headphones, Clock, CheckCircle2, CircleDot,
  Mail, MessageSquare, ArrowLeft, ArrowUp, ArrowDown,
  Smartphone, Send as SendIcon, Bot,
} from 'lucide-react'

interface ConversationEntry {
  role: 'user' | 'admin' | 'bot'
  content: string
  timestamp: string
  deliveryMethods?: string[]
}

interface SupportMessage {
  id: string
  subject: string | null
  message: string
  context: string | null
  status: string
  adminResponse: string | null
  respondedAt: string | null
  respondedVia: string | null
  chatHistory: string | null
  createdAt: string
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'replied':
      return { label: 'Replied', icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-200' }
    case 'resolved':
      return { label: 'Resolved', icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'read':
      return { label: 'Under Review', icon: CircleDot, color: 'bg-amber-50 text-amber-700 border-amber-200' }
    default:
      return { label: 'Sent', icon: Clock, color: 'bg-gray-50 text-gray-600 border-gray-200' }
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

function getConversationThread(msg: SupportMessage): ConversationEntry[] {
  if (msg.chatHistory) {
    try {
      const parsed = JSON.parse(msg.chatHistory)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.thread) {
        return Array.isArray(parsed.thread) ? parsed.thread : []
      }
    } catch { /* ignore */ }
  }
  // Backward compat: legacy adminResponse only
  if (msg.adminResponse && msg.respondedAt) {
    return [{ role: 'admin', content: msg.adminResponse, timestamp: msg.respondedAt }]
  }
  return []
}

function ChatBubble({ entry, compact }: { entry: ConversationEntry; compact?: boolean }) {
  const sz = compact ? 'w-7 h-7' : 'w-8 h-8'
  const iconSz = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const px = compact ? 'px-4 py-3' : 'px-5 py-4'

  if (entry.role === 'user') {
    return (
      <div className="flex items-start gap-2 md:gap-3">
        <div className={`${sz} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <MessageSquare className={`${iconSz} text-gray-600`} />
        </div>
        <div className={`flex-1 bg-white rounded-xl rounded-tl-md ${px} border border-gray-200 shadow-sm`}>
          <p className="text-xs font-semibold text-gray-500 mb-1">You</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.content}</p>
          <p className="text-xs text-gray-400 mt-2">{formatDateTime(entry.timestamp)}</p>
        </div>
      </div>
    )
  }

  if (entry.role === 'bot') {
    return (
      <div className="flex items-start gap-2 md:gap-3 justify-end">
        <div className={`flex-1 bg-blue-50 rounded-xl rounded-tr-md ${px} border border-blue-200 shadow-sm`}>
          <p className="text-xs font-semibold text-blue-700 mb-1">VivaahReady Assistant</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.content}</p>
          <p className="text-xs text-blue-400 mt-2">{formatDateTime(entry.timestamp)}</p>
        </div>
        <div className={`${sz} rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Bot className={`${iconSz} text-white`} />
        </div>
      </div>
    )
  }

  // admin
  return (
    <div className="flex items-start gap-2 md:gap-3 justify-end">
      <div className={`flex-1 bg-green-50 rounded-xl rounded-tr-md ${px} border border-green-200 shadow-sm`}>
        <p className="text-xs font-semibold text-green-700 mb-1">Support Team</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.content}</p>
        <p className="text-xs text-green-500 mt-2">{formatDateTime(entry.timestamp)}</p>
      </div>
      <div className={`${sz} rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Headphones className={`${iconSz} text-white`} />
      </div>
    </div>
  )
}

function ConversationThread({
  msg,
  replyText,
  onReplyChange,
  onSendReply,
  sendingReply,
  compact,
}: {
  msg: SupportMessage
  replyText: string
  onReplyChange: (val: string) => void
  onSendReply: () => void
  sendingReply: boolean
  compact?: boolean
}) {
  const thread = getConversationThread(msg)
  const threadEndRef = useRef<HTMLDivElement>(null)
  const canReply = msg.status !== 'resolved'

  return (
    <div className="space-y-3">
      {/* Original message */}
      <ChatBubble
        entry={{ role: 'user', content: msg.message, timestamp: msg.createdAt }}
        compact={compact}
      />

      {/* Thread messages */}
      {thread.map((entry, idx) => (
        <ChatBubble key={idx} entry={entry} compact={compact} />
      ))}

      {/* Awaiting response (only if no thread at all) */}
      {thread.length === 0 && (
        <div className="flex items-start gap-2 md:gap-3 justify-end">
          <div className="flex-1 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200 text-center">
            <Clock className="h-4 w-4 mx-auto text-amber-400 mb-1" />
            <p className="text-xs text-amber-600">Awaiting response from our team</p>
          </div>
        </div>
      )}

      <div ref={threadEndRef} />

      {/* Reply input */}
      {canReply && (
        <div className="flex items-end gap-2 pt-2 border-t border-gray-200">
          <textarea
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={2}
          />
          <button
            onClick={onSendReply}
            disabled={sendingReply || !replyText.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap"
          >
            {sendingReply ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
      )}

      {msg.status === 'resolved' && (
        <div className="text-center py-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">This conversation has been resolved</span>
        </div>
      )}
    </div>
  )
}

function AdminMessagesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'date' | 'status'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [sendingReply, setSendingReply] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchMessages()
    }
  }, [session])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/support-messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching support messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendReply = async (messageId: string) => {
    const text = (replyTexts[messageId] || '').trim()
    if (!text) return

    setSendingReply(messageId)
    try {
      const res = await fetch('/api/support-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content: text }),
      })
      if (res.ok) {
        setReplyTexts(prev => ({ ...prev, [messageId]: '' }))
        await fetchMessages()
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingReply(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const toggleSort = (field: 'date' | 'status') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'date' ? 'desc' : 'asc')
    }
  }

  const sortedMessages = [...messages].sort((a, b) => {
    let cmp = 0
    if (sortField === 'date') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else {
      const statusOrder: Record<string, number> = { new: 0, read: 1, replied: 2, resolved: 3 }
      cmp = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }: { field: 'date' | 'status' }) => {
    if (sortField !== field) return <ArrowDown className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary-600" />
      : <ArrowDown className="h-3 w-3 text-primary-600" />
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) return null

  const repliedCount = messages.filter(m => m.status === 'replied' || m.status === 'resolved').length
  const pendingCount = messages.filter(m => m.status === 'new' || m.status === 'read').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-8 xl:px-10 py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 truncate">Support Messages</h1>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <SendIcon className="h-4 w-4" />
            Contact Support
          </Link>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          {messages.length > 0
            ? `${messages.length} message${messages.length !== 1 ? 's' : ''} \u2022 ${repliedCount} replied \u2022 ${pendingCount} awaiting response`
            : 'Your support conversations will appear here'}
        </p>

        {/* Messages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {messages.length === 0 ? (
            <div className="py-16 text-center">
              <Headphones className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Messages Yet</h3>
              <p className="text-gray-500 text-sm mb-6">
                When you contact our support team, your messages and responses will appear here.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                <SendIcon className="h-4 w-4" />
                Contact Support
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-gray-100">
                {sortedMessages.map((msg) => {
                  const statusInfo = getStatusInfo(msg.status)
                  const StatusIcon = statusInfo.icon
                  const isExpanded = expandedId === msg.id
                  return (
                    <div key={msg.id}>
                      <div
                        className="px-4 py-4 transition-colors cursor-pointer bg-white"
                        onClick={() => toggleExpand(msg.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {msg.subject || 'General Inquiry'}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{msg.message}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>Sent: {formatDate(msg.createdAt)}</span>
                          {msg.respondedAt && <span>Replied: {formatDate(msg.respondedAt)}</span>}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50 pt-3">
                          <ConversationThread
                            msg={msg}
                            replyText={replyTexts[msg.id] || ''}
                            onReplyChange={(val) => setReplyTexts(prev => ({ ...prev, [msg.id]: val }))}
                            onSendReply={() => sendReply(msg.id)}
                            sendingReply={sendingReply === msg.id}
                            compact
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full table-fixed divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-[30%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700">
                        Subject
                      </th>
                      <th className="w-[25%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700">
                        Message
                      </th>
                      <th
                        className="w-[15%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700 cursor-pointer select-none group"
                        onClick={() => toggleSort('status')}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Status <SortIcon field="status" />
                        </span>
                      </th>
                      <th
                        className="w-[15%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700 cursor-pointer select-none group"
                        onClick={() => toggleSort('date')}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Sent <SortIcon field="date" />
                        </span>
                      </th>
                      <th className="w-[15%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700">
                        Response
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedMessages.map((msg) => {
                      const statusInfo = getStatusInfo(msg.status)
                      const StatusIcon = statusInfo.icon
                      const isExpanded = expandedId === msg.id
                      return (
                        <Fragment key={msg.id}>
                          <tr
                            className="align-top transition-colors cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleExpand(msg.id)}
                          >
                            <td className="px-6 py-5">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {msg.subject || 'General Inquiry'}
                              </p>
                              {msg.context && (
                                <span className="inline-flex mt-1 text-xs text-gray-500 capitalize">
                                  {msg.context.replace(/_/g, ' ')}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <p className="text-sm text-gray-800">{formatDate(msg.createdAt)}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{timeAgo(msg.createdAt)}</p>
                            </td>
                            <td className="px-6 py-5">
                              {msg.adminResponse ? (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-green-700 font-medium">Replied</span>
                                  {msg.respondedVia && (
                                    <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
                                      {msg.respondedVia === 'email' ? <Mail className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Pending</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded conversation */}
                          {isExpanded && (
                            <tr className="bg-gray-50/60">
                              <td colSpan={5} className="px-6 py-5">
                                <div className="max-w-3xl mx-auto">
                                  <ConversationThread
                                    msg={msg}
                                    replyText={replyTexts[msg.id] || ''}
                                    onReplyChange={(val) => setReplyTexts(prev => ({ ...prev, [msg.id]: val }))}
                                    onSendReply={() => sendReply(msg.id)}
                                    sendingReply={sendingReply === msg.id}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-4 text-center">
          <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-800">
            Need help? Contact our support team
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <AdminMessagesContent />
    </Suspense>
  )
}
