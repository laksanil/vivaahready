import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { Heart, Shield, Users, CheckCircle, Star, Sparkles, Ban, Quote, Calendar, Video, ArrowRight } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import FindMatchButton from '@/components/FindMatchButton'

// JSON-LD Structured Data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://vivaahready.com/#website',
      url: 'https://vivaahready.com',
      name: 'VivaahReady',
      description: 'Premium Indian Matchmaking & Matrimony Service for US Diaspora',
      publisher: {
        '@id': 'https://vivaahready.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://vivaahready.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://vivaahready.com/#organization',
      name: 'VivaahReady',
      url: 'https://vivaahready.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vivaahready.com/logo-banner.png',
        width: 2460,
        height: 936,
      },
      sameAs: [
        // Add your social media URLs here
        // 'https://www.facebook.com/vivaahready',
        // 'https://www.instagram.com/vivaahready',
        // 'https://twitter.com/vivaahready',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@vivaahready.com',
        availableLanguage: ['English', 'Hindi'],
      },
    },
    {
      '@type': 'Service',
      '@id': 'https://vivaahready.com/#service',
      name: 'Indian Matchmaking Service',
      description: 'Premium matrimony and matchmaking service for Indian singles in the United States. Verified profiles, privacy-first approach, and meaningful connections.',
      provider: {
        '@id': 'https://vivaahready.com/#organization',
      },
      serviceType: 'Matchmaking',
      areaServed: {
        '@type': 'Country',
        name: 'United States',
      },
      audience: {
        '@type': 'Audience',
        audienceType: 'Indian Singles in USA',
      },
      offers: {
        '@type': 'Offer',
        price: '50',
        priceCurrency: 'USD',
        description: 'One-time verification fee to unlock full features',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is VivaahReady?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'VivaahReady is a premium Indian matchmaking and matrimony service designed for the US diaspora. We offer verified profiles, privacy-first matching, and meaningful connections for serious relationship seekers.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does VivaahReady work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Create your profile for free, set your preferences and deal-breakers, and see mutual matches only. Photos and contact details are shared after verification and mutual interest.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is VivaahReady free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Creating a profile and viewing matches is free. A one-time verification fee is required to unlock full features like messaging and contact sharing.',
          },
        },
        {
          '@type': 'Question',
          name: 'How are profiles verified?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our team manually reviews every profile to ensure authenticity. We verify identity and ensure genuine intent for marriage.',
          },
        },
      ],
    },
  ],
}

export default async function HomePage() {
  // Redirect logged-in users to dashboard
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-silver-50 to-silver-100 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Modern Matchmaking with a{' '}
                <span className="gradient-text">Traditional Soul</span>
              </h1>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                Create your profile, set deal-breakers and preferences, and view mutual matches only. Photos and contact details unlock after verification and mutual interest.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <FindMatchButton variant="primary" />
                <a
                  href="#how-it-works"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  How it Works
                </a>
              </div>

              {/* Trust Microcopy */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                  Free to start
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-1.5" />
                  Verified to connect
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center">
                  <Ban className="h-4 w-4 text-green-500 mr-1.5" />
                  Essential cookies only
                </div>
              </div>

            </div>

            {/* Community Stories Teaser */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Real Stories from Real People</p>
              <p className="text-sm text-gray-400 mb-4">Because the best proof is hearing it from them.</p>
              <div className="space-y-4">
                <Link
                  href="/community"
                  className="block bg-white rounded-2xl shadow-2xl p-5 group"
                >
                  <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-3">
                    💬 Community
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                    I Made My Daughter&apos;s Profile. She Doesn&apos;t Know Yet.
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    &ldquo;I am not that kind of mother. I always said I would never do this...&rdquo;
                  </p>
                  <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700 transition-colors">
                    Read why she did it anyway →
                  </span>
                </Link>
                <Link
                  href="/community"
                  className="block bg-white rounded-2xl shadow-lg p-5 group"
                >
                  <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-3">
                    💬 Community
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Okay but why am I actually on here
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    &ldquo;I have a masters degree. I negotiated my salary. I filed my own taxes. But making a profile on a matrimonial site? Total disaster...&rdquo;
                  </p>
                  <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700 transition-colors">
                    Read why she&apos;s here anyway →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Singles Meetup Event Banner */}
      <section className="py-0">
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <Link href="/marchevent" className="block py-4 sm:py-5 group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <Video className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-lg font-bold text-white">Singles Zoom Mixer</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                        $25
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-purple-200 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      April 12, 2026 &bull; Vegetarian Edition &bull; Ages 24-35 &bull; California
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-purple-700 rounded-lg text-sm font-semibold group-hover:bg-purple-50 transition-colors shadow-sm">
                    Sign Up <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-6">
            {/* Left: Title + Steps */}
            <div className="lg:w-[60%]">
              <div className="text-center mb-8">
                <h2 className="section-title">How VivaahReady Works</h2>
                <p className="mt-3 text-gray-500">
                  Privacy-first matchmaking with phone-verified profiles.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="text-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-primary-600">1</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">Create Profile (Free)</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Add your preferences and deal-breakers.
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-primary-600">2</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">Find & Express Interest (Free)</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    See curated matches and signal intent.
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-primary-600">3</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">Verify to Proceed</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Verification keeps the community genuine.
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-primary-600">4</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">Connect</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Mutual interest unlocks contact details.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Smart Matching card - aligned with heading */}
            <div className="lg:w-[40%] flex justify-center lg:pt-2">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center space-x-4 mb-5">
                  <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Matching</h3>
                    <p className="text-sm text-gray-500">Based on your preferences</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Shield className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Mutual matches only (privacy-first)</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                    <span>Compatibility scores with deal-breakers</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Phone-verified profiles</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                    <span>Contact shared after mutual acceptance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-12 items-center">
            <div>
              <h2 className="section-title">Why Choose VivaahReady?</h2>
              <div className="mt-6 space-y-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Verified & Secure</h3>
                    <p className="text-gray-600 text-sm">
                      All profiles are manually reviewed. Your privacy is protected until mutual interest.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Preference Matching</h3>
                    <p className="text-gray-600 text-sm">
                      See only profiles matching YOUR preferences — age, location, caste, diet, and more.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Heart className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Mutual Interest Required</h3>
                    <p className="text-gray-600 text-sm">
                      Contact details shared only when BOTH parties express interest. No spam.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Ban className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Essential Cookies Only</h3>
                    <p className="text-gray-600 text-sm">
                      No tracking cookies. We only use essential cookies required for the site to function.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-xl p-7 text-white">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="h-7 w-7" />
                <h3 className="text-xl font-semibold">Free to Start</h3>
              </div>
              <p className="text-primary-100 mb-5 text-sm">
                Create your profile, set deal-breakers, and view mutual matches. Verification keeps profiles genuine.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-primary-100 text-sm">
                  <CheckCircle className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  Free profile creation
                </li>
                <li className="flex items-center text-primary-100 text-sm">
                  <CheckCircle className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  Mutual matches only (no public directory)
                </li>
                <li className="flex items-center text-primary-100 text-sm">
                  <CheckCircle className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  Photos & names unlock after verification
                </li>
                <li className="flex items-center text-primary-100 text-sm">
                  <CheckCircle className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  Contact shared after mutual acceptance
                </li>
              </ul>
              <FindMatchButton variant="white" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-b from-silver-50 to-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">What Our Members Say</h2>
            <p className="mt-3 text-gray-500">
              Real experiences from people who found meaningful connections.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <Quote className="h-8 w-8 text-primary-200 mb-3" />
              <p className="text-gray-700 mb-4 leading-relaxed">
                &quot;I was tired of swiping on apps that didn&apos;t understand what I was looking for. VivaahReady felt different — the matches actually aligned with my values and preferences.&quot;
              </p>
              <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">Smitha P.</p>
                <p className="text-sm text-gray-500">Joined 2025</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <Quote className="h-8 w-8 text-primary-200 mb-3" />
              <p className="text-gray-700 mb-4 leading-relaxed">
                &quot;The privacy-first approach gave me confidence. I didn&apos;t have to worry about my profile being publicly visible. Only mutual matches can see each other.&quot;
              </p>
              <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">Suma K.</p>
                <p className="text-sm text-gray-500">Joined 2025</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <Quote className="h-8 w-8 text-primary-200 mb-3" />
              <p className="text-gray-700 mb-4 leading-relaxed">
                &quot;My parents and I both loved that profiles are verified. It&apos;s serious matchmaking, not casual browsing. The one-time fee means no subscription pressure.&quot;
              </p>
              <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">Gayathri A.</p>
                <p className="text-sm text-gray-500">Joined 2025</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Internal Links — Find Matchmaking Near You */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Find Indian Matchmaking Near You</h2>
            <p className="mt-3 text-gray-500">
              Connecting Indian singles across the United States
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <a href="/indian-matchmaking-new-york" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">New York</span>
            </a>
            <a href="/indian-matchmaking-bay-area" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">Bay Area</span>
            </a>
            <a href="/indian-matchmaking-chicago" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">Chicago</span>
            </a>
            <a href="/indian-matchmaking-houston" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">Houston</span>
            </a>
            <a href="/telugu-matrimony-usa" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">Telugu Matrimony</span>
            </a>
            <a href="/tamil-matrimony-usa" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">Tamil Matrimony</span>
            </a>
            <a href="/hindi-matrimony-usa" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">Hindi Matrimony</span>
            </a>
            <a href="/punjabi-matrimony-usa" className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors text-center">
              <span className="font-medium text-gray-900 text-sm">Punjabi Matrimony</span>
            </a>
          </div>
          <div className="text-center mt-6">
            <a href="/indian-matchmaking" className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
              View all locations and communities &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Light background */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to create your profile?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Free to start. Verified, privacy-first matchmaking for serious relationships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <FindMatchButton variant="primary" />
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
