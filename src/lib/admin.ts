import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import type { Session } from 'next-auth'

// Server-side admin session store (cryptographic tokens)
interface AdminSessionEntry {
  expiresAt: Date
}

const globalStore = global as typeof globalThis & {
  adminSessionStore?: Map<string, AdminSessionEntry>
}

if (!globalStore.adminSessionStore) {
  globalStore.adminSessionStore = new Map<string, AdminSessionEntry>()
}

const adminSessionStore = globalStore.adminSessionStore

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Cleanup expired sessions periodically
function cleanupExpiredSessions() {
  const now = new Date()
  adminSessionStore.forEach((entry, token) => {
    if (now > entry.expiresAt) {
      adminSessionStore.delete(token)
    }
  })
}

/** Create a new admin session and return the token */
export function createAdminSession(): string {
  cleanupExpiredSessions()
  const token = randomUUID()
  adminSessionStore.set(token, {
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
  })
  return token
}

/** Destroy an admin session by token */
export function destroyAdminSession(token: string): void {
  adminSessionStore.delete(token)
}

// Check if admin is authenticated via cookie
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')
  if (!adminSession?.value) return false

  const entry = adminSessionStore.get(adminSession.value)
  if (!entry) return false

  if (new Date() > entry.expiresAt) {
    adminSessionStore.delete(adminSession.value)
    return false
  }

  return true
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
