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
  ArrowRight,
  MessageCircle,
  BadgeCheck,
  XCircle
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

export default async function GetVerifiedPage() {
  const session = await getServerSession(authOptions)

  // Determine CTA links based on auth state
  const signupLink = session ? '/dashboard' : '/register'
  const verifyLink = session ? '/payment' : '/register'

  return (
    <div className="bg-white">
      {/* HERO SECTION - Big Get Verified CTA */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Shield className="h-5 w-5 text-white" />
              <span className="text-white font-medium">One-time verification fee</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Get Verified &amp; Start
              <br />
              <span className="text-yellow-300">Meaningful Connections</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed mb-8 max-w-2xl mx-auto">
              Join a community of serious, verified individuals looking for meaningful relationships.
              One payment. Lifetime access. No subscriptions.
            </p>

            {/* Big Price Display */}
            <div className="inline-flex flex-col items-center bg-white rounded-2xl p-8 shadow-2xl mb-8">
              <span className="text-gray-500 text-sm uppercase tracking-wider mb-2">One-time fee</span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-6xl font-bold text-gray-900">$50</span>
                <span className="text-gray-500 text-lg">USD</span>
              </div>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Lifetime access included
              </span>
            </div>

            {/* Big CTA Button */}
            <Link
              href={verifyLink}
              className="inline-flex items-center bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-10 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <BadgeCheck className="mr-3 h-7 w-7" />
              Get Verified Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>

            <p className="mt-6 text-primary-200 text-sm">
              Secure payment powered by Stripe. No recurring charges.
            </p>
          </div>
        </div>
      </section>

      {/* WHY GET VERIFIED SECTION */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Get Verified?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Verification unlocks all features and ensures you connect with genuine, serious individuals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Benefit 1 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <UserCheck className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authentic Profiles Only</h3>
              <p className="text-gray-600">
                Every verified member is manually reviewed by our admin team. No fake profiles, no bots, no time-wasters.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">See Full Profiles</h3>
              <p className="text-gray-600">
                Unlock photos, names, and complete profile details. Make informed decisions about who to connect with.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-100">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Heart className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Express Interest</h3>
              <p className="text-gray-600">
                Send and receive interests from your matches. When both express interest, contact details are revealed.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Message Directly</h3>
              <p className="text-gray-600">
                After mutual interest, message your matches directly within VivaahReady. Safe and private communication.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border border-amber-100">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <Lock className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Protected</h3>
              <p className="text-gray-600">
                Your phone and email are only shared after mutual acceptance. You control who sees your contact info.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-8 border border-cyan-100">
              <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
                <BadgeCheck className="h-7 w-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Verified Badge</h3>
              <p className="text-gray-600">
                Get a verified badge on your profile showing others you&apos;re serious and committed to finding a match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You Unlock with Verification
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-100 border-b font-semibold text-gray-700">
              <div>Feature</div>
              <div className="text-center">Without Verification</div>
              <div className="text-center text-primary-600">With Verification</div>
            </div>

            {[
              { feature: 'View match compatibility', without: true, with: true },
              { feature: 'See photos & names', without: false, with: true },
              { feature: 'Send interests', without: false, with: true },
              { feature: 'Receive interests', without: false, with: true },
              { feature: 'Message matches', without: false, with: true },
              { feature: 'See contact details (mutual)', without: false, with: true },
              { feature: 'Verified badge', without: false, with: true },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0 items-center">
                <div className="text-gray-700">{row.feature}</div>
                <div className="text-center">
                  {row.without ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                  )}
                </div>
                <div className="text-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA after comparison */}
          <div className="text-center mt-10">
            <Link
              href={verifyLink}
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-all"
            >
              <Shield className="mr-2 h-5 w-5" />
              Get Verified for $50
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Verification Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple 4-step process to get verified
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-primary-200 hidden md:block" />

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: 'Complete Payment',
                  desc: 'Pay the one-time $50 verification fee securely via Stripe',
                  icon: '💳'
                },
                {
                  step: 2,
                  title: 'Profile Submitted for Review',
                  desc: 'Your profile is automatically sent to our admin team',
                  icon: '📋'
                },
                {
                  step: 3,
                  title: 'Admin Approval (24-48 hrs)',
                  desc: 'Our team reviews your profile for authenticity',
                  icon: '✅'
                },
                {
                  step: 4,
                  title: 'Start Connecting!',
                  desc: 'View profiles, express interest, and find your match',
                  icon: '💕'
                }
              ].map((item) => (
                <div key={item.step} className="flex gap-6 items-start">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 z-10">
                    {item.step}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    </div>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY WE CHARGE */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why We Require Verification
            </h2>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600 text-center mb-10">
            <p>
              Free platforms attract casual browsers and fake profiles. The $50 verification fee ensures
              everyone on VivaahReady is <strong>serious about finding a life partner</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <Shield className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Serious community</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <Heart className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <p className="font-medium text-gray-700">No time-wasters</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <UserCheck className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Verified profiles</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <Users className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Quality matches</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <FAQItem
              question="What do I get with verification?"
              answer="You unlock full profile access (photos, names), ability to send and receive interests, messaging with matches, and contact detail sharing on mutual acceptance."
            />
            <FAQItem
              question="Is this a subscription?"
              answer="No. The $50 is a one-time payment. There are no recurring charges or hidden fees."
            />
            <FAQItem
              question="How long does approval take?"
              answer="Our admin team typically reviews and approves profiles within 24-48 hours."
            />
            <FAQItem
              question="When do I see contact details?"
              answer="Phone and email are only revealed after both you and your match mutually accept interest in each other."
            />
            <FAQItem
              question="What if my profile is rejected?"
              answer="If your profile doesn't meet our guidelines, we'll let you know what needs to be updated. You can edit and resubmit."
            />
            <FAQItem
              question="Is my payment secure?"
              answer="Yes. All payments are processed securely through Stripe, a trusted payment processor used by millions of businesses."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Find Your Life Partner?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of verified members who are serious about finding meaningful connections.
          </p>

          <Link
            href={verifyLink}
            className="inline-flex items-center bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-12 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <BadgeCheck className="mr-3 h-7 w-7" />
            Get Verified - $50
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>

          <p className="mt-8 text-primary-200">
            One-time payment. No subscriptions. Lifetime access.
          </p>
        </div>
      </section>
    </div>
  )
}
