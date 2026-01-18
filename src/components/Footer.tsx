'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Mail, MapPin } from 'lucide-react'

export function Footer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Don't show footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Don't show footer on photo upload page during signup flow
  const fromSignup = searchParams.get('fromSignup') === 'true'
  if (pathname === '/profile/photos' && fromSignup) {
    return null
  }

  return (
    <footer className="bg-gradient-to-b from-primary-800 via-primary-900 to-primary-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <Image
                src="/logo-banner.png"
                alt="VivaahReady"
                width={280}
                height={107}
                className="h-14 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Modern matchmaking with a traditional soul. Privacy-first, verification-based connections for serious relationships.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-primary-400 transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-primary-400 transition-colors">
                  View Matches
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary-400 transition-colors">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary-400 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-400 transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-primary-400 transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <a href="mailto:hello@vivaahready.com" className="hover:text-primary-400 transition-colors">
                  hello@vivaahready.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <span>United States</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal consent line */}
        <div className="mt-8 pt-6 border-t border-primary-800">
          <p className="text-center text-xs text-gray-500">
            By using VivaahReady you agree to our{' '}
            <Link href="/terms" className="text-gray-400 hover:text-primary-400 underline transition-colors">
              Terms of Use
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-gray-400 hover:text-primary-400 underline transition-colors">
              Privacy Policy
            </Link>.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-primary-800">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} VivaahReady. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
