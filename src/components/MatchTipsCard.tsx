'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Lightbulb,
  MapPin,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
} from 'lucide-react'

interface UserPreferences {
  prefLocation?: string | null
  prefLocationList?: string | null
  prefAgeMin?: string | null
  prefAgeMax?: string | null
  prefAgeIsDealbreaker?: boolean
  prefLocationIsDealbreaker?: boolean
  prefMaritalStatusIsDealbreaker?: boolean
  prefReligionIsDealbreaker?: boolean
  prefDietIsDealbreaker?: boolean
  prefHeightIsDealbreaker?: boolean
  prefSmokingIsDealbreaker?: boolean
  prefDrinkingIsDealbreaker?: boolean
  prefEducationIsDealbreaker?: boolean
  prefIncomeIsDealbreaker?: boolean
}

interface Tip {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  actionUrl: string
}

interface MatchTipsCardProps {
  matchCount: number
  userPreferences: UserPreferences
  onDismiss?: () => void
}

function countDealbreakers(prefs: UserPreferences): number {
  const dealbreakers = [
    prefs.prefAgeIsDealbreaker,
    prefs.prefLocationIsDealbreaker,
    prefs.prefMaritalStatusIsDealbreaker,
    prefs.prefReligionIsDealbreaker,
    prefs.prefDietIsDealbreaker,
    prefs.prefHeightIsDealbreaker,
    prefs.prefSmokingIsDealbreaker,
    prefs.prefDrinkingIsDealbreaker,
    prefs.prefEducationIsDealbreaker,
    prefs.prefIncomeIsDealbreaker,
  ]
  return dealbreakers.filter(Boolean).length
}

function generateTips(prefs: UserPreferences, matchCount: number): Tip[] {
  const tips: Tip[] = []

  // Location tip
  const location = prefs.prefLocation || prefs.prefLocationList
  if (location && location.toLowerCase() !== 'doesnt_matter' && location.toLowerCase() !== "doesn't matter") {
    tips.push({
      id: 'location',
      icon: <MapPin className="h-5 w-5" />,
      title: 'Expand your location',
      description: `Consider adding nearby metros or states to see more profiles from the broader region.`,
      actionLabel: 'Edit Location',
      actionUrl: '/profile?tab=preferences&edit=preferences_2',
    })
  }

  // Age tip
  if (prefs.prefAgeMin && prefs.prefAgeMax) {
    const minAge = parseInt(prefs.prefAgeMin)
    const maxAge = parseInt(prefs.prefAgeMax)
    const range = maxAge - minAge

    if (range < 6) {
      tips.push({
        id: 'age',
        icon: <Calendar className="h-5 w-5" />,
        title: 'Widen age range by 1-2 years',
        description: `Your current range is ${minAge}-${maxAge} (${range} years). Even a small expansion can significantly increase your matches.`,
        actionLabel: 'Edit Age',
        actionUrl: '/profile?tab=preferences&edit=preferences_1',
      })
    }
  }

  // Deal-breaker tip
  const dealbreakers = countDealbreakers(prefs)
  if (dealbreakers > 4) {
    tips.push({
      id: 'dealbreakers',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Review your deal-breakers',
      description: `You have ${dealbreakers} deal-breakers set. Consider making some preferences flexible instead of must-haves.`,
      actionLabel: 'Review Preferences',
      actionUrl: '/profile?tab=preferences&edit=preferences_1',
    })
  }

  // General encouragement if few tips
  if (tips.length === 0 && matchCount < 3) {
    tips.push({
      id: 'general',
      icon: <Lightbulb className="h-5 w-5" />,
      title: 'Review your preferences',
      description: 'Your preferences may be quite specific. Consider which criteria are truly essential vs nice-to-have.',
      actionLabel: 'Edit Preferences',
      actionUrl: '/profile?tab=preferences&edit=preferences_1',
    })
  }

  return tips.slice(0, 4) // Max 4 tips
}

export function MatchTipsCard({
  matchCount,
  userPreferences,
  onDismiss,
}: MatchTipsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if dismissed or if user has enough matches
  if (isDismissed || matchCount >= 5) {
    return null
  }

  const tips = generateTips(userPreferences, matchCount)

  if (tips.length === 0) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tips to Get More Matches</h3>
            <p className="text-sm text-gray-600">
              {tips.length} suggestion{tips.length > 1 ? 's' : ''} to expand your potential matches
            </p>
          </div>
          <div className="ml-auto text-blue-600">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg ml-2"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tips list */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="bg-white rounded-lg p-4 border border-blue-100 flex items-start gap-3"
            >
              <div className="text-blue-600 flex-shrink-0 mt-0.5">
                {tip.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900">{tip.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
              </div>
              <Link
                href={tip.actionUrl}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap flex-shrink-0"
              >
                {tip.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
