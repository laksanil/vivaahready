'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, AlertCircle } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { formatMessageTime } from '@/lib/formatTime'
import { useImpersonation } from '@/hooks/useImpersonation'

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  isFromMe: boolean
  createdAt: string
  read: boolean
}

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
  recipientPhoto?: string | null
  recipientPhotoUrls?: string | null
}

export default function MessageModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientPhoto,
}: MessageModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { buildApiUrl } = useImpersonation()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && recipientId) {
      fetchMessages()
    }
  }, [isOpen, recipientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(buildApiUrl(`/api/messages/${recipientId}`))
      const data = await response.json()
      if (response.ok) {
        setMessages(data.messages || [])
      } else {
        setError(data.error || 'Failed to load messages')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    if (!recipientId) {
      setError('Recipient ID is missing')
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: recipientId,
          content: newMessage.trim(),
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setMessages([
          ...messages,
          {
            id: data.id,
            content: data.content,
            senderId: data.senderId,
            senderName: data.sender.name,
            isFromMe: true,
            createdAt: data.createdAt,
            read: false,
          },
        ])
        setNewMessage('')
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Avatar name={recipientName} photoUrl={recipientPhoto} size="md" />
          <div className="flex-1">
            <h3 id="modal-title" className="font-semibold text-gray-900">
              {recipientName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close conversation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-center">No messages yet.</p>
              <p className="text-sm text-center mt-1">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.isFromMe
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isFromMe ? 'text-primary-200' : 'text-gray-400'
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Type a message"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
