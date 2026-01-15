'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * This page redirects to the user's profile page with viewAsUser parameter.
 * Admin and user now use the same edit interface for consistency.
 */
export default function AdminProfileEditRedirect() {
  const params = useParams()
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const redirectToProfile = async () => {
      try {
        // Fetch the profile to get the userId
        const res = await fetch(`/api/admin/profiles/${params.id}`)
        if (!res.ok) {
          setError('Profile not found')
          return
        }

        const profile = await res.json()
        const userId = profile.userId

        if (!userId) {
          setError('User not found for this profile')
          return
        }

        // Redirect to the user's profile page with viewAsUser parameter
        // This uses the same edit flow as the user sees
        router.replace(`/profile?viewAsUser=${userId}`)
      } catch (err) {
        console.error('Redirect error:', err)
        setError('Failed to redirect')
      }
    }

    redirectToProfile()
  }, [params.id, router])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/admin/profiles')}
          className="text-primary-600 hover:underline"
        >
          Back to Profiles
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
      <p className="text-gray-600">Redirecting to profile edit...</p>
    </div>
  )
}
