import type { Session } from 'next-auth'

type TestAuthUser = {
  id: string
  email: string
  name: string
  isAdmin: boolean
  phone: string | null
  isVerified: boolean
  profileId: string | null
}

export const TEST_AUTH_USERS: Record<string, TestAuthUser> = {
  admin_with_phone: {
    id: 'test-admin-with-phone',
    email: 'admin+withphone@vivaahready.test',
    name: 'Test Admin Phone',
    isAdmin: true,
    phone: '+14085551234',
    isVerified: true,
    profileId: 'test-profile-admin-with-phone',
  },
  admin_no_phone: {
    id: 'test-admin-no-phone',
    email: 'admin+nophone@vivaahready.test',
    name: 'Test Admin No Phone',
    isAdmin: true,
    phone: null,
    isVerified: true,
    profileId: 'test-profile-admin-no-phone',
  },
  user_with_phone: {
    id: 'test-user-with-phone',
    email: 'user+withphone@vivaahready.test',
    name: 'Test User Phone',
    isAdmin: false,
    phone: '+14085550001',
    isVerified: false,
    profileId: 'test-profile-user-with-phone',
  },
  user_no_phone: {
    id: 'test-user-no-phone',
    email: 'user+nophone@vivaahready.test',
    name: 'Test User No Phone',
    isAdmin: false,
    phone: null,
    isVerified: false,
    profileId: 'test-profile-user-no-phone',
  },
}

function testModeEnabled() {
  return process.env.NODE_ENV === 'test' && process.env.TEST_AUTH_MODE === '1'
}

export function getTestAuthUser(request: Request): TestAuthUser | null {
  if (!testModeEnabled()) return null
  const key = request.headers.get('x-test-auth-user')
  if (!key) return null
  return TEST_AUTH_USERS[key] || null
}

export function resolveSessionUserId(
  request: Request,
  session: Session | null
): string | null {
  const testUser = getTestAuthUser(request)
  if (testUser) return testUser.id
  return (session?.user as any)?.id || null
}

export function isTestAdminRequest(request: Request): boolean {
  const testUser = getTestAuthUser(request)
  return !!testUser?.isAdmin
}
