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

          {/* How It Works - Step by Step */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
            <div className="relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                <div className="flex gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 z-10">1</div>
                  <div className="pt-1">
                    <p className="font-medium text-gray-900 text-sm">Complete Payment</p>
                    <p className="text-xs text-gray-500">Pay the one-time $50 verification fee</p>
                  </div>
                </div>
                <div className="flex gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 z-10">2</div>
                  <div className="pt-1">
                    <p className="font-medium text-gray-900 text-sm">Profile Sent for Review</p>
                    <p className="text-xs text-gray-500">Your profile is submitted to our admin team for verification</p>
                  </div>
                </div>
                <div className="flex gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 z-10">3</div>
                  <div className="pt-1">
                    <p className="font-medium text-gray-900 text-sm">Admin Approval (24-48 hrs)</p>
                    <p className="text-xs text-gray-500">Our team reviews and approves your profile</p>
                  </div>
                </div>
                <div className="flex gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 z-10">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-gray-900 text-sm">Start Connecting!</p>
                    <p className="text-xs text-gray-500">Express interest, view profiles, and find your match</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What You Unlock After Approval</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">View full profiles with names, photos & contact details</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Send and receive interests from matches</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Get verified badge on your profile</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Eye className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Contact details revealed only on mutual match</p>
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
