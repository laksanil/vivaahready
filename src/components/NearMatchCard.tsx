'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  MapPin,
  Briefcase,
  Lock,
  Sparkles,
} from 'lucide-react'
import { calculateAge, getInitials, extractPhotoUrls, isValidImageUrl } from '@/lib/utils'

interface FailedCriterion {
  name: string
  seekerPref: string | null
  candidateValue: string | null
  isDealbreaker: boolean
}

interface NearMatchProfile {
  id: string
  userId: string
  firstName?: string | null
  profileImageUrl?: string | null
  photoUrls?: string | null
  dateOfBirth?: string | null
  age?: number | string | null
  currentLocation?: string | null
  occupation?: string | null
  user?: {
    name?: string | null
  }
}

interface NearMatchCardProps {
  profile: NearMatchProfile
  failedCriteria: FailedCriterion[]
  matchScore: {
    percentage: number
    totalScore: number
    maxScore: number
  }
  failedDirection: 'seeker' | 'candidate' | 'both'
  isVerified?: boolean
}

// Map criterion names to preference edit URLs
const criterionToEditUrl: Record<string, string> = {
  'Age': '/profile?tab=preferences&edit=preferences_1',
  'Height': '/profile?tab=preferences&edit=preferences_1',
  'Education': '/profile?tab=preferences&edit=preferences_2',
  'Income': '/profile?tab=preferences&edit=preferences_2',
  'Smoking': '/profile?tab=preferences&edit=preferences_1',
  'Drinking': '/profile?tab=preferences&edit=preferences_1',
  'Occupation': '/profile?tab=preferences&edit=preferences_2',
  'Location': '/profile?tab=preferences&edit=preferences_2',
  'Citizenship': '/profile?tab=preferences&edit=preferences_2',
  'Grew Up In': '/profile?tab=preferences&edit=preferences_2',
  'Relocation': '/profile?tab=preferences&edit=preferences_2',
  'Sub-Community': '/profile?tab=preferences&edit=preferences_1',
  'Mother Tongue': '/profile?tab=preferences&edit=preferences_2',
  'Family Location': '/profile?tab=preferences&edit=preferences_2',
  'Family Values': '/profile?tab=preferences&edit=preferences_2',
  'Hobbies': '/profile?tab=preferences&edit=preferences_2',
  'Fitness': '/profile?tab=preferences&edit=preferences_2',
  'Interests': '/profile?tab=preferences&edit=preferences_2',
  'Pets': '/profile?tab=preferences&edit=preferences_2',
}

// Friendly descriptions for each preference
const criterionDescriptions: Record<string, string> = {
  'Age': 'age preferences',
  'Height': 'height preferences',
  'Education': 'education preferences',
  'Income': 'income preferences',
  'Smoking': 'smoking preferences',
  'Drinking': 'drinking preferences',
  'Occupation': 'occupation preferences',
  'Location': 'location preferences',
  'Citizenship': 'citizenship preferences',
  'Grew Up In': '"grew up in" preferences',
  'Relocation': 'relocation preferences',
  'Sub-Community': 'sub-community preferences',
  'Mother Tongue': 'language preferences',
  'Family Location': 'family location preferences',
  'Family Values': 'family values preferences',
  'Hobbies': 'hobby preferences',
  'Fitness': 'fitness preferences',
  'Interests': 'interest preferences',
  'Pets': 'pet preferences',
}

// Nudge messages for specific preferences - encouraging seeker to reconsider
const getNudgeMessage = (criterionName: string): string => {
  switch (criterionName) {
    // Age
    case 'Age':
      return 'A year or two difference rarely impacts compatibility'

    // Location-related
    case 'Location':
      return 'One of you may be open to relocating for the right person'
    case 'Relocation':
      return 'Some people become more flexible about moving when they find someone special'
    case 'Grew Up In':
      return 'Cultural background matters, but shared values and chemistry matter more'
    case 'Citizenship':
      return 'Immigration status can change - focus on compatibility first'
    case 'Family Location':
      return 'Family distance becomes less important when two people are committed'

    // Physical/Lifestyle
    case 'Height':
      return 'An inch or two difference rarely matters in person'
    case 'Smoking':
      return 'Many people quit or reduce smoking for the right partner'
    case 'Drinking':
      return 'Social habits often align naturally in a relationship'
    case 'Fitness':
      return 'Fitness levels can change - shared motivation helps!'
    case 'Pets':
      return 'Pet preferences often become flexible with the right person'

    // Education/Career
    case 'Education':
      return 'Ambition and values matter more than degrees'
    case 'Income':
      return 'Income grows with time and career - potential matters more'
    case 'Occupation':
      return 'Job titles change - character and work ethic remain'

    // Cultural/Family
    case 'Sub-Community':
      return 'Sub-community differences often matter less than shared core values'
    case 'Mother Tongue':
      return 'Language barriers can be overcome when connection is strong'
    case 'Family Values':
      return 'Family dynamics evolve - individual character matters more'

    // Interests
    case 'Hobbies':
      return 'Couples often discover new shared hobbies together'
    case 'Interests':
      return 'Different interests can complement each other well'

    default:
      return 'Consider if this preference is essential for long-term happiness'
  }
}

export function NearMatchCard({
  profile,
  failedCriteria,
  matchScore,
  failedDirection,
  isVerified = true,
}: NearMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const age = profile.dateOfBirth
    ? calculateAge(profile.dateOfBirth)
    : typeof profile.age === 'number'
    ? profile.age
    : profile.age
    ? parseInt(profile.age)
    : null

  const fullName = profile.firstName || profile.user?.name || 'Profile'
  // For unverified users, hide the name
  const name = isVerified ? fullName : 'Profile'
  const initials = getInitials(name)

  // Get profile photo
  const extractedPhotos = extractPhotoUrls(profile.photoUrls || null)
  const validProfileImageUrl = isValidImageUrl(profile.profileImageUrl) ? profile.profileImageUrl : null
  const photoUrl = extractedPhotos[0] || validProfileImageUrl

  // Get direction explanation
  const getDirectionText = () => {
    switch (failedDirection) {
      case 'seeker':
        return "doesn't match your preferences"
      case 'candidate':
        return "your profile doesn't match their preferences"
      case 'both':
        return 'preferences differ on both sides'
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      {/* Collapsed view */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-amber-100/50 transition-colors"
      >
        {/* Photo */}
        <div className="relative h-14 w-14 rounded-full overflow-hidden bg-amber-200 flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className={`h-full w-full object-cover ${isVerified ? '' : 'blur-md'}`}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-amber-700 font-semibold">
              {isVerified ? initials : '?'}
            </div>
          )}
          {/* Overlay badge */}
          <div className="absolute inset-0 flex items-center justify-center bg-amber-900/30">
            {isVerified ? (
              <AlertCircle className="h-5 w-5 text-amber-100" />
            ) : (
              <Lock className="h-5 w-5 text-amber-100" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">
              {name}{age ? `, ${age}` : ''}
            </span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
              {matchScore.percentage}% match
            </span>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-3 mt-0.5">
            {profile.currentLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.currentLocation}
              </span>
            )}
            {profile.occupation && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {profile.occupation}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-700 mt-1">
            {new Set(failedCriteria.map(c => c.name)).size} preference{new Set(failedCriteria.map(c => c.name)).size > 1 ? 's' : ''} {getDirectionText()}
          </p>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0 text-amber-600">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-amber-200 pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Preferences that don't match:
          </h4>
          <div className="space-y-2">
            {failedCriteria.map((criterion, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 border border-amber-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {criterion.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Your preference: <span className="text-gray-700">{criterion.seekerPref || 'Any'}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Their profile: <span className="text-gray-700">{criterion.candidateValue || 'Not specified'}</span>
                    </p>
                    <p className="text-xs text-amber-600 mt-1 italic">
                      💡 {getNudgeMessage(criterion.name)}
                    </p>
                  </div>
                  {criterionToEditUrl[criterion.name] && (
                    <Link
                      href={criterionToEditUrl[criterion.name]}
                      className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium px-2 py-1 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
                    >
                      <Settings className="h-3 w-3" />
                      Adjust
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-amber-100">
            <p className="text-xs text-gray-500">
              Adjusting your preferences could make this profile visible in your matches.
              Consider whether these criteria are essential for you.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function NearMatchesSection({
  nearMatches,
  showNearMatches,
  isVerified = false,
}: {
  nearMatches: Array<{
    profile: NearMatchProfile
    failedCriteria: FailedCriterion[]
    matchScore: { percentage: number; totalScore: number; maxScore: number }
    failedDirection: 'seeker' | 'candidate' | 'both'
  }>
  showNearMatches: boolean
  isVerified?: boolean
}) {
  if (!showNearMatches || nearMatches.length === 0) {
    return null
  }

  // Aggregate preferences blocking matches (for summary)
  const preferenceCountMap = new Map<string, Set<string>>()
  nearMatches.forEach(nm => {
    nm.failedCriteria.forEach(criterion => {
      if (!preferenceCountMap.has(criterion.name)) {
        preferenceCountMap.set(criterion.name, new Set())
      }
      preferenceCountMap.get(criterion.name)!.add(nm.profile.userId)
    })
  })

  // Sort by most blocking preferences first
  const sortedPreferences = Array.from(preferenceCountMap.entries())
    .map(([name, userIds]) => ({ name, count: userIds.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4) // Show top 4 preferences

  return (
    <section className="mt-8">
      {/* Info banner - different for verified vs unverified */}
      {isVerified ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 font-medium">
                Want to see more profiles?
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Here are profiles that are close to your preferences.
                A small adjustment could make them a perfect match!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-900 font-medium">
                Get verified to see full profiles!
              </p>
              <p className="text-sm text-amber-700 mt-1">
                These profiles are close to your preferences. Verify your profile to see their photos and names.
              </p>
              <Link
                href="/get-verified"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
              >
                <Lock className="h-4 w-4" />
                Get Verified
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Preference adjustment summary */}
      {sortedPreferences.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Preferences to consider adjusting:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedPreferences.map(({ name, count }) => (
              <div key={name} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">
                  <span className="font-semibold text-amber-700">{count}</span> profile{count !== 1 ? 's' : ''} blocked by {criterionDescriptions[name] || name.toLowerCase()}
                </span>
                {criterionToEditUrl[name] && (
                  <Link
                    href={criterionToEditUrl[name]}
                    className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 ml-2 flex-shrink-0"
                  >
                    <Settings className="h-3 w-3" />
                    Edit
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <Sparkles className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Close to Your Preferences ({nearMatches.length})
        </h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        These profiles match most of your criteria. See what's different and decide if it matters to you.
      </p>
      <div className="space-y-2">
        {nearMatches.map((nearMatch) => (
          <NearMatchCard
            key={nearMatch.profile.id}
            profile={nearMatch.profile}
            failedCriteria={nearMatch.failedCriteria}
            matchScore={nearMatch.matchScore}
            failedDirection={nearMatch.failedDirection}
            isVerified={isVerified}
          />
        ))}
      </div>
    </section>
  )
}
