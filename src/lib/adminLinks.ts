/**
 * Admin link utilities for user impersonation
 *
 * When admins click on user-related links, they should see the app
 * exactly as that user would see it, with a purple admin banner.
 */

/**
 * Generate a link that opens the user's view with admin impersonation
 * @param path - The base path (e.g., '/feed', '/dashboard', '/connections')
 * @param userId - The user's ID to impersonate
 * @returns The full URL with viewAsUser parameter
 */
export function adminViewLink(path: string, userId: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}viewAsUser=${userId}`
}

/**
 * Generate links for common user pages
 */
export const adminLinks = {
  // View user's profile page
  profile: (profileId: string, userId: string) => adminViewLink(`/profile/${profileId}`, userId),

  // View user's own profile (settings page)
  myProfile: (userId: string) => adminViewLink('/profile', userId),

  // View user's dashboard
  dashboard: (userId: string) => adminViewLink('/dashboard', userId),

  // View user's matches/feed
  feed: (userId: string) => adminViewLink('/feed', userId),

  // View user's connections
  connections: (userId: string) => adminViewLink('/connections', userId),

  // View user's messages
  messages: (userId: string) => adminViewLink('/messages', userId),

  // View user's reconsider page (declined profiles)
  reconsider: (userId: string) => adminViewLink('/reconsider', userId),

  // Admin user detail page
  userDetail: (userId: string) => `/admin/users/${userId}`,

  // Admin user edit page
  userEdit: (userId: string) => `/admin/users/${userId}/edit`,
}

/**
 * All pages that support admin impersonation via viewAsUser
 */
export const IMPERSONATION_PAGES = [
  '/dashboard',
  '/feed',
  '/connections',
  '/messages',
  '/reconsider',
  '/profile',
] as const
