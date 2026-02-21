'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Check, Users, MessageCircle, Mail, Zap } from 'lucide-react'

export default function ReferralCard() {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [referralLink, setReferralLink] = useState('')
  const [boostActive, setBoostActive] = useState(false)
  const [boostExpiresAt, setBoostExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReferral() {
      try {
        const res = await fetch('/api/profile/referral')
        if (res.ok) {
          const data = await res.json()
          setReferralCode(data.referralCode)
          setReferralCount(data.referralCount)
          setReferralLink(data.referralLink)
          setBoostActive(data.boostActive || false)
          setBoostExpiresAt(data.boostExpiresAt || null)
        }
      } catch (error) {
        console.error('Error fetching referral:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReferral()
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = referralLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareWhatsApp = () => {
    const text = `Join VivaahReady — privacy-first Indian matchmaking for the US diaspora. Free to start! ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareEmail = () => {
    const subject = 'Join VivaahReady — Indian Matchmaking'
    const body = `Hi,\n\nI wanted to share VivaahReady with you — it's a privacy-first Indian matchmaking platform for the US diaspora. Verified profiles, mutual matches only.\n\nSign up here: ${referralLink}\n\nFree to start!`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  if (loading || !referralCode) return null

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Invite Friends</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Share VivaahReady with friends and family who are looking for meaningful connections.
      </p>

      {/* Referral Link */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 truncate border border-gray-200">
          {referralLink}
        </div>
        <button
          onClick={copyLink}
          className="flex-shrink-0 p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </button>
        <button
          onClick={shareEmail}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
      </div>

      {/* Referral Count & Boost Status */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        {referralCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{referralCount} {referralCount === 1 ? 'person' : 'people'} joined via your link</span>
          </div>
        )}

        {/* Boost Incentive */}
        {boostActive && boostExpiresAt ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-700">
                Your profile is boosted in match results!
              </span>
            </div>
            <p className="text-xs text-amber-600 mt-1 ml-6">
              Expires in {Math.max(1, Math.ceil((new Date(boostExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
            </p>
          </div>
        ) : referralCount >= 3 ? (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">
                Your profile boost has expired. Keep referring to earn a new boost!
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Refer {3 - referralCount} more to boost your profile for 30 days
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((referralCount / 3) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
