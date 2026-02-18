'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    // Don't show if VAPID key isn't configured
    if (!VAPID_PUBLIC_KEY) return

    // Don't show if browser doesn't support push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Don't show if user already dismissed
    if (localStorage.getItem('push-prompt-dismissed')) return

    // Check if already subscribed
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        if (!subscription) {
          // Small delay so it doesn't flash on page load
          setTimeout(() => setShow(true), 2000)
        }
      })
    })

    // Register service worker
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err)
    })
  }, [])

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) return
    setSubscribing(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (response.ok) {
        setShow(false)
        localStorage.setItem('push-prompt-dismissed', 'true')
      }
    } catch (error) {
      console.error('Push subscription failed:', error)
    } finally {
      setSubscribing(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem('push-prompt-dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Enable notifications</p>
          <p className="text-xs text-gray-500 mt-1">
            Get instant alerts for new matches, interests, and messages.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={subscribe}
              disabled={subscribing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {subscribing ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
