import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  CheckCircle,
  Shield,
  Users,
  Lock,
  Heart,
  ChevronDown,
  Sparkles,
  Eye,
  UserCheck,
  ArrowRight
} from 'lucide-react'

// FAQ Accordion Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-gray-200 last:border-b-0">
      <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
        <h3 className="text-lg font-medium text-gray-900 pr-4">{question}</h3>
        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 pr-12">
        <p className="text-gray-600">{answer}</p>
      </div>
    </details>
  )
}

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  // Determine CTA links based on auth state
  const signupLink = session ? '/dashboard' : '/register'
  const verifyLink = session ? '/payment' : '/register'
  const matchesLink = session ? '/matches' : '/register'

  return (
    <div className="bg-white">
      {/* SECTION 1 — HERO */}
      <section className="relative bg-gradient-to-br from-white via-silver-50 to-silver-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Pricing that protects your{' '}
              <span className="gradient-text">privacy</span> and your{' '}
              <span className="gradient-text">time</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed">
              Start free. Verify once when you&apos;re ready to connect—so every interaction is intentional.
            </p>
            <p className="mt-4 text-sm text-gray-500 font-medium">
              No subscriptions. No recurring fees.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={signupLink} className="btn-primary inline-flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href={verifyLink} className="btn-secondary inline-flex items-center">
                Get Verified
                <Shield className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — HOW IT WORKS */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, transparent pricing designed for intentional connections.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="relative text-center p-8 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Free to Start</h3>
              <p className="text-gray-600">
                Create your profile, set deal-breakers and preferences, and view mutual matches only.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center p-8 bg-primary-50 rounded-2xl border-2 border-primary-200">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Verified Registration (One-time)</h3>
              <p className="text-gray-600">
                Unlock photos/names and express interest. After mutual acceptance, you can reveal phone/email and message securely on VivaahReady.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PRICING CARDS */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white via-silver-50 to-silver-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Choose Your Path</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade only when you&apos;re ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card A: Free to Start */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="h-6 w-6 text-primary-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Free to Start</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Create your profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Set deal-breakers + nice-to-haves</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">View mutual matches only</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Compatibility table for each match</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Privacy-first browsing (no public directory)</span>
                </li>
              </ul>

              <Link href={signupLink} className="btn-outline text-center w-full">
                Create Profile
              </Link>
            </div>

            {/* Card B: Verified Registration (Most Popular) */}
            <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-2xl p-8 flex flex-col transform md:scale-105">
              {/* Most Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 text-sm font-semibold px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Most Popular
                </span>
              </div>

              <div className="mb-6 pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <UserCheck className="h-6 w-6 text-white" />
                  <h3 className="text-xl font-semibold text-white">Verified Registration</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">$50</span>
                  <span className="text-primary-200 text-sm">one-time</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-primary-100">Admin profile verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-primary-100">Unlock photos + names</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-primary-100">Send and accept interests</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-primary-100">After mutual acceptance: reveal phone + email</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-primary-100">Message inside VivaahReady</span>
                </li>
              </ul>

              <Link href={verifyLink} className="bg-white text-primary-600 px-6 py-3 font-semibold rounded-lg text-center hover:bg-primary-50 transition-colors shadow-lg">
                Get Verified
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY WE PRICE THIS WAY */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">Why we price this way</h2>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600">
            <p>
              Completely free platforms often lead to casual outreach and no follow-through. People can message many profiles impulsively—and disappear. That wastes time and creates disappointment.
            </p>
            <p className="mt-4">
              Verified Registration helps keep profiles genuine and interactions intentional, while mutual acceptance ensures contact details are shared only when both members agree.
            </p>
          </div>

          {/* Benefit bullets */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary-50 rounded-lg p-4 text-center">
              <Shield className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">More serious community</p>
            </div>
            <div className="bg-primary-50 rounded-lg p-4 text-center">
              <Heart className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Less unsolicited outreach</p>
            </div>
            <div className="bg-primary-50 rounded-lg p-4 text-center">
              <Eye className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Privacy-first by default</p>
            </div>
            <div className="bg-primary-50 rounded-lg p-4 text-center">
              <Users className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Mutual-consent contact sharing</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — PRIVACY & CONSENT PROMISE */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-silver-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Lock className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="section-title">Privacy and consent are non-negotiable</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <p className="text-gray-700">You only see mutual matches—no public profile browsing.</p>
            </div>
            <div className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <p className="text-gray-700">Photos and names unlock after verification.</p>
            </div>
            <div className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <p className="text-gray-700">Phone and email are revealed only after mutual acceptance.</p>
            </div>
            <div className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <p className="text-gray-700">Messaging happens inside VivaahReady after mutual acceptance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — FAQ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to know about our pricing.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <FAQItem
              question="Is registration really free?"
              answer="Yes. Creating a profile, setting preferences, and viewing mutual matches is free."
            />
            <FAQItem
              question="What is Verified Registration and why is it $50?"
              answer="It is a one-time fee that supports admin verification and helps keep the community authentic and serious."
            />
            <FAQItem
              question="When do I pay the $50?"
              answer="Only when you choose to verify to unlock photos/names and express interest."
            />
            <FAQItem
              question="When are phone and email shared?"
              answer="Phone and email are revealed only after both members mutually accept interest, and only for verified members."
            />
            <FAQItem
              question="Can we message on the website?"
              answer="Yes. After mutual acceptance, verified members can message each other on VivaahReady."
            />
            <FAQItem
              question="Do you have subscriptions?"
              answer="No. There are no recurring charges."
            />
            <FAQItem
              question="Can I browse all profiles?"
              answer="No. To protect privacy, you will only see profiles that are a mutual match based on preferences and deal-breakers."
            />
            <FAQItem
              question="Does verification guarantee a response?"
              answer="No platform can guarantee responses, but verification and mutual acceptance improve the likelihood of serious engagement."
            />
          </div>
        </div>
      </section>

      {/* SECTION 7 — BOTTOM CTA STRIP */}
      <section className="py-16 md:py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
            Start free. Verify when you&apos;re ready. Connect when it&apos;s mutual.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={signupLink}
              className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-full font-semibold hover:bg-primary-50 transition-colors shadow-lg"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href={matchesLink}
              className="inline-flex items-center bg-primary-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-primary-800 transition-colors border-2 border-primary-500"
            >
              View Matches
              <Heart className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
