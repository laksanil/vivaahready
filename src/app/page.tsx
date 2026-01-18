import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Heart, Shield, Users, CheckCircle, Star, ArrowRight, Lock, Sparkles, Phone, UserCheck } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfilePhoto from '@/components/ProfilePhoto'

async function getPreviewProfiles() {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        approvalStatus: 'approved',
        isActive: true,
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true }
        }
      }
    })
    return profiles
  } catch {
    return []
  }
}

export default async function HomePage() {
  // Redirect logged-in users to dashboard
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }

  const previewProfiles = await getPreviewProfiles()

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-silver-50 to-silver-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
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
                <Link
                  href="/register"
                  className="bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center"
                >
                  Find My Match
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
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
                  <Phone className="h-4 w-4 text-green-500 mr-1.5" />
                  Phone verification
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 text-green-500 mr-1.5" />
                  Contact after mutual interest
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center space-x-4 mb-5">
                  <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center">
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

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">How VivaahReady Works</h2>
            <p className="mt-3 text-gray-500">
              Privacy-first matchmaking with phone-verified profiles.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Profile</h3>
              <p className="text-gray-600 text-sm">
                Free to start. Add preferences and deal-breakers.
              </p>
            </div>

            <div className="text-center p-5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verification</h3>
              <p className="text-gray-600 text-sm">
                Admin phone verification keeps the community genuine.
              </p>
            </div>

            <div className="text-center p-5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Mutual Matches</h3>
              <p className="text-gray-600 text-sm">
                See curated mutual matches with compatibility scores.
              </p>
            </div>

            <div className="text-center p-5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect</h3>
              <p className="text-gray-600 text-sm">
                Contact details shared only after mutual interest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blurred Profiles Preview */}
      {previewProfiles.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-white via-silver-50 to-silver-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="section-title">Real Profiles Waiting for You</h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                Join to see complete profiles and start connecting with compatible matches.
              </p>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {previewProfiles.map((profile) => (
                  <div key={profile.id} className="relative group">
                    <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl overflow-hidden">
                      <div className="relative h-full w-full">
                        <ProfilePhoto
                          profile={profile}
                          name={profile.user.name}
                          size="xl"
                          blurred={true}
                          className="filter blur-md scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="font-medium text-sm blur-[3px]">
                        {profile.user.name.charAt(0)}****
                      </p>
                      <p className="text-xs text-white/80 blur-[2px]">
                        {profile.currentLocation?.split(',').pop()?.trim() || 'Location'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overlay CTA - Premium Styling */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] rounded-xl">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-4 border border-gray-100">
                  <Lock className="h-10 w-10 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                    Unlock matches after you create your profile
                  </h3>
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>No public browsing — matches appear only when compatible.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Photos & contact unlock after verification + mutual interest.</span>
                    </li>
                  </ul>
                  <Link
                    href="/register"
                    className="btn-primary w-full flex items-center justify-center py-3"
                  >
                    Find My Match
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
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
              <Link
                href="/register"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center"
              >
                Find My Match
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Light background */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to create your profile?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Free to start. Verified, privacy-first matchmaking for serious relationships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center"
            >
              Find My Match
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-white transition-all flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
