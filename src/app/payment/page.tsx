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
  AlertCircle,
} from 'lucide-react'

// PayPal Client ID from environment variable (public, safe to expose in frontend)
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AQaudKo50ofbHjXkE91kbhzdPGji-Jk9b1tMzG89KjhROwnvZLVv6DKXZUAK99ZvJQvxDa-X_LFLwrfD'

export default function PaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasPaid, setHasPaid] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paypalContainerRef = useRef<HTMLDivElement>(null)
  const buttonsRendered = useRef(false)

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

  // Render PayPal buttons when SDK is loaded
  useEffect(() => {
    if (paypalLoaded && !hasPaid && paypalContainerRef.current && !buttonsRendered.current) {
      buttonsRendered.current = true

      const paypal = (window as unknown as { paypal?: {
        Buttons: (config: {
          style?: {
            layout?: string
            color?: string
            shape?: string
            label?: string
            height?: number
          }
          createOrder: () => Promise<string>
          onApprove: (data: { orderID: string }) => Promise<void>
          onError: (err: unknown) => void
          onCancel: () => void
        }) => { render: (selector: string | HTMLElement) => void }
      }}).paypal

      if (paypal?.Buttons) {
        paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 45,
          },
          createOrder: async () => {
            setError(null)
            setProcessing(true)
            try {
              const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
              const data = await response.json()
              if (data.error) {
                throw new Error(data.error)
              }
              return data.orderId
            } catch (err) {
              console.error('Error creating order:', err)
              setError('Failed to create order. Please try again.')
              setProcessing(false)
              throw err
            }
          },
          onApprove: async (data: { orderID: string }) => {
            try {
              // Capture the order on our server
              const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID }),
              })
              const result = await response.json()

              if (result.success) {
                // Redirect to dashboard - it will show payment success banner
                router.push('/dashboard')
              } else {
                setError('Payment verification failed. Please contact support.')
                setProcessing(false)
              }
            } catch (err) {
              console.error('Error capturing order:', err)
              setError('Payment processing failed. Please contact support.')
              setProcessing(false)
            }
          },
          onError: (err: unknown) => {
            console.error('PayPal error:', err)
            setError('Payment failed. Please try again.')
            setProcessing(false)
          },
          onCancel: () => {
            setProcessing(false)
          },
        }).render(paypalContainerRef.current!)
      }
    }
  }, [paypalLoaded, hasPaid, router])

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
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`}
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

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{error}</p>
                      <p className="text-xs text-red-600 mt-1">
                        If the issue persists, contact{' '}
                        <a href="mailto:support@vivaahready.com" className="underline">
                          support@vivaahready.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing state */}
              {processing && (
                <div className="flex items-center justify-center py-4 mb-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                  <span className="text-gray-600 text-sm">Processing payment...</span>
                </div>
              )}

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

              {/* Help text */}
              <p className="text-xs text-gray-400 text-center">
                After payment, your profile will be automatically verified.
                <br />
                Questions? Email{' '}
                <a href="mailto:support@vivaahready.com" className="text-primary-600 hover:underline">
                  support@vivaahready.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
