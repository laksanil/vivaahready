'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  User,
  MapPin,
  ClipboardList,
  ThumbsUp,
  HelpCircle,
} from 'lucide-react'

interface EventRegistration {
  id: string
  status: string
  paymentStatus: string
  whatsappOptIn: boolean
  smsOptIn: boolean
  registeredAt: string
  profile: {
    id: string
    odNumber: string | null
    firstName: string | null
    lastName: string | null
    gender: string | null
    dateOfBirth: string | null
    currentLocation: string | null
    zipCode: string | null
    dietaryPreference: string | null
    user: {
      name: string
      email: string
      phone: string | null
    }
  }
}

interface EventData {
  id: string
  slug: string
  title: string
  eventDate: string
  status: string
  price: number
  maxMaleSpots: number
  maxFemaleSpots: number
  registrations: EventRegistration[]
  stats: {
    totalRegistered: number
    totalWaitlisted: number
    maleCount: number
    femaleCount: number
    totalRevenue: number
  }
}

interface SurveyEntry {
  id: string
  interestLevel: string
  availability: string | null
  duration: string | null
  goal: string | null
  nameSharing: string | null
  frequency: string | null
  groupSize: string | null
  ageRange: string | null
  timeZone: string | null
  videoComfort: string | null
  suggestions: string | null
  createdAt: string
  updatedAt: string
  user: {
    name: string | null
    email: string | null
    phone: string | null
  } | null
  profile: {
    odNumber: string | null
    firstName: string | null
    lastName: string | null
    currentLocation: string | null
  } | null
}

interface SurveySummary {
  total: number
  interested: number
  maybe: number
  notNow: number
}

const availabilityLabels: Record<string, string> = {
  weekend_morning: 'Weekend mornings',
  weekend_evening: 'Weekend evenings',
  weekday_evening: 'Weekday evenings',
  flexible: 'Flexible / Any time',
}

const durationLabels: Record<string, string> = {
  '1_hour': '1 hour',
  '1.5_hours': '1.5 hours',
}

const goalLabels: Record<string, string> = {
  matched_profiles: 'Only matched profiles',
  make_friends: 'Open to making friends',
  find_partner: 'Looking for a partner',
}

const nameSharingLabels: Record<string, string> = {
  share_name: 'Share first name',
  anonymous: 'Stay anonymous',
  after_match: 'After mutual interest',
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
}

const groupSizeLabels: Record<string, string> = {
  small: 'Small (4-6)',
  medium: 'Medium (8-12)',
  large: 'Large (12+)',
}

const ageRangeLabels: Record<string, string> = {
  strict: 'Strict match criteria',
  flexible_5: 'Flexible +/- 5 yrs',
  open: 'Open to any',
}

const videoComfortLabels: Record<string, string> = {
  camera_on: 'Camera on',
  audio_only: 'Audio only',
  either: 'Either works',
}

const formatLabel = (value: string | null, labels?: Record<string, string>): string => {
  if (!value) return '-'
  if (labels && labels[value]) return labels[value]
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AdminEventsPage() {
  const [activeTab, setActiveTab] = useState<'registrations' | 'survey'>('registrations')
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  // Survey state
  const [surveyEntries, setSurveyEntries] = useState<SurveyEntry[]>([])
  const [surveySummary, setSurveySummary] = useState<SurveySummary>({ total: 0, interested: 0, maybe: 0, notNow: 0 })
  const [surveyLoading, setSurveyLoading] = useState(false)
  const [surveyLoaded, setSurveyLoaded] = useState(false)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/events')
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data.events || [])
      if (data.events?.length > 0 && !selectedEvent) {
        setSelectedEvent(data.events[0].id)
      }
    } catch (err) {
      setError('Failed to load events')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSurvey = async () => {
    try {
      setSurveyLoading(true)
      const res = await fetch('/api/admin/event-interest')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSurveyEntries(data.interests || [])
      setSurveySummary(data.summary || { total: 0, interested: 0, maybe: 0, notNow: 0 })
      setSurveyLoaded(true)
    } catch {
      // silent
    } finally {
      setSurveyLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // Lazy load survey data when tab is first selected
  useEffect(() => {
    if (activeTab === 'survey' && !surveyLoaded) {
      fetchSurvey()
    }
  }, [activeTab, surveyLoaded])

  const selectedEventData = events.find((e) => e.id === selectedEvent)

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null
    const [month, day, year] = dateOfBirth.split('/').map(Number)
    const dob = new Date(year, month - 1, day)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchEvents}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage event registrations and attendees</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'registrations') fetchEvents()
            else fetchSurvey()
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'registrations'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Registrations
            </span>
          </button>
          <button
            onClick={() => setActiveTab('survey')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'survey'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Survey Interest
              {surveyLoaded && surveySummary.total > 0 && (
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {surveySummary.total}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Registrations Tab */}
      {activeTab === 'registrations' && (
        <>
          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No Events Yet</h2>
              <p className="text-gray-600">Events will appear here once created.</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Event List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Events</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedEvent === event.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                        }`}
                      >
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(event.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-blue-600">
                            {event.stats.maleCount}M
                          </span>
                          <span className="text-pink-600">
                            {event.stats.femaleCount}F
                          </span>
                          <span className="text-green-600">
                            ${event.stats.totalRevenue}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="lg:col-span-2">
                {selectedEventData ? (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <User className="w-5 h-5" />
                          <span className="text-sm font-medium">Males</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedEventData.stats.maleCount}/{selectedEventData.maxMaleSpots}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-pink-600 mb-2">
                          <User className="w-5 h-5" />
                          <span className="text-sm font-medium">Females</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedEventData.stats.femaleCount}/{selectedEventData.maxFemaleSpots}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-yellow-600 mb-2">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm font-medium">Waitlist</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedEventData.stats.totalWaitlisted}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                          <DollarSign className="w-5 h-5" />
                          <span className="text-sm font-medium">Revenue</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${selectedEventData.stats.totalRevenue}
                        </div>
                      </div>
                    </div>

                    {/* Registrations Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">
                          Registrations ({selectedEventData.registrations.length})
                        </h2>
                      </div>

                      {selectedEventData.registrations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No registrations yet
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  VR ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Gender/Age
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Contact
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Notifications
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {selectedEventData.registrations.map((reg) => (
                                <tr key={reg.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-purple-600">
                                    {reg.profile.odNumber || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="font-medium text-gray-900">
                                      {reg.profile.firstName} {reg.profile.lastName}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      {reg.profile.currentLocation}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      reg.profile.gender === 'male'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-pink-100 text-pink-800'
                                    }`}>
                                      {reg.profile.gender === 'male' ? 'M' : 'F'}
                                    </span>
                                    <span className="ml-2 text-gray-600">
                                      {calculateAge(reg.profile.dateOfBirth) || '-'} yrs
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <Mail className="w-3 h-3" />
                                      <span className="text-xs">{reg.profile.user.email}</span>
                                    </div>
                                    {reg.profile.user.phone && (
                                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                                        <Phone className="w-3 h-3" />
                                        <span className="text-xs">{reg.profile.user.phone}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                      reg.status === 'registered' && reg.paymentStatus === 'paid'
                                        ? 'bg-green-100 text-green-800'
                                        : reg.status === 'waitlisted'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {reg.status === 'registered' && reg.paymentStatus === 'paid' ? (
                                        <>
                                          <CheckCircle className="w-3 h-3" />
                                          Confirmed
                                        </>
                                      ) : reg.status === 'waitlisted' ? (
                                        <>
                                          <Clock className="w-3 h-3" />
                                          Waitlist
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3 h-3" />
                                          {reg.status}
                                        </>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex gap-2">
                                      {reg.whatsappOptIn && (
                                        <span className="text-green-600 text-xs">WhatsApp</span>
                                      )}
                                      {reg.smsOptIn && (
                                        <span className="text-blue-600 text-xs">SMS</span>
                                      )}
                                      {!reg.whatsappOptIn && !reg.smsOptIn && (
                                        <span className="text-gray-400 text-xs">Email only</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">Select an event to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Survey Interest Tab */}
      {activeTab === 'survey' && (
        <>
          {surveyLoading && !surveyLoaded ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Total Responses</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{surveySummary.total}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Interested</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{surveySummary.interested}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-2 text-yellow-600 mb-2">
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Maybe</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{surveySummary.maybe}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-2 text-red-500 mb-2">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Not Now</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{surveySummary.notNow}</div>
                </div>
              </div>

              {/* Survey Table */}
              {surveyEntries.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">No Responses Yet</h2>
                  <p className="text-gray-600">Survey responses will appear here once users submit them.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">
                      Responses ({surveyEntries.length})
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goal</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">TZ</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {surveyEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-xs">
                              <div className="font-medium text-gray-900">
                                {entry.profile
                                  ? `${entry.profile.firstName || ''} ${entry.profile.lastName || ''}`.trim() || entry.user?.name || '-'
                                  : entry.user?.name || '-'}
                              </div>
                              {entry.profile?.odNumber && (
                                <div className="text-xs text-purple-600 font-medium">{entry.profile.odNumber}</div>
                              )}
                              {entry.user?.email && (
                                <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  <span className="text-xs">{entry.user.email}</span>
                                </div>
                              )}
                              {entry.user?.phone && (
                                <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                                  <Phone className="w-3 h-3" />
                                  <span className="text-xs">{entry.user.phone}</span>
                                </div>
                              )}
                              {entry.profile?.currentLocation && (
                                <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-xs">{entry.profile.currentLocation}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                entry.interestLevel === 'yes'
                                  ? 'bg-green-100 text-green-800'
                                  : entry.interestLevel === 'maybe'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {entry.interestLevel === 'yes' ? 'Yes' : entry.interestLevel === 'maybe' ? 'Maybe' : 'Not Now'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.availability, availabilityLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.duration, durationLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.goal, goalLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.frequency, frequencyLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.groupSize, groupSizeLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.ageRange, ageRangeLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {entry.timeZone || '-'}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.videoComfort, videoComfortLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {formatLabel(entry.nameSharing, nameSharingLabels)}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700 max-w-[150px]">
                              {entry.suggestions ? (
                                <span className="truncate block" title={entry.suggestions}>{entry.suggestions}</span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
