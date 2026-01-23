import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  Shield,
  Users,
  Lock,
  Heart,
  ChevronDown,
  Eye,
  UserCheck,
  ArrowRight,
  MessageCircle,
  BadgeCheck,
} from 'lucide-react'

// FAQ Accordion Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-stone-200 last:border-b-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
        <h3 className="text-sm font-medium text-stone-800 pr-4">{question}</h3>
        <ChevronDown className="h-4 w-4 text-stone-400 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 pr-8">
        <p className="text-stone-600 text-sm leading-relaxed">{answer}</p>
      </div>
    </details>
  )
}

export default async function GetVerifiedPage() {
  const session = await getServerSession(authOptions)

  // Determine CTA link based on auth state
  const verifyLink = session ? '/payment' : '/register'

  return (
    <div className="bg-white">
      {/* HERO SECTION - Compact with CTA at top */}
      <section className="bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="text-center">
            {/* Quick CTA at top */}
            <Link
              href={verifyLink}
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full font-medium text-sm shadow-md hover:shadow-lg transition-all mb-8"
            >
              Get Verified Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-4">
              Where Serious People Find Real Connections
            </h1>

            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto mb-4">
              VivaahReady is built for people ready for marriage. Every member is verified. Every profile is real.
            </p>

            <p className="text-stone-500 text-sm">
              One-time fee &middot; No subscriptions &middot; Lifetime access
            </p>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION - Condensed */}
      <section className="py-10 md:py-12 bg-white border-t border-stone-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-8">
            Why We Verify Every Member
          </h2>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">Trust & Safety</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Our team manually reviews every profile. No fake accounts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">Serious Intent</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Verification filters out casual browsers. Everyone here is committed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">Quality Over Quantity</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                A smaller community of genuine individuals means better matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Compact horizontal */}
      <section className="py-10 md:py-12 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-8">
            How Verification Works
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { step: '1', title: 'Create Profile', desc: 'Tell us about yourself' },
              { step: '2', title: 'Submit for Review', desc: 'One-time verification fee' },
              { step: '3', title: 'Admin Review', desc: '24-48 hour turnaround' },
              { step: '4', title: 'Start Connecting', desc: 'Message your matches' }
            ].map((item) => (
              <div key={item.step} className="text-center p-3 sm:p-4 bg-white rounded-xl">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full text-sm font-bold mb-2">
                  {item.step}
                </span>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">{item.title}</h3>
                <p className="text-stone-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - Compact grid */}
      <section className="py-10 md:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-8">
            What Verified Members Get
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Eye, title: 'Full Profile Access', desc: 'See photos, names & details' },
              { icon: Heart, title: 'Express Interest', desc: 'Send & receive interests' },
              { icon: MessageCircle, title: 'Private Messaging', desc: 'Message your matches' },
              { icon: Lock, title: 'Privacy Protection', desc: 'Contact shared after mutual match' },
              { icon: BadgeCheck, title: 'Verified Badge', desc: 'Show you\'re serious' },
              { icon: UserCheck, title: 'Verified Community', desc: 'All members are reviewed' }
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 rounded-xl border border-stone-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900 text-sm">{item.title}</h3>
                  <p className="text-stone-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL - Compact */}
      <section className="py-10 md:py-12 bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-4">
            &ldquo;Finding someone who shares your values shouldn&apos;t feel like searching for a needle in a haystack.&rdquo;
          </blockquote>
          <p className="text-primary-100 text-sm">
            That&apos;s why we built VivaahReady — where every profile is real and everyone is here for the same reason.
          </p>
        </div>
      </section>

      {/* FAQ - Compact */}
      <section className="py-10 md:py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-6">
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-stone-200">
            <FAQItem
              question="What does verification include?"
              answer="Full access: view profiles with photos/names, send interests, message matches, and share contact info on mutual match."
            />
            <FAQItem
              question="Is this a monthly subscription?"
              answer="No. One-time payment. Once verified, you have lifetime access with no recurring charges."
            />
            <FAQItem
              question="How long does review take?"
              answer="Our team typically reviews and approves profiles within 24-48 hours."
            />
            <FAQItem
              question="When can I see contact information?"
              answer="Contact details are revealed after both you and your match mutually accept interest."
            />
            <FAQItem
              question="Is the payment secure?"
              answer="Yes. All payments are processed through Stripe, a trusted payment processor."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA - Compact */}
      <section className="py-10 md:py-14 bg-gradient-to-b from-stone-50 to-stone-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
            Ready to Find Your Match?
          </h2>

          <p className="text-stone-600 mb-6 max-w-lg mx-auto">
            Join a community of verified individuals who are ready for marriage.
          </p>

          <Link
            href={verifyLink}
            className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-primary-600/25 hover:shadow-xl transition-all"
          >
            Get Verified Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>

          <p className="mt-4 text-stone-500 text-sm">
            One-time fee &middot; No subscriptions &middot; Lifetime access
          </p>
        </div>
      </section>
    </div>
  )
}
