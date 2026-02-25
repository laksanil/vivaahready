'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import {
  CheckCircle,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  User,
} from 'lucide-react'

type ResponseMethod = 'email' | 'sms' | 'whatsapp' | 'in_app'
type NeedsResponseFilter = 'all' | 'yes' | 'no'
type ResponseKindFilter = 'all' | 'email' | 'sms' | 'whatsapp' | 'in_app' | 'none'

interface SupportMessage {
  id: string
  userId: string | null
  name: string | null
  email: string | null
  phone: string | null
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

interface MessageSummary {
  newCount: number
  needsResponseCount: number
  repliedCount: number
  resolvedCount: number
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatContext(context: string | null): string {
  if (!context) return 'unknown'
  return context.replace(/_/g, ' ')
}

function needsResponse(message: SupportMessage): boolean {
  return message.status === 'new' || message.status === 'read'
}

function getAvailableResponseMethods(message: SupportMessage): ResponseMethod[] {
  const methods: ResponseMethod[] = ['in_app']
  if (message.email) methods.push('email')
  if (message.phone) {
    methods.push('sms')
    methods.push('whatsapp')
  }
  return methods
}

function parseChatHistory(history: string | null): Array<{ role: string; content: string }> {
  if (!history) return []
  try {
    const parsed = JSON.parse(history)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is { role: string; content: string } =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as { role?: string }).role === 'string' &&
        typeof (entry as { content?: string }).content === 'string'
    )
  } catch {
    return []
  }
}

interface ConversationEntry {
  role: 'user' | 'admin' | 'bot'
  content: string
  timestamp: string
  deliveryMethods?: string[]
}

function getConversationThread(message: SupportMessage): {
  chatbotHistory: Array<{ role: string; content: string }>
  thread: ConversationEntry[]
} {
  if (!message.chatHistory) {
    // Backward compat: build from adminResponse
    const thread: ConversationEntry[] = []
    if (message.adminResponse && message.respondedAt) {
      thread.push({ role: 'admin', content: message.adminResponse, timestamp: message.respondedAt })
    }
    return { chatbotHistory: [], thread }
  }

  try {
    const parsed = JSON.parse(message.chatHistory)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'thread' in parsed) {
      return {
        chatbotHistory: Array.isArray(parsed._chatbotHistory) ? parsed._chatbotHistory : [],
        thread: Array.isArray(parsed.thread) ? parsed.thread : [],
      }
    }
    if (Array.isArray(parsed)) {
      const thread: ConversationEntry[] = []
      if (message.adminResponse && message.respondedAt) {
        thread.push({ role: 'admin', content: message.adminResponse, timestamp: message.respondedAt })
      }
      return { chatbotHistory: parsed, thread }
    }
  } catch { /* ignore */ }

  return { chatbotHistory: [], thread: [] }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      {copied ? <span className="text-xs text-green-600">Copied</span> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'new':
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">New</span>
    case 'read':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Read</span>
    case 'replied':
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Replied</span>
    case 'resolved':
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">Resolved</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{status}</span>
  }
}

const STATUS_OPTIONS = ['all', 'new', 'read', 'replied', 'resolved'] as const
const CONTEXT_OPTIONS = ['all', 'contact_form', 'chatbot', 'marchevent'] as const

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [summary, setSummary] = useState<MessageSummary | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('all')
  const [contextFilter, setContextFilter] = useState<(typeof CONTEXT_OPTIONS)[number]>('all')
  const [needsResponseFilter, setNeedsResponseFilter] = useState<NeedsResponseFilter>('all')
  const [responseKindFilter, setResponseKindFilter] = useState<ResponseKindFilter>('all')

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyMethods, setReplyMethods] = useState<Record<string, ResponseMethod[]>>({})
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null)
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null)

  const fetchMessages = useCallback(async (showLoadingSpinner: boolean) => {
    if (showLoadingSpinner) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        context: contextFilter,
        needsResponse: needsResponseFilter,
        responseKind: responseKindFilter,
        search: searchQuery.trim(),
        limit: '150',
      })

      const res = await fetch(`/api/admin/messages?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      setMessages(data.messages || [])
      setTotal(data.total || 0)
      setSummary(data.summary || null)
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load messages'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [contextFilter, needsResponseFilter, responseKindFilter, searchQuery, statusFilter])

  useEffect(() => {
    fetchMessages(true)
  }, [fetchMessages])

  const updateStatus = async (messageId: string, nextStatus: 'new' | 'read' | 'replied' | 'resolved') => {
    setUpdatingMessageId(messageId)
    try {
      const res = await fetch('/api/admin/messages/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, status: nextStatus }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, status: nextStatus } : msg)))
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : 'Failed to update status'
      setError(message)
    } finally {
      setUpdatingMessageId(null)
    }
  }

  const sendResponse = async (messageId: string) => {
    const draft = (replyDrafts[messageId] || '').trim()
    if (!draft) return

    const message = messages.find((item) => item.id === messageId)
    if (!message) return

    const selected = replyMethods[messageId]
    const methods = selected && selected.length > 0 ? selected : ['in_app' as ResponseMethod]

    setSendingMessageId(messageId)
    setError(null)
    try {
      const res = await fetch('/api/admin/messages/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          response: draft,
          methods,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send response')
      }

      const nowIso = new Date().toISOString()
      const respondedVia = methods.join(', ')
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg
          // Update chatHistory with new admin entry
          const { chatbotHistory, thread } = getConversationThread(msg)
          thread.push({
            role: 'admin',
            content: draft,
            timestamp: nowIso,
            deliveryMethods: methods,
          })
          const updatedHistory = JSON.stringify({
            ...(chatbotHistory.length > 0 ? { _chatbotHistory: chatbotHistory } : {}),
            thread,
          })
          return {
            ...msg,
            status: 'replied',
            adminResponse: draft,
            respondedVia,
            respondedAt: nowIso,
            chatHistory: updatedHistory,
          }
        })
      )
      setReplyDrafts((prev) => ({ ...prev, [messageId]: '' }))

      if (data.warnings && data.warnings.length > 0) {
        setError(data.warnings.join('; '))
      }
    } catch (sendError) {
      const messageText = sendError instanceof Error ? sendError.message : 'Failed to send response'
      setError(messageText)
    } finally {
      setSendingMessageId(null)
    }
  }

  const toggleMessageDetails = (message: SupportMessage) => {
    const willOpen = selectedMessageId !== message.id
    setSelectedMessageId(willOpen ? message.id : null)

    if (!willOpen) return

    if (message.status === 'new') {
      void updateStatus(message.id, 'read')
    }

    if (!replyMethods[message.id]) {
      setReplyMethods((prev) => ({ ...prev, [message.id]: ['in_app'] }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const selectedMessage = messages.find((item) => item.id === selectedMessageId) || null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary-600" />
          Support Messages
        </h1>
        <p className="text-gray-600 mt-1">Contact and chatbot messages with response tracking.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-gray-500 text-xs font-semibold uppercase mb-1">New</div>
            <p className="text-2xl font-bold text-gray-900">{summary.newCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Needs Response</div>
            <p className="text-2xl font-bold text-amber-700">{summary.needsResponseCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Replied</div>
            <p className="text-2xl font-bold text-emerald-700">{summary.repliedCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Resolved</div>
            <p className="text-2xl font-bold text-gray-900">{summary.resolvedCount}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),180px,180px,180px,180px,auto] gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, phone, subject, message..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={contextFilter}
          onChange={(event) => setContextFilter(event.target.value as (typeof CONTEXT_OPTIONS)[number])}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Sources</option>
          <option value="contact_form">Contact Form</option>
          <option value="chatbot">Chatbot</option>
          <option value="marchevent">March Event</option>
        </select>

        <select
          value={needsResponseFilter}
          onChange={(event) => setNeedsResponseFilter(event.target.value as NeedsResponseFilter)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">Any Response State</option>
          <option value="yes">Needs Response</option>
          <option value="no">Responded/Resolved</option>
        </select>

        <select
          value={responseKindFilter}
          onChange={(event) => setResponseKindFilter(event.target.value as ResponseKindFilter)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">Any Response Kind</option>
          <option value="in_app">In-App</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="none">No Response Sent</option>
        </select>

        <button
          type="button"
          onClick={() => fetchMessages(false)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {total} message{total === 1 ? '' : 's'}
        {(statusFilter !== 'all' || contextFilter !== 'all' || needsResponseFilter !== 'all' || responseKindFilter !== 'all' || searchQuery.trim())
          ? ' (filtered)'
          : ''}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No messages found</h2>
          <p className="text-gray-600">Support and contact submissions will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Message</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Response Kind</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Response Sent On</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Received On</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {messages.map((message) => {
                  const isSelected = selectedMessageId === message.id
                  const availableMethods = getAvailableResponseMethods(message)
                  return (
                    <Fragment key={message.id}>
                      <tr key={message.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 align-top">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {message.name || 'Anonymous'}
                          </div>
                          <div className="mt-1 space-y-1">
                            {message.email && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                <span className="max-w-[220px] truncate">{message.email}</span>
                                <CopyButton text={message.email} />
                              </div>
                            )}
                            {message.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-mono">{message.phone}</span>
                                <CopyButton text={message.phone} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {formatContext(message.context)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-gray-700">
                          {message.subject || '-'}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-gray-700 max-w-[280px]">
                          <p className="max-h-10 overflow-hidden">{message.message}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1">
                            <StatusBadge status={message.status} />
                            {needsResponse(message) ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                Needs response
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Responded
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-700 uppercase">
                          {message.respondedVia || '-'}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-600 whitespace-nowrap">
                          {formatDateTime(message.respondedAt)}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDateTime(message.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleMessageDetails(message)}
                              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              {isSelected ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {isSelected ? 'Hide' : 'View'}
                            </button>
                            {message.status === 'new' && (
                              <button
                                type="button"
                                onClick={() => updateStatus(message.id, 'read')}
                                disabled={updatingMessageId === message.id}
                                className="text-xs px-2 py-1 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                              >
                                Mark Read
                              </button>
                            )}
                            {message.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => updateStatus(message.id, 'resolved')}
                                disabled={updatingMessageId === message.id}
                                className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isSelected && selectedMessage && selectedMessage.id === message.id && (
                        <tr className="bg-gray-50/60">
                          <td className="px-4 py-4" colSpan={9}>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              <div className="space-y-4">
                                {/* Conversation Thread */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversation</h3>
                                  <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {/* Original user message */}
                                    <div className="flex items-start gap-2">
                                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <User className="h-3.5 w-3.5 text-gray-600" />
                                      </div>
                                      <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">{message.name || 'User'}</p>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(message.createdAt)}</p>
                                      </div>
                                    </div>

                                    {/* Thread entries */}
                                    {(() => {
                                      const { thread } = getConversationThread(message)
                                      return thread.map((entry, idx) => {
                                        if (entry.role === 'user') {
                                          return (
                                            <div key={idx} className="flex items-start gap-2">
                                              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <User className="h-3.5 w-3.5 text-gray-600" />
                                              </div>
                                              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                                <p className="text-xs font-semibold text-gray-500 mb-1">{message.name || 'User'}</p>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatDateTime(entry.timestamp)}</p>
                                              </div>
                                            </div>
                                          )
                                        }
                                        if (entry.role === 'bot') {
                                          return (
                                            <div key={idx} className="flex items-start gap-2 justify-end">
                                              <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">AI Assistant</p>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                                                <p className="text-xs text-blue-400 mt-1">{formatDateTime(entry.timestamp)}</p>
                                              </div>
                                            </div>
                                          )
                                        }
                                        // admin
                                        return (
                                          <div key={idx} className="flex items-start gap-2 justify-end">
                                            <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                                              <p className="text-xs font-semibold text-green-700 mb-1">Admin</p>
                                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                                              <p className="text-xs text-green-500 mt-1">{formatDateTime(entry.timestamp)}</p>
                                            </div>
                                          </div>
                                        )
                                      })
                                    })()}

                                    {getConversationThread(message).thread.length === 0 && !message.adminResponse && (
                                      <div className="text-center py-2">
                                        <p className="text-xs text-amber-600">No responses yet</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Chatbot pre-escalation history (collapsible) */}
                                {(() => {
                                  const { chatbotHistory } = getConversationThread(message)
                                  if (chatbotHistory.length === 0) return null
                                  return (
                                    <details className="bg-white border border-gray-200 rounded-lg p-4">
                                      <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
                                        Chatbot History ({chatbotHistory.length} messages)
                                      </summary>
                                      <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                                        {chatbotHistory.map((chatItem, idx) => (
                                          <div
                                            key={`${message.id}-chat-${idx}`}
                                            className={`text-sm ${chatItem.role === 'user' ? 'text-blue-700' : 'text-gray-700'}`}
                                          >
                                            <span className="font-medium">{chatItem.role === 'user' ? 'User' : 'Bot'}:</span>{' '}
                                            {chatItem.content}
                                          </div>
                                        ))}
                                      </div>
                                    </details>
                                  )
                                })()}

                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Message Actions</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {message.status !== 'new' && (
                                      <button
                                        type="button"
                                        onClick={() => updateStatus(message.id, 'new')}
                                        disabled={updatingMessageId === message.id}
                                        className="text-xs px-2.5 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                                      >
                                        Mark New
                                      </button>
                                    )}
                                    {message.status !== 'read' && (
                                      <button
                                        type="button"
                                        onClick={() => updateStatus(message.id, 'read')}
                                        disabled={updatingMessageId === message.id}
                                        className="text-xs px-2.5 py-1.5 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                                      >
                                        Mark Read
                                      </button>
                                    )}
                                    {message.status !== 'resolved' && (
                                      <button
                                        type="button"
                                        onClick={() => updateStatus(message.id, 'resolved')}
                                        disabled={updatingMessageId === message.id}
                                        className="text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                      >
                                        Mark Resolved
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">

                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Send Response</h3>
                                    <textarea
                                      value={replyDrafts[message.id] || ''}
                                      onChange={(event) =>
                                        setReplyDrafts((prev) => ({ ...prev, [message.id]: event.target.value }))
                                      }
                                      placeholder="Type your response..."
                                      className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      rows={4}
                                    />
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                                      <div>
                                        <span className="text-sm text-gray-600 block mb-2">Send via:</span>
                                        <div className="flex flex-wrap gap-3">
                                          {([
                                            { value: 'in_app' as ResponseMethod, label: 'In-App', always: true },
                                            { value: 'email' as ResponseMethod, label: 'Email', always: false },
                                            { value: 'sms' as ResponseMethod, label: 'SMS', always: false },
                                            { value: 'whatsapp' as ResponseMethod, label: 'WhatsApp', always: false },
                                          ] as const).map((opt) => {
                                            if (!opt.always && !availableMethods.includes(opt.value)) return null
                                            const selected = replyMethods[message.id] || ['in_app']
                                            const isChecked = selected.includes(opt.value)
                                            return (
                                              <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() => {
                                                    setReplyMethods((prev) => {
                                                      const current = prev[message.id] || ['in_app']
                                                      const next = isChecked
                                                        ? current.filter((m) => m !== opt.value)
                                                        : [...current, opt.value]
                                                      return { ...prev, [message.id]: next.length > 0 ? next : ['in_app'] }
                                                    })
                                                  }}
                                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                {opt.label}
                                              </label>
                                            )
                                          })}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => sendResponse(message.id)}
                                        disabled={sendingMessageId === message.id || !(replyDrafts[message.id] || '').trim()}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap"
                                      >
                                        {sendingMessageId === message.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Send className="h-4 w-4" />
                                        )}
                                        Send Response
                                      </button>
                                    </div>
                                  </div>
                              </div>
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
        </div>
      )}
    </div>
  )
}
