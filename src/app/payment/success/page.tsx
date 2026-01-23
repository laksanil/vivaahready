'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  Heart,
  Eye,
  Mail,
  Users,
  RefreshCw,
} from 'lucide-react'

function PaymentSuccessContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [checking, setChecking] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'error'>('pending')
  const [retryCount, setRetryCount] = useState(0)

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

  // Auto-retry checking payment status (webhook may take a few seconds)
  useEffect(() => {
    if (paymentStatus === 'pending' && retryCount < 10) {
      const timer = setTimeout(() => {
        checkPaymentStatus()
        setRetryCount(prev => prev + 1)
      }, 3000) // Check every 3 seconds

      return () => clearTimeout(timer)
    }
  }, [paymentStatus, retryCount])

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch('/api/payment/status')
      const data = await response.json()

      if (data.hasPaid) {
        setPaymentStatus('paid')
      } else {
        setPaymentStatus('pending')
      }
    } catch (err) {
      console.error('Error checking payment status:', err)
      setPaymentStatus('error')
    } finally {
      setChecking(false)
    }
  }

  const handleManualCheck = () => {
    setChecking(true)
    setRetryCount(0)
    checkPaymentStatus()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    )
  }

  // Show processing while checking or waiting for webhook
  if (checking || (paymentStatus === 'pending' && retryCount < 10)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming Your Payment</h2>
          <p className="text-gray-600 mb-4">
            Please wait while we verify your payment with Stripe...
          </p>
          <p className="text-sm text-gray-400">
            This usually takes a few seconds
          </p>
        </div>
      </div>
    )
  }

  // Payment still pending after retries - show manual check option
  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h1>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. This can take up to a minute.
              If you completed the payment, please wait or click below to check again.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleManualCheck}
                className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Check Payment Status
              </button>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
                Go to Dashboard
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              If you didn't complete the payment, you can try again from the dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
            <p className="text-gray-600 mb-6">
              We couldn't verify your payment status. Please try again or contact support.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={handleManualCheck} className="btn-primary">
                Try Again
              </button>
              <Link href="/dashboard" className="btn-secondary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Payment confirmed - show success
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-silver-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-8 text-center text-white">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100">Thank you for verifying your profile</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Profile Sent for Admin Review</h3>
                  <p className="text-blue-700 text-sm">
                    Your $50 verification payment has been received. Our admin team will review and verify your profile within <strong>24-48 hours</strong>.
                    You'll receive an email notification once your profile is approved.
                  </p>
                </div>
              </div>
            </div>

            {/* What's Next - Timeline */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h2>
            <div className="relative mb-8">
              {/* Vertical line */}
              <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-gray-900">Payment Received</h3>
                    <p className="text-gray-500 text-sm">Your $50 verification fee has been processed</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 animate-pulse">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-gray-900">Admin Review in Progress</h3>
                    <p className="text-gray-500 text-sm">Our team verifies your profile for authenticity (24-48 hrs)</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-medium text-gray-400">Email Notification</h3>
                    <p className="text-gray-400 text-sm">You'll be notified when your profile is approved</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <Heart className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-medium text-gray-400">Start Connecting</h3>
                    <p className="text-gray-400 text-sm">Express interest and find your perfect match</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unlocked Features */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-5 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Features Unlocked After Approval</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Eye className="w-4 h-4 text-primary-600" />
                  <span>View full profiles</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Heart className="w-4 h-4 text-primary-600" />
                  <span>Express interest</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Shield className="w-4 h-4 text-primary-600" />
                  <span>Verified badge</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span>Connect with matches</span>
                </div>
              </div>
            </div>

            {/* Meanwhile message */}
            <div className="bg-gray-50 rounded-xl p-4 mb-8">
              <p className="text-gray-600 text-sm">
                <strong>In the meantime:</strong> You can browse matches and explore profiles while waiting for approval.
                Expressing interest and viewing contact details will be unlocked once approved.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold text-center hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/matches"
                className="flex-1 border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold text-center hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Browse Matches
              </Link>
            </div>
          </div>
        </div>

        {/* Support Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? Contact us at <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:underline">support@vivaahready.com</a>
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
