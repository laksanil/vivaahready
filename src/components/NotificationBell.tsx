'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, CheckCheck, Heart, UserCheck, MessageCircle, CreditCard, Users, Star } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  read: boolean
  createdAt: string
}

const typeIcons: Record<string, typeof Heart> = {
  new_interest: Heart,
  interest_accepted: Users,
  match_available: Star,
  profile_approved: UserCheck,
  payment_confirmed: CreditCard,
  new_message: MessageCircle,
  welcome: Bell,
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
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // Silently fail
    }
  }, [])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const markAsRead = async (id: string) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    setLoading(true)
    const res = await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
    setLoading(false)
  }

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="relative text-white/90 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => {
                const Icon = typeIcons[n.type] || Bell
                const content = (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !n.read ? 'bg-primary-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={`flex-shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center ${
                      !n.read ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="flex-shrink-0 mt-2">
                        <div className="h-2 w-2 rounded-full bg-primary-500" />
                      </div>
                    )}
                  </div>
                )

                return n.url ? (
                  <Link key={n.id} href={n.url}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
