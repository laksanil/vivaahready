'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, User, MapPin, Briefcase,
  GraduationCap, Users, Heart, CreditCard, Clock,
  CheckCircle, XCircle, AlertCircle, Settings
} from 'lucide-react'
import {
  BasicsSection,
  LocationSection,
  EducationSection,
  FamilySection,
  LifestyleSection,
  ReligionSection,
  PreferencesSection
} from '@/components/ProfileFormSections'

interface Profile {
  id: string
  odNumber: string | null
  gender: string
  dateOfBirth: string | null
  placeOfBirth: string | null
  height: string | null
  maritalStatus: string | null
  currentLocation: string | null
  country: string | null
  citizenship: string | null
  residencyStatus: string | null
  grewUpIn: string | null
  linkedinProfile: string | null
  facebookInstagram: string | null
  photoUrls: string | null
  profileImageUrl: string | null
  caste: string | null
  gotra: string | null
  qualification: string | null
  university: string | null
  occupation: string | null
  annualIncome: string | null
  fatherName: string | null
  motherName: string | null
  siblings: string | null
  familyLocation: string | null
  dietaryPreference: string | null
  languagesKnown: string | null
  aboutMe: string | null
  prefHeight: string | null
  prefAgeDiff: string | null
  prefLocation: string | null
  prefCountry: string | null
  prefDiet: string | null
  prefCaste: string | null
  prefGotra: string | null
  prefQualification: string | null
  prefIncome: string | null
  idealPartnerDesc: string | null
  approvalStatus: string
  approvalDate: string | null
  rejectionReason: string | null
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
    phone: string | null
    createdAt: string
    subscription: {
      plan: string
      status: string
      profilePaid: boolean
      profilePaymentId: string | null
      createdAt: string
      updatedAt: string
    } | null
  }
}

export default function AdminProfileEditPage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

  const [formData, setFormData] = useState<Partial<Profile>>({})

  useEffect(() => {
    fetchProfile()
  }, [params.id])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/admin/profiles/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
      setFormData(data)
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/profiles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to save')

      setSuccess('Profile updated successfully!')
      fetchProfile()
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString()
  }

  const formatValue = (value: string | null | undefined) => {
    if (!value) return 'Not specified'
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profile not found</p>
        <Link href="/admin/profiles" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Profiles
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'religion', label: 'Religion', icon: Settings },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'lifestyle', label: 'Lifestyle', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Heart },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'history', label: 'History', icon: Clock },
  ]

  // Props for shared form sections
  const sectionProps = {
    formData: formData as Record<string, unknown>,
    handleChange,
    setFormData: setFormData as React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/admin/profiles" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.user.name}</h1>
            <p className="text-sm text-gray-500">{profile.user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            profile.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
            profile.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {formatValue(profile.approvalStatus)}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Photos */}
      {profile.photoUrls && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Photos</h3>
          <div className="flex gap-4 flex-wrap">
            {profile.photoUrls.split(',').map((url, index) => (
              <img
                key={index}
                src={url.trim()}
                alt={`Photo ${index + 1}`}
                className="w-24 h-24 object-cover rounded-lg border"
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Info Tab - Using shared component */}
          {activeTab === 'basic' && <BasicsSection {...sectionProps} />}

          {/* Location Tab - Using shared component */}
          {activeTab === 'location' && <LocationSection {...sectionProps} />}

          {/* Education Tab - Using shared component */}
          {activeTab === 'education' && <EducationSection {...sectionProps} />}

          {/* Religion Tab - Using shared component */}
          {activeTab === 'religion' && <ReligionSection {...sectionProps} />}

          {/* Family Tab - Using shared component */}
          {activeTab === 'family' && <FamilySection {...sectionProps} />}

          {/* Lifestyle Tab - Using shared component */}
          {activeTab === 'lifestyle' && <LifestyleSection {...sectionProps} />}

          {/* Preferences Tab - Using shared component */}
          {activeTab === 'preferences' && <PreferencesSection {...sectionProps} />}

          {/* Admin Tab - Admin-only settings */}
          {activeTab === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                <select name="approvalStatus" value={formData.approvalStatus || ''} onChange={handleChange} className="input-field">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    name="isVerified"
                    checked={formData.isVerified || false}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Verified Profile</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive !== false}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Profile</span>
                </label>
              </div>
              {formData.approvalStatus === 'rejected' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                  <textarea
                    name="rejectionReason"
                    value={(formData.rejectionReason as string) || ''}
                    onChange={handleChange}
                    className="input-field min-h-[80px]"
                    placeholder="Reason for rejection..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                {profile.user.subscription ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium">{formatValue(profile.user.subscription.plan)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">{formatValue(profile.user.subscription.status)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Profile Payment</p>
                      <p className="font-medium flex items-center">
                        {profile.user.subscription.profilePaid ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            Not Paid
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment ID</p>
                      <p className="font-medium font-mono text-sm">{profile.user.subscription.profilePaymentId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Subscription Created</p>
                      <p className="font-medium">{formatDate(profile.user.subscription.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{formatDate(profile.user.subscription.updatedAt)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No subscription record found</p>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                    <div>
                      <p className="font-medium">User Account Created</p>
                      <p className="text-sm text-gray-500">{formatDate(profile.user.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                    <div>
                      <p className="font-medium">Profile Created</p>
                      <p className="text-sm text-gray-500">{formatDate(profile.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mt-1.5 mr-3"></div>
                    <div>
                      <p className="font-medium">Profile Last Updated</p>
                      <p className="text-sm text-gray-500">{formatDate(profile.updatedAt)}</p>
                    </div>
                  </div>
                  {profile.approvalDate && (
                    <div className="flex items-start">
                      <div className={`w-3 h-3 ${profile.approvalStatus === 'approved' ? 'bg-green-500' : 'bg-red-500'} rounded-full mt-1.5 mr-3`}></div>
                      <div>
                        <p className="font-medium">
                          Profile {profile.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(profile.approvalDate)}</p>
                        {profile.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">Reason: {profile.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">User Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{profile.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{profile.user.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
