'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UserSidebar, { isSidebarPage } from './UserSidebar'

function SidebarWrapper() {
  return <UserSidebar />
}

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  // Only apply sidebar layout when the page supports it AND user is authenticated
  const showSidebar = isSidebarPage(pathname) && !!session

  return (
    <div className={showSidebar ? 'lg:flex' : ''}>
      <Suspense fallback={null}>
        <SidebarWrapper />
      </Suspense>
      <div className={showSidebar ? 'flex-1 lg:ml-64 min-w-0' : 'w-full'}>
        {children}
      </div>
    </div>
  )
}
