'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Lock, Shield } from 'lucide-react'

// PayPal SDK types
interface PayPalButtonsInstance {
  close: () => void
}

interface PayPalActions {
  restart: () => void
}

interface PayPalButtons {
  (options: {
    style?: Record<string, string>
    createOrder: () => Promise<string>
    onApprove: (data: { orderID: string }, actions: PayPalActions) => Promise<void>
    onError: (err: unknown) => void
    onCancel: () => void
  }): { render: (selector: string) => Promise<PayPalButtonsInstance> }
}

interface PayPalNamespace {
  Buttons: PayPalButtons
}

declare global {
  interface Window {
    paypal?: PayPalNamespace
  }
}

interface PayPalPaymentFormProps {
  amount: number
  userEmail?: string | null
  userName?: string | null
  onSuccess?: () => void
}

export function PayPalPaymentForm({
  amount,
  onSuccess,
}: PayPalPaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const buttonsInstanceRef = useRef<PayPalButtonsInstance | null>(null)

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

  const renderButtons = useCallback(async () => {
    if (!window.paypal || !buttonContainerRef.current) return

    // Clear previous buttons
    if (buttonsInstanceRef.current) {
      buttonsInstanceRef.current.close()
      buttonsInstanceRef.current = null
    }
    buttonContainerRef.current.innerHTML = ''

    try {
      const instance = await window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: '48',
        },

        createOrder: async () => {
          setError(null)
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
              throw new Error(result.error || 'Payment capture failed')
            }

            // Success
            if (onSuccess) {
              onSuccess()
            } else {
              router.push('/dashboard?verified=true')
            }
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
      }).render('#paypal-button-container')

      buttonsInstanceRef.current = instance
    } catch (err) {
      console.error('Error rendering PayPal buttons:', err)
      setError('Failed to load PayPal. Please refresh the page.')
    }
  }, [onSuccess, router])

  // Load PayPal SDK
  useEffect(() => {
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
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&disable-funding=credit,card`
    script.async = true
    script.onload = () => {
      setLoading(false)
      renderButtons()
    }
    script.onerror = () => {
      setError('Failed to load PayPal SDK')
      setLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      if (buttonsInstanceRef.current) {
        buttonsInstanceRef.current.close()
      }
    }
  }, [clientId, renderButtons])

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
          <span className="text-stone-600 text-sm">Loading PayPal...</span>
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
          <span className="text-stone-600 text-sm">Processing payment...</span>
        </div>
      )}

      {/* PayPal button container */}
      <div
        id="paypal-button-container"
        ref={buttonContainerRef}
        className={loading || processing ? 'hidden' : 'mb-4'}
      />

      {/* Trust badges */}
      <div className="border-t border-stone-100 pt-4 mt-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Secure Payment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-stone-500" />
            <span className="text-xs font-medium text-stone-600">PayPal Protected</span>
          </div>
        </div>
        <p className="text-center text-xs text-stone-500">
          Powered by PayPal. Your payment is secure and protected.
        </p>
      </div>
    </div>
  )
}
