'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  X,
  Check,
  Clock,
  User,
  MapPin,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { calculateAge, formatHeight, getInitials } from '@/lib/utils'

type MatchStatus = 'pending' | 'accepted' | 'rejected'

interface Match {
  id: string
  status: MatchStatus
  createdAt: string
  profile: {
    id: string
    gender: string
    dateOfBirth: string
    height: number | null
    city: string | null
    state: string | null
    occupation: string | null
    user: {
      name: string
    }
  }
}

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchMatches()
    }
  }, [session, activeTab])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/matches?type=${activeTab}`)
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMatchAction = async (matchId: string, action: 'accept' | 'reject') => {
    try {
      await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' }),
      })
      fetchMatches()
    } catch (error) {
      console.error('Error updating match:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Matches</h1>
          <p className="text-gray-600 mt-1">Manage your connections</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Interests Received
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Interests Sent
          </button>
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab === 'received' ? 'interests received' : 'interests sent'} yet
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'received'
                ? "When someone expresses interest in your profile, you'll see it here."
                : 'Start exploring profiles and express interest to see your sent requests here.'}
            </p>
            <Link href="/search" className="btn-primary inline-block">
              Browse Profiles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                type={activeTab}
                onAccept={() => handleMatchAction(match.id, 'accept')}
                onReject={() => handleMatchAction(match.id, 'reject')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MatchCardProps {
  match: Match
  type: 'received' | 'sent'
  onAccept: () => void
  onReject: () => void
}

function MatchCard({ match, type, onAccept, onReject }: MatchCardProps) {
  const { profile } = match
  const age = calculateAge(profile.dateOfBirth)

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    accepted: <Check className="h-4 w-4" />,
    rejected: <X className="h-4 w-4" />,
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xl font-semibold text-primary-600">
              {getInitials(profile.user.name)}
            </span>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{profile.user.name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[match.status]}`}>
                {statusIcons[match.status]}
                <span className="ml-1 capitalize">{match.status}</span>
              </span>
            </div>
            <p className="text-gray-600">
              {age} yrs{profile.height && `, ${formatHeight(profile.height)}`}
            </p>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              {profile.city && profile.state && (
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profile.city}, {profile.state}
                </span>
              )}
              {profile.occupation && (
                <span className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {profile.occupation.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {type === 'received' && match.status === 'pending' && (
            <>
              <button
                onClick={onReject}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={onAccept}
                className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
              >
                <Check className="h-5 w-5" />
              </button>
            </>
          )}
          {match.status === 'accepted' && (
            <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </button>
          )}
          <Link
            href={`/profile/${profile.id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
