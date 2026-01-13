'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Play,
  Eye,
  User,
  UserPlus,
  Heart,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ArrowLeft,
  Monitor,
  Smartphone,
  RefreshCw,
  Settings,
  AlertTriangle,
  Users,
  MessageCircle,
  Search,
  Home,
  ExternalLink,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Camera,
  Lock,
  Unlock,
  CheckCircle2,
  Send,
  Inbox,
  X,
} from 'lucide-react'
import {
  BasicsSection,
  LocationSection,
  EducationSection,
  FamilySection,
  LifestyleSection,
  ReligionSection,
  PreferencesSection,
} from '@/components/ProfileFormSections'

// Real users from the database for "View as User" testing
interface RealUser {
  id: string
  odNumber: string | null
  gender: string
  name: string
  email: string
  approvalStatus: string
  currentLocation: string | null
}

// Mock profile data for form testing
const MOCK_PROFILE_DATA = {
  createdBy: 'self',
  firstName: 'Test',
  lastName: 'User',
  gender: 'female',
  dateOfBirth: '03/15/1996',
  height: '5\'4"',
  weight: '130',
  maritalStatus: 'never_married',
  bloodGroup: 'B+',
  healthInfo: 'no_health_issues',
  anyDisability: 'none',
  motherTongue: 'Telugu',
  languagesKnown: 'English, Hindi, Telugu',
  currentLocation: 'San Francisco, CA',
  zipCode: '94105',
  citizenship: 'us_citizen',
  grewUpIn: 'India',
  qualification: 'masters_cs',
  university: 'Stanford University',
  occupation: 'Software Engineer',
  employerName: 'Google',
  annualIncome: '150000_200000',
  religion: 'Hindu',
  caste: 'Brahmin - Smartha',
  gotra: 'Bharadwaj',
  fatherName: 'Ramesh Kumar',
  motherName: 'Lakshmi Devi',
  fatherOccupation: 'Business',
  motherOccupation: 'Homemaker',
  numberOfBrothers: '1',
  numberOfSisters: '0',
  familyType: 'nuclear',
  familyValues: 'moderate',
  dietaryPreference: 'vegetarian',
  smoking: 'no',
  drinking: 'occasionally',
  aboutMe: 'I am a software engineer passionate about technology and innovation. I enjoy reading, traveling, and exploring new cuisines. Looking for someone who shares similar values and interests.',
  prefHeight: 'any',
  prefAgeDiff: 'between_3_to_5_years_elder',
  prefLocation: 'bay_area',
  prefQualification: 'masters_any',
  prefIncome: 'above_100k',
  prefDiet: 'vegetarian',
  prefCaste: 'same_caste',
  idealPartnerDesc: 'Looking for someone who is educated, family-oriented, and has a good sense of humor.',
}

export default function AdminTestingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'view-as-user' | 'form-preview' | 'ui-states' | 'flow-test'>('view-as-user')

  // View as User state
  const [realUsers, setRealUsers] = useState<RealUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<'all' | 'male' | 'female'>('all')

  // Form Preview state
  const [formSection, setFormSection] = useState<'basics' | 'location' | 'education' | 'religion' | 'family' | 'lifestyle' | 'preferences'>('basics')
  const [formData, setFormData] = useState<Record<string, unknown>>(MOCK_PROFILE_DATA)

  // UI States Preview
  const [uiStatePreview, setUiStatePreview] = useState<'dashboard-pending' | 'dashboard-approved' | 'dashboard-rejected' | 'matches-empty' | 'matches-with-data' | 'interest-received'>('dashboard-pending')

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        setIsAdmin(true)
        fetchRealUsers()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchRealUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/profiles?limit=100')
      const data = await response.json()
      if (data.profiles) {
        setRealUsers(data.profiles.map((p: any) => ({
          id: p.user.id,
          odNumber: p.odNumber,
          gender: p.gender,
          name: p.user.name,
          email: p.user.email,
          approvalStatus: p.approvalStatus,
          currentLocation: p.currentLocation,
        })))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const filteredUsers = realUsers.filter(u => {
    if (userFilter === 'all') return true
    return u.gender === userFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Monitor className="h-7 w-7 text-purple-600" />
            Testing Sandbox
          </h1>
          <p className="text-gray-500 mt-1">Test user experience and preview UI components</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-800">Testing Mode</h3>
          <p className="text-sm text-amber-700 mt-1">
            Use this sandbox to test the user interface. &quot;View as User&quot; shows real user data.
            Form previews use mock data and don&apos;t save to the database.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex">
        {[
          { id: 'view-as-user', label: 'View as User', icon: Eye },
          { id: 'form-preview', label: 'Form Preview', icon: Settings },
          { id: 'ui-states', label: 'UI States', icon: Monitor },
          { id: 'flow-test', label: 'User Flows', icon: Play },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* VIEW AS USER TAB */}
        {activeTab === 'view-as-user' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">View as User</h2>
                <p className="text-sm text-gray-500">Select a user to view their matches dashboard exactly as they see it</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="female">Brides Only</option>
                  <option value="male">Grooms Only</option>
                </select>
                <button
                  onClick={fetchRealUsers}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                      selectedUserId === user.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          user.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                        }`}>
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.odNumber || 'No VR ID'}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        user.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : user.approvalStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.approvalStatus}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {user.currentLocation || 'Location not set'}
                    </div>
                    {selectedUserId === user.id && (
                      <div className="mt-4 pt-4 border-t border-purple-200 flex gap-2">
                        <Link
                          href={`/matches?viewAsUser=${user.id}`}
                          target="_blank"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                        >
                          <Heart className="h-4 w-4" />
                          View Matches
                        </Link>
                        <Link
                          href={`/dashboard?viewAsUser=${user.id}`}
                          target="_blank"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                        >
                          <Home className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {filteredUsers.length === 0 && !loadingUsers && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No users found</p>
              </div>
            )}
          </div>
        )}

        {/* FORM PREVIEW TAB */}
        {activeTab === 'form-preview' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profile Form Preview</h2>
                <p className="text-sm text-gray-500">Preview how the profile creation form looks with sample data</p>
              </div>
              <button
                onClick={() => setFormData(MOCK_PROFILE_DATA)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Reset to Mock Data
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'basics', label: 'Basic Info' },
                { id: 'location', label: 'Location' },
                { id: 'education', label: 'Education' },
                { id: 'religion', label: 'Religion' },
                { id: 'family', label: 'Family' },
                { id: 'lifestyle', label: 'Lifestyle' },
                { id: 'preferences', label: 'Preferences' },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setFormSection(section.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formSection === section.id
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {/* Form Section Preview */}
            <div className="max-w-2xl mx-auto bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                {formSection === 'basics' && (
                  <BasicsSection formData={formData} handleChange={handleFormChange} setFormData={setFormData} />
                )}
                {formSection === 'location' && (
                  <LocationSection formData={formData} handleChange={handleFormChange} setFormData={setFormData} />
                )}
                {formSection === 'education' && (
                  <EducationSection formData={formData} handleChange={handleFormChange} setFormData={setFormData} />
                )}
                {formSection === 'religion' && (
                  <ReligionSection formData={formData} handleChange={handleFormChange} setFormData={setFormData} />
                )}
                {formSection === 'family' && (
                  <FamilySection formData={formData} handleChange={handleFormChange} setFormData={setFormData} />
                )}
                {formSection === 'lifestyle' && (
                  <LifestyleSection formData={formData} handleChange={handleFormChange} setFormData={setFormData} />
                )}
                {formSection === 'preferences' && (
                  <PreferencesSection formData={formData} handleChange={handleFormChange} setFormData={setFormData} />
                )}
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                This is a preview only - changes are not saved
              </p>
            </div>
          </div>
        )}

        {/* UI STATES TAB */}
        {activeTab === 'ui-states' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">UI State Previews</h2>
              <p className="text-sm text-gray-500">See how different UI states look to users</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* State Selector */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 text-sm">Select State</h3>
                {[
                  { id: 'dashboard-pending', label: 'Dashboard - Pending Approval', icon: Clock, color: 'yellow' },
                  { id: 'dashboard-approved', label: 'Dashboard - Approved', icon: CheckCircle, color: 'green' },
                  { id: 'dashboard-rejected', label: 'Dashboard - Rejected', icon: XCircle, color: 'red' },
                  { id: 'matches-empty', label: 'Matches - No Matches', icon: Heart, color: 'gray' },
                  { id: 'matches-with-data', label: 'Matches - With Data', icon: Heart, color: 'pink' },
                  { id: 'interest-received', label: 'Interest Received', icon: Inbox, color: 'blue' },
                ].map((state) => {
                  const Icon = state.icon
                  return (
                    <button
                      key={state.id}
                      onClick={() => setUiStatePreview(state.id as any)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        uiStatePreview === state.id
                          ? 'bg-purple-100 border-2 border-purple-400'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-${state.color}-100`}>
                        <Icon className={`h-4 w-4 text-${state.color}-600`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{state.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Preview Panel */}
              <div className="lg:col-span-2 bg-gray-100 rounded-xl p-4 min-h-[500px]">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
                  {/* Dashboard Pending */}
                  {uiStatePreview === 'dashboard-pending' && (
                    <div className="p-6">
                      <div className="max-w-md mx-auto text-center py-8">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="h-10 w-10 text-yellow-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Under Review</h2>
                        <p className="text-gray-600 mb-6">
                          Your profile is being reviewed by our team. This usually takes 24-48 hours.
                          We&apos;ll notify you once it&apos;s approved.
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            <strong>What happens next?</strong><br />
                            Once approved, you&apos;ll be able to view matches and express interest.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Approved */}
                  {uiStatePreview === 'dashboard-approved' && (
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Welcome back, Priya!</h2>
                          <p className="text-sm text-green-600">Your profile is active</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-pink-50 rounded-xl p-4">
                          <div className="text-2xl font-bold text-pink-600">12</div>
                          <div className="text-sm text-gray-600">Potential Matches</div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                          <div className="text-2xl font-bold text-purple-600">3</div>
                          <div className="text-sm text-gray-600">Interests Received</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="text-2xl font-bold text-blue-600">2</div>
                          <div className="text-sm text-gray-600">Mutual Matches</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                          <div className="text-2xl font-bold text-green-600">5</div>
                          <div className="text-sm text-gray-600">Interests Sent</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Rejected */}
                  {uiStatePreview === 'dashboard-rejected' && (
                    <div className="p-6">
                      <div className="max-w-md mx-auto text-center py-8">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Needs Updates</h2>
                        <p className="text-gray-600 mb-4">
                          Your profile was not approved. Please review the feedback and make necessary changes.
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-6">
                          <p className="text-sm font-medium text-red-800 mb-2">Reason:</p>
                          <p className="text-sm text-red-700">
                            Profile photo does not meet our guidelines. Please upload a clear, recent photo of yourself.
                          </p>
                        </div>
                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Matches Empty */}
                  {uiStatePreview === 'matches-empty' && (
                    <div className="p-6">
                      <div className="max-w-md mx-auto text-center py-12">
                        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Matches Yet</h2>
                        <p className="text-gray-600 mb-6">
                          We&apos;re looking for profiles that match your preferences.
                          Check back soon or try adjusting your partner preferences.
                        </p>
                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                          Update Preferences
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Matches With Data */}
                  {uiStatePreview === 'matches-with-data' && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Your Matches</h2>
                        <span className="text-sm text-gray-500">12 profiles found</span>
                      </div>
                      <div className="space-y-4">
                        {[
                          { name: 'Rahul P.', age: 30, location: 'San Francisco', match: '92%' },
                          { name: 'Vikram S.', age: 28, location: 'New York', match: '87%' },
                          { name: 'Arjun M.', age: 31, location: 'Seattle', match: '85%' },
                        ].map((profile, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                              {profile.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{profile.name}</div>
                              <div className="text-sm text-gray-500">{profile.age} yrs • {profile.location}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-green-600">{profile.match}</div>
                              <div className="text-xs text-gray-500">match</div>
                            </div>
                            <button className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200">
                              <Heart className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interest Received */}
                  {uiStatePreview === 'interest-received' && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Interests Received</h2>
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">3 new</span>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-pink-50 border-2 border-pink-200 rounded-xl">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                              R
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Rahul Sharma</div>
                              <div className="text-sm text-gray-500">30 yrs • Software Engineer • Bay Area</div>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4 italic">
                            &quot;Hi! I came across your profile and found it very interesting. Would love to connect!&quot;
                          </p>
                          <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Accept
                            </button>
                            <button className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2">
                              <X className="h-4 w-4" />
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER FLOWS TAB */}
        {activeTab === 'flow-test' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">User Flow Testing</h2>
              <p className="text-sm text-gray-500">Test complete user journeys through the application</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Flow Cards */}
              {[
                {
                  title: 'New User Registration',
                  description: 'Test the complete signup flow from homepage to profile creation',
                  steps: ['Visit homepage', 'Click "Get Started"', 'Fill registration form', 'Create profile', 'Upload photos', 'Submit for approval'],
                  link: '/',
                  color: 'blue',
                },
                {
                  title: 'Profile Creation',
                  description: 'Test the multi-step profile creation wizard',
                  steps: ['Basic info', 'Location details', 'Education & career', 'Family info', 'Preferences', 'Photo upload'],
                  link: '/profile/create',
                  color: 'green',
                },
                {
                  title: 'Match Discovery',
                  description: 'Test viewing and interacting with matches',
                  steps: ['View matches list', 'Check match percentage', 'View full profile', 'Express interest', 'Send message'],
                  link: '/matches',
                  color: 'pink',
                },
                {
                  title: 'Interest Flow',
                  description: 'Test sending and receiving interests',
                  steps: ['Receive interest notification', 'View sender profile', 'Accept/Decline interest', 'Start conversation'],
                  link: '/matches?tab=received',
                  color: 'purple',
                },
              ].map((flow, idx) => (
                <div key={idx} className={`bg-${flow.color}-50 border border-${flow.color}-200 rounded-xl p-6`}>
                  <h3 className={`font-semibold text-${flow.color}-900 mb-2`}>{flow.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{flow.description}</p>
                  <div className="space-y-2 mb-4">
                    {flow.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-center gap-2 text-sm">
                        <span className={`w-5 h-5 rounded-full bg-${flow.color}-200 text-${flow.color}-700 flex items-center justify-center text-xs font-medium`}>
                          {stepIdx + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={flow.link}
                    target="_blank"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-${flow.color}-600 text-white rounded-lg hover:bg-${flow.color}-700 text-sm font-medium`}
                  >
                    Start Test
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Testing Checklist */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">QA Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  'Homepage loads correctly',
                  'Google OAuth works',
                  'Email/password login works',
                  'Profile creation saves all fields',
                  'Photo upload works',
                  'Matches display correctly',
                  'Match percentage calculates properly',
                  'Interest express works',
                  'Interest accept/decline works',
                  'Messaging works between matched users',
                  'Profile visibility rules work',
                  'Admin approval flow works',
                  'Mobile responsive design',
                  'Error states display properly',
                  'Loading states show correctly',
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200">
                    <input type="checkbox" className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
