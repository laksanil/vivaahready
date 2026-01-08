'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { Suspense } from 'react'

function PaymentSuccessContent() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'verifying' | 'creating' | 'success' | 'error'>('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId || !session?.user?.id) return

    const processPayment = async () => {
      try {
        // Step 1: Verify payment with Stripe
        const verifyRes = await fetch(`/api/stripe/profile-payment?session_id=${sessionId}`)
        const verifyData = await verifyRes.json()

        if (!verifyData.paid) {
          setError('Payment not completed. Please try again.')
          setStatus('error')
          return
        }

        setStatus('creating')

        // Step 2: Get profile data from localStorage
        const storedData = localStorage.getItem('profileFormData')
        if (!storedData) {
          setError('Profile data not found. Please fill out the form again.')
          setStatus('error')
          return
        }

        const profileData = JSON.parse(storedData)

        // Step 3: Create the profile
        const createRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...profileData,
            paymentId: verifyData.paymentId,
          }),
        })

        if (!createRes.ok) {
          const createData = await createRes.json()
          setError(createData.error || 'Failed to create profile')
          setStatus('error')
          return
        }

        // Step 4: Clear localStorage
        localStorage.removeItem('profileFormData')

        // Step 5: Update session to reflect new profile
        await updateSession()

        setStatus('success')

        // Step 6: Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard?profileCreated=true')
        }, 3000)
      } catch (err) {
        console.error('Payment processing error:', err)
        setError('Something went wrong. Please contact support.')
        setStatus('error')
      }
    }

    processPayment()
  }, [sessionId, session?.user?.id])

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Please sign in to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'creating' && (
          <>
            <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Profile</h1>
            <p className="text-gray-600">Almost there! Setting up your profile...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Created!</h1>
            <p className="text-gray-600 mb-6">
              Your profile is now live. Start connecting with potential matches!
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-600">
              <span>Redirecting to dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/profile/create')}
                className="btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
