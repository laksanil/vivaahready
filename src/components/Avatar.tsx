'use client'

import Image from 'next/image'
import { User } from 'lucide-react'

interface AvatarProps {
  name: string
  photoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
}

/**
 * Get initials from a name (e.g., "John Doe" -> "JD")
 */
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Reusable Avatar component for displaying user photos or initials
 */
export function Avatar({ name, photoUrl, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size]

  // Show photo if available and valid
  if (photoUrl && photoUrl.startsWith('http')) {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={size === 'xl' ? '64px' : size === 'lg' ? '48px' : size === 'md' ? '40px' : '32px'}
        />
      </div>
    )
  }

  // Fallback: show initials or icon
  const initials = getInitials(name)

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {initials !== '?' ? (
        <span className="text-primary font-medium">{initials}</span>
      ) : (
        <User className="text-primary/60" size={iconSizes[size]} />
      )}
    </div>
  )
}

export default Avatar
