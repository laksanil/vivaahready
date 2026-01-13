'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft, Copy, Check, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import FindMatchModal from '@/components/FindMatchModal'

interface CreatedProfile {
  profileId: string
  vrId: string
  email: string
  tempPassword: string
  name: string
}

export default function AdminCreateProfilePage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createdProfile, setCreatedProfile] = useState<CreatedProfile | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleAdminSuccess = (profileId: string, tempPassword: string, email: string, name?: string, vrId?: string) => {
    setCreatedProfile({
      profileId,
      vrId: vrId || '',
      email,
      tempPassword,
      name: name || ''
    })
    setIsModalOpen(false)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyAllCredentials = async () => {
    if (!createdProfile) return
    const text = `Profile Created Successfully!

Email: ${createdProfile.email}
Temporary Password: ${createdProfile.tempPassword}
VR ID: ${createdProfile.vrId}

Note: User must change password on first login.`

    await copyToClipboard(text, 'all')
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/profiles"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profiles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Profile</h1>
        <p className="text-gray-600 mt-1">
          Create a profile on behalf of a user. They will receive temporary credentials to access their account.
        </p>
      </div>

      {!createdProfile ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Start Creating a Profile
            </h2>
            <p className="text-gray-600 mb-6">
              Click the button below to open the profile creation wizard.
              You&apos;ll be able to enter all the user&apos;s details and set up their account with a temporary password.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Create Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">
                  Profile Created Successfully!
                </h2>
                <p className="text-green-600">
                  {createdProfile.name}&apos;s profile has been created and approved.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              User Credentials
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Share these credentials with the user. They will be required to change their password on first login.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">VR ID</p>
                    <p className="text-lg font-mono text-gray-900">{createdProfile.vrId}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdProfile.vrId, 'vrId')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copiedField === 'vrId' ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-lg font-mono text-gray-900">{createdProfile.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdProfile.email, 'email')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copiedField === 'email' ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-700">Temporary Password</p>
                    <p className="text-lg font-mono text-gray-900">
                      {showPassword ? createdProfile.tempPassword : '••••••••••'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(createdProfile.tempPassword, 'password')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  The user must change this password on first login.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={copyAllCredentials}
                className="flex-1 btn-secondary inline-flex items-center justify-center gap-2"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy All Credentials
                  </>
                )}
              </button>
              <Link
                href={`/admin/profiles/${createdProfile.profileId}`}
                className="flex-1 btn-primary inline-flex items-center justify-center gap-2"
              >
                View Profile
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setCreatedProfile(null)
                  setIsModalOpen(true)
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create Another Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <FindMatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdminMode={true}
        onAdminSuccess={handleAdminSuccess}
      />
    </div>
  )
}
