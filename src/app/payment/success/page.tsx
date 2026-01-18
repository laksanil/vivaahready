'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  Heart,
  Eye,
} from 'lucide-react'

function PaymentSuccessContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session && sessionId) {
      verifyPayment()
    }
  }, [session, sessionId])

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/stripe/verification-payment?session_id=${sessionId}`)
      const data = await response.json()

      if (data.paid) {
        setVerified(true)
      } else if (data.error) {
        setError(data.error)
      } else {
        setError('Payment verification pending. Please wait a moment.')
      }
    } catch (err) {
      setError('Failed to verify payment. Please contact support.')
    } finally {
      setVerifying(false)
    }
  }

  if (status === 'loading' || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
              <button onClick={verifyPayment} className="btn-secondary">
                Retry Verification
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                  <h3 className="font-semibold text-blue-900 mb-1">Profile Pending Admin Review</h3>
                  <p className="text-blue-700 text-sm">
                    Your payment has been received. Our admin team will review and verify your profile within 24-48 hours.
                    You'll receive an email notification once your profile is approved.
                  </p>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Admin Reviews Your Profile</h3>
                  <p className="text-gray-600 text-sm">Our team verifies your information for authenticity</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile Gets Verified Badge</h3>
                  <p className="text-gray-600 text-sm">Once approved, your profile shows as verified to others</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Full Access Unlocked</h3>
                  <p className="text-gray-600 text-sm">View names, photos, social links, and express interest</p>
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
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                  <span>Connect with matches</span>
                </div>
              </div>
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
                href="/profile"
                className="flex-1 border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold text-center hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                View My Profile
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
