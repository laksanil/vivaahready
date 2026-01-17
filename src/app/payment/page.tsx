'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  Check,
  Shield,
  Heart,
  Users,
  MessageCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react'

export default function PaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending')
  const [hasPaid, setHasPaid] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      checkPaymentStatus()
    }
  }, [session])

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch('/api/payment/status')
      const data = await response.json()
      setHasPaid(data.hasPaid)
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    setPaymentStatus('processing')

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50 }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentStatus('success')
        setHasPaid(true)
      } else {
        setPaymentStatus('error')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (hasPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Complete!</h1>
            <p className="text-gray-600 mb-6">
              Your $50 payment has been received. Your profile is now pending admin approval.
              Once approved, you'll be able to express interest in matching profiles.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/matches" className="btn-primary">
                View Matches
              </Link>
              <Link href="/profile" className="btn-secondary">
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/matches"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Matches
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Profile Verification</h1>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">$50</span>
                <span className="text-gray-500">one-time payment</span>
              </div>
              <p className="text-gray-600">
                Complete your profile verification to unlock the ability to express interest
                and connect with matching profiles.
              </p>
            </div>

            {paymentStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Payment successful!</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Your profile is now pending admin approval.
                </p>
              </div>
            ) : paymentStatus === 'error' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">
                  Payment failed. Please try again or contact support.
                </p>
              </div>
            ) : null}

            <button
              onClick={handlePayment}
              disabled={loading || paymentStatus === 'success'}
              className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay $50 Now
                </>
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Secure payment processing</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">What You Get</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile Verification</h3>
                  <p className="text-gray-600 text-sm">
                    Your profile will be reviewed and verified by our team
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Express Interest</h3>
                  <p className="text-gray-600 text-sm">
                    Send interest to profiles that match your preferences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Full Profiles</h3>
                  <p className="text-gray-600 text-sm">
                    Access complete profile information of matching candidates
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Connect with Matches</h3>
                  <p className="text-gray-600 text-sm">
                    Get contact details when there's mutual interest
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> After payment, your profile will be reviewed by our admin team.
                Once approved, you'll receive full access to express interest in matching profiles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
