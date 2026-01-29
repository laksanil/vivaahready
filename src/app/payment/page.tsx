'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Redirect /payment to /get-verified - payment is now integrated there
export default function PaymentPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/get-verified')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  )
}
