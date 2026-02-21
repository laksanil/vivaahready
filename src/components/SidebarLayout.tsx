'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { isSidebarPage } from './UserSidebar'

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const hasSidebar = isSidebarPage(pathname) && !!session

  if (hasSidebar) {
    return (
      <div className="md:ml-64 min-h-screen">
        {children}
      </div>
    )
  }

  return <>{children}</>
}
