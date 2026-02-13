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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

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

  useEffect(() => {
    fetchEvents()
  }, [])

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
          onClick={fetchEvents}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

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
    </div>
  )
}
