import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'
import FeedbackWidget from '@/components/FeedbackWidget'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  // Primary Meta Tags
  title: {
    default: 'VivaahReady - Indian Matchmaking & Matrimony for US Diaspora',
    template: '%s | VivaahReady',
  },
  description: 'Find your perfect life partner with VivaahReady. Premium Indian matchmaking service for US diaspora. Verified profiles, privacy-first approach. Join thousands finding meaningful connections. Free to start.',
  keywords: [
    // Primary keywords
    'Indian matchmaking',
    'Indian matrimony',
    'Indian matrimonial site',
    'Indian marriage',
    'Hindu matrimony',
    'Sikh matrimony',
    'Muslim matrimony',
    'Christian matrimony',
    // Location-specific
    'Indian matchmaking USA',
    'Indian matrimony USA',
    'Indian matrimony in USA',
    'Indian matrimony America',
    'NRI matrimony',
    'US Indian matrimony',
    'Indian singles USA',
    // Community-specific
    'Telugu matrimony',
    'Tamil matrimony',
    'Punjabi matrimony',
    'Gujarati matrimony',
    'Bengali matrimony',
    'Marathi matrimony',
    'South Indian matrimony',
    'North Indian matrimony',
    // Intent-based
    'find Indian spouse',
    'Indian bride',
    'Indian groom',
    'Indian wedding',
    'arranged marriage',
    'marriage partner',
    'life partner',
    // Brand
    'VivaahReady',
    'Vivaah Ready',
  ],

  // Robots & Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add your codes after registering)
  verification: {
    google: 'your-google-verification-code', // Get from Google Search Console
    // yandex: 'your-yandex-code',
    // bing: 'your-bing-code',
  },

  // Canonical & Alternates
  metadataBase: new URL('https://vivaahready.com'),
  alternates: {
    canonical: '/',
  },

  // Open Graph
  openGraph: {
    title: 'VivaahReady - Indian Matchmaking & Matrimony for US Diaspora',
    description: 'Find your perfect life partner. Premium Indian matchmaking with verified profiles. Privacy-first, mutual-match only. Free to start.',
    url: 'https://vivaahready.com',
    siteName: 'VivaahReady',
    images: [
      {
        url: 'https://vivaahready.com/logo-banner.png',
        width: 2460,
        height: 936,
        alt: 'VivaahReady - Modern Indian Matchmaking',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'VivaahReady - Indian Matchmaking & Matrimony',
    description: 'Find your perfect life partner. Premium Indian matchmaking with verified profiles. Free to start.',
    images: ['https://vivaahready.com/logo-banner.png'],
    creator: '@vivaahready',
  },

  // App Links
  applicationName: 'VivaahReady',
  authors: [{ name: 'VivaahReady', url: 'https://vivaahready.com' }],
  creator: 'VivaahReady',
  publisher: 'VivaahReady',

  // Category
  category: 'Matchmaking',

  // Other
  other: {
    'geo.region': 'US',
    'geo.placename': 'United States',
    'rating': 'general',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-white">
        <Providers>
          <Suspense fallback={<div className="h-16 bg-white/80 backdrop-blur-sm shadow-sm" />}>
            <Navbar />
          </Suspense>
          <main className="flex-grow bg-gradient-to-b from-white via-silver-50 to-silver-100">{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
          <Suspense fallback={null}>
            <FeedbackWidget />
          </Suspense>
          <CookieConsent />
          <PushNotificationPrompt />
        </Providers>
      </body>
    </html>
  )
}
