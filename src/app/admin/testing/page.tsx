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
} from 'lucide-react'

// Test scenarios configuration
const TEST_SCENARIOS = {
  visitor: {
    id: 'visitor',
    name: 'Visitor (Logged Out)',
    description: 'View the site as a non-authenticated visitor',
    icon: LogOut,
    color: 'bg-gray-500',
    pages: [
      { name: 'Homepage', path: '/', description: 'Landing page with blurred profiles' },
      { name: 'Login', path: '/login', description: 'Login page' },
      { name: 'Register', path: '/register', description: 'Registration page' },
      { name: 'Pricing', path: '/pricing', description: 'Pricing information' },
      { name: 'About', path: '/about', description: 'About us page' },
    ]
  },
  newUser: {
    id: 'newUser',
    name: 'New User (No Profile)',
    description: 'Logged in user who hasn\'t created a profile yet',
    icon: UserPlus,
    color: 'bg-blue-500',
    pages: [
      { name: 'Dashboard', path: '/dashboard', description: 'Shows profile creation prompt' },
      { name: 'Create Profile', path: '/profile/create', description: 'Profile creation wizard' },
    ]
  },
  pendingUser: {
    id: 'pendingUser',
    name: 'Pending Approval',
    description: 'User with profile awaiting admin approval',
    icon: Clock,
    color: 'bg-yellow-500',
    pages: [
      { name: 'Dashboard', path: '/dashboard', description: 'Shows pending status message' },
      { name: 'My Profile', path: '/profile', description: 'View own profile (limited)' },
    ]
  },
  approvedUser: {
    id: 'approvedUser',
    name: 'Approved User',
    description: 'Fully approved user with active profile',
    icon: CheckCircle,
    color: 'bg-green-500',
    pages: [
      { name: 'Dashboard', path: '/dashboard', description: 'Full dashboard with stats' },
      { name: 'My Profile', path: '/profile', description: 'Complete profile view' },
      { name: 'Matches', path: '/matches', description: 'View potential matches' },
      { name: 'Messages', path: '/messages', description: 'Messaging inbox' },
      { name: 'Search', path: '/search', description: 'Browse profiles' },
    ]
  },
  rejectedUser: {
    id: 'rejectedUser',
    name: 'Rejected Profile',
    description: 'User whose profile was rejected',
    icon: XCircle,
    color: 'bg-red-500',
    pages: [
      { name: 'Dashboard', path: '/dashboard', description: 'Shows rejection notice' },
      { name: 'Edit Profile', path: '/profile/edit', description: 'Edit and resubmit' },
    ]
  },
}

// Mock user profiles for testing
const MOCK_USERS = {
  testBride: {
    id: 'test-bride-001',
    name: 'Priya Sharma',
    email: 'usdesivivah@gmail.com',
    gender: 'female',
    age: 28,
    location: 'San Francisco, CA',
    occupation: 'Software Engineer',
    qualification: 'Masters in Computer Science',
    approvalStatus: 'approved',
  },
  testGroom: {
    id: 'test-groom-001',
    name: 'Rahul Patel',
    email: 'test.groom@vivaahready.com',
    gender: 'male',
    age: 30,
    location: 'New York, NY',
    occupation: 'Product Manager',
    qualification: 'MBA',
    approvalStatus: 'approved',
  },
}

interface TestSession {
  scenario: string
  mockUser: typeof MOCK_USERS.testBride | null
  startedAt: Date
}

export default function AdminTestingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')
  const [testSession, setTestSession] = useState<TestSession | null>(null)
  const [selectedMockUser, setSelectedMockUser] = useState<'testBride' | 'testGroom'>('testBride')

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        setIsAdmin(true)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const startTestSession = (scenarioId: string) => {
    const session: TestSession = {
      scenario: scenarioId,
      mockUser: scenarioId !== 'visitor' ? MOCK_USERS[selectedMockUser] : null,
      startedAt: new Date(),
    }
    setTestSession(session)
    setActiveScenario(scenarioId)

    // Store test session in sessionStorage for the app to detect
    sessionStorage.setItem('adminTestMode', JSON.stringify({
      active: true,
      scenario: scenarioId,
      mockUser: session.mockUser,
    }))
  }

  const endTestSession = () => {
    setTestSession(null)
    setActiveScenario(null)
    setPreviewUrl(null)
    sessionStorage.removeItem('adminTestMode')
  }

  const openPreview = (path: string) => {
    setPreviewUrl(path)
  }

  const openInNewTab = (path: string) => {
    // Add test mode query param
    const testParam = activeScenario ? `?testMode=${activeScenario}` : ''
    window.open(path + testParam, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  Testing Sandbox
                </h1>
                <p className="text-sm text-gray-500">Test user experience without affecting real data</p>
              </div>
            </div>

            {testSession && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  <Play className="h-4 w-4" />
                  Testing: {TEST_SCENARIOS[testSession.scenario as keyof typeof TEST_SCENARIOS]?.name}
                </div>
                <button
                  onClick={endTestSession}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                >
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Mode Warning */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Testing Mode</h3>
            <p className="text-sm text-amber-700 mt-1">
              This sandbox allows you to preview the user interface at different stages.
              Test data is not saved to the database. Use the mock account <strong>usdesivivah@gmail.com</strong> for testing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Scenarios */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                Test Configuration
              </h2>

              {/* Mock User Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mock User Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedMockUser('testBride')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedMockUser === 'testBride'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">Priya Sharma</div>
                    <div className="text-xs text-gray-500">Female, 28</div>
                  </button>
                  <button
                    onClick={() => setSelectedMockUser('testGroom')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedMockUser === 'testGroom'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">Rahul Patel</div>
                    <div className="text-xs text-gray-500">Male, 30</div>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Scenario</label>
              </div>
            </div>

            {/* Scenario Cards */}
            {Object.values(TEST_SCENARIOS).map((scenario) => {
              const Icon = scenario.icon
              const isActive = activeScenario === scenario.id

              return (
                <div
                  key={scenario.id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                    isActive ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => startTestSession(scenario.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${scenario.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
                      </div>
                      {isActive && (
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                  </button>

                  {isActive && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 mt-2">
                      <div className="text-xs font-medium text-gray-500 mb-2">Available Pages</div>
                      <div className="space-y-1">
                        {scenario.pages.map((page) => (
                          <button
                            key={page.path}
                            onClick={() => openPreview(page.path)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
                              previewUrl === page.path
                                ? 'bg-purple-100 text-purple-700'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span>{page.name}</span>
                            <Eye className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Preview Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setDeviceMode('desktop')}
                      className={`p-1.5 rounded ${deviceMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeviceMode('mobile')}
                      className={`p-1.5 rounded ${deviceMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>

                  {previewUrl && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                        {previewUrl}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {previewUrl && (
                    <>
                      <button
                        onClick={() => openPreview(previewUrl)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Refresh"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openInNewTab(previewUrl)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Preview Content */}
              <div
                className={`bg-gray-100 flex items-center justify-center ${
                  deviceMode === 'mobile' ? 'p-8' : 'p-4'
                }`}
                style={{ minHeight: '600px' }}
              >
                {previewUrl ? (
                  <div
                    className={`bg-white shadow-xl rounded-lg overflow-hidden ${
                      deviceMode === 'mobile' ? 'w-[375px]' : 'w-full'
                    }`}
                    style={{ height: deviceMode === 'mobile' ? '667px' : '100%', minHeight: '550px' }}
                  >
                    <iframe
                      src={`${previewUrl}${previewUrl.includes('?') ? '&' : '?'}testMode=${activeScenario || 'preview'}`}
                      className="w-full h-full border-0"
                      title="Preview"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="font-medium text-gray-700">No Preview Selected</h3>
                    <p className="text-sm mt-1">Select a scenario and click on a page to preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {activeScenario && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => openInNewTab('/')}
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
                  >
                    <Home className="h-4 w-4" />
                    Homepage
                  </button>
                  <button
                    onClick={() => openInNewTab('/dashboard')}
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => openInNewTab('/matches')}
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
                  >
                    <Heart className="h-4 w-4" />
                    Matches
                  </button>
                  <button
                    onClick={() => openInNewTab('/search')}
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </button>
                </div>
              </div>
            )}

            {/* Test Checklist */}
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Testing Checklist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {[
                  'Homepage loads correctly for visitors',
                  'Login/Register pages work',
                  'Profile creation wizard flows correctly',
                  'Dashboard shows correct status',
                  'Matches page shows filtered results',
                  'Photo visibility rules work',
                  'Interest express/accept/reject works',
                  'Messaging between matched users works',
                  'Search filters work correctly',
                  'Mobile responsive design works',
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" />
                    <span className="text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
