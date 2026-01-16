'use client'

import { SessionProvider } from 'next-auth/react'
import { ProfileCompletionGuard } from '@/components/ProfileCompletionGuard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProfileCompletionGuard>{children}</ProfileCompletionGuard>
    </SessionProvider>
  )
}
