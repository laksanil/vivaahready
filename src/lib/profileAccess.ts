/**
 * Profile Access Control Utilities
 * Handles what content users can see based on their profile status
 */

import { Session } from 'next-auth'

export interface AccessInfo {
  canViewFullProfile: boolean
  canViewContactInfo: boolean
  canSendInterest: boolean
  reason?: string
}

/**
 * Check if a user can view full profile details
 */
export function getAccessInfo(session: Session | null): AccessInfo {
  // Not logged in
  if (!session) {
    return {
      canViewFullProfile: false,
      canViewContactInfo: false,
      canSendInterest: false,
      reason: 'Please sign in to view full profiles',
    }
  }

  // Logged in but no profile
  if (!session.user.hasProfile) {
    return {
      canViewFullProfile: false,
      canViewContactInfo: false,
      canSendInterest: false,
      reason: 'Complete your profile to see full details',
    }
  }

  // Has profile - full access
  return {
    canViewFullProfile: true,
    canViewContactInfo: true,
    canSendInterest: true,
  }
}

/**
 * Fields that should be blurred for users without complete profile
 */
export const BLURRED_FIELDS = [
  'name', // Show initials only
  'currentLocation', // Show general area
  'annualIncome',
  'phone',
  'email',
  'linkedinProfile',
  'facebookInstagram',
  'familyLocation',
  'fatherName',
  'motherName',
  'university',
] as const

/**
 * Fields that are always visible (to entice users)
 */
export const VISIBLE_FIELDS = [
  'gender',
  'height',
  'caste',
  'qualification', // General level
  'occupation', // General
  'dietaryPreference',
  'maritalStatus',
  'aboutMe', // First few words
] as const

/**
 * Get a partially blurred profile for non-complete users
 */
export function getBlurredProfileData(profile: any): any {
  const hasLinkedIn = !!profile.linkedinProfile && profile.linkedinProfile !== 'no_linkedin'

  return {
    ...profile,
    // Mask sensitive data
    user: profile.user ? {
      name: maskName(profile.user.name),
      email: '••••••@••••.com',
    } : undefined,
    currentLocation: maskLocation(profile.currentLocation),
    annualIncome: profile.annualIncome ? 'Disclosed to members' : null,
    linkedinProfile: hasLinkedIn ? 'Available' : null,
    facebookInstagram: profile.facebookInstagram ? 'Available' : null,
    familyLocation: profile.familyLocation ? maskLocation(profile.familyLocation) : null,
    fatherName: profile.fatherName ? '••••••' : null,
    motherName: profile.motherName ? '••••••' : null,
    aboutMe: truncateText(profile.aboutMe, 100),
  }
}

/**
 * Mask name to show only first initial
 */
function maskName(name: string | null | undefined): string {
  if (!name) return '••••'
  const firstName = name.split(' ')[0]
  return firstName.charAt(0) + '••••'
}

/**
 * Mask location to show only state/general area
 */
function maskLocation(location: string | null | undefined): string | null {
  if (!location) return null

  // If it contains comma (City, State), show only state
  if (location.includes(',')) {
    const parts = location.split(',')
    return parts[parts.length - 1].trim() + ' area'
  }

  // Otherwise show first word + "area"
  return location.split(' ')[0] + ' area'
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string | null | undefined, maxLength: number): string | null {
  if (!text) return null
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
