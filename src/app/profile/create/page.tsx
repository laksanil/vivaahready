'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// This page redirects to dashboard which shows the profile creation modal
// All profile creation now happens through FindMatchModal for a consistent experience

export default function CreateProfilePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard with createProfile flag
    router.replace('/dashboard?createProfile=true')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
        <p className="mt-4 text-gray-600">Redirecting to profile creation...</p>
      </div>
    </div>
  )
}
