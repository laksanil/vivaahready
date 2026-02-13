'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  User,
  Bot,
  AlertCircle,
} from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface EventChatbotProps {
  context?: string
}

export function EventChatbot({ context = 'marchevent' }: EventChatbotProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help with questions about the Singles Zoom Meetup. Ask me about eligibility, registration, pricing, or anything else!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSupportForm, setShowSupportForm] = useState(false)
  const [supportSubmitted, setShowSupportSubmitted] = useState(false)
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [submittingSupport, setSubmittingSupport] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pre-fill support form with session data
  useEffect(() => {
    if (session?.user) {
      setSupportForm(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }))
    }
  }, [session])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      })

      const data = await response.json()

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response },
      ])

      // Show support form suggestion if AI couldn't help
      if (data.needsHuman) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: "Would you like to send a message to our support team? Click 'Talk to Support' below.",
            },
          ])
        }, 500)
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting. Please try again or use 'Talk to Support' below.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const submitSupportMessage = async () => {
    if (!supportForm.message.trim()) return

    setSubmittingSupport(true)

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supportForm,
          context,
          chatHistory: messages,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowSupportSubmitted(true)
        setShowSupportForm(false)
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Your message has been sent! Ticket #${data.ticketId}. Our team will review and respond soon.`,
          },
        ])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      alert('Failed to send message. Please try again.')
    } finally {
      setSubmittingSupport(false)
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-rose-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
          isOpen ? 'hidden' : ''
        }`}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Event Assistant</h3>
                <p className="text-xs text-white/80">Ask me anything!</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px] bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Support Form */}
          {showSupportForm && (
            <div className="p-4 bg-amber-50 border-t border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Talk to Support</span>
              </div>
              <div className="space-y-2">
                <textarea
                  placeholder="How can we help you?"
                  value={supportForm.message}
                  onChange={e => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSupportForm(false)}
                    className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitSupportMessage}
                    disabled={submittingSupport || !supportForm.message.trim()}
                    className="flex-1 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingSupport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!showSupportForm && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="p-2 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setShowSupportForm(true)}
                className="w-full mt-2 py-2 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Need more help? Talk to Support
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
