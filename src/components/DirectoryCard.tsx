'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Ruler,
  Loader2,
  Lock,
  Sparkles,
  Eye,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'
import { ProfileData } from './ProfileCard'

interface DirectoryCardProps {
  profile: ProfileData
  onLike?: () => void
  onPass?: () => void
  isLoading?: boolean
  canLike?: boolean
  showActions?: boolean
}

export function DirectoryCard({
  profile,
  onLike,
  onPass,
  isLoading = false,
  canLike = true,
  showActions = true,
}: DirectoryCardProps) {
  const [imageError, setImageError] = useState(false)

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null

  // Get primary photo
  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const primaryPhoto = extractedPhotos[0] || validProfileImageUrl

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-stretch">
        {/* Photo - Square, smaller */}
        <Link href={`/profile/${profile.id}`} className="flex-shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gray-100 rounded-l-lg overflow-hidden">
            {primaryPhoto && !imageError ? (
              <img
                src={primaryPhoto}
                alt={profile.user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                <span className="text-2xl font-semibold text-primary-600">
                  {getInitials(profile.user.name)}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col">
          {/* Top Row: Name, Age, Badges */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <Link href={`/profile/${profile.id}`} className="hover:text-primary-600">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {profile.user.name}{age ? `, ${age}` : ''}
                </h3>
              </Link>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {profile.theyLikedMeFirst && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-xs font-semibold text-white">
                  <Heart className="h-3 w-3 fill-current" />
                  <span className="hidden sm:inline">Likes You</span>
                </span>
              )}
              {profile.matchScore && (
                <span className="px-2 py-0.5 bg-primary-100 rounded-full text-xs font-bold text-primary-700">
                  {profile.matchScore.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Key Info Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-2">
            {profile.height && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-gray-400" />
                {formatHeight(profile.height)}
              </span>
            )}
            {profile.currentLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate max-w-[120px]">{profile.currentLocation}</span>
              </span>
            )}
            {profile.qualification && (
              <span className="flex items-center gap-1 hidden sm:flex">
                <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate max-w-[100px]">{profile.qualification}</span>
              </span>
            )}
          </div>

          {/* Occupation Row */}
          {profile.occupation && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{profile.occupation.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* Religion/Community & Marital Status */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(profile.religion || profile.caste) && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {profile.religion || 'Hindu'}{profile.caste ? ` • ${profile.caste}` : ''}
              </span>
            )}
            {profile.maritalStatus && profile.maritalStatus !== 'Never Married' && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                {profile.maritalStatus}
              </span>
            )}
          </div>
        </div>

        {/* Actions Column */}
        {showActions && (
          <div className="flex flex-col justify-center gap-2 p-3 border-l border-gray-100">
            <Link
              href={`/profile/${profile.id}`}
              className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="View Profile"
            >
              <Eye className="h-5 w-5" />
            </Link>

            {!canLike ? (
              <Link
                href="/profile"
                className="p-2.5 text-gray-400 bg-gray-100 rounded-lg"
                title="Verify to Like"
              >
                <Lock className="h-5 w-5" />
              </Link>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onLike?.() }}
                disabled={isLoading}
                className={`p-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                  profile.theyLikedMeFirst
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                    : 'text-primary-600 hover:text-white hover:bg-primary-600 bg-primary-50'
                }`}
                title={profile.theyLikedMeFirst ? 'Like Back' : 'Like'}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Heart className={`h-5 w-5 ${profile.theyLikedMeFirst ? 'fill-current' : ''}`} />
                )}
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onPass?.() }}
              disabled={isLoading}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Pass"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Skeleton loader for directory card
export function DirectoryCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="flex items-stretch">
        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gray-200 rounded-l-lg" />
        <div className="flex-1 p-3 sm:p-4 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="flex flex-col justify-center gap-2 p-3 border-l border-gray-100">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
