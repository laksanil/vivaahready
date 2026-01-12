import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Heart, Shield, Users, CheckCircle, Star, ArrowRight, Lock, Sparkles } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfilePhoto from '@/components/ProfilePhoto'
import FindMatchButton from '@/components/FindMatchButton'

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
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Modern Matchmaking with a{' '}
                <span className="gradient-text">Traditional Soul</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Stop choosing between outdated tradition and superficial swiping.
                VivaahReady bridges the gap — connecting Indian singles in the US
                through preference-based matching and verified profiles.
              </p>
              <div className="mt-8">
                <FindMatchButton className="bg-gradient-to-r from-teal-400 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
                  Find Your Match
                </FindMatchButton>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Verified Profiles
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  100% Free
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Matching</h3>
                    <p className="text-sm text-gray-500">Based on your preferences</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>Values-based matching</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span>Privacy protected</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                    <span>Verified profiles only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">How VivaahReady Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              We believe meaningful connections require quality profiles and mutual interest.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
              <p className="text-gray-600">
                Complete a detailed form about yourself, your values, and what you're
                looking for in a partner.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Profile Review</h3>
              <p className="text-gray-600">
                Our team reviews your profile to ensure quality and authenticity
                before you start matching.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">View Matches</h3>
              <p className="text-gray-600">
                See profiles that match your preferences — age, location, caste,
                education, and more.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect</h3>
              <p className="text-gray-600">
                Express interest. When mutual, contact details are revealed
                so you can take it from there!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blurred Profiles Preview */}
      {previewProfiles.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title">Real Profiles Waiting for You</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Join now to see complete profiles and start connecting with compatible matches.
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

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] rounded-xl">
                <div className="text-center bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md mx-4">
                  <Lock className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Create Your Free Profile
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sign up to see complete profiles, photos, and start connecting with your matches.
                  </p>
                  <FindMatchButton className="btn-primary inline-flex items-center">
                    Find Your Match
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </FindMatchButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="section-title">Why Choose VivaahReady?</h2>
              <div className="mt-8 space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Verified & Secure</h3>
                    <p className="text-gray-600">
                      All profiles are manually reviewed before approval. Your privacy
                      is protected with limited information sharing until mutual interest.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Preference Matching</h3>
                    <p className="text-gray-600">
                      See only profiles that match YOUR preferences — age, location,
                      caste, diet, education, and more. No irrelevant matches.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Heart className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Mutual Interest Required</h3>
                    <p className="text-gray-600">
                      Contact details are shared only when BOTH parties express interest.
                      No spam, no unwanted contacts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-8 w-8" />
                <h3 className="text-2xl font-semibold">Completely Free</h3>
              </div>
              <p className="text-primary-100 mb-6">
                No hidden fees. No premium tiers. Create your profile and start matching today.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-primary-100">
                  <CheckCircle className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                  Unlimited profile access
                </li>
                <li className="flex items-center text-primary-100">
                  <CheckCircle className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                  View all matched profiles & photos
                </li>
                <li className="flex items-center text-primary-100">
                  <CheckCircle className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                  Express unlimited interest
                </li>
                <li className="flex items-center text-primary-100">
                  <CheckCircle className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                  Full contact info on mutual match
                </li>
              </ul>
              <FindMatchButton className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center">
                Find Your Match
                <ArrowRight className="ml-2 h-5 w-5" />
              </FindMatchButton>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
            Your Story Begins Here
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join Indian singles in the US who trust VivaahReady
            to find their perfect life partner.
          </p>
          <FindMatchButton className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-full font-semibold hover:bg-primary-50 transition-colors shadow-lg">
            Find Your Match
            <ArrowRight className="ml-2 h-5 w-5" />
          </FindMatchButton>
        </div>
      </section>
    </div>
  )
}
