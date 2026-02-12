'use client'

import { useState, useEffect } from 'react'
import {
  MessageCircle,
  Phone,
  Clock,
  CheckCircle,
  RefreshCw,
  Loader2,
  Send,
  User,
  ChevronDown,
  ChevronUp,
  Mail,
} from 'lucide-react'

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

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [response, setResponse] = useState('')
  const [responseMethod, setResponseMethod] = useState<'sms' | 'whatsapp'>('sms')
  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/messages?status=${statusFilter}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [statusFilter])

  const sendResponse = async (messageId: string) => {
    if (!response.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/messages/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          response,
          method: responseMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send')
      }

      // Update local state
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, status: 'replied', adminResponse: response, respondedVia: responseMethod, respondedAt: new Date().toISOString() }
            : m
        )
      )
      setResponse('')
      setSelectedMessage(null)
      alert('Response sent successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send response')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch('/api/admin/messages/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, status: 'read' }),
      })
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status: 'read' } : m))
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const parseChatHistory = (history: string | null): Array<{ role: string; content: string }> => {
    if (!history) return []
    try {
      return JSON.parse(history)
    } catch {
      return []
    }
  }

  const getStatusBadge = (status: string) => {
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
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Messages</h1>
          <p className="text-gray-600 text-sm mt-1">Respond to user inquiries via SMS or WhatsApp</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Messages</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            onClick={fetchMessages}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Messages</h2>
          <p className="text-gray-600">Support messages from the chatbot will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Message Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setSelectedMessage(selectedMessage === msg.id ? null : msg.id)
                  if (msg.status === 'new') markAsRead(msg.id)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{msg.name || 'Anonymous'}</span>
                        {getStatusBadge(msg.status)}
                        {msg.context && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                            {msg.context}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        {msg.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {msg.email}
                          </span>
                        )}
                        {msg.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {msg.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-2 line-clamp-2">{msg.message}</p>
                    </div>
                  </div>
                  {selectedMessage === msg.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedMessage === msg.id && (
                <div className="border-t border-gray-100 p-4">
                  {/* Full Message */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Message</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>

                  {/* Chat History */}
                  {msg.chatHistory && parseChatHistory(msg.chatHistory).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Chat History</h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                        {parseChatHistory(msg.chatHistory).map((chat, idx) => (
                          <div
                            key={idx}
                            className={`text-sm ${
                              chat.role === 'user' ? 'text-blue-700' : 'text-gray-600'
                            }`}
                          >
                            <strong>{chat.role === 'user' ? 'User' : 'Bot'}:</strong> {chat.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous Response */}
                  {msg.adminResponse && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Responded via {msg.respondedVia} on {msg.respondedAt ? new Date(msg.respondedAt).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-sm text-green-800">{msg.adminResponse}</p>
                    </div>
                  )}

                  {/* Response Form */}
                  {msg.status !== 'resolved' && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Send Response</h4>
                      <textarea
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                        placeholder="Type your response..."
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Send via:</span>
                          <select
                            value={responseMethod}
                            onChange={e => setResponseMethod(e.target.value as 'sms' | 'whatsapp')}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="sms">SMS</option>
                            <option value="whatsapp">WhatsApp</option>
                          </select>
                        </div>
                        <button
                          onClick={() => sendResponse(msg.id)}
                          disabled={sending || !response.trim()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send Response
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
