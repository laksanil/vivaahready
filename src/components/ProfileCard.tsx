'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Briefcase,
  GraduationCap,
  Ruler,
  Utensils,
  Loader2,
  Lock,
  Sparkles,
  ZoomIn,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'

export interface ProfileData {
  id: string
  userId: string
  gender: string
  dateOfBirth: string | null
  height: string | null
  currentLocation: string | null
  occupation: string | null
  qualification: string | null
  caste: string | null
  gotra: string | null
  dietaryPreference: string | null
  maritalStatus: string | null
  aboutMe: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  annualIncome: string | null
  familyLocation: string | null
  languagesKnown: string | null
  religion: string | null
  hobbies: string | null
  fitness: string | null
  interests: string | null
  theyLikedMeFirst?: boolean
  user: {
    id: string
    name: string
  }
  matchScore?: {
    totalScore: number
    maxScore: number
    percentage: number
  }
}

interface ProfileCardProps {
  profile: ProfileData
  onLike?: () => void
  onPass?: () => void
  isLoading?: boolean
  canLike?: boolean
  showActions?: boolean
}

export function ProfileCard({
  profile,
  onLike,
  onPass,
  isLoading = false,
  canLike = true,
  showActions = true,
}: ProfileCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null

  // Get all photos
  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const allPhotos = extractedPhotos.length > 0
    ? extractedPhotos
    : (validProfileImageUrl ? [validProfileImageUrl] : [])

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev + 1) % allPhotos.length)
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-200 hover:shadow-xl flex flex-col h-full group">
        {/* Photo Section - Larger aspect ratio for bigger photos */}
        <div className="relative aspect-[3/4] bg-gray-100 flex-shrink-0">
          {allPhotos.length > 0 && !imageError ? (
            <>
              <img
                src={allPhotos[photoIndex]}
                alt={profile.user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />

              {/* Zoom button */}
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(true) }}
                className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              {/* Photo Navigation Dots */}
              {allPhotos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {allPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setPhotoIndex(idx) }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === photoIndex ? 'bg-white w-4' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Photo Navigation Arrows */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <span className="text-4xl font-semibold text-primary-600">
                {getInitials(profile.user.name)}
              </span>
            </div>
          )}

          {/* Match Score Badge */}
          {profile.matchScore && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 rounded-full text-xs font-bold text-primary-600 shadow-sm">
              {profile.matchScore.percentage}% Match
            </div>
          )}

          {/* They Liked You Badge */}
          {profile.theyLikedMeFirst && (
            <div className="absolute top-3 right-12 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-xs font-semibold text-white shadow-sm">
              <Heart className="h-3 w-3 fill-current" />
              Likes You
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Name and Age */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 leading-tight">
              {profile.user.name}{age ? `, ${age}` : ''}
            </h3>
            {profile.maritalStatus && profile.maritalStatus !== 'Never Married' && (
              <span className="text-sm text-gray-500">{profile.maritalStatus}</span>
            )}
          </div>

          {/* Key Details */}
          <div className="space-y-2.5 text-sm flex-1">
            {/* Location */}
            {profile.currentLocation && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{profile.currentLocation}</span>
              </div>
            )}

            {/* Height & Diet Row */}
            <div className="flex items-center gap-4 text-gray-600">
              {profile.height && (
                <div className="flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <span>{formatHeight(profile.height)}</span>
                </div>
              )}
              {profile.dietaryPreference && (
                <div className="flex items-center gap-1.5">
                  <Utensils className="h-4 w-4 text-gray-400" />
                  <span>{profile.dietaryPreference}</span>
                </div>
              )}
            </div>

            {/* Occupation */}
            {profile.occupation && (
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{profile.occupation.replace(/_/g, ' ')}</span>
              </div>
            )}

            {/* Education */}
            {profile.qualification && (
              <div className="flex items-center gap-2 text-gray-600">
                <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{profile.qualification}</span>
              </div>
            )}

            {/* Caste/Religion */}
            {profile.caste && (
              <div className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-full inline-block">
                {profile.religion || 'Hindu'} • {profile.caste}
                {profile.gotra && ` • ${profile.gotra}`}
              </div>
            )}

            {/* About Me Preview */}
            {profile.aboutMe && (
              <p className="text-gray-500 text-xs line-clamp-2 mt-2 leading-relaxed">
                {profile.aboutMe}
              </p>
            )}

            {/* Hobbies, Fitness & Interests Pills */}
            {(profile.hobbies || profile.fitness || profile.interests) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.hobbies?.split(', ').slice(0, 2).map((hobby, idx) => (
                  <span key={`hobby-${idx}`} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                    {hobby}
                  </span>
                ))}
                {profile.fitness?.split(', ').slice(0, 1).map((fit, idx) => (
                  <span key={`fitness-${idx}`} className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
                    {fit}
                  </span>
                ))}
                {profile.interests?.split(', ').slice(0, 1).map((interest, idx) => (
                  <span key={`interest-${idx}`} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={(e) => { e.stopPropagation(); onPass?.() }}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <X className="h-5 w-5" />
                    Pass
                  </>
                )}
              </button>

              {!canLike ? (
                <Link
                  href="/profile"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-400 text-white rounded-xl font-semibold"
                >
                  <Lock className="h-5 w-5" />
                  Verify
                </Link>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onLike?.() }}
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                    profile.theyLikedMeFirst
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Heart className={`h-5 w-5 ${profile.theyLikedMeFirst ? 'fill-current' : ''}`} />
                      {profile.theyLikedMeFirst ? 'Like Back' : 'Like'}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={allPhotos[photoIndex]}
            alt={profile.user.name}
            className="max-w-full max-h-full object-contain"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
          {allPhotos.length > 1 && (
            <>
              <button
                className="absolute left-4 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length) }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                className="absolute right-4 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev + 1) % allPhotos.length) }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                {photoIndex + 1} of {allPhotos.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

// Skeleton loader for the card
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100">
          <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
          <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
