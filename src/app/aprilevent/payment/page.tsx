'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  Lock,
  Shield,
  CheckCircle,
  Calendar,
  Video,
  ArrowLeft,
} from 'lucide-react'

// PayPal SDK types
interface PayPalButtonsInstance {
  close: () => void
  isEligible?: () => boolean
  render: (selector: string) => Promise<void>
}

interface PayPalActions {
  restart: () => void
}

interface PayPalButtons {
  (options: {
    style?: Record<string, string | number>
    createOrder: () => Promise<string>
    onApprove: (data: { orderID: string }, actions: PayPalActions) => Promise<void>
    onError: (err: unknown) => void
    onCancel: () => void
  }): PayPalButtonsInstance
}

interface PayPalNamespace {
  Buttons: PayPalButtons
}

declare global {
  interface Window {
    paypal?: PayPalNamespace
  }
}

function EventPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const registrationId = searchParams.get('registrationId')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    mountedRef.current = true

    if (!registrationId || !session?.user?.id) return

    async function renderButtons() {
      if (!window.paypal || !buttonContainerRef.current || !mountedRef.current) return

      buttonContainerRef.current.innerHTML = ''

      try {
        const buttons = window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 48,
          },

          createOrder: async () => {
            setError(null)
            const response = await fetch('/api/events/payment/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ registrationId }),
            })

            const data = await response.json()

            if (!response.ok || !data.orderId) {
              throw new Error(data.error || 'Failed to create payment order')
            }

            return data.orderId
          },

          onApprove: async (data: { orderID: string }) => {
            setProcessing(true)
            setError(null)

            try {
              const response = await fetch('/api/events/payment/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID, registrationId }),
              })

              const result = await response.json()

              if (!response.ok || !result.success) {
                throw new Error(result.error || 'Payment capture failed')
              }

              setSuccess(true)
            } catch (err) {
              console.error('Payment capture error:', err)
              setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
              setProcessing(false)
            }
          },

          onError: (err: unknown) => {
            console.error('PayPal error:', err)
            setError('Something went wrong with PayPal. Please try again.')
            setProcessing(false)
          },

          onCancel: () => {
            setError(null)
            setProcessing(false)
          },
        })

        if (typeof buttons.isEligible === 'function' && !buttons.isEligible()) {
          if (mountedRef.current) {
            setError('PayPal is not available. Try a different browser or disable content blockers.')
          }
          return
        }

        await buttons.render('#event-paypal-button-container')

        if (mountedRef.current) {
          setError(null)
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        if (/zoid|destroyed/i.test(errMsg)) return
        if (mountedRef.current) {
          console.error('Error rendering PayPal buttons:', err)
          setError(`Failed to load PayPal: ${errMsg}`)
        }
      }
    }

    if (!clientId) {
      setError('PayPal is not configured. Please contact support.')
      setLoading(false)
      return
    }

    if (window.paypal) {
      setLoading(false)
      renderButtons()
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&enable-funding=applepay,venmo&disable-funding=credit`
    script.async = true
    script.onload = () => {
      if (!mountedRef.current) return
      if (!window.paypal?.Buttons) {
        setError('PayPal SDK loaded but did not initialize. Try disabling content blockers.')
        setLoading(false)
        return
      }
      setLoading(false)
      renderButtons()
    }
    script.onerror = () => {
      if (!mountedRef.current) return
      setError('Failed to load PayPal SDK. Check network/content-blocker settings.')
      setLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      mountedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, registrationId, session?.user?.id])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!registrationId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Missing Registration</h2>
          <p className="text-gray-600 mb-6">No registration found. Please register for the event first.</p>
          <Link href="/aprilevent" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re In!</h2>
          <p className="text-gray-600 mb-6">
            Your spot for the Singles Zoom Mixer on April 5 is confirmed.
            We&apos;ll send you event details before the day.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-8 px-4">
      <div className="max-w-md mx-auto">
        <Link href="/aprilevent" className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Event
        </Link>

        {/* Event Summary */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Singles Zoom Mixer</h2>
              <p className="text-purple-200 text-sm">Vegetarian Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-100">
            <Calendar className="h-4 w-4" />
            <span>April 5, 2026 &bull; 6:00 PM PT &bull; Ages 29-35</span>
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Complete Payment
          </h2>

          <div className="text-center mb-5">
            <div className="text-4xl font-bold text-gray-900">$25</div>
            <p className="text-xs text-gray-500 mt-1">One-time event fee</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={() => {
                      setError(null)
                      window.location.reload()
                    }}
                    className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium underline underline-offset-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
              <span className="text-gray-600 text-sm">Loading PayPal...</span>
            </div>
          )}

          {processing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
              <span className="text-gray-600 text-sm">Processing payment...</span>
            </div>
          )}

          <div
            id="event-paypal-button-container"
            ref={buttonContainerRef}
            className={loading || processing ? 'hidden' : 'mb-4'}
          />

          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Secure Payment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">PayPal Protected</span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500">
              Powered by PayPal. Your payment is secure and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <EventPaymentContent />
    </Suspense>
  )
}
