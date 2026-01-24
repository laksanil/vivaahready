import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'VivaahReady - Modern Indian Matchmaking for the US Diaspora',
  description: 'Find your perfect life partner with VivaahReady. Authentic connections through human-curated profiles, not algorithms. Modern matchmaking with a traditional soul.',
  keywords: ['Indian matchmaking', 'matrimony', 'US diaspora', 'marriage', 'VivaahReady'],
  openGraph: {
    title: 'VivaahReady - Modern Indian Matchmaking',
    description: 'Find your perfect life partner. Authentic connections through human-curated profiles, not algorithms.',
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
  twitter: {
    card: 'summary_large_image',
    title: 'VivaahReady - Modern Indian Matchmaking',
    description: 'Find your perfect life partner. Authentic connections through human-curated profiles.',
    images: ['https://vivaahready.com/logo-banner.png'],
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
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}
