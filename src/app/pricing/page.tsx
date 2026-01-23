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
  Star
} from 'lucide-react'

// FAQ Accordion Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-stone-200 last:border-b-0">
      <summary className="flex items-center justify-between py-6 cursor-pointer list-none">
        <h3 className="text-base font-medium text-stone-800 pr-4">{question}</h3>
        <ChevronDown className="h-5 w-5 text-stone-400 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-6 pr-12">
        <p className="text-stone-600 leading-relaxed">{answer}</p>
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
      {/* HERO SECTION - Emotional, Story-driven */}
      <section className="relative bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <p className="text-primary-600 font-medium tracking-wide uppercase text-sm mb-4">
              A Different Kind of Matchmaking
            </p>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight mb-8">
              Where Serious People
              <br />
              Find Real Connections
            </h1>

            <p className="text-xl md:text-2xl text-stone-600 leading-relaxed max-w-2xl mx-auto mb-6">
              VivaahReady is built for people who are ready for marriage, not endless swiping.
              Every member is verified. Every profile is real.
            </p>

            <div className="flex items-center justify-center gap-2 text-stone-500">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm">Trusted by families across India</span>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION - Why Verification Matters */}
      <section className="py-20 md:py-24 bg-white border-t border-stone-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-5">
              Why We Verify Every Member
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Marriage is one of life&apos;s most important decisions. You deserve to meet people
              who are as serious about it as you are.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Trust & Safety</h3>
              <p className="text-stone-600 leading-relaxed">
                Our team manually reviews every profile before approval. No fake accounts. No catfishing. Just real people.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Serious Intent</h3>
              <p className="text-stone-600 leading-relaxed">
                Verification filters out casual browsers. Everyone here has made a commitment to finding their life partner.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Quality Over Quantity</h3>
              <p className="text-stone-600 leading-relaxed">
                A smaller community of genuine, verified individuals leads to more meaningful connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Clean Steps */}
      <section className="py-20 md:py-24 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-5">
              How Verification Works
            </h2>
            <p className="text-lg text-stone-600">
              A simple process to join our trusted community
            </p>
          </div>

          <div className="space-y-0">
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                desc: 'Tell us about yourself, your values, and what you\'re looking for in a partner.'
              },
              {
                step: '02',
                title: 'Complete Verification',
                desc: 'Submit your profile for review with a one-time verification fee.'
              },
              {
                step: '03',
                title: 'Admin Review',
                desc: 'Our team reviews your profile within 24-48 hours to ensure authenticity.'
              },
              {
                step: '04',
                title: 'Start Connecting',
                desc: 'Once verified, browse profiles, express interest, and message your matches.'
              }
            ].map((item, index) => (
              <div key={item.step} className="flex gap-6 md:gap-8 items-start group">
                <div className="flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-bold text-stone-200 group-hover:text-primary-200 transition-colors">
                    {item.step}
                  </span>
                  {index < 3 && (
                    <div className="w-px h-16 bg-stone-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-12">
                  <h3 className="text-xl font-semibold text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - What Verified Members Get */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-5">
              What You Get as a Verified Member
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Full access to everything you need to find your perfect match
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-5 p-6 rounded-2xl border border-stone-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Full Profile Access</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  See complete profiles including photos, names, and detailed information about potential matches.
                </p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl border border-stone-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Heart className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Express Interest</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Send and receive interests from matches. When it&apos;s mutual, you&apos;re both notified.
                </p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl border border-stone-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Private Messaging</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Message your matches directly within the platform after mutual interest.
                </p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl border border-stone-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Privacy Protection</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Your contact details are only shared after both parties accept the match.
                </p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl border border-stone-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Verified Badge</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Your profile displays a badge showing you&apos;re a verified, serious member.
                </p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl border border-stone-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Verified Community</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Connect only with other verified members who have been reviewed by our team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL/TRUST SECTION */}
      <section className="py-20 md:py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl md:text-3xl font-medium text-white leading-relaxed mb-8">
            &ldquo;Finding someone who shares your values and is genuinely ready for marriage
            shouldn&apos;t feel like searching for a needle in a haystack.&rdquo;
          </blockquote>
          <p className="text-primary-100">
            That&apos;s why we built VivaahReady — a place where every profile is real,
            every member is verified, and everyone is here for the same reason.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-5">
              Questions? We Have Answers
            </h2>
          </div>

          <div className="divide-y divide-stone-200">
            <FAQItem
              question="What does verification include?"
              answer="Verification gives you full access to the platform: view complete profiles with photos and names, send and receive interests, message matches, and have your contact details shared when there's mutual interest."
            />
            <FAQItem
              question="Is this a monthly subscription?"
              answer="No. The verification fee is a one-time payment. Once verified, you have lifetime access with no recurring charges."
            />
            <FAQItem
              question="How long does the review process take?"
              answer="Our team typically reviews and approves profiles within 24-48 hours."
            />
            <FAQItem
              question="When can I see someone's contact information?"
              answer="Contact details (phone and email) are only revealed after both you and your match have mutually accepted interest in each other."
            />
            <FAQItem
              question="What if my profile isn't approved?"
              answer="If your profile needs changes, we'll let you know exactly what to update. You can edit and resubmit for review."
            />
            <FAQItem
              question="Is the payment secure?"
              answer="Yes. All payments are processed through Stripe, a trusted payment processor used by millions of businesses worldwide."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA - Warm, Inviting */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-stone-50 to-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-primary-600 font-medium tracking-wide uppercase text-sm mb-4">
            Take the First Step
          </p>

          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6">
            Ready to Find Someone Who&apos;s
            <br />
            Just as Serious as You?
          </h2>

          <p className="text-lg text-stone-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Join a community of verified individuals who are ready for marriage,
            not just dating.
          </p>

          <Link
            href={verifyLink}
            className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-full font-semibold text-lg shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-700/25 transition-all"
          >
            Get Verified Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>

          <p className="mt-8 text-stone-500 text-sm">
            One-time verification fee &middot; No subscriptions &middot; Lifetime access
          </p>
        </div>
      </section>
    </div>
  )
}
