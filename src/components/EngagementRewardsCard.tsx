'use client'

import { useState, useEffect } from 'react'
import { Zap, Trophy, TrendingUp, Clock, Sparkles } from 'lucide-react'
import { ENGAGEMENT_EARNING_RULES, POINTS_CONFIG } from '@/lib/engagementConfig'

interface EngagementData {
  points: number
  activeBoost: {
    active: boolean
    expiresAt: string | null
    daysRemaining: number
  } | null
  progress: {
    pointsToNextBoost: number
    pointsPercent: number
  }
  recentActivity: {
    action: string
    points: number
    description: string | null
    createdAt: string
  }[]
  totals: {
    totalPointsEarned: number
    totalBoostsUsed: number
  }
}

const ACTION_LABELS: Record<string, string> = {
  daily_login: 'Daily login',
  express_interest: 'Expressed interest',
  respond_interest: 'Responded to interest',
  community_post: 'Community post',
  community_comment: 'Community comment',
  referral_joined: 'Referral reward',
  boost_redemption: 'Boost activated',
}

interface EngagementRewardsCardProps {
  primary?: boolean
  compact?: boolean
}

export default function EngagementRewardsCard({ primary = false, compact = false }: EngagementRewardsCardProps) {
  const [data, setData] = useState<EngagementData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement')
      .then(res => res.ok ? res.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return null

  const pointsBarWidth = Math.min(data.progress.pointsPercent, 100)

  if (compact) {
    const circleColor = data.activeBoost?.active ? '#8b5cf6' : data.points >= 50 ? '#f59e0b' : '#6366f1'

    return (
      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-700 uppercase tracking-wide">Engagement</h3>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex-shrink-0">
            <svg className="w-28 h-28" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={circleColor}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - pointsBarWidth / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="transition-all duration-1000 ease-out"
              />
              <text x="60" y="55" textAnchor="middle" className="text-3xl font-bold" fill="#111827">{data.points}</text>
              <text x="60" y="75" textAnchor="middle" className="text-sm" fill="#6b7280">pts</text>
            </svg>
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              {data.activeBoost?.active ? (
                <span className="flex items-center gap-1.5 text-purple-700 font-semibold">
                  <Zap className="h-4 w-4" /> {data.activeBoost.daysRemaining}d boost
                </span>
              ) : (
                <span className="text-gray-500 font-semibold">{data.totals.totalBoostsUsed} boosts used</span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Next boost</span>
                <span className="text-amber-600 font-medium">{data.progress.pointsPercent}/{POINTS_CONFIG.POINTS_PER_BOOST} pts</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${pointsBarWidth}%` }}
                />
              </div>
            </div>

            <div className="w-full text-center text-sm font-medium py-2 rounded-lg bg-gray-50 text-gray-500 border border-gray-200">
              Auto boost at {POINTS_CONFIG.POINTS_PER_BOOST} points
            </div>
          </div>
        </div>

        {data.recentActivity.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">How you earned</p>
            <div className="space-y-1.5">
              {data.recentActivity.filter(a => a.points > 0).slice(0, 3).map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{ACTION_LABELS[activity.action] || activity.action}</span>
                  <span className="text-green-600 font-semibold">+{activity.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Earn more points</p>
          <div className="space-y-1">
            {ENGAGEMENT_EARNING_RULES.map(rule => (
              <div key={rule.action} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{rule.label}</span>
                <span className="text-amber-600 font-medium">+{rule.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${primary ? 'bg-gradient-to-r from-amber-50 via-white to-yellow-50 border border-amber-200 shadow-md' : 'bg-white shadow-sm'} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Engagement Rewards</h3>
      </div>

      {primary && (
        <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2">
          <p className="text-sm font-semibold text-primary-700 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Reach {POINTS_CONFIG.POINTS_PER_BOOST} points to auto-activate a profile boost.
          </p>
          <p className="text-xs text-primary-600 mt-1">
            Your points reset after each boost activation. Boost duration: {POINTS_CONFIG.BOOST_DURATION_DAYS} days.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2.5 rounded-lg bg-amber-50 border border-amber-100">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700">{data.points}</p>
          <p className="text-[11px] text-amber-600 font-medium">Points</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-purple-50 border border-purple-100">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-700">{data.totals.totalBoostsUsed}</p>
          <p className="text-[11px] text-purple-600 font-medium">Boosts Used</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Next Boost</span>
            <span className="text-amber-600 font-medium">{data.progress.pointsPercent}/{POINTS_CONFIG.POINTS_PER_BOOST} pts</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${pointsBarWidth}%` }}
            />
          </div>
        </div>
      </div>

      {data.activeBoost?.active ? (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
          <Zap className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-purple-800">Boost Active</p>
            <p className="text-[11px] text-purple-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data.activeBoost.daysRemaining} day{data.activeBoost.daysRemaining !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full text-sm text-center font-medium py-2 px-4 rounded-lg bg-gray-100 text-gray-500">
          Auto boost at {POINTS_CONFIG.POINTS_PER_BOOST} points
        </div>
      )}

      {primary && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-2">Point Earning Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ENGAGEMENT_EARNING_RULES.map(rule => (
              <div key={rule.action} className="rounded-lg border border-gray-100 bg-white/80 px-3 py-2">
                <p className="text-xs font-medium text-gray-700">{rule.label}</p>
                <p className="text-[11px] text-gray-500">+{rule.points} pts • {rule.limit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentActivity.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-2">Recent Activity</p>
          <div className="space-y-1.5">
            {data.recentActivity.slice(0, 3).map((activity, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 truncate">
                  {ACTION_LABELS[activity.action] || activity.description || activity.action}
                </span>
                <span className={`font-medium flex-shrink-0 ml-2 ${activity.points > 0 ? 'text-green-600' : activity.points < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {activity.points > 0 ? '+' : ''}{activity.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totals.totalPointsEarned === 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            Log in daily, post in community, refer friends, and respond to interest to earn points.
          </p>
        </div>
      )}
    </div>
  )
}
