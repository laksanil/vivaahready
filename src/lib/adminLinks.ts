/**
 * Admin link utilities for user impersonation
 *
 * When admins click on user-related links, they should see the app
 * exactly as that user would see it, with a purple admin banner.
 *
 * IMPORTANT: Admin and user should use the SAME edit functionality.
 * All edit links go to /profile?viewAsUser={userId} which opens the
 * same ProfileEditModal used by regular users.
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

  // View/Edit user's own profile (same page - uses modal for editing)
  // This is the same experience for both admin and user
  myProfile: (userId: string) => adminViewLink('/profile', userId),

  // Edit user's profile - goes to their profile page where they can open edit modal
  // Admin uses the same edit flow as users for consistency
  editProfile: (userId: string) => adminViewLink('/profile', userId),

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
  '/profile/edit',
] as const
