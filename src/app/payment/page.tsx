'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  Shield,
  Loader2,
  ArrowLeft,
} from 'lucide-react'

export default function PaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasPaid, setHasPaid] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      console.error('Error checking payment status:', err)
    } finally {
      setCheckingStatus(false)
    }
  }

  // Redirect to Stripe checkout on mount if not already paid
  useEffect(() => {
    if (!checkingStatus && !hasPaid && session) {
      redirectToStripe()
    }
  }, [checkingStatus, hasPaid, session])

  const redirectToStripe = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/verify-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.alreadyPaid) {
        setHasPaid(true)
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start payment. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (status === 'loading' || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Checking payment status...</p>
        </div>
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
              Your payment has been received. Your profile is now pending admin approval.
              Once approved, you&apos;ll be able to accept interests and connect with matching profiles.
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {loading && !error ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Redirecting to secure payment...</p>
            <p className="text-gray-500 text-sm mt-1">You&apos;ll be taken to Stripe to complete your payment.</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Shield className="h-4 w-4" />
              <span>Secure payment by Stripe</span>
            </div>
          </>
        ) : error ? (
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={redirectToStripe}
              className="btn-primary mb-3"
            >
              Try Again
            </button>
            <Link
              href="/get-verified"
              className="inline-flex items-center text-gray-600 hover:text-primary-600 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Get Verified
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
