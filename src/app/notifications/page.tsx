'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCheck, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  data?: string | Record<string, unknown> | null
  read: boolean
  createdAt: string
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

function parseNotificationMeta(notification: Notification): { sentAt: string; deliveryModes: string[] } {
  let sentAt = notification.createdAt
  let deliveryModes = ['in_app']

  if (notification.data) {
    try {
      const parsed = (typeof notification.data === 'string'
        ? JSON.parse(notification.data)
        : notification.data) as { __sentAt?: string; __deliveryModes?: unknown }
      if (typeof parsed.__sentAt === 'string') {
        sentAt = parsed.__sentAt
      }
      if (Array.isArray(parsed.__deliveryModes)) {
        const validModes = parsed.__deliveryModes.filter((mode): mode is string => typeof mode === 'string')
        if (validModes.length > 0) {
          deliveryModes = validModes
        }
      }
    } catch {
      // Ignore malformed legacy payloads
    }
  }

  return { sentAt, deliveryModes }
}

function formatSentDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function formatDeliveryModes(deliveryModes: string[]): string {
  const modeLabels: Record<string, string> = {
    in_app: 'In-App',
    email: 'Email',
    sms: 'SMS',
    push: 'Push',
  }
  return deliveryModes.map((mode) => modeLabels[mode] || mode).join(' + ')
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<'sent' | 'mode'>('sent')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchNotifications = useCallback(async () => {
    const url = '/api/notifications?all=true'
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const sorted = [...(data.notifications || [])].sort((a: Notification, b: Notification) => {
        const sentA = new Date(parseNotificationMeta(a).sentAt).getTime()
        const sentB = new Date(parseNotificationMeta(b).sentAt).getTime()
        if (sentA !== sentB) return sentB - sentA
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      setNotifications(sorted)
      setUnreadCount(data.unreadCount)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchNotifications().finally(() => setLoading(false))
    }
  }, [status, router, fetchNotifications])

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
    const res = await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  const toggleSort = (field: 'sent' | 'mode') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'sent' ? 'desc' : 'asc')
    }
  }

  const sortedNotifications = [...notifications].sort((a, b) => {
    const metaA = parseNotificationMeta(a)
    const metaB = parseNotificationMeta(b)
    let cmp = 0
    if (sortField === 'sent') {
      cmp = new Date(metaA.sentAt).getTime() - new Date(metaB.sentAt).getTime()
    } else {
      cmp = formatDeliveryModes(metaA.deliveryModes).localeCompare(formatDeliveryModes(metaB.deliveryModes))
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ field }: { field: 'sent' | 'mode' }) => {
    if (sortField !== field) return <ArrowDown className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary-600" />
      : <ArrowDown className="h-3 w-3 text-primary-600" />
  }

  const openNotification = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id).catch(() => {
        // ignore read errors for UX continuity
      })
    }
    if (notification.url) {
      router.push(notification.url)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-8 xl:px-10 py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 truncate">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
        </p>

        {/* Notification list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-1">We&apos;ll notify you when something happens</p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-gray-100">
                {sortedNotifications.map((n) => {
                  const meta = parseNotificationMeta(n)
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-4 transition-colors ${
                        !n.read ? 'bg-primary-50/40 border-l-3 border-l-primary-500' : 'bg-white'
                      } ${n.url ? 'cursor-pointer' : ''}`}
                      onClick={() => openNotification(n)}
                    >
                      <p className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <p className={`text-sm mt-1 ${!n.read ? 'font-medium text-gray-700' : 'text-gray-500'}`}>{n.body}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span>Sent: {formatSentDate(meta.sentAt)}</span>
                        <span>Mode: {formatDeliveryModes(meta.deliveryModes)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{timeAgo(meta.sentAt)}</p>
                      {n.url && (
                        <Link
                          href={n.url}
                          className="inline-flex mt-2 text-xs text-gray-600 hover:text-gray-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full table-fixed divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-[55%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700">
                        Message
                      </th>
                      <th
                        className="w-[27%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700 cursor-pointer select-none group"
                        onClick={() => toggleSort('sent')}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Sent <SortIcon field="sent" />
                        </span>
                      </th>
                      <th
                        className="w-[18%] px-6 py-3 text-left text-sm font-bold uppercase tracking-wide text-gray-700 cursor-pointer select-none group"
                        onClick={() => toggleSort('mode')}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Mode <SortIcon field="mode" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedNotifications.map((n) => {
                      const meta = parseNotificationMeta(n)
                      return (
                        <tr
                          key={n.id}
                          className={`align-top transition-colors ${
                            !n.read ? 'bg-primary-50/40 hover:bg-primary-50/60 border-l-3 border-l-primary-500' : 'hover:bg-gray-50'
                          } ${n.url ? 'cursor-pointer' : ''}`}
                          onClick={() => openNotification(n)}
                        >
                          <td className="px-6 py-5">
                            <div className="min-w-0">
                              <p className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                {n.title}
                              </p>
                              <p className={`text-sm mt-0.5 ${!n.read ? 'font-medium text-gray-700' : 'text-gray-500'}`}>{n.body}</p>
                              {n.url && (
                                <Link
                                  href={n.url}
                                  className="inline-flex mt-1.5 text-xs text-gray-600 hover:text-gray-900"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Open
                                </Link>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <p className="text-sm text-gray-800">{formatSentDate(meta.sentAt)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{timeAgo(meta.sentAt)}</p>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">
                            {formatDeliveryModes(meta.deliveryModes)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Settings link */}
        <div className="mt-4 text-center">
          <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-800">
            Manage notification preferences
          </Link>
        </div>
      </div>
    </div>
  )
}
