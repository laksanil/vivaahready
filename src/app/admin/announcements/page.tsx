'use client'

import { useState, useEffect } from 'react'
import { Mail, MessageCircle, Send, Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react'

interface SubscriberStats {
  whatsappSubscribers: number
  totalVerifiedPhones: number
}

interface SendResult {
  total: number
  successful?: number
  sent?: number
  failed: number
  errors?: { email?: string; error: string }[] | string[]
  message?: string
}

export default function AnnouncementsPage() {
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')
  const [contentSid, setContentSid] = useState('')
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [variableInputs, setVariableInputs] = useState<{ key: string; value: string }[]>([
    { key: '2', value: '' }, // Variable 1 is always firstName (auto-filled)
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<SubscriberStats | null>(null)
  const [result, setResult] = useState<SendResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscriber stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/whatsapp-announcement')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchStats()
  }, [])

  const addVariable = () => {
    const nextKey = String(variableInputs.length + 2) // +2 because 1 is firstName
    setVariableInputs([...variableInputs, { key: nextKey, value: '' }])
  }

  const removeVariable = (index: number) => {
    setVariableInputs(variableInputs.filter((_, i) => i !== index))
  }

  const updateVariable = (index: number, value: string) => {
    const updated = [...variableInputs]
    updated[index].value = value
    setVariableInputs(updated)
  }

  const handleSend = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      if (channel === 'email') {
        const response = await fetch('/api/admin/send-announcement', {
          method: 'POST',
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send announcements')
        }

        setResult(data)
      } else {
        // WhatsApp
        if (!contentSid) {
          throw new Error('Content SID is required for WhatsApp messages')
        }

        // Build template variables object
        const vars: Record<string, string> = {}
        variableInputs.forEach((v) => {
          if (v.value) {
            vars[v.key] = v.value
          }
        })

        const response = await fetch('/api/admin/whatsapp-announcement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentSid,
            templateVariables: vars,
          }),
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send WhatsApp announcements')
        }

        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Announcements</h1>
        <p className="text-gray-600 mt-1">
          Send bulk announcements to your users via Email or WhatsApp
        </p>
      </div>

      {/* Channel Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Channel</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setChannel('email')}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              channel === 'email'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Mail className={`h-8 w-8 mx-auto mb-2 ${channel === 'email' ? 'text-primary-500' : 'text-gray-400'}`} />
            <p className={`font-medium ${channel === 'email' ? 'text-primary-700' : 'text-gray-700'}`}>Email</p>
            <p className="text-sm text-gray-500 mt-1">Send to all users with profiles</p>
          </button>
          <button
            onClick={() => setChannel('whatsapp')}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              channel === 'whatsapp'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MessageCircle className={`h-8 w-8 mx-auto mb-2 ${channel === 'whatsapp' ? 'text-green-500' : 'text-gray-400'}`} />
            <p className={`font-medium ${channel === 'whatsapp' ? 'text-green-700' : 'text-gray-700'}`}>WhatsApp</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats ? `${stats.whatsappSubscribers} subscribers` : 'Loading...'}
            </p>
          </button>
        </div>
      </div>

      {/* WhatsApp Configuration */}
      {channel === 'whatsapp' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Template</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content SID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contentSid}
                onChange={(e) => setContentSid(e.target.value)}
                placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in Twilio Console → Messaging → Content Template Builder
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Variables
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Variable {'{{1}}'} is automatically filled with the user&apos;s first name.
                Add additional variables below.
              </p>

              <div className="space-y-2">
                {variableInputs.map((v, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-sm text-gray-500 w-16">{`{{${v.key}}}`}</span>
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => updateVariable(index, e.target.value)}
                      placeholder={`Value for variable ${v.key}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <button
                      onClick={() => removeVariable(index)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addVariable}
                className="mt-2 text-sm text-green-600 hover:text-green-700"
              >
                + Add Variable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriber Info */}
      {channel === 'whatsapp' && stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-blue-900">Subscriber Stats</span>
          </div>
          <div className="mt-2 text-sm text-blue-800">
            <p>WhatsApp Subscribers: <strong>{stats.whatsappSubscribers}</strong></p>
            <p>Total Verified Phones: <strong>{stats.totalVerifiedPhones}</strong></p>
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={handleSend}
          disabled={isLoading || (channel === 'whatsapp' && !contentSid)}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            channel === 'email'
              ? 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-primary-300'
              : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Send {channel === 'email' ? 'Email' : 'WhatsApp'} Announcement
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-lg p-4 ${result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.failed === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">
              {result.failed === 0 ? 'Success!' : 'Completed with some failures'}
            </span>
          </div>
          <div className="text-sm">
            <p>Total: {result.total}</p>
            <p>Sent: {result.successful ?? result.sent ?? 0}</p>
            <p>Failed: {result.failed}</p>
          </div>
          {result.errors && result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-yellow-700 cursor-pointer">View errors</summary>
              <ul className="mt-1 text-xs text-yellow-800 max-h-32 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i}>{typeof err === 'string' ? err : `${err.email}: ${err.error}`}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-900">Error</span>
          </div>
          <p className="text-sm text-red-800 mt-1">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-3">How to use WhatsApp Announcements</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Create a message template in Twilio Console → Messaging → Content Template Builder</li>
          <li>Wait for Meta/WhatsApp to approve the template (usually 24-48 hours)</li>
          <li>Copy the Content SID (starts with HX...)</li>
          <li>Paste it here and fill in any template variables</li>
          <li>Click Send to broadcast to all WhatsApp subscribers</li>
        </ol>
        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> WhatsApp requires pre-approved templates for business-initiated messages.
            Make sure your template is approved before sending.
          </p>
        </div>
      </div>
    </div>
  )
}
