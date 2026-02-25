'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'

interface NotificationPreferences {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  matchNotifications: boolean
  interestNotifications: boolean
  messageNotifications: boolean
  marketingEmails: boolean
}

export default function SettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/notifications/preferences')
        .then(res => res.json())
        .then(data => {
          setPrefs(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status, router])

  const updatePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!prefs) return
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    setSaving(true)
    setSaved(false)

    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!prefs) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-8 xl:px-10 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          {saving && <span className="text-xs text-gray-400">Saving...</span>}
          {saved && <span className="text-xs text-green-600">Saved</span>}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Notification Channels */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Notification Channels</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choose how you want to receive notifications</p>
            </div>

            <Toggle
              icon={<Mail className="h-4 w-4" />}
              label="Email notifications"
              description="Receive notifications via email"
              checked={prefs.emailEnabled}
              onChange={v => updatePref('emailEnabled', v)}
            />
            <Toggle
              icon={<Smartphone className="h-4 w-4" />}
              label="SMS notifications"
              description="Receive notifications via text message"
              checked={prefs.smsEnabled}
              onChange={v => updatePref('smsEnabled', v)}
            />
            <Toggle
              icon={<Bell className="h-4 w-4" />}
              label="Push notifications"
              description="Receive browser push notifications"
              checked={prefs.pushEnabled}
              onChange={v => updatePref('pushEnabled', v)}
            />
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Notification Types</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choose which notifications you want to receive</p>
            </div>

            <Toggle
              icon={<MessageSquare className="h-4 w-4" />}
              label="Match notifications"
              description="New match suggestions and availability"
              checked={prefs.matchNotifications}
              onChange={v => updatePref('matchNotifications', v)}
            />
            <Toggle
              icon={<MessageSquare className="h-4 w-4" />}
              label="Interest notifications"
              description="When someone expresses interest or accepts yours"
              checked={prefs.interestNotifications}
              onChange={v => updatePref('interestNotifications', v)}
            />
            <Toggle
              icon={<MessageSquare className="h-4 w-4" />}
              label="Message notifications"
              description="New messages from connections"
              checked={prefs.messageNotifications}
              onChange={v => updatePref('messageNotifications', v)}
            />
            <Toggle
              icon={<Mail className="h-4 w-4" />}
              label="Marketing emails"
              description="Tips, updates, and special offers"
              checked={prefs.marketingEmails}
              onChange={v => updatePref('marketingEmails', v)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="text-gray-400 mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
