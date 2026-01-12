'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PreviewProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main profile page
    router.replace('/profile')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to profile...</p>
    </div>
  )
}
