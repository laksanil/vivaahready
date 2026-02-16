'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  Lock,
  Shield,
  CreditCard,
  CheckCircle,
  Calendar,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { MARCH_EVENT_CONFIG } from '@/lib/marchEventConfig'
import {
  getSquareAppIdConfigError,
  getSquareSdkUrl,
  resolveSquareWebEnvironment,
} from '@/lib/squareClientConfig'

// Square SDK types
interface Square {
  payments: (appId: string, locationId: string) => Promise<Payments>
}

interface Payments {
  card: () => Promise<Card>
  verifyBuyer: (
    sourceId: string,
    verificationDetails: VerificationDetails
  ) => Promise<{ token: string }>
}

interface Card {
  attach: (elementId: string) => Promise<void>
  tokenize: () => Promise<TokenizeResult>
  destroy: () => Promise<void>
}

interface TokenizeResult {
  status: 'OK' | 'ERROR'
  token?: string
  errors?: Array<{ message: string }>
}

interface VerificationDetails {
  amount: string
  billingContact: {
    givenName?: string
    familyName?: string
    email?: string
  }
  currencyCode: string
  intent: 'CHARGE'
}

declare global {
  interface Window {
    Square?: Square
  }
}

function PaymentContent() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registrationId')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const cardRef = useRef<Card | null>(null)
  const paymentsRef = useRef<Payments | null>(null)

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || ''
  const environment = resolveSquareWebEnvironment(
    appId,
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT
  )
  const amount = MARCH_EVENT_CONFIG.priceDollars

  // Redirect if no registration ID
  useEffect(() => {
    if (!registrationId) {
      router.replace('/marchevent')
    }
  }, [registrationId, router])

  // Redirect if not logged in
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/marchevent')
    }
  }, [sessionStatus, router])

  // Load Square SDK
  useEffect(() => {
    const appIdConfigError = getSquareAppIdConfigError(appId)
    if (appIdConfigError) {
      setError(`${appIdConfigError} Please contact support.`)
      setLoading(false)
      return
    }

    if (window.Square) {
      setSdkLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = getSquareSdkUrl(environment)
    script.async = true
    script.onload = () => setSdkLoaded(true)
    script.onerror = () => setError('Failed to load payment SDK')
    document.body.appendChild(script)

    return () => {
      if (cardRef.current) {
        cardRef.current.destroy().catch(console.error)
      }
    }
  }, [environment, appId])

  // Initialize card form
  useEffect(() => {
    if (!sdkLoaded || !window.Square) return

    const initializeCard = async () => {
      try {
        const locationRes = await fetch('/api/square/location')
        const locationData = await locationRes.json().catch(() => ({}))

        if (!locationRes.ok) {
          throw new Error(locationData?.error || 'Could not get payment location')
        }

        if (!locationData.locationId) {
          throw new Error('Could not get payment location')
        }

        const payments = await window.Square!.payments(appId, locationData.locationId)
        paymentsRef.current = payments

        const card = await payments.card()
        await card.attach('#card-container')
        cardRef.current = card
        setLoading(false)
      } catch (err) {
        console.error('Error initializing payment:', err)
        setError('Failed to initialize payment form. Please refresh and try again.')
        setLoading(false)
      }
    }

    initializeCard()
  }, [sdkLoaded, appId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardRef.current || !paymentsRef.current || !registrationId) {
      setError('Payment form not ready')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Tokenize the card
      const tokenizeResult = await cardRef.current.tokenize()

      if (tokenizeResult.status !== 'OK' || !tokenizeResult.token) {
        const errorMessage = tokenizeResult.errors?.[0]?.message || 'Card validation failed'
        setError(errorMessage)
        setProcessing(false)
        return
      }

      // Verify buyer
      const verificationResult = await paymentsRef.current.verifyBuyer(
        tokenizeResult.token,
        {
          amount: amount.toFixed(2),
          billingContact: {
            givenName: session?.user?.name?.split(' ')[0] || undefined,
            familyName: session?.user?.name?.split(' ').slice(1).join(' ') || undefined,
            email: session?.user?.email || undefined,
          },
          currencyCode: 'USD',
          intent: 'CHARGE',
        }
      )

      // Process payment
      const response = await fetch('/api/events/march-2025/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          sourceId: tokenizeResult.token,
          verificationToken: verificationResult.token,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment failed')
      }

      // Success!
      setSuccess(true)
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You're Registered!
            </h1>
            <p className="text-gray-600 mb-6">
              Your spot is confirmed for the Singles Zoom Meetup on March 15th, 2026 at 10 AM PDT.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span className="text-gray-900 font-medium">March 15, 2026</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-600" />
                <span className="text-gray-900 font-medium">10:00 AM PST</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              You will receive a confirmation email shortly. The Zoom link will be sent 1 hour before the event.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Back link */}
        <Link
          href="/marchevent"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Event
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600 text-sm mt-1">
              Singles Zoom Meetup - March 15, 2026
            </p>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
            <div className="text-3xl font-bold text-gray-900">${amount}</div>
            <p className="text-sm text-gray-500">Registration Fee</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-1 text-sm text-red-700 hover:text-red-800 font-medium underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
              <span className="text-gray-600">Loading payment form...</span>
            </div>
          )}

          {/* Payment form */}
          <form onSubmit={handleSubmit} className={loading ? 'hidden' : ''}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Card Details
              </label>
              <div
                id="card-container"
                className="min-h-[50px] border border-gray-300 rounded-lg p-3 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={processing || loading}
              className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="h-5 h-5" />
                  Pay ${amount}
                </>
              )}
            </button>
          </form>

          {/* Trust badges */}
          <div className="border-t border-gray-100 pt-4 mt-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Encrypted</span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500">
              Powered by Square. Your payment details are secure.
            </p>
          </div>

          {/* Refund policy */}
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Refund Policy:</strong> Full refund if cancelled 48+ hours before the event. No refund within 48 hours.
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
