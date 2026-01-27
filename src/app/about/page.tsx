import type { Metadata } from 'next'
import { Heart, Users, Shield, Target, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about VivaahReady — bridging traditional matchmaking values with modern preferences for Indian singles in the US. Verified profiles, privacy-first approach.',
  openGraph: {
    title: 'About Us | VivaahReady',
    description: 'Learn about VivaahReady — bridging traditional matchmaking values with modern preferences for Indian singles in the US.',
    url: 'https://vivaahready.com/about',
  },
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-silver-50 to-silver-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About VivaahReady
            </h1>
            <p className="text-xl text-gray-600">
              We're bridging the gap between traditional matchmaking values and modern
              preferences, helping Indian singles in the US find meaningful connections.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  VivaahReady was born from a simple observation: Indian singles in the US
                  were caught between two extremes - traditional matchmaking that felt
                  outdated, and modern dating apps that reduced meaningful connections to
                  superficial swiping.
                </p>
                <p>
                  We believed there had to be a better way. A way that honored the wisdom
                  of traditional matchmaking - taking time to understand values, family,
                  and long-term compatibility - while embracing the autonomy and
                  preferences of modern individuals.
                </p>
                <p>
                  That's why we created VivaahReady: a platform where human curators,
                  not algorithms, take the time to understand who you are and hand-select
                  matches that align with your values, goals, and vision for the future.
                </p>
              </div>
            </div>
            <div className="bg-primary-50 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Heart className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Human-First</h3>
                    <p className="text-gray-600 text-sm">Real people reviewing profiles, not algorithms</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Privacy-Focused</h3>
                    <p className="text-gray-600 text-sm">Your information is protected and shared only with consent</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Target className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Values-Based</h3>
                    <p className="text-gray-600 text-sm">Matching based on what truly matters for lasting relationships</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-20 bg-gradient-to-b from-white via-silver-50 to-silver-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">How We're Different</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We combine the best of traditional matchmaking with modern convenience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Curated Matches</h3>
              <p className="text-gray-600">
                Unlike apps that show you hundreds of profiles, we hand-select 3-4
                compatible matches every few days. Quality over quantity.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verified Profiles</h3>
              <p className="text-gray-600">
                Every profile goes through our verification process. Multi-step ID
                checks ensure you're connecting with real, serious individuals.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="h-14 w-14 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Cultural Understanding</h3>
              <p className="text-gray-600">
                We understand the nuances of Indian culture - family values, traditions,
                and the importance of compatibility beyond just personal preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="section-title text-center mb-12">Our Values</h2>

            <div className="space-y-8">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Authenticity</h3>
                  <p className="text-gray-600">
                    We believe in genuine connections. That's why we verify profiles and
                    encourage members to be truthful about who they are and what they're looking for.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Respect</h3>
                  <p className="text-gray-600">
                    Every member deserves to be treated with dignity. We maintain a safe,
                    respectful environment where serious individuals can connect.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy</h3>
                  <p className="text-gray-600">
                    Your personal information is sacred. Full profiles are visible only to
                    our team, and contact details are shared only when both parties consent.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Intentionality</h3>
                  <p className="text-gray-600">
                    We're here for people who are serious about finding a life partner.
                    No casual swiping, no games - just meaningful connections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Find Your Match?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join VivaahReady today and let us help you find your perfect life partner.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  )
}
