'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Lock,
  Eye,
  Heart,
  MessageCircle,
  ChevronDown,
  ArrowRight,
  UserCheck,
  CheckCircle,
  Users,
  Loader2,
  AlertCircle,
  CreditCard,
  Check,
} from 'lucide-react'

// PayPal Client ID from environment variable (public, safe to expose in frontend)
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AQaudKo50ofbHjXkE91kbhzdPGji-Jk9b1tMzG89KjhROwnvZLVv6DKXZUAK99ZvJQvxDa-X_LFLwrfD'

// FAQ Accordion Item
function FAQItem({ question, answer, defaultOpen = false }: {
  question: string
  answer: string
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-stone-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-stone-800 pr-4">{question}</span>
        <ChevronDown className={`h-4 w-4 text-stone-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-3 pr-8">
          <p className="text-stone-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

// Trust chip component
function TrustChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-full text-xs text-stone-600">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  )
}

export default function GetVerifiedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasPaid, setHasPaid] = useState<boolean | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paypalContainerRef = useRef<HTMLDivElement>(null)
  const buttonsRendered = useRef(false)

  const isLoggedIn = status === 'authenticated'
  const hasProfile = (session?.user as { hasProfile?: boolean })?.hasProfile

  // Check payment status for logged-in users
  useEffect(() => {
    if (isLoggedIn && hasProfile) {
      fetch('/api/payment/status')
        .then(res => res.json())
        .then(data => {
          setHasPaid(data.hasPaid === true)
        })
        .catch(() => setHasPaid(false))
        .finally(() => setCheckingStatus(false))
    } else {
      setCheckingStatus(false)
    }
  }, [isLoggedIn, hasProfile])

  // Render PayPal buttons when SDK is loaded
  useEffect(() => {
    if (paypalLoaded && isLoggedIn && hasProfile && hasPaid === false && paypalContainerRef.current && !buttonsRendered.current) {
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
              const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID }),
              })
              const result = await response.json()

              if (result.success) {
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
  }, [paypalLoaded, isLoggedIn, hasProfile, hasPaid, router])

  // Determine what CTA to show
  const showPayPal = isLoggedIn && hasProfile && hasPaid === false
  const showRegisterLink = !isLoggedIn
  const showAlreadyPaid = isLoggedIn && hasProfile && hasPaid === true
  const showCompleteProfile = isLoggedIn && !hasProfile

  return (
    <>
      {/* PayPal SDK Script - only load if needed */}
      {showPayPal && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`}
          onLoad={() => setPaypalLoaded(true)}
        />
      )}

      <div className="bg-white min-h-screen">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <span className="font-semibold text-stone-900 text-sm">Get Verified</span>
            {showRegisterLink && (
              <Link
                href="/register"
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-full font-medium text-sm transition-colors"
              >
                Create Profile
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            )}
            {showAlreadyPaid && (
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full font-medium text-sm transition-colors"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Already Verified
              </Link>
            )}
            {showCompleteProfile && (
              <Link
                href="/profile/complete"
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-full font-medium text-sm transition-colors"
              >
                Complete Profile
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Hero Section - Compact */}
        <section className="bg-gradient-to-b from-stone-50 to-white">
          <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
              {/* Left: Main Content */}
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900 leading-tight mb-2">
                  Get Verified
                </h1>
                <p className="text-stone-600 text-base mb-4">
                  Unlock full photos and send interests with confidence.
                </p>

                {/* Key Benefits - Compact bullets */}
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2 text-sm text-stone-700">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>See full photos, names, and profile details</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-stone-700">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Send and receive interest requests</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-stone-700">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Message after mutual acceptance</span>
                  </li>
                </ul>

                {/* CTA Section - Different based on user state */}
                {status === 'loading' || checkingStatus ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                    <span className="text-sm text-stone-600">Loading...</span>
                  </div>
                ) : showRegisterLink ? (
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Link
                      href="/register"
                      className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all"
                    >
                      Create Profile First
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <a
                      href="#how-it-works"
                      className="text-sm text-stone-600 hover:text-primary-600 underline underline-offset-2"
                    >
                      Learn how it works
                    </a>
                  </div>
                ) : showCompleteProfile ? (
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Link
                      href="/profile/complete"
                      className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all"
                    >
                      Complete Your Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                ) : showAlreadyPaid ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">You&apos;re already verified!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Your profile is pending admin approval or already approved.
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center mt-3 text-green-700 hover:text-green-800 font-medium text-sm"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                ) : null}

                {/* Founding Member Pricing - Discreet inline */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">Founding Member:</span>{' '}
                    <span className="text-amber-700">$50 until March 1, 2026</span>
                    <span className="mx-1.5 text-amber-400">•</span>
                    <span className="text-amber-600">$100 after</span>
                    <span className="text-amber-500 ml-1">(one-time)</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Helps keep VivaahReady private and spam-free.
                  </p>
                </div>
              </div>

              {/* Right: Payment Card or What Unlocks */}
              {showPayPal ? (
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-lg">
                  <h2 className="text-lg font-semibold text-stone-900 mb-4 text-center">Complete Verification</h2>

                  {/* Price */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-stone-900">$50</div>
                    <p className="text-xs text-stone-500 mt-1">One-time payment</p>
                  </div>

                  {/* Error message with retry button */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-red-800">{error}</p>
                          <button
                            onClick={() => {
                              setError(null)
                              setProcessing(false)
                              // Re-render PayPal buttons by resetting the ref
                              buttonsRendered.current = false
                              if (paypalContainerRef.current) {
                                paypalContainerRef.current.innerHTML = ''
                              }
                              // Trigger re-render
                              setPaypalLoaded(false)
                              setTimeout(() => setPaypalLoaded(true), 100)
                            }}
                            className="mt-2 inline-flex items-center text-sm text-red-700 hover:text-red-800 font-medium underline underline-offset-2"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing state */}
                  {processing && (
                    <div className="flex items-center justify-center py-3 mb-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary-600 mr-2" />
                      <span className="text-stone-600 text-sm">Processing...</span>
                    </div>
                  )}

                  {/* PayPal Button Container */}
                  <div className="mb-4">
                    {!paypalLoaded ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-600 mr-2" />
                        <span className="text-stone-600 text-sm">Loading payment...</span>
                      </div>
                    ) : (
                      <div ref={paypalContainerRef} className="paypal-button-container" />
                    )}
                  </div>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      <span>Cards accepted</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                  <h2 className="text-sm font-semibold text-stone-900 mb-3">What verification unlocks</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Eye, label: 'Full photos' },
                      { icon: Heart, label: 'Send interests' },
                      { icon: MessageCircle, label: 'Messaging' },
                      { icon: UserCheck, label: 'Accept interests' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                        <item.icon className="h-4 w-4 text-primary-600" />
                        <span className="text-xs text-stone-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Trust Strip - Single row compact chips */}
        <section className="border-y border-stone-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
              <TrustChip icon={Shield} label="Phone verified" />
              <TrustChip icon={Users} label="Mutual interest only" />
              <TrustChip icon={Lock} label="Privacy-first" />
            </div>
          </div>
        </section>

        {/* How It Works - Compact 4-step row */}
        <section id="how-it-works" className="py-5 md:py-6 bg-stone-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-base font-semibold text-stone-900 text-center mb-4">How it works</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                { step: '1', title: 'Create profile', icon: '👤' },
                { step: '2', title: 'Request verification', icon: '📝' },
                { step: '3', title: 'Verification check', icon: '✓' },
                { step: '4', title: 'Start connecting', icon: '💬' },
              ].map((item, index) => (
                <div key={item.step} className="relative text-center p-3 bg-white rounded-lg border border-stone-200">
                  <div className="inline-flex items-center justify-center w-7 h-7 bg-primary-100 text-primary-700 rounded-full text-xs font-bold mb-1.5">
                    {item.step}
                  </div>
                  <p className="text-xs font-medium text-stone-800">{item.title}</p>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-stone-300">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Section - 2 lines only */}
        <section className="py-4 md:py-5 bg-white border-b border-stone-100">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-stone-900">Your privacy is protected</span>
            </div>
            <p className="text-xs text-stone-600">
              Photos, name, and contact details stay hidden until verification + mutual acceptance.
            </p>
          </div>
        </section>

        {/* FAQ - Collapsible Accordion */}
        <section className="py-5 md:py-6 bg-white">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-base font-semibold text-stone-900 text-center mb-4">Common questions</h2>
            <div className="border border-stone-200 rounded-lg px-4 divide-y divide-stone-200">
              <FAQItem
                question="Is this a monthly subscription?"
                answer="No. It's a one-time verification fee with no recurring charges or subscriptions."
              />
              <FAQItem
                question="What unlocks after verification?"
                answer="You can see full photos and names, send and receive interest requests, and message matches after mutual acceptance."
              />
              <FAQItem
                question="Are my interests private?"
                answer="Yes. When you express interest, only the recipient sees it. Others cannot see who you've expressed interest in."
              />
              <FAQItem
                question="Can I verify later?"
                answer="Yes. You can browse matches without verification. Verification is required to send interests or accept them."
              />
            </div>
          </div>
        </section>

        {/* Bottom CTA Bar - Compact */}
        <section className="py-5 md:py-6 bg-gradient-to-b from-stone-50 to-stone-100 border-t border-stone-200">
          <div className="max-w-2xl mx-auto px-4 text-center">
            {showRegisterLink ? (
              <Link
                href="/register"
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : showAlreadyPaid ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                <Check className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            ) : showPayPal ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Complete Payment Above
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
            <p className="mt-3 text-xs text-stone-500">
              One-time fee &middot; No subscriptions &middot; Full access
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
