import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function calculateAge(dateOfBirth: Date | string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export function formatHeight(height: number | string | null | undefined): string {
  if (!height) return ''

  // If it's a number, assume centimeters and convert
  if (typeof height === 'number') {
    const feet = Math.floor(height / 30.48)
    const inches = Math.round((height % 30.48) / 2.54)
    return `${feet}'${inches}"`
  }

  // If it's a string, try to clean it up
  const heightStr = String(height).trim()

  // Extract just the height part (e.g., "5'10" from "5'10 or above")
  const match = heightStr.match(/(\d+)[''′]?\s*(\d+)?[""″]?/)
  if (match) {
    const feet = match[1]
    const inches = match[2] || '0'
    return `${feet}'${inches}"`
  }

  // If we can't parse it, return cleaned version without "or above" etc.
  return heightStr
    .replace(/\s*(or above|or below|and above|and below|\+)\s*/gi, '')
    .trim()
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format full name to "Firstname L." format for privacy
 * E.g., "Lakshmi Nagasamudra" -> "Lakshmi N."
 */
export function formatDisplayName(fullName: string | null | undefined): string {
  if (!fullName) return 'User'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}

/**
 * Extract photo URLs from comma-separated photoUrls field
 * Only returns valid Cloudinary URLs (excludes Google Drive URLs)
 */
export function extractPhotoUrls(photoUrls: string | null | undefined): string[] {
  if (!photoUrls) return []

  return photoUrls
    .split(',')
    .map(url => url.trim())
    .filter(url => {
      if (url.length === 0) return false
      // Only accept Cloudinary URLs or other non-Google-Drive http URLs
      if (url.includes('drive.google.com')) return false
      if (url.includes('googleusercontent.com')) return false
      return url.startsWith('http')
    })
}

/**
 * Check if a URL is a valid displayable image URL (not Google Drive)
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (url.includes('drive.google.com')) return false
  if (url.includes('googleusercontent.com')) return false
  return url.startsWith('http')
}

/**
 * Mask phone number - shows area code, hides rest
 * "+1 (555) 123-4567" → "(555) XXX-XXXX"
 * "555-123-4567" → "(555) XXX-XXXX"
 * Used to indicate phone exists but is locked for non-connected users
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '(XXX) XXX-XXXX'

  // Extract digits only
  const digits = phone.replace(/\D/g, '')

  // Handle different formats
  if (digits.length >= 10) {
    // If 11+ digits, assume first digit is country code
    const areaCode = digits.length > 10 ? digits.slice(1, 4) : digits.slice(0, 3)
    return `(${areaCode}) XXX-XXXX`
  }

  // Fallback for shorter numbers
  return '(XXX) XXX-XXXX'
}
