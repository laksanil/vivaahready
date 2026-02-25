'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Send,
  Shield,
} from 'lucide-react'

export default function VerifyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [profileApproved, setProfileApproved] = useState(false)

  // Email verification state
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailVerifying, setEmailVerifying] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  // Phone verification state
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneSending, setPhoneSending] = useState(false)
  const [phoneVerifying, setPhoneVerifying] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchUserStatus()
    }
  }, [session])

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/user/verification-status')
      if (response.ok) {
        const data = await response.json()
        setUserEmail(data.email || '')
        setUserPhone(data.phone || '')
        setEmailVerified(!!data.emailVerified)
        setPhoneVerified(!!data.phoneVerified)
        setProfileApproved(data.approvalStatus === 'approved')
      }
    } catch (error) {
      console.error('Error fetching user status:', error)
    }
  }

  const sendEmailOtp = async () => {
    setEmailSending(true)
    setEmailError('')
    setEmailSuccess('')
    try {
      const response = await fetch('/api/verify/email/send', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        setEmailOtpSent(true)
        setEmailSuccess('Verification code sent to your email!')
      } else {
        setEmailError(data.error || 'Failed to send verification code')
      }
    } catch (error) {
      setEmailError('Failed to send verification code')
    } finally {
      setEmailSending(false)
    }
  }

  const verifyEmailOtp = async () => {
    setEmailVerifying(true)
    setEmailError('')
    try {
      const response = await fetch('/api/verify/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: emailOtp }),
      })
      const data = await response.json()

      if (response.ok) {
        setEmailVerified(true)
        setEmailSuccess('Email verified successfully!')
        setEmailOtp('')
        setEmailOtpSent(false)
      } else {
        setEmailError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setEmailError('Failed to verify code')
    } finally {
      setEmailVerifying(false)
    }
  }

  const sendPhoneOtp = async () => {
    setPhoneSending(true)
    setPhoneError('')
    setPhoneSuccess('')
    try {
      const response = await fetch('/api/verify/phone/send', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        setPhoneOtpSent(true)
        setPhoneSuccess('Verification code sent to your phone!')
      } else {
        setPhoneError(data.error || 'Failed to send verification code')
      }
    } catch (error) {
      setPhoneError('Failed to send verification code')
    } finally {
      setPhoneSending(false)
    }
  }

  const verifyPhoneOtp = async () => {
    setPhoneVerifying(true)
    setPhoneError('')
    try {
      const response = await fetch('/api/verify/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: phoneOtp }),
      })
      const data = await response.json()

      if (response.ok) {
        setPhoneVerified(true)
        setPhoneSuccess('Phone verified successfully!')
        setPhoneOtp('')
        setPhoneOtpSent(false)
      } else {
        setPhoneError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setPhoneError('Failed to verify code')
    } finally {
      setPhoneVerifying(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-silver-50 to-silver-100 py-8">
      <div className="w-full px-4 md:px-8 xl:px-10">
        {/* Back Button */}
        <Link
          href="/matches"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Matches
        </Link>

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Account</h1>
          <p className="text-gray-600 mt-2">
            Verify your email and phone to unlock all features
          </p>
        </div>

        {/* Verification Status Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profileApproved ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {profileApproved ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <span className="text-gray-700">Profile Verified by Admin</span>
              </div>
              <span className={`text-sm font-medium ${
                profileApproved ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {profileApproved ? 'Verified' : 'Pending Review'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  emailVerified ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {emailVerified ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Mail className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <span className="text-gray-700">Email Verified</span>
              </div>
              <span className={`text-sm font-medium ${
                emailVerified ? 'text-green-600' : 'text-gray-400'
              }`}>
                {emailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  phoneVerified ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {phoneVerified ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Phone className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <span className="text-gray-700">Phone Verified</span>
              </div>
              <span className={`text-sm font-medium ${
                phoneVerified ? 'text-green-600' : 'text-gray-400'
              }`}>
                {phoneVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Email Verification */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              emailVerified ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <Mail className={`h-5 w-5 ${emailVerified ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email Verification</h2>
              <p className="text-sm text-gray-500">{userEmail || 'No email on file'}</p>
            </div>
          </div>

          {emailVerified ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <Check className="h-5 w-5" />
              <span className="font-medium">Your email is verified!</span>
            </div>
          ) : !userEmail ? (
            <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
              Please update your profile with an email address to verify.
            </div>
          ) : !emailOtpSent ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Click the button below to receive a verification code at your email address.
              </p>
              <button
                onClick={sendEmailOtp}
                disabled={emailSending}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {emailSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Send Verification Code
              </button>
              {emailError && (
                <p className="text-red-600 text-sm">{emailError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {emailSuccess && (
                <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                  {emailSuccess}
                </div>
              )}
              <p className="text-gray-600">
                Enter the 4-digit code sent to your email:
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter code"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                  maxLength={4}
                />
                <button
                  onClick={verifyEmailOtp}
                  disabled={emailVerifying || emailOtp.length !== 4}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {emailVerifying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
              {emailError && (
                <p className="text-red-600 text-sm">{emailError}</p>
              )}
              <button
                onClick={sendEmailOtp}
                disabled={emailSending}
                className="text-blue-600 text-sm hover:underline"
              >
                Resend code
              </button>
            </div>
          )}
        </div>

        {/* Phone Verification */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              phoneVerified ? 'bg-green-100' : 'bg-purple-100'
            }`}>
              <Phone className={`h-5 w-5 ${phoneVerified ? 'text-green-600' : 'text-purple-600'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Phone Verification</h2>
              <p className="text-sm text-gray-500">{userPhone || 'No phone on file'}</p>
            </div>
          </div>

          {phoneVerified ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <Check className="h-5 w-5" />
              <span className="font-medium">Your phone is verified!</span>
            </div>
          ) : !userPhone ? (
            <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
              Please update your profile with a phone number to verify.
            </div>
          ) : !phoneOtpSent ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Click the button below to receive a verification code via SMS.
              </p>
              <button
                onClick={sendPhoneOtp}
                disabled={phoneSending}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {phoneSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Send Verification Code
              </button>
              {phoneError && (
                <p className="text-red-600 text-sm">{phoneError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {phoneSuccess && (
                <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                  {phoneSuccess}
                </div>
              )}
              <p className="text-gray-600">
                Enter the 6-digit code sent to your phone:
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter code"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <button
                  onClick={verifyPhoneOtp}
                  disabled={phoneVerifying || phoneOtp.length !== 6}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {phoneVerifying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
              {phoneError && (
                <p className="text-red-600 text-sm">{phoneError}</p>
              )}
              <button
                onClick={sendPhoneOtp}
                disabled={phoneSending}
                className="text-purple-600 text-sm hover:underline"
              >
                Resend code
              </button>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Why verify?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>- Verified profiles appear more trustworthy to other members</li>
            <li>- You can express interest and connect with other profiles</li>
            <li>- Your verification badges are visible on your profile</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
