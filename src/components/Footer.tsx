'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Mail, MapPin, Shield, UserCheck, Users } from 'lucide-react'
import { isSidebarPage } from './UserSidebar'

export function Footer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Don't show footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Don't show footer on authenticated sidebar pages
  if (isSidebarPage(pathname) && (session || searchParams.get('viewAsUser'))) {
    return null
  }

  // Don't show footer on photo upload page during signup flow
  const fromSignup = searchParams.get('fromSignup') === 'true'
  if (pathname === '/profile/photos' && fromSignup) {
    return null
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-b from-[#8b0d0d] to-[#3a0707]" role="contentinfo">
      {/* Subtle dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
            {/* Brand Section */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="mb-4">
                <Image
                  src="/logo-banner.png"
                  alt="VivaahReady"
                  width={180}
                  height={69}
                  className="h-10 w-auto brightness-110"
                />
              </div>
              <p className="text-white/80 font-medium text-sm mb-1">
                Modern matchmaking with a traditional soul.
              </p>
              <p className="text-white/50 text-xs leading-relaxed">
                Privacy-first matchmaking with verified profiles.
              </p>
            </div>

            {/* Quick Links */}
            <nav aria-label="Quick Links">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/#how-it-works" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    View Matches
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    Feedback
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Trust & Safety */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                Trust & Safety
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/60 text-sm">
                  <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Privacy-first design</span>
                </li>
                <li className="flex items-center gap-2 text-white/60 text-sm">
                  <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Verified to connect</span>
                </li>
                <li className="flex items-center gap-2 text-white/60 text-sm">
                  <Users className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Mutual interest only</span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <nav aria-label="Legal">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/60 hover:text-white text-sm transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Contact & Social */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                Contact
              </h3>
              <ul className="space-y-2 mb-4">
                <li>
                  <a
                    href="mailto:support@vivaahready.com"
                    className="flex items-center gap-2 min-w-0 text-white/60 hover:text-white text-sm transition-colors duration-200"
                  >
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="break-all sm:break-normal">support@vivaahready.com</span>
                  </a>
                </li>
                <li className="flex items-center gap-2 text-white/60 text-sm">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>United States</span>
                </li>
              </ul>

              {/* Social Media */}
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/vivaahready"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/vivaahready/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href="https://wa.me/19255777559"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors duration-200"
                  aria-label="WhatsApp"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Explore by City & Language */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <nav aria-label="Explore by City">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                  Explore by City
                </h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <li><Link href="/indian-matchmaking-new-york" className="text-white/60 hover:text-white text-sm transition-colors duration-200">New York</Link></li>
                  <li><Link href="/indian-matchmaking-bay-area" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Bay Area</Link></li>
                  <li><Link href="/indian-matchmaking-chicago" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Chicago</Link></li>
                  <li><Link href="/indian-matchmaking-houston" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Houston</Link></li>
                  <li><Link href="/indian-matchmaking-dallas" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Dallas</Link></li>
                  <li><Link href="/indian-matchmaking-atlanta" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Atlanta</Link></li>
                  <li><Link href="/indian-matchmaking-seattle" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Seattle</Link></li>
                  <li><Link href="/indian-matchmaking" className="text-white/60 hover:text-white text-sm transition-colors duration-200">View All &rarr;</Link></li>
                </ul>
              </nav>
              <nav aria-label="Explore by Language">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                  Explore by Language
                </h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <li><Link href="/telugu-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Telugu</Link></li>
                  <li><Link href="/tamil-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Tamil</Link></li>
                  <li><Link href="/hindi-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Hindi</Link></li>
                  <li><Link href="/punjabi-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Punjabi</Link></li>
                  <li><Link href="/gujarati-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Gujarati</Link></li>
                  <li><Link href="/bengali-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Bengali</Link></li>
                  <li><Link href="/marathi-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Marathi</Link></li>
                  <li><Link href="/kannada-matrimony-usa" className="text-white/60 hover:text-white text-sm transition-colors duration-200">Kannada</Link></li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-white/40 text-xs">
                &copy; {currentYear} VivaahReady. All rights reserved.
              </p>
              <div className="flex items-center gap-5">
                <Link
                  href="/terms"
                  className="text-white/40 hover:text-white text-xs transition-colors duration-200"
                >
                  Terms of Use
                </Link>
                <Link
                  href="/privacy"
                  className="text-white/40 hover:text-white text-xs transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
