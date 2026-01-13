'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function MatchesRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve query params (e.g., viewAsUser for admin mode)
    const params = searchParams.toString()
    const redirectUrl = params ? `/feed?${params}` : '/feed'
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to Feed...</p>
      </div>
    </div>
  )
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <MatchesRedirectContent />
    </Suspense>
  )
}
