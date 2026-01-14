import { cookies } from 'next/headers'
import type { Session } from 'next-auth'

const ADMIN_TOKEN = 'vivaah_admin_session_token_2024'

// Check if admin is authenticated via cookie
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')
  return adminSession?.value === ADMIN_TOKEN
}

// Check if request has viewAsUser param (admin impersonation)
export function getAdminViewUserId(request: Request): string | null {
  const { searchParams } = new URL(request.url)
  return searchParams.get('viewAsUser') || null
}

/**
 * Get the target user ID for API operations.
 * If admin is viewing as another user, returns that user's ID.
 * Otherwise returns the logged-in user's ID.
 * Returns null if no valid user context.
 */
export async function getTargetUserId(
  request: Request,
  session: Session | null
): Promise<{ userId: string; isAdminView: boolean } | null> {
  const { searchParams } = new URL(request.url)
  const viewAsUser = searchParams.get('viewAsUser')

  if (viewAsUser) {
    // Validate admin access via cookie
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      // Not authorized to impersonate - fall back to normal user flow
      if (!session?.user?.id) return null
      return { userId: session.user.id, isAdminView: false }
    }
    return { userId: viewAsUser, isAdminView: true }
  }

  if (!session?.user?.id) return null
  return { userId: session.user.id, isAdminView: false }
}
