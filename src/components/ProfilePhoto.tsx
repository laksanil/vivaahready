'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { getProfileImageUrl, getInitials } from '@/lib/googleDrive'

interface ProfilePhotoProps {
  profile: {
    profileImageUrl?: string | null
    photoUrls?: string | null
  }
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  blurred?: boolean
}

const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-16 h-16 text-lg',
  lg: 'w-24 h-24 text-2xl',
  xl: 'w-32 h-32 text-3xl',
  '2xl': 'w-48 h-48 text-5xl',
}

const imageSizeMap = {
  xs: 'w100',
  sm: 'w200',
  md: 'w200',
  lg: 'w400',
  xl: 'w400',
  '2xl': 'w800',
}

export default function ProfilePhoto({
  profile,
  name,
  size = 'md',
  className = '',
  blurred = false,
}: ProfilePhotoProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const imageUrl = getProfileImageUrl(profile, imageSizeMap[size])
  const initials = getInitials(name)
  const sizeClass = sizeClasses[size]

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // If no image URL or image failed to load, show initials
  if (!imageUrl || imageError) {
    return (
      <div
        className={`
          ${sizeClass}
          rounded-full flex items-center justify-center
          bg-gradient-to-br from-primary-400 to-primary-600
          text-white font-semibold
          ${blurred ? 'filter blur-sm' : ''}
          ${className}
        `}
      >
        {initials || <User className="w-1/2 h-1/2" />}
      </div>
    )
  }

  return (
    <div className={`${sizeClass} relative rounded-full overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
      )}

      {/* Actual image */}
      <img
        src={imageUrl}
        alt={name || 'Profile photo'}
        className={`
          w-full h-full object-cover
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${blurred ? 'filter blur-sm' : ''}
          transition-opacity duration-300
        `}
        onError={handleImageError}
        onLoad={handleImageLoad}
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

// Simplified avatar for cards (just initials, no photo)
export function InitialsAvatar({
  name,
  size = 'md',
  className = '',
  gender,
}: {
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  gender?: string
}) {
  const initials = getInitials(name)
  const sizeClass = sizeClasses[size]

  const bgColor = gender === 'female'
    ? 'bg-gradient-to-br from-pink-400 to-pink-600'
    : gender === 'male'
      ? 'bg-gradient-to-br from-blue-400 to-blue-600'
      : 'bg-gradient-to-br from-primary-400 to-primary-600'

  return (
    <div
      className={`
        ${sizeClass}
        rounded-full flex items-center justify-center
        ${bgColor}
        text-white font-semibold
        ${className}
      `}
    >
      {initials || <User className="w-1/2 h-1/2" />}
    </div>
  )
}
