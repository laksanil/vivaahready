'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export default function FeedbackWidget() {
  const pathname = usePathname()
  const { status } = useSession()

  // Hide on feedback page, admin pages, signup photo page, and login/register
  if (
    pathname === '/feedback' ||
    pathname?.startsWith('/admin') ||
    pathname === '/profile/photos' ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return null
  }

  const feedbackFrom = encodeURIComponent(pathname || '/')

  // If not authenticated, route to login with callback to feedback
  const href =
    status === 'authenticated'
      ? `/feedback?from=${feedbackFrom}`
      : `/login?callbackUrl=${encodeURIComponent(`/feedback?from=${feedbackFrom}`)}`

  return (
    <Link
      href={href}
      aria-label="Give feedback"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all group print:hidden"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-sm font-medium hidden sm:inline">Give Feedback</span>
    </Link>
  )
}
