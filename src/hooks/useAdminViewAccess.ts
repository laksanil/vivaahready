'use client'

import { useEffect, useState } from 'react'
import { useImpersonation } from '@/hooks/useImpersonation'

export function useAdminViewAccess() {
  const { viewAsUser } = useImpersonation()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)

  useEffect(() => {
    let active = true

    if (!viewAsUser) {
      setIsAdmin(false)
      setAdminChecked(true)
      return () => {}
    }

    setAdminChecked(false)
    fetch('/api/admin/check')
      .then((res) => {
        if (active) {
          setIsAdmin(res.ok)
        }
      })
      .catch(() => {
        if (active) {
          setIsAdmin(false)
        }
      })
      .finally(() => {
        if (active) {
          setAdminChecked(true)
        }
      })

    return () => {
      active = false
    }
  }, [viewAsUser])

  return {
    viewAsUser,
    isAdminView: !!viewAsUser,
    isAdmin,
    adminChecked,
  }
}
