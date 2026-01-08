'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  User,
  ChevronDown,
  Loader2,
  Lock,
} from 'lucide-react'
import ProfilePhoto from '@/components/ProfilePhoto'
import { BlurBadge } from '@/components/BlurredOverlay'

interface Profile {
  id: string
  gender: string
  dateOfBirth: string | null
  height: string | null
  currentLocation: string | null
  caste: string | null
  qualification: string | null
  occupation: string | null
  dietaryPreference: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  user: {
    name: string
  }
}

export default function SearchPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Check if user has a completed profile
  const hasProfile = session?.user?.hasProfile || false

  const [filters, setFilters] = useState({
    gender: '',
    caste: '',
    qualification: '',
    diet: '',
    location: '',
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const response = await fetch(`/api/profiles?${queryParams}`)
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const applyFilters = () => {
    fetchProfiles()
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      gender: '',
      caste: '',
      qualification: '',
      diet: '',
      location: '',
    })
  }

  const calculateAge = (dob: string | null): string => {
    if (!dob) return ''
    // Handle MM/YYYY format
    const parts = dob.split('/')
    if (parts.length >= 2) {
      const year = parseInt(parts[parts.length - 1])
      if (year > 1900 && year < 2010) {
        const age = new Date().getFullYear() - year
        return `${age} yrs`
      }
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Search Profiles</h1>
            <p className="text-gray-600 mt-1">Find your perfect match from {profiles.length} profiles</p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Filters
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Profile Completion Banner */}
        {session && !hasProfile && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Lock className="h-8 w-8 text-primary-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900">Complete Your Profile</h3>
                <p className="text-sm text-gray-600">
                  Create your profile to see full details and connect with matches
                </p>
              </div>
              <Link
                href="/profile/create"
                className="flex-shrink-0 btn-primary text-sm"
              >
                Complete Profile
              </Link>
            </div>
          </div>
        )}

        {/* Not Logged In Banner */}
        {!session && sessionStatus !== 'loading' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Lock className="h-8 w-8 text-primary-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900">Sign In to View Full Profiles</h3>
                <p className="text-sm text-gray-600">
                  Create an account to see complete profile details and start connecting
                </p>
              </div>
              <div className="flex-shrink-0 flex gap-2">
                <Link href="/login" className="btn-outline text-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filter Profiles</h2>
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700">
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Looking for</label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  className="input-field text-sm py-2"
                >
                  <option value="">All</option>
                  <option value="male">Groom</option>
                  <option value="female">Bride</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caste</label>
                <select
                  name="caste"
                  value={filters.caste}
                  onChange={handleFilterChange}
                  className="input-field text-sm py-2"
                >
                  <option value="">Any</option>
                  <option value="Brahmin">Brahmin</option>
                  <option value="Madhwa">Madhwa</option>
                  <option value="Smartha">Smartha</option>
                  <option value="Iyengar">Iyengar</option>
                  <option value="Nair">Nair</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <select
                  name="qualification"
                  value={filters.qualification}
                  onChange={handleFilterChange}
                  className="input-field text-sm py-2"
                >
                  <option value="">Any</option>
                  <option value="Bachelors">Bachelors</option>
                  <option value="Masters">Masters</option>
                  <option value="Doctor">Doctor/MD</option>
                  <option value="Ph.D">Ph.D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
                <select
                  name="diet"
                  value={filters.diet}
                  onChange={handleFilterChange}
                  className="input-field text-sm py-2"
                >
                  <option value="">Any</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non Vegetarian">Non Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="input-field text-sm py-2"
                  placeholder="e.g., California"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={applyFilters} className="btn-primary text-sm py-2">
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No profiles found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                calculateAge={calculateAge}
                hasAccess={hasProfile}
                isLoggedIn={!!session}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileCard({
  profile,
  calculateAge,
  hasAccess,
  isLoggedIn,
}: {
  profile: Profile
  calculateAge: (dob: string | null) => string
  hasAccess: boolean
  isLoggedIn: boolean
}) {
  const age = calculateAge(profile.dateOfBirth)

  // Mask name if no access
  const displayName = hasAccess
    ? profile.user.name
    : profile.user.name.split(' ')[0].charAt(0) + '****'

  // Mask location if no access
  const displayLocation = hasAccess
    ? profile.currentLocation
    : profile.currentLocation
      ? profile.currentLocation.split(',').pop()?.trim() + ' area'
      : null

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
      {/* Photo */}
      <div className={`h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative ${!hasAccess ? 'overflow-hidden' : ''}`}>
        <ProfilePhoto
          profile={profile}
          name={profile.user.name}
          size="xl"
          blurred={!hasAccess}
          className={!hasAccess ? 'filter blur-sm scale-110' : ''}
        />
        {!hasAccess && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
        )}
      </div>

      {/* Info */}
      <div className={`p-5 ${!hasAccess ? 'relative' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className={`text-lg font-semibold text-gray-900 ${!hasAccess ? 'blur-[3px] select-none' : ''}`}>
              {hasAccess ? profile.user.name : displayName}
            </h3>
            <p className="text-gray-600">
              {age}{age && profile.height ? ', ' : ''}{profile.height || ''}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            profile.gender === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {profile.gender === 'female' ? 'Bride' : 'Groom'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          {(profile.currentLocation || !hasAccess) && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className={!hasAccess ? 'blur-[2px] select-none' : ''}>
                {displayLocation || 'Location hidden'}
              </span>
            </div>
          )}
          {profile.occupation && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
              {profile.occupation}
            </div>
          )}
          {profile.qualification && (
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
              {profile.qualification}
            </div>
          )}
          {profile.caste && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              {profile.caste}
            </div>
          )}
        </div>

        {profile.aboutMe && (
          <p className={`mt-3 text-sm text-gray-600 line-clamp-2 ${!hasAccess ? 'blur-[2px] select-none' : ''}`}>
            {hasAccess ? profile.aboutMe : profile.aboutMe.substring(0, 50) + '...'}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          {hasAccess ? (
            <>
              <Link
                href={`/profile/${profile.id}`}
                className="flex-1 text-center py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                View Profile
              </Link>
              <button className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <Heart className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href={isLoggedIn ? '/profile/create' : '/register'}
              className="flex-1 text-center py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              {isLoggedIn ? 'Complete Profile to View' : 'Sign Up to View'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
