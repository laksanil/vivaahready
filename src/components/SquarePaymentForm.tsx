'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Lock, Shield, CreditCard } from 'lucide-react'

// Square Web Payments SDK types
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

interface SquarePaymentFormProps {
  amount: number
  userEmail?: string | null
  userName?: string | null
  onSuccess?: () => void
}

export function SquarePaymentForm({
  amount,
  userEmail,
  userName,
  onSuccess,
}: SquarePaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const cardRef = useRef<Card | null>(null)
  const paymentsRef = useRef<Payments | null>(null)

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || ''
  const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox'

  // Load Square SDK
  useEffect(() => {
    if (window.Square) {
      setSdkLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'
    script.async = true
    script.onload = () => setSdkLoaded(true)
    script.onerror = () => setError('Failed to load payment SDK')
    document.body.appendChild(script)

    return () => {
      // Cleanup card on unmount
      if (cardRef.current) {
        cardRef.current.destroy().catch(console.error)
      }
    }
  }, [environment])

  // Initialize card form when SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || !window.Square) return

    const initializeCard = async () => {
      try {
        // Get location ID from our API
        const locationRes = await fetch('/api/square/location')
        const locationData = await locationRes.json()

        if (!locationData.locationId) {
          throw new Error('Could not get Square location')
        }

        const payments = await window.Square!.payments(appId, locationData.locationId)
        paymentsRef.current = payments

        const card = await payments.card()
        await card.attach('#card-container')
        cardRef.current = card
        setLoading(false)
      } catch (err) {
        console.error('Error initializing Square:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to initialize payment form: ${errorMessage}`)
        setLoading(false)
      }
    }

    initializeCard()
  }, [sdkLoaded, appId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardRef.current || !paymentsRef.current) {
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

      // Verify the buyer (3D Secure / Strong Customer Authentication)
      const verificationResult = await paymentsRef.current.verifyBuyer(
        tokenizeResult.token,
        {
          amount: amount.toFixed(2),
          billingContact: {
            givenName: userName?.split(' ')[0] || undefined,
            familyName: userName?.split(' ').slice(1).join(' ') || undefined,
            email: userEmail || undefined,
          },
          currencyCode: 'USD',
          intent: 'CHARGE',
        }
      )

      // Send payment to our API
      const response = await fetch('/api/square/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: tokenizeResult.token,
          verificationToken: verificationResult.token,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment failed')
      }

      // Success!
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard?verified=true')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-lg">
      <h2 className="text-lg font-semibold text-stone-900 mb-4 text-center">
        Complete Verification
      </h2>

      {/* Price */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-stone-900">${amount}</div>
        <p className="text-xs text-stone-500 mt-1">One-time payment</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium underline underline-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
          <span className="text-stone-600 text-sm">Loading payment form...</span>
        </div>
      )}

      {/* Payment form */}
      <form onSubmit={handleSubmit} className={loading ? 'hidden' : ''}>
        {/* Card input container - Square will render the card form here */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            <CreditCard className="h-4 w-4 inline mr-1" />
            Card Details
          </label>
          <div
            id="card-container"
            className="min-h-[50px] border border-stone-300 rounded-lg p-3 bg-white"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={processing || loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-stone-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay ${amount}
            </>
          )}
        </button>
      </form>

      {/* Trust badges */}
      <div className="border-t border-stone-100 pt-4 mt-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Secure Payment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-stone-500" />
            <span className="text-xs font-medium text-stone-600">All Cards Accepted</span>
          </div>
        </div>
        <p className="text-center text-xs text-stone-500">
          Powered by Square. Your card details are encrypted and secure.
        </p>
      </div>
    </div>
  )
}
