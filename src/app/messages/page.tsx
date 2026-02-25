'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Loader2, ChevronLeft, Search, RefreshCw } from 'lucide-react'
import MessageModal from '@/components/MessageModal'
import { Avatar } from '@/components/Avatar'
import { formatTime } from '@/lib/formatTime'
import { useImpersonation } from '@/hooks/useImpersonation'
import { useAdminViewAccess } from '@/hooks/useAdminViewAccess'

interface Conversation {
  partnerId: string
  partnerName: string
  partnerPhoto: string | null
  partnerPhotoUrls?: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isLastMessageFromMe: boolean
}

type ModalState =
  | { isOpen: false }
  | {
      isOpen: true
      recipientId: string
      recipientName: string
      recipientPhoto: string | null
      recipientPhotoUrls: string | null
    }

function MessagesPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { buildApiUrl, buildUrl, viewAsUser } = useImpersonation()
  const { isAdminView, isAdmin, adminChecked } = useAdminViewAccess()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ isOpen: false })

  const canAccess = !!session || (isAdminView && isAdmin)

  useEffect(() => {
    if (status === 'unauthenticated') {
      if (!isAdminView) {
        router.push('/login')
      } else if (adminChecked && !isAdmin) {
        router.push('/login')
      }
    }
  }, [status, router, isAdminView, adminChecked, isAdmin])

  useEffect(() => {
    if (canAccess) {
      fetchConversations()
    }
  }, [canAccess, viewAsUser])

  const fetchConversations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(buildApiUrl('/api/messages'))
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to load conversations')
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (conversation: Conversation) => {
    setModal({
      isOpen: true,
      recipientId: conversation.partnerId,
      recipientName: conversation.partnerName,
      recipientPhoto: conversation.partnerPhoto,
      recipientPhotoUrls: conversation.partnerPhotoUrls || null,
    })
  }

  const closeModal = () => {
    setModal({ isOpen: false })
    fetchConversations()
  }

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || (isAdminView && !adminChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-8">
      <div className="w-full px-4 md:px-8 xl:px-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={buildUrl('/matches')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 text-sm">Your conversations with matches</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchConversations}
              className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {/* Conversations List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Start messaging your matches to see conversations here'}
            </p>
            {!searchQuery && (
              <Link href={buildUrl('/matches')} className="btn-primary inline-block">
                Browse Matches
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.partnerId}
                onClick={() => openModal(conversation)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                aria-label={`Open conversation with ${conversation.partnerName}${
                  conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread` : ''
                }`}
              >
                <Avatar
                  name={conversation.partnerName}
                  photoUrl={conversation.partnerPhoto}
                  size="lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-semibold truncate ${
                        conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {conversation.partnerName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {conversation.isLastMessageFromMe && (
                        <span className="text-gray-400">You: </span>
                      )}
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span
                        className="ml-2 flex-shrink-0 bg-primary-600 text-white text-xs font-medium px-2 py-0.5 rounded-full"
                        aria-label={`${conversation.unreadCount} unread messages`}
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {modal.isOpen && (
        <MessageModal
          isOpen={true}
          onClose={closeModal}
          recipientId={modal.recipientId}
          recipientName={modal.recipientName}
          recipientPhoto={modal.recipientPhoto}
          recipientPhotoUrls={modal.recipientPhotoUrls}
        />
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}
