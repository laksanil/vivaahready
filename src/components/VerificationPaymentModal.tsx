'use client'

import { useState } from 'react'
import { X, Shield, CheckCircle, CreditCard, Loader2, Lock, UserCheck, Eye, Heart } from 'lucide-react'

interface VerificationPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentInitiated?: () => void
}

export default function VerificationPaymentModal({
  isOpen,
  onClose,
  onPaymentInitiated
}: VerificationPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/verification-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        onPaymentInitiated?.()
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Profile Verification</h2>
              <p className="text-white/90 text-sm">One-time verification fee</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Price */}
          <div className="text-center mb-6">
            <div className="inline-flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">$50</span>
              <span className="text-gray-500 text-sm">USD</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">One-time payment, lifetime access</p>
          </div>

          {/* Why We Charge */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-600" />
              Why We Require Verification
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              VivaahReady is a <strong>serious matchmaking platform</strong> designed for individuals
              genuinely seeking meaningful, long-term relationships. Our verification process ensures:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <UserCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Authentic profiles only</strong> — We manually verify each profile to ensure genuineness</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Serious intent filter</strong> — Payment commitment filters out casual browsers and fake profiles</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Heart className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Quality over quantity</strong> — Connect only with verified, marriage-minded individuals</span>
              </li>
            </ul>
          </div>

          {/* What You Get */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What You Unlock</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">View Full Profiles</p>
                  <p className="text-xs text-gray-500">See names, photos, and social media links of your matches</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Express Interest</p>
                  <p className="text-xs text-gray-500">Send and receive interests from compatible matches</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Profile Verification Badge</p>
                  <p className="text-xs text-gray-500">Your profile gets verified status, building trust with others</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Privacy Protected</p>
                  <p className="text-xs text-gray-500">Contact details revealed only after mutual acceptance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay $50 & Get Verified
              </>
            )}
          </button>

          {/* Payment Methods */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 mb-2">Secure payment powered by Stripe</p>
            <div className="flex justify-center gap-2 opacity-60">
              <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">Visa</div>
              <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">Mastercard</div>
              <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">Amex</div>
              <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">PayPal</div>
            </div>
          </div>

          {/* Trust Note */}
          <p className="text-xs text-gray-400 text-center mt-4">
            By proceeding, you agree to our Terms of Service. Your payment is secure and encrypted.
            This is a one-time fee with no recurring charges.
          </p>
        </div>
      </div>
    </div>
  )
}
