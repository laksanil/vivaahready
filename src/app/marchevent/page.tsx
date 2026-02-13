'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { EventChatbot } from '@/components/EventChatbot'
import FindMatchModal from '@/components/FindMatchModal'
import { MARCH_EVENT_CONFIG, getMarchEventDate } from '@/lib/marchEventConfig'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  CheckCircle,
  Leaf,
  Video,
  Shield,
  AlertCircle,
  Loader2,
  ChevronDown,
  Phone,
  MessageCircle,
  X,
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

// Event configuration
const EVENT_CONFIG = {
  title: 'Singles Zoom Mixer',
  subtitle: 'Vegetarian Edition',
  date: getMarchEventDate(),
  duration: '60-80',
  price: MARCH_EVENT_CONFIG.priceDollars,
  maxSeats: 20,
  minAttendees: 12,
  minAge: 24,
  maxAge: 35,
  location: 'California',
  dietary: 'Vegetarian',
  registrationDeadlineHours: 48,
}

function CountdownTimer({ targetDate, compact = false }: { targetDate: Date; compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (compact) {
    return (
      <div className="flex gap-2 justify-center text-sm">
        {[
          { value: timeLeft.days, label: 'd' },
          { value: timeLeft.hours, label: 'h' },
          { value: timeLeft.minutes, label: 'm' },
          { value: timeLeft.seconds, label: 's' },
        ].map((item, i) => (
          <span key={item.label} className="text-white/80">
            {i > 0 && <span className="mr-2">:</span>}
            <span className="font-semibold text-white">{String(item.value).padStart(2, '0')}</span>
            <span className="text-xs ml-0.5">{item.label}</span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Mins' },
        { value: timeLeft.seconds, label: 'Secs' },
      ].map((item) => (
        <div
          key={item.label}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[50px] sm:min-w-[60px]"
        >
          <div className="text-lg sm:text-xl font-semibold text-white">
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs text-white/60">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors px-2 -mx-2 rounded"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function MarchEventPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrationStatus, setRegistrationStatus] = useState<{
    isRegistered: boolean
    isWaitlisted: boolean
    maleCount: number
    femaleCount: number
    userEligibility?: {
      eligible: boolean
      reason?: string
      profileComplete: boolean
      ageEligible: boolean
      locationEligible: boolean
      dietEligible: boolean
    }
  } | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [whatsappOptIn, setWhatsappOptIn] = useState(true)
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [showFindMatchModal, setShowFindMatchModal] = useState(false)

  // Fetch registration status
  useEffect(() => {
    const fetchStatus = async () => {
      setCheckingStatus(true)
      try {
        const response = await fetch('/api/events/march-2025/status')
        if (response.ok) {
          const data = await response.json()
          setRegistrationStatus(data)
        }
      } catch (err) {
        console.error('Error fetching status:', err)
      } finally {
        setCheckingStatus(false)
      }
    }

    fetchStatus()
  }, [session])

  const handleCancelRegistration = async () => {
    if (!cancelReason.trim()) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch('/api/events/march-2025/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cancel registration')
        return
      }

      setCancelled(true)
      setShowCancelModal(false)
      setRegistrationStatus(prev => prev ? { ...prev, isRegistered: false } : null)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handleRegisterClick = async () => {
    if (status === 'loading' || checkingStatus) return

    // If not logged in, redirect to Google OAuth
    if (!session) {
      signIn('google', { callbackUrl: '/marchevent' })
      return
    }

    // Check if profile is complete - if not, show FindMatchModal
    if (!registrationStatus?.userEligibility?.profileComplete) {
      setShowFindMatchModal(true)
      return
    }

    // Proceed to registration - let the API handle eligibility checks
    setRegistering(true)
    setError(null)

    try {
      const response = await fetch('/api/events/march-2025/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappOptIn,
          smsOptIn,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If API says profile incomplete, show FindMatchModal
        if (data.redirectTo && data.redirectTo.includes('profile')) {
          setShowFindMatchModal(true)
          setRegistering(false)
          return
        }
        setError(data.error || 'Registration failed')
        return
      }

      if (data.paymentUrl) {
        // Redirect to payment
        window.location.href = data.paymentUrl
      } else if (data.waitlisted) {
        // Added to waitlist
        setRegistrationStatus(prev => prev ? { ...prev, isWaitlisted: true } : null)
      } else {
        // Successfully registered (free event or already paid)
        setRegistrationStatus(prev => prev ? { ...prev, isRegistered: true } : null)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  const scrollToRegistration = () => {
    document.getElementById('how-to-register')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToAgenda = () => {
    document.getElementById('what-happens')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isEventPast = new Date() > EVENT_CONFIG.date

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm mb-6">
              <Leaf className="w-4 h-4" />
              Indian Vegetarian Singles in California
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              {EVENT_CONFIG.title}
            </h1>
            <p className="text-lg sm:text-xl text-purple-200 mb-6">
              {EVENT_CONFIG.subtitle}
            </p>

            {/* Event Details - Scannable */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/80 text-sm mb-8">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>March 15, 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>10:00 AM PST</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                <span>Zoom</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>California</span>
              </div>
            </div>

            {/* Portrait Images */}
            <div className="flex justify-center items-center gap-6 mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-xl bg-gray-200">
                <img
                  src="/images/male_portrait.png"
                  alt="Male participant"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-300" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-xl bg-gray-200">
                <img
                  src="/images/female_portrait.png"
                  alt="Female participant"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Capacity Info - No gender promises */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
                <Users className="w-4 h-4 inline mr-1.5" />
                20 seats max
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
                Balanced attendance (best effort)
              </div>
            </div>

            {/* Countdown - Subtle */}
            {!isEventPast && (
              <div className="mb-8">
                <p className="text-white/50 text-xs mb-2">Event starts in</p>
                <CountdownTimer targetDate={EVENT_CONFIG.date} compact />
              </div>
            )}

            {/* Primary CTA */}
            <div className="space-y-4">
              <button
                onClick={handleRegisterClick}
                disabled={registering || status === 'loading' || isEventPast}
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering || status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : registrationStatus?.isRegistered ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    You're Registered
                  </>
                ) : registrationStatus?.isWaitlisted ? (
                  <>
                    <Clock className="w-5 h-5 text-amber-600" />
                    On Waitlist
                  </>
                ) : (
                  <>
                    Register — ${EVENT_CONFIG.price}
                  </>
                )}
              </button>

              {/* Secondary CTA */}
              <div>
                <button
                  onClick={scrollToAgenda}
                  className="text-white/70 hover:text-white text-sm underline underline-offset-4"
                >
                  See how it works
                </button>
              </div>

              {/* Trust Microcopy */}
              <p className="text-white/50 text-xs">
                No recording &bull; Moderated &bull; Contact shared only by mutual opt-in
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens Section */}
      <section id="what-happens" className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            What happens ({EVENT_CONFIG.duration} minutes)
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Structured, low-pressure conversations — not a random Zoom call.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="space-y-6">
              {[
                { time: '5 min', title: 'Welcome + how breakouts work' },
                { time: '12 min', title: 'Round 1 small-group breakout' },
                { time: '12 min', title: 'Round 2 small-group breakout' },
                { time: '15 min', title: 'Choose-your-room mingle' },
                { time: '5–10 min', title: 'Wrap + optional mutual opt-in to connect' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {item.time}
                    </span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <span className="text-gray-700">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
              We may end around 60 minutes or extend to ~80 based on the group's energy.
            </p>
          </div>
        </div>
      </section>

      {/* Hosted By Section */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-purple-100">
                  <img
                    src="/images/founder-lakshmi.jpg"
                    alt="Lakshmi - Founder of VivaahReady"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Hosted by Lakshmi</h3>
                <p className="text-purple-600 text-sm mb-3">Founder, VivaahReady (Bay Area)</p>
                <p className="text-gray-600 text-sm mb-4">
                  Built for serious, respectful Indian matchmaking with privacy first.
                </p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Read my story
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Safety Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Privacy & Safety
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            {/* What others see */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">What others see</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  First name (or first initial), age range
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  City (e.g., "San Jose"), diet
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Profession/field (optional)
                </li>
              </ul>
            </div>

            {/* Never shared */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <EyeOff className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Never shared</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  Last name, phone number, email
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  Exact address, employer
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  Social media handles
                </li>
              </ul>
            </div>
          </div>

          {/* Safety & After event */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Safety</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>No recording</li>
                <li>Waiting room enabled</li>
                <li>Moderated session + code of conduct</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-pink-500" />
                <h3 className="font-semibold text-gray-900">After the event</h3>
              </div>
              <p className="text-sm text-gray-600">
                Contact shared only by mutual opt-in (both people choose yes).
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Full details: <Link href="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>
          </p>
        </div>
      </section>

      {/* How to Register Section */}
      <section id="how-to-register" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            How to Register
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Takes ~5 minutes total
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                step: 1,
                title: 'Sign In',
                description: 'Secure sign-in (Google). We never post to your account.',
                color: 'from-blue-500 to-blue-600',
              },
              {
                step: 2,
                title: 'Add Profile',
                description: 'Add only the basics needed for this event (3–5 min).',
                helper: 'Your last name and contact info are not shown to attendees.',
                color: 'from-purple-500 to-purple-600',
              },
              {
                step: 3,
                title: 'Preferences',
                description: "Share what you're looking for — used to set up breakout rooms.",
                color: 'from-pink-500 to-pink-600',
              },
              {
                step: 4,
                title: 'Payment',
                description: 'Pay $25 securely to confirm your spot.',
                helper: 'Powered by Square',
                color: 'from-green-500 to-green-600',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200" />
                )}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center relative z-10 h-full">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3 text-white text-lg font-semibold shadow`}>
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                  {item.helper && (
                    <p className="text-gray-400 text-xs mt-2">{item.helper}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Registration Section */}
          <div className="mt-12 text-center">
            {registrationStatus?.isRegistered && !cancelled ? (
              <RegisteredState
                eventDate={EVENT_CONFIG.date}
                onCancelClick={() => setShowCancelModal(true)}
              />
            ) : cancelled ? (
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-medium">
                <AlertCircle className="w-5 h-5" />
                Registration Cancelled. Refund is being processed.
              </div>
            ) : registrationStatus?.isWaitlisted ? (
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-6 py-4 rounded-xl font-medium border border-amber-200">
                <Clock className="w-5 h-5" />
                You're on the Waitlist! We'll notify you if a spot opens.
              </div>
            ) : isEventPast ? (
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-4 rounded-xl font-medium">
                This event has ended
              </div>
            ) : (
              <div className="space-y-4">
                {/* Communication Opt-ins - Hidden until SMS/WhatsApp capability is ready
                {session && (
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappOptIn}
                        onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      WhatsApp reminders
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsOptIn}
                        onChange={(e) => setSmsOptIn(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <Phone className="w-4 h-4 text-blue-600" />
                      SMS reminders
                    </label>
                  </div>
                )}
                */}

                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg max-w-md mx-auto">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleRegisterClick}
                  disabled={registering || status === 'loading'}
                  className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering || status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : session ? (
                    <>
                      Register — ${EVENT_CONFIG.price}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500">
                  Registration closes 48 hours before the event
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            What to Expect
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: Users,
                title: 'Meet Indian vegetarian singles in CA',
                description: 'A small, curated group for real conversation — not endless swiping.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Shield,
                title: 'Safe & moderated',
                description: 'Hosted live with clear guidelines. We remove anyone who violates the code of conduct.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: Video,
                title: 'Structured Zoom format',
                description: 'Guided rounds + small groups, so you actually meet people — not awkward open mic.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: Heart,
                title: 'Mutual opt-in connections',
                description: 'No public sharing. Contact is exchanged only if both people opt in.',
                color: 'bg-pink-50 text-pink-600',
              },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            Who This Is For
          </h2>
          <p className="text-center text-gray-600 mb-10">
            This event is designed for a specific audience
          </p>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Age', value: `${EVENT_CONFIG.minAge}–${EVENT_CONFIG.maxAge} years` },
                { label: 'Location', value: 'California residents (currently living in CA)' },
                { label: 'Dietary', value: 'Vegetarian' },
                { label: 'Audience', value: 'Indian ethnicity (designed for Indian diaspora)' },
                { label: 'Profile', value: 'Basic profile required for the event' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</div>
                    <div className="text-gray-900 text-sm">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100 text-center">
              Designed for US-raised / ABCD-friendly vibe — but we welcome anyone in CA who fits the above.
            </p>
          </div>
        </div>
      </section>

      {/* Balance & Waitlist Policy */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Balance & Waitlist Policy
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                We aim for balanced attendance.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Seats are confirmed in registration order.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                If one side reaches capacity first, additional registrations may be placed on a waitlist.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                If we cannot confirm your seat, you will receive a full refund.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Event Guarantee */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-800 mb-2">Event Guarantee</h3>
            <p className="text-green-700 text-sm">
              Event runs with a minimum of {EVENT_CONFIG.minAttendees} confirmed attendees.
              If we don't reach the minimum, you'll receive a full refund.
            </p>
          </div>
        </div>
      </section>

      {/* Refund Policy */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-amber-800 mb-4">Refund Policy</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Cancel 48+ hours before:</strong> Full refund
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Within 48 hours:</strong> No refund (we've finalized breakout rooms)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>If we cancel due to minimum attendance:</strong> Full refund
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            Frequently Asked Questions
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <FAQItem
              question="How does the Zoom mixer work?"
              answer="You'll join a moderated Zoom call with structured rounds. We start with a welcome, then move through small-group breakouts where you'll chat with 3-4 people at a time. There's also a 'choose-your-room' mingle period. At the end, you can opt in to share contact info with anyone you connected with."
            />
            <FAQItem
              question="Is this awkward like other online meetups?"
              answer="We've designed this to minimize awkwardness. You're in small groups (not a big gallery view), conversations are time-boxed so there's no pressure, and the host guides transitions. Most attendees say it feels more like a dinner party than a typical Zoom call."
            />
            <FAQItem
              question="Do you guarantee 10 men and 10 women?"
              answer="No, we don't guarantee exact counts. We aim for balanced attendance and seats are confirmed in registration order. If one side fills faster, we may waitlist additional registrations to maintain balance. If we can't confirm your seat, you'll receive a full refund."
            />
            <FAQItem
              question="What if one side fills up first?"
              answer="We'll place additional registrations on a waitlist and notify you. If a spot opens or we're able to add more seats while maintaining balance, you'll be offered a spot. If we can't confirm you, you'll receive a full refund."
            />
            <FAQItem
              question="What information is visible to other attendees?"
              answer="During the event, others see your first name (or initial), age range, city (e.g., 'San Jose'), and diet. Your last name, phone, email, exact address, employer, and social media are never shared. Contact info is only exchanged if both people opt in after the event."
            />
            <FAQItem
              question="Is the event recorded?"
              answer="No. The session is not recorded. We also enable Zoom's waiting room and have a code of conduct that all attendees agree to."
            />
            <FAQItem
              question="What if I can't attend after registering?"
              answer="Cancel 48+ hours before for a full refund. Within 48 hours, we can't offer refunds because we've finalized breakout rooms and seating. If we cancel due to minimum attendance, you'll receive a full refund."
            />
            <FAQItem
              question="Do I need a full VivaahReady profile?"
              answer="Only basics are required for this event (name, age, city, diet, a photo). You can complete additional profile details later if you'd like to use the full VivaahReady platform. The profile takes about 3-5 minutes."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to meet someone great?
          </h2>
          <p className="text-gray-400 mb-8">
            20 seats max. Registration closes 48 hours before the event.
          </p>

          {!registrationStatus?.isRegistered && !registrationStatus?.isWaitlisted && !isEventPast && (
            <button
              onClick={handleRegisterClick}
              disabled={registering || status === 'loading'}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              {registering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Register — ${EVENT_CONFIG.price}
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-950 text-center">
        <p className="text-gray-500 text-sm">
          <Link href="/" className="text-gray-400 hover:text-white">VivaahReady</Link>
          {' '}·{' '}
          <Link href="/privacy" className="text-gray-500 hover:text-gray-300">Privacy</Link>
          {' '}·{' '}
          <Link href="/terms" className="text-gray-500 hover:text-gray-300">Terms</Link>
          {' '}·{' '}
          <Link href="/contact" className="text-gray-500 hover:text-gray-300">Contact</Link>
        </p>
      </footer>

      {/* Mobile Sticky CTA */}
      {!registrationStatus?.isRegistered && !registrationStatus?.isWaitlisted && !isEventPast && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 sm:hidden z-40">
          <button
            onClick={handleRegisterClick}
            disabled={registering || status === 'loading'}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {registering ? 'Processing...' : `Register — $${EVENT_CONFIG.price}`}
          </button>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Cancel Registration</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setError(null)
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              We're sorry to see you go. Please let us know why you're cancelling.
            </p>

            {(() => {
              const hoursUntilEvent = (EVENT_CONFIG.date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
              const canRefund = hoursUntilEvent > 48
              return (
                <div className={`p-3 rounded-lg mb-4 ${canRefund ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  {canRefund ? (
                    <p className="text-green-700 text-sm">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      You will receive a <strong>full refund of $25</strong>.
                    </p>
                  ) : (
                    <p className="text-amber-700 text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Within 48 hours — <strong>no refund available</strong>.
                    </p>
                  )}
                </div>
              )
            })()}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a reason...</option>
                <option value="Schedule conflict">Schedule conflict</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found a match elsewhere">Found a match elsewhere</option>
                <option value="Financial reasons">Financial reasons</option>
                <option value="Personal reasons">Personal reasons</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setError(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Registration
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={cancelling || !cancelReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Registration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot */}
      <EventChatbot context="marchevent" />

      {/* Find Match Modal for profile completion */}
      <FindMatchModal
        isOpen={showFindMatchModal}
        onClose={() => {
          setShowFindMatchModal(false)
          router.push('/marchevent/payment')
        }}
      />
    </div>
  )
}

// Registered State Component
function RegisteredState({ eventDate, onCancelClick }: { eventDate: Date; onCancelClick: () => void }) {
  const hoursUntilEvent = (eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
  const canCancel = hoursUntilEvent > 48

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 text-green-700 mb-4">
          <CheckCircle className="w-6 h-6" />
          <span className="text-lg font-semibold">You're registered!</span>
        </div>
        <p className="text-green-700 text-sm mb-4">
          Zoom link will be sent 1 hour before the event.
        </p>
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">Event starts in</p>
          <CountdownTimer targetDate={eventDate} compact />
        </div>
      </div>

      {canCancel ? (
        <button
          onClick={onCancelClick}
          className="text-sm text-gray-500 hover:text-red-600 underline"
        >
          Need to cancel?
        </button>
      ) : (
        <p className="text-sm text-gray-500">
          Cancellations are no longer available (within 48 hours of event).
        </p>
      )}
    </div>
  )
}
