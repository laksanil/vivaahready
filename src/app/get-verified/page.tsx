'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Check,
} from 'lucide-react'
import { PayPalPaymentForm } from '@/components/PayPalPaymentForm'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

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
  const [pricing, setPricing] = useState<{ price: number; isPromo: boolean; regularPrice: number } | null>(null)

  const isLoggedIn = status === 'authenticated'
  const hasProfile = (session?.user as { hasProfile?: boolean })?.hasProfile

  // Fetch current pricing
  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(() => setPricing({ price: 50, isPromo: false, regularPrice: 50 }))
  }, [])

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

  // Determine what CTA to show
  const showPayment = isLoggedIn && hasProfile && hasPaid === false
  const showRegisterLink = !isLoggedIn
  const showAlreadyPaid = isLoggedIn && hasProfile && hasPaid === true
  const showCompleteProfile = isLoggedIn && !hasProfile

  return (
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
                  {new Date() < new Date('2026-03-01T00:00:00') ? (
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">Founding Member:</span>{' '}
                      <span className="text-amber-700">$50 until March 1, 2026</span>
                      <span className="mx-1.5 text-amber-400">•</span>
                      <span className="text-amber-600">$100 after</span>
                      <span className="text-amber-500 ml-1">(one-time)</span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">One-time verification fee:</span>{' '}
                      <span className="text-amber-700">$100</span>
                      <span className="text-amber-500 ml-1">(one-time, no subscription)</span>
                    </p>
                  )}
                  <p className="text-xs text-amber-600 mt-0.5">
                    Helps keep VivaahReady private and spam-free.
                  </p>
                </div>
              </div>

              {/* Right: Payment Card or What Unlocks */}
              {showPayment ? (
                IS_PRODUCTION ? (
                  <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-lg">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4 text-center">
                      Complete Verification
                    </h2>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-stone-900">${pricing?.price || 50}</div>
                      <p className="text-xs text-stone-500 mt-1">One-time payment</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💸</span>
                        <span className="font-semibold text-purple-900">Pay with Zelle</span>
                      </div>
                      <p className="text-sm text-purple-800 mb-3">
                        Send <span className="font-bold">${pricing?.price || 50}.00</span> via Zelle to:
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-purple-200 text-center">
                        <p className="text-lg font-mono font-bold text-stone-900">5103968605</p>
                        <p className="text-xs text-stone-500 mt-1">Phone number</p>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs text-purple-700 flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          Open your banking app and send via Zelle
                        </p>
                        <p className="text-xs text-purple-700 flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          Add your VR ID (e.g. VR20260213030) in the Zelle note
                        </p>
                        <p className="text-xs text-purple-700 flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          Verification activates within 24 hours
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-stone-100 pt-4 mt-4">
                      <div className="flex items-center justify-center gap-4 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Lock className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-stone-500" />
                          <span className="text-xs font-medium text-stone-600">Bank Protected</span>
                        </div>
                      </div>
                      <p className="text-center text-xs text-stone-500">
                        Zelle payments are sent directly through your bank. Fast, free, and secure.
                      </p>
                    </div>
                  </div>
                ) : (
                  <PayPalPaymentForm
                      amount={pricing?.price || 50}
                      onSuccess={() => router.push('/dashboard')}
                    />
                )
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
            ) : showPayment ? (
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
  )
}
