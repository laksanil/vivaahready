import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Shield, Users, CheckCircle, Star, Lock, Heart, UserCheck } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import FindMatchButton from '@/components/FindMatchButton'

export default async function HomePage() {
  // Redirect logged-in users to dashboard
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }

  const steps = [
    {
      title: 'Create Profile (Free)',
      body: 'Create your profile and preferences. Add deal-breakers and match preferences.',
    },
    {
      title: 'Find Matches',
      body: 'See curated matches where both sides\' preferences align. Identity stays hidden.',
    },
    {
      title: 'Express Interest (Free)',
      body: 'Express interest for free to signal intent.',
    },
    {
      title: 'Verify to Proceed',
      body: 'Verification is required to unlock next steps and keep the community genuine.',
    },
    {
      title: 'Connect',
      body: 'Mutual interest unlocks messaging and contact details.',
    },
  ]

  const whyChooseCards = [
    {
      icon: Lock,
      title: 'Privacy by Default',
      body: 'Identity details remain hidden until both sides are interested.',
    },
    {
      icon: UserCheck,
      title: 'Verification to Connect',
      body: 'Verification is required to proceed—designed to keep profiles genuine.',
    },
    {
      icon: Star,
      title: 'Compatibility Scoring',
      body: 'Matches filtered by deal-breakers and ranked with compatibility scores.',
    },
    {
      icon: Shield,
      title: 'No Spam, No Directory',
      body: 'No random DMs. No public browsing. Focused on serious intent.',
    },
  ]

  return (
    <div>
      {/* Block 1: Hero */}
      <section className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="max-w-2xl mx-auto text-center md:text-left md:mx-0">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Modern Matchmaking with a{' '}
              <span className="gradient-text">Traditional Soul</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed line-clamp-3">
              Create your profile, set deal-breakers and preferences, and see mutual matches only. Identity stays private until verification and mutual interest.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <FindMatchButton variant="primary" />
              <a
                href="#how-it-works"
                className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center"
              >
                How It Works
              </a>
            </div>

            {/* Trust Chips - Horizontal scroll on mobile */}
            <div className="mt-5 -mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 min-w-max pb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  <Shield className="h-3.5 w-3.5 text-primary-600" />
                  Privacy-first
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  <UserCheck className="h-3.5 w-3.5 text-primary-600" />
                  Verified to connect
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  <Users className="h-3.5 w-3.5 text-primary-600" />
                  Mutual matches only
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  <Star className="h-3.5 w-3.5 text-primary-600" />
                  Compatibility scoring
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Block 2: How It Works */}
      <section id="how-it-works" className="py-10 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-2">How It Works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">5 Simple Steps</h2>
          </div>

          {/* Mobile: Vertical Stepper | Desktop: Grid */}
          <div className="md:hidden space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-primary-100 mt-2" />
                  )}
                </div>
                <div className="pb-4">
                  <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary-600">{index + 1}</span>
                </div>
                <h3 className="text-sm font-semibold mb-1 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 3: Trust & Privacy Strip */}
      <section id="privacy" className="py-8 md:py-12 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-1">Trust & Privacy</p>
            <h2 className="text-xl md:text-2xl font-bold text-white">Built for Privacy by Design</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary-400" />
              <span>No public directory</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary-400" />
              <span>Identity hidden until mutual interest</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary-400" />
              <span>Verification required to connect</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary-400" />
              <span>Compatibility scoring + preferences</span>
            </div>
          </div>
        </div>
      </section>

      {/* Block 4: Why Choose */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-2">Why VivaahReady</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Designed for Serious Connections</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {whyChooseCards.map((card, index) => {
              const IconComponent = card.icon
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow">
                  <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                    <IconComponent className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{card.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Block 5: Final CTA */}
      <section className="py-10 md:py-14 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="h-10 w-10 text-white/80 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to create your profile?
          </h2>
          <p className="text-primary-100 mb-6">
            Free to start. Privacy-first. Verified to connect.
          </p>
          <FindMatchButton variant="white" />
        </div>
      </section>
    </div>
  )
}
