import type { Metadata } from 'next'
import Image from 'next/image'
import { Heart, Users, Shield, Target, CheckCircle, MapPin, Quote } from 'lucide-react'
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
      <section className="bg-gradient-to-br from-white via-silver-50 to-silver-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About VivaahReady
            </h1>
            <p className="text-xl text-gray-600">
              Built by a mom who understood the struggle of finding the right match
              for her daughter in the US.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Photo */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="w-72 h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/founder-lakshmi.jpg"
                    alt="Lakshmi - Founder of VivaahReady"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Bay Area, CA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Hi, I&apos;m Lakshmi</h2>
              <p className="text-primary-600 font-medium mb-6">Founder of VivaahReady</p>

              <div className="space-y-4 text-gray-600">
                <p>
                  I come from a traditional Indian family, and like many parents in the diaspora,
                  I wanted to help my daughter find the right life partner. Someone who shared
                  our values, understood our culture, and was serious about marriage.
                </p>
                <p>
                  I tried every matrimonial website out there. Some felt outdated and impersonal.
                  Others were full of fake profiles and people who weren&apos;t serious. None of them
                  felt right for families like ours who wanted a blend of tradition and modernity.
                </p>
                <p>
                  So I decided to build what I was looking for. VivaahReady is the platform I
                  wished existed — where every profile is verified, privacy is respected, and
                  the focus is on meaningful connections, not endless swiping.
                </p>
                <div className="bg-primary-50 border-l-4 border-primary-600 p-4 rounded-r-lg mt-6">
                  <div className="flex items-start gap-3">
                    <Quote className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700 italic">
                      &quot;I built VivaahReady because I believe every family deserves a platform
                      that takes matchmaking as seriously as they do.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Verified Profiles</p>
              <p className="text-sm text-gray-500">Every profile checked</p>
            </div>
            <div>
              <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Privacy-First</p>
              <p className="text-sm text-gray-500">Your data protected</p>
            </div>
            <div>
              <MapPin className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Nationwide</p>
              <p className="text-sm text-gray-500">Across the US</p>
            </div>
            <div>
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Serious Connections</p>
              <p className="text-sm text-gray-500">Marriage-minded only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why I Built This */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-6">Why I Built This</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  As a mother living in the Bay Area, I saw firsthand the challenges
                  Indian families face when looking for matches in the US. The big
                  matrimonial sites felt impersonal, and dating apps weren&apos;t designed
                  for families who value tradition.
                </p>
                <p>
                  I wanted a platform where parents could be involved without being
                  overbearing, where profiles were real and verified, and where the
                  focus was on compatibility that leads to lasting marriages.
                </p>
                <p>
                  VivaahReady combines the thoughtfulness of traditional matchmaking
                  with the convenience of modern technology. Because finding a life
                  partner should feel personal, not transactional.
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
                    <h3 className="font-semibold text-gray-900">Family Values</h3>
                    <p className="text-gray-600 text-sm">Built for families who want to be part of the journey</p>
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
                    <h3 className="font-semibold text-gray-900">Quality Matches</h3>
                    <p className="text-gray-600 text-sm">Thoughtful matching based on what truly matters</p>
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
