import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Globe, Shield, CheckCircle, Heart, Users } from 'lucide-react'
import { SEO_LOCATIONS } from '@/data/seo-locations'
import { SEO_LANGUAGES } from '@/data/seo-languages'
import { SeoCta } from '@/components/seo/SeoCta'

export const metadata: Metadata = {
  title: 'Indian Matchmaking — Find Your Perfect Match',
  description:
    'Browse Indian matchmaking by city and community. Verified profiles, privacy-first approach. Connecting Indian singles across the US. Free to start.',
  alternates: { canonical: '/indian-matchmaking' },
  openGraph: {
    title: 'Indian Matchmaking — Find Your Perfect Match | VivaahReady',
    description:
      'Browse Indian matchmaking by city and community across the US.',
    url: 'https://vivaahready.com/indian-matchmaking',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Indian Matchmaking — Find Your Perfect Match',
  description:
    'Browse Indian matchmaking by city and community across the United States.',
  url: 'https://vivaahready.com/indian-matchmaking',
  publisher: {
    '@type': 'Organization',
    name: 'VivaahReady',
    url: 'https://vivaahready.com',
  },
}

export default function IndianMatchmakingHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-silver-50 to-silver-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Indian Matchmaking — Find Your{' '}
              <span className="gradient-text">Perfect Match</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              VivaahReady connects verified Indian singles across the United States.
              Whether you are looking for matches in your city or within your community,
              explore the pages below to learn more about Indian matchmaking near you.
            </p>
            <SeoCta variant="hero" secondaryHref="/#how-it-works" secondaryLabel="How it Works" />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
            Free to start
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-green-500 mr-1.5" />
            Verified profiles
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 text-green-500 mr-1.5" />
            Mutual matches only
          </div>
          <div className="flex items-center">
            <Heart className="h-4 w-4 text-green-500 mr-1.5" />
            Privacy-first
          </div>
        </div>
      </section>

      {/* Core Pages */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
            Learn About VivaahReady
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/indian-matchmaking-usa"
              className="block p-5 bg-primary-50/50 rounded-lg border border-primary-100 hover:border-primary-300 transition-colors"
            >
              <span className="font-semibold text-gray-900">Indian Matchmaking in the USA</span>
              <span className="block mt-1 text-sm text-gray-500">
                How VivaahReady connects Indian singles across America
              </span>
            </Link>
            <Link
              href="/verified-indian-matrimony"
              className="block p-5 bg-primary-50/50 rounded-lg border border-primary-100 hover:border-primary-300 transition-colors"
            >
              <span className="font-semibold text-gray-900">Verified Indian Matrimony</span>
              <span className="block mt-1 text-sm text-gray-500">
                Learn about our profile verification process
              </span>
            </Link>
            <Link
              href="/privacy-first-matchmaking"
              className="block p-5 bg-primary-50/50 rounded-lg border border-primary-100 hover:border-primary-300 transition-colors"
            >
              <span className="font-semibold text-gray-900">Privacy-First Matchmaking</span>
              <span className="block mt-1 text-sm text-gray-500">
                How we protect your identity until mutual interest
              </span>
            </Link>
            <Link
              href="/nri-matrimony-usa"
              className="block p-5 bg-primary-50/50 rounded-lg border border-primary-100 hover:border-primary-300 transition-colors"
            >
              <span className="font-semibold text-gray-900">NRI Matrimony in the USA</span>
              <span className="block mt-1 text-sm text-gray-500">
                Built specifically for the Indian diaspora in America
              </span>
            </Link>
            <Link
              href="/indian-matrimony-usa"
              className="block p-5 bg-primary-50/50 rounded-lg border border-primary-100 hover:border-primary-300 transition-colors"
            >
              <span className="font-semibold text-gray-900">Indian Matrimony USA</span>
              <span className="block mt-1 text-sm text-gray-500">
                Trusted matrimony for Indian families and professionals in America
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Location Pages */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-6 w-6 text-primary-600" />
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Indian Matchmaking by City
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {SEO_LOCATIONS.map((loc) => (
              <Link
                key={loc.slug}
                href={`/indian-matchmaking-${loc.slug}`}
                className="block p-4 bg-white rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
              >
                <span className="font-medium text-gray-900">{loc.city}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{loc.stateAbbr}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Language Pages */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-primary-600" />
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Indian Matchmaking by Community
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {SEO_LANGUAGES.map((lang) => (
              <Link
                key={lang.slug}
                href={`/${lang.slug}-matrimony-usa`}
                className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
              >
                <span className="font-medium text-gray-900">{lang.language} Matrimony</span>
                <span className="block text-xs text-gray-400 mt-0.5">{lang.region}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <SeoCta
        variant="bottom"
        headline="Start your matchmaking journey"
        subtext="Create your free profile and discover compatible matches across the US."
      />
    </>
  )
}
