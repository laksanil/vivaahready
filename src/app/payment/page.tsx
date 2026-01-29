'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import {
  Check,
  Shield,
  Loader2,
  ArrowLeft,
  CreditCard,
  Clock,
} from 'lucide-react'

const PAYPAL_CLIENT_ID = 'BAA2bQdg8XChuxjCrEc7y0eKKd0xkmtWlGLGu8_cU0w69TNzYa2D0vtrMqva9LWcjQyrV_qHXLvNdEeAlA'
const PAYPAL_BUTTON_ID = 'D3MQVBJT53SGU'

export default function PaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasPaid, setHasPaid] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const paypalContainerRef = useRef<HTMLDivElement>(null)

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

  // Render PayPal button when SDK is loaded
  useEffect(() => {
    if (paypalLoaded && !hasPaid && paypalContainerRef.current) {
      // Clear container first
      paypalContainerRef.current.innerHTML = ''

      // Create the PayPal button container
      const container = document.createElement('div')
      container.id = `paypal-container-${PAYPAL_BUTTON_ID}`
      paypalContainerRef.current.appendChild(container)

      // Render the hosted button
      if ((window as unknown as { paypal?: { HostedButtons?: (config: { hostedButtonId: string }) => { render: (selector: string) => void } } }).paypal?.HostedButtons) {
        (window as unknown as { paypal: { HostedButtons: (config: { hostedButtonId: string }) => { render: (selector: string) => void } } }).paypal.HostedButtons({
          hostedButtonId: PAYPAL_BUTTON_ID,
        }).render(`#paypal-container-${PAYPAL_BUTTON_ID}`)
      }
    }
  }, [paypalLoaded, hasPaid])

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
    <>
      {/* PayPal SDK Script */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&enable-funding=venmo&currency=USD`}
        onLoad={() => setPaypalLoaded(true)}
      />

      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-8">
        <div className="max-w-lg mx-auto px-4">
          {/* Back Link */}
          <Link
            href="/get-verified"
            className="inline-flex items-center text-gray-600 hover:text-primary-600 text-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
              <h1 className="text-xl font-bold">Complete Your Verification</h1>
              <p className="text-primary-100 text-sm mt-1">One-time payment for lifetime access</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900">$50</div>
                <p className="text-sm text-gray-500 mt-1">
                  Founding member price (until March 1, 2026)
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Regular price: $100
                </p>
              </div>

              {/* What you get */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">What you get:</h3>
                <ul className="space-y-2">
                  {[
                    'See full photos and profile details',
                    'Send unlimited interests',
                    'Accept interests from matches',
                    'Message after mutual acceptance',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PayPal Button Container */}
              <div className="mb-4">
                {!paypalLoaded ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                    <span className="text-gray-600 text-sm">Loading payment options...</span>
                  </div>
                ) : (
                  <div ref={paypalContainerRef} className="paypal-button-container" />
                )}
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Cards accepted</span>
                </div>
              </div>

              {/* Post-payment note */}
              {paymentInitiated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Payment completed?</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Your profile will be verified within a few hours.
                        You&apos;ll receive an email once approved.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-xs text-blue-700 underline hover:no-underline"
                      >
                        Refresh to check status
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Help text */}
              <p className="text-xs text-gray-400 text-center">
                After payment, your profile will be reviewed and verified.
                <br />
                Questions? Email{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:underline">
                  support@vivaahready.com
                </a>
              </p>
            </div>
          </div>

          {/* Click tracker for post-payment state */}
          <div
            className="fixed inset-0 pointer-events-none"
            onClick={() => setPaymentInitiated(true)}
          />
        </div>
      </div>
    </>
  )
}
