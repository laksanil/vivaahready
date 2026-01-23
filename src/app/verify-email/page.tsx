'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Mail, Loader2, CheckCircle, ArrowRight } from 'lucide-react'

export default function VerifyEmailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [code, setCode] = useState(['', '', '', ''])
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      checkVerificationStatus()
    }
  }, [session])

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('/api/user/verification-status')
      if (response.ok) {
        const data = await response.json()
        setUserEmail(data.email || '')

        // If already verified, redirect to profile
        if (data.emailVerified) {
          setIsAlreadyVerified(true)
        }
      }
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

  const sendCode = async () => {
    setSending(true)
    setError('')
    try {
      const response = await fetch('/api/verify/email/send', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        setCodeSent(true)
        // Focus first input
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        if (data.error === 'Email already verified') {
          setIsAlreadyVerified(true)
        } else {
          setError(data.error || 'Failed to send code')
        }
      }
    } catch {
      setError('Failed to send verification code')
    } finally {
      setSending(false)
    }
  }

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)

    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    setError('')

    // Auto-advance to next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3 && newCode.every(d => d)) {
      verifyCode(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length === 4) {
      const newCode = pastedData.split('')
      setCode(newCode)
      verifyCode(pastedData)
    }
  }

  const verifyCode = async (codeString: string) => {
    setVerifying(true)
    setError('')
    try {
      const response = await fetch('/api/verify/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: codeString }),
      })
      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to profile creation after short delay
        setTimeout(() => {
          router.push('/profile?fromVerification=true')
        }, 1500)
      } else {
        setError(data.error || 'Invalid code')
        setCode(['', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('Failed to verify code')
    } finally {
      setVerifying(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Already verified - show success and redirect
  if (isAlreadyVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Already Verified</h1>
          <p className="text-gray-600 mb-6">Your email is already verified. You can continue to create your profile.</p>
          <button
            onClick={() => router.push('/profile')}
            className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            Continue to Profile
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-4">Redirecting you to create your profile...</p>
          <Loader2 className="h-6 w-6 animate-spin text-primary-600 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">
            {codeSent
              ? `We sent a 4-digit code to ${userEmail}`
              : 'Verify your email to continue creating your profile'}
          </p>
        </div>

        {!codeSent ? (
          // Send code button
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                We&apos;ll send a verification code to:
              </p>
              <p className="font-medium text-gray-900 mt-1">{userEmail}</p>
            </div>

            <button
              onClick={sendCode}
              disabled={sending}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}
          </div>
        ) : (
          // Code input
          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={verifying}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 disabled:opacity-50 transition-colors"
                  maxLength={1}
                />
              ))}
            </div>

            {verifying && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Didn&apos;t receive the code?</p>
              <button
                onClick={sendCode}
                disabled={sending}
                className="text-primary-600 font-medium hover:underline disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            By verifying your email, you confirm that you have access to this email address and agree to receive important notifications about your profile.
          </p>
        </div>
      </div>
    </div>
  )
}
