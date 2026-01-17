'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main profile page
    router.replace('/profile')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-silver-50 to-silver-100">
      <p className="text-gray-600">Redirecting to profile...</p>
    </div>
  )
}
