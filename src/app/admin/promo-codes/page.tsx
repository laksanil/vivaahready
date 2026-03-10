'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  discountPercent: number
  maxUses: number | null
  usedCount: number
  eventSlug: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Form state
  const [newCode, setNewCode] = useState('')
  const [discount, setDiscount] = useState(100)
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/promo-codes')
      if (res.ok) {
        const data = await res.json()
        setCodes(data.codes)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          discountPercent: discount,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create code')
        return
      }

      setNewCode('')
      setMaxUses('')
      setExpiresAt('')
      setDiscount(100)
      fetchCodes()
    } catch {
      setError('Failed to create code')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    await fetch('/api/admin/promo-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentActive }),
    })
    fetchCodes()
  }

  const deleteCode = async (id: string) => {
    if (!confirm('Delete this promo code?')) return
    await fetch(`/api/admin/promo-codes?id=${id}`, { method: 'DELETE' })
    fetchCodes()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Event Promo Codes</h1>

      {/* Create Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Promo Code</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. VIP2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input
                type="number"
                min={1}
                max={100}
                value={discount}
                onChange={e => setDiscount(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires <span className="text-gray-400">(optional)</span></label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={creating || !newCode}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creating ? 'Creating...' : 'Create Code'}
          </button>
        </form>
      </div>

      {/* Codes Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Discount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Uses</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Expires</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Created</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No promo codes yet</td></tr>
              ) : (
                codes.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-gray-900">{c.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.discountPercent === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {c.discountPercent === 100 ? 'FREE' : `${c.discountPercent}% off`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ' / \u221e'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => toggleActive(c.id, c.isActive)}
                          title={c.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        >
                          {c.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => deleteCode(c.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
