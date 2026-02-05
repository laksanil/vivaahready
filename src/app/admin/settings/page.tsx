'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, Loader2, Calendar, Tag } from 'lucide-react'

interface Settings {
  id: string
  verificationPrice: number
  promoPrice: number | null
  promoEndDate: string | null
  updatedAt: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [verificationPrice, setVerificationPrice] = useState(50)
  const [promoPrice, setPromoPrice] = useState<string>('')
  const [promoEndDate, setPromoEndDate] = useState<string>('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data)
      setVerificationPrice(data.verificationPrice)
      setPromoPrice(data.promoPrice?.toString() || '')
      setPromoEndDate(data.promoEndDate ? new Date(data.promoEndDate).toISOString().split('T')[0] : '')
    } catch (err) {
      setError('Failed to load settings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationPrice: Number(verificationPrice),
          promoPrice: promoPrice ? Number(promoPrice) : null,
          promoEndDate: promoEndDate || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to save settings')

      const data = await res.json()
      setSettings(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to save settings')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const clearPromo = () => {
    setPromoPrice('')
    setPromoEndDate('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Calculate current active price
  const now = new Date()
  const isPromoActive = promoPrice && promoEndDate && new Date(promoEndDate) > now
  const currentPrice = isPromoActive ? Number(promoPrice) : verificationPrice

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pricing Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Settings saved successfully!
        </div>
      )}

      {/* Current Price Display */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-6 w-6 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">Current Active Price</span>
          {isPromoActive && (
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
              PROMO ACTIVE
            </span>
          )}
        </div>
        <div className="text-4xl font-bold text-primary-900">${currentPrice}</div>
        {isPromoActive && (
          <p className="text-sm text-primary-600 mt-1">
            Regular price: ${verificationPrice} | Promo ends: {new Date(promoEndDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Regular Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Regular Verification Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="1"
              value={verificationPrice}
              onChange={(e) => setVerificationPrice(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">This is the standard price when no promo is active</p>
        </div>

        {/* Promo Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promotional Pricing
            </h3>
            {(promoPrice || promoEndDate) && (
              <button
                onClick={clearPromo}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear Promo
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promo Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="1"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  placeholder="Leave empty for no promo"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Promo End Date
              </label>
              <input
                type="date"
                value={promoEndDate}
                onChange={(e) => setPromoEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Set both promo price and end date to activate a promotion. The promo will automatically expire.
          </p>
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Settings
              </>
            )}
          </button>
        </div>

        {/* Last Updated */}
        {settings?.updatedAt && (
          <p className="text-xs text-gray-400 text-center">
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
