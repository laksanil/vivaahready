'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'
import { ProfileData } from './ProfileCard'
import { useImpersonation } from '@/hooks/useImpersonation'

interface DirectoryCardProps {
  profile: ProfileData
  onLike?: () => void
  onPass?: () => void
  isLoading?: boolean
  canLike?: boolean
  showActions?: boolean
  /** If true, photos are blurred and names/contact/social are masked */
  isRestricted?: boolean
  /** If true, user has paid but awaiting admin approval */
  hasPaid?: boolean
}

// Helper to mask sensitive text
function maskText(text: string | null | undefined, showFirst: number = 1): string {
  if (!text) return 'XXXXXXXX'
  if (text.length <= showFirst) return 'X'.repeat(8)
  return text.substring(0, showFirst) + 'X'.repeat(Math.min(8, text.length - showFirst))
}

export function DirectoryCard({
  profile,
  onLike,
  onPass,
  isLoading = false,
  canLike = true,
  showActions = true,
  isRestricted = false,
  hasPaid = false,
}: DirectoryCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [verificationModalOpen, setVerificationModalOpen] = useState(false)
  const { buildUrl } = useImpersonation()
  const router = useRouter()

  const profileUrl = buildUrl(`/profile/${profile.id}`)

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null

  // Get all photos
  const extractedPhotos = extractPhotoUrls(profile.photoUrls)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const allPhotos = extractedPhotos.length > 0 ? extractedPhotos : (validProfileImageUrl ? [validProfileImageUrl] : [])
  const hasMultiplePhotos = allPhotos.length > 1

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index))
  }, [])

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length)
    }
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
    }
  }

  const openLightbox = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const currentPhoto = allPhotos[currentPhotoIndex]
  const hasError = imageErrors.has(currentPhotoIndex)

  return (
    <>
      <div
        className="bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => router.push(profileUrl)}
      >
        <div className="flex items-stretch">
          {/* Photo with Carousel */}
          <div className="flex-shrink-0 relative group">
            <Link href={buildUrl(`/profile/${profile.id}`)} className="block">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gray-100 rounded-l-lg overflow-hidden relative">
                {currentPhoto && !hasError ? (
                  <img
                    src={currentPhoto}
                    alt={isRestricted ? 'Profile photo' : profile.user.name}
                    className={`w-full h-full object-cover ${isRestricted ? 'blur-md' : ''}`}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(currentPhotoIndex)}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 ${isRestricted ? 'blur-sm' : ''}`}>
                    <span className="text-2xl font-semibold text-primary-600">
                      {getInitials(profile.user.name)}
                    </span>
                  </div>
                )}
                {/* Lock overlay for restricted profiles */}
                {isRestricted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-white/90 rounded-full p-2">
                      <Lock className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            </Link>

            {/* Carousel Navigation - Only show if multiple photos */}
            {hasMultiplePhotos && (
              <>
                {/* Prev Button */}
                <button
                  onClick={prevPhoto}
                  className="absolute left-0.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-1 bg-black/40 hover:bg-black/60 rounded-full text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Next Button */}
                <button
                  onClick={nextPhoto}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-1 bg-black/40 hover:bg-black/60 rounded-full text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Photo Dots */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {allPhotos.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCurrentPhotoIndex(index)
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Zoom Button */}
            {currentPhoto && !hasError && (
              <button
                onClick={openLightbox}
                className="absolute top-1 right-1 p-1 bg-black/40 hover:bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="View full size"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col">
          {/* Top Row: Name, Age, Badges */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <Link href={buildUrl(`/profile/${profile.id}`)} className="hover:text-primary-600">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {isRestricted ? maskText(profile.user.name, 2) : profile.user.name}{age ? `, ${age}` : ''}
                </h3>
              </Link>
              {isRestricted && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Verify to see full profile
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {profile.theyLikedMeFirst && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full text-xs font-semibold text-white">
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
            {(profile.currentLocation || profile.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate max-w-[100px] sm:max-w-[150px]">
                  {[profile.currentLocation, profile.country].filter(Boolean).join(', ')}
                </span>
              </span>
            )}
            {profile.qualification && (
              <span className="hidden sm:flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate max-w-[80px] sm:max-w-[100px]">{profile.qualification}</span>
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
            {(profile.religion || profile.community || profile.caste) && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {profile.religion || 'Hindu'}{(profile.community || profile.caste) ? ` • ${profile.community || profile.caste}` : ''}
              </span>
            )}
            {profile.maritalStatus && profile.maritalStatus !== 'Never Married' && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                {profile.maritalStatus}
              </span>
            )}
            {profile.hasChildren && profile.maritalStatus && profile.maritalStatus !== 'Never Married' && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                Children: {profile.hasChildren.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Actions Column */}
        {showActions && (
          <div className="flex flex-col justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 border-l border-gray-100">
            {/* View Profile Button */}
            <div className="group relative">
              <Link
                href={buildUrl(`/profile/${profile.id}`)}
                className="block p-2 sm:p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Eye className="h-5 w-5" />
              </Link>
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">View Profile</div>
                  <div className="text-gray-300">See full details</div>
                </div>
              </div>
            </div>

            {/* Like Button */}
            {!canLike ? (
              <div className="group relative">
                <Link
                  href={buildUrl('/profile')}
                  className="block p-2 sm:p-2.5 text-gray-400 bg-gray-100 rounded-lg"
                >
                  <Lock className="h-5 w-5" />
                </Link>
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">Verification Required</div>
                    <div className="text-gray-300">Get verified to express interest</div>
                  </div>
                </div>
              </div>
            ) : profile.theyLikedMeFirst && isRestricted ? (
              /* They liked me first but I'm not approved - can't create mutual match */
              <button
                onClick={(e) => { e.stopPropagation(); setVerificationModalOpen(true) }}
                className="p-2.5 rounded-lg bg-gray-200 text-gray-400 hover:bg-gray-300 transition-colors"
              >
                <Heart className="h-5 w-5 fill-current" />
              </button>
            ) : (
              <div className="group relative">
                <button
                  onClick={(e) => { e.stopPropagation(); onLike?.() }}
                  disabled={isLoading}
                  className={`p-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                    profile.theyLikedMeFirst
                      ? 'text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                      : 'text-primary-600 hover:text-white hover:bg-primary-600 bg-primary-50'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart className={`h-5 w-5 ${profile.theyLikedMeFirst ? 'fill-current' : ''}`} />
                  )}
                </button>
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">{profile.theyLikedMeFirst ? 'Accept Interest' : 'Express Interest'}</div>
                    <div className="text-gray-300">{profile.theyLikedMeFirst ? 'They like you! Click to connect' : 'Let them know you\'re interested'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pass Button */}
            <div className="group relative">
              <button
                onClick={(e) => { e.stopPropagation(); onPass?.() }}
                disabled={isLoading}
                title="Pass"
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </button>
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">Skip Profile</div>
                  <div className="text-gray-300">You can reconsider later</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Lightbox Modal */}
      {lightboxOpen && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Navigation arrows */}
          {hasMultiplePhotos && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allPhotos[currentPhotoIndex]}
              alt={isRestricted ? 'Profile photo' : `${profile.user.name} - Photo ${currentPhotoIndex + 1}`}
              className={`max-w-full max-h-[90vh] object-contain ${isRestricted ? 'blur-lg' : ''}`}
              referrerPolicy="no-referrer"
            />
            {isRestricted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 rounded-xl p-6 text-center">
                  <Lock className="h-12 w-12 text-white mx-auto mb-3" />
                  <p className="text-white font-semibold">Photo Restricted</p>
                  <p className="text-white/70 text-sm">Verify your profile to view</p>
                </div>
              </div>
            )}
          </div>

          {/* Photo counter */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {currentPhotoIndex + 1} / {allPhotos.length}
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      {verificationModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setVerificationModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {hasPaid ? (
              <>
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100">
                  <Sparkles className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                  Awaiting Admin Approval
                </h3>
                <p className="text-center text-gray-600 mb-6">
                  Your payment has been received! Our team is reviewing your profile.
                  This typically takes 24-48 hours. Once approved, you&apos;ll be able to
                  connect with this match.
                </p>
                <button
                  onClick={() => setVerificationModalOpen(false)}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Got it
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100">
                  <Lock className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                  Verification Required
                </h3>
                <p className="text-center text-gray-600 mb-6">
                  This person has expressed interest in you! To connect with them
                  and reveal contact details, please verify your profile first.
                </p>
                <div className="space-y-3">
                  <Link
                    href={buildUrl('/get-verified')}
                    className="block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-center"
                  >
                    Get Verified
                  </Link>
                  <button
                    onClick={() => setVerificationModalOpen(false)}
                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
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
