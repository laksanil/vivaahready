import type { APIRequestContext, Page, APIResponse } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { recordCreatedTestUser } from './cleanup-registry'

export const DEFAULT_PASSWORD = 'E2EPass123!'
export const DEFAULT_PHOTO_PATH = path.join(process.cwd(), 'public', 'logo-couple.png')

export interface TestUser {
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: 'male' | 'female'
}

export function buildTestUser(suffix: string, gender: 'male' | 'female' = 'male'): TestUser {
  const safeSuffix = suffix.replace(/[^a-z0-9]/gi, '').toLowerCase()
  return {
    firstName: `E2E${safeSuffix}${gender === 'male' ? 'M' : 'F'}`,
    lastName: 'User',
    email: `e2e-${gender}-${safeSuffix}@example.com`,
    phone: gender === 'male' ? '5551234567' : '5559876543',
    gender,
  }
}

export async function registerUser(
  request: APIRequestContext,
  baseURL: string,
  user: TestUser,
  password: string = DEFAULT_PASSWORD
): Promise<{ userId: string }> {
  const response = await request.post(`${baseURL}/api/register`, {
    data: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      password,
      phone: user.phone,
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Register failed (${response.status()}): ${body}`)
  }

  const data = await response.json()
  const userId = data.userId as string
  recordCreatedTestUser(userId, user.email, 'helpers.registerUser')
  return { userId }
}

export async function createProfile(
  request: APIRequestContext,
  baseURL: string,
  user: TestUser,
  overrides: Record<string, unknown> = {}
): Promise<{ profileId: string }> {
  const payload = {
    email: user.email,
    gender: user.gender,
    phone: user.phone, // Phone is now mandatory - stored in User model
    createdBy: 'self',
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: '01/01/1992',
    height: "5'8\"",
    maritalStatus: 'never_married',
    motherTongue: 'English',
    country: 'USA',
    citizenship: 'USA',
    grewUpIn: 'USA',
    currentLocation: 'San Jose, CA',
    zipCode: '95112',
    qualification: 'bachelors_cs',
    university: 'San Jose State University',
    occupation: 'software_engineer',
    employerName: 'E2E QA Systems',
    annualIncome: '75k-100k',
    openToRelocation: 'yes',
    religion: 'Hindu',
    community: 'Iyer',
    familyLocation: 'USA',
    familyValues: 'moderate',
    dietaryPreference: 'Vegetarian',
    smoking: 'No',
    drinking: 'No',
    pets: 'no_but_love',
    aboutMe: 'E2E seeded profile for coverage tests.',
    linkedinProfile: 'no_linkedin',
    referralSource: 'google',
    ...overrides,
  }

  const response = await request.post(`${baseURL}/api/profile/create-from-modal`, {
    data: payload,
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Profile create failed (${response.status()}): ${body}`)
  }

  const data = await response.json()
  return { profileId: data.profileId as string }
}

export async function uploadProfilePhoto(
  request: APIRequestContext,
  baseURL: string,
  profileId: string,
  photoPath: string = DEFAULT_PHOTO_PATH
): Promise<APIResponse> {
  return request.post(`${baseURL}/api/profile/upload-photo`, {
    multipart: {
      profileId,
      file: fs.createReadStream(photoPath),
    },
  })
}

export async function createUserWithProfile(
  request: APIRequestContext,
  baseURL: string,
  user: TestUser,
  password: string = DEFAULT_PASSWORD,
  overrides: Record<string, unknown> = {}
): Promise<{ userId: string; profileId: string }> {
  const { userId } = await registerUser(request, baseURL, user, password)
  const { profileId } = await createProfile(request, baseURL, user, overrides)
  const resolvedPrefQualification =
    typeof overrides.prefQualification === 'string' && overrides.prefQualification.trim()
      ? overrides.prefQualification
      : 'bachelors'
  // Mark signup flow complete so profile completion guard doesn't redirect in UI flows.
  // signupStep >= 8 now enforces core partner-preference validation on this endpoint.
  const completionResponse = await request.put(`${baseURL}/api/profile/${profileId}`, {
    data: {
      signupStep: 9,
      prefAgeMin: '25',
      prefAgeMax: '35',
      prefHeightMin: `5'0"`,
      prefHeightMax: `6'2"`,
      prefMaritalStatus: 'never_married',
      prefReligions: ['Hindu'],
      prefReligion: 'Hindu',
      prefQualification: resolvedPrefQualification,
      prefAgeIsDealbreaker: true,
      prefHeightIsDealbreaker: true,
      prefMaritalStatusIsDealbreaker: true,
      prefReligionIsDealbreaker: true,
    },
    headers: { 'x-new-user-id': userId },
  })

  if (!completionResponse.ok()) {
    const body = await completionResponse.text()
    throw new Error(`Profile completion update failed (${completionResponse.status()}): ${body}`)
  }

  return { userId, profileId }
}

export async function adminLogin(request: APIRequestContext, baseURL: string): Promise<void> {
  const response = await request.post(`${baseURL}/api/admin/login`, {
    data: {
      username: 'admin',
      password: 'vivaah2024',
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Admin login failed (${response.status()}): ${body}`)
  }
}

export async function adminApproveProfile(
  adminRequest: APIRequestContext,
  baseURL: string,
  profileId: string
): Promise<void> {
  const response = await adminRequest.post(`${baseURL}/api/admin/approve`, {
    data: {
      profileId,
      action: 'approve',
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Admin approve failed (${response.status()}): ${body}`)
  }
}

export async function adminRejectProfile(
  adminRequest: APIRequestContext,
  baseURL: string,
  profileId: string,
  reason: string = 'Rejected via E2E coverage tests.'
): Promise<void> {
  const response = await adminRequest.post(`${baseURL}/api/admin/approve`, {
    data: {
      profileId,
      action: 'reject',
      rejectionReason: reason,
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Admin reject failed (${response.status()}): ${body}`)
  }
}

export async function loginViaUi(page: Page, email: string, password: string = DEFAULT_PASSWORD): Promise<void> {
  await page.goto('/login')
  // Expand email form when needed (Google is primary by default).
  const emailToggle = page.getByRole('button', { name: /Don\'t have Gmail|Use another email|Sign in with email/i }).first()
  const emailInput = page.locator('#email')
  if (!(await emailInput.isVisible().catch(() => false)) && await emailToggle.isVisible().catch(() => false)) {
    await emailToggle.click()
  }
  await emailInput.waitFor({ state: 'visible', timeout: 10000 })

  const passwordInput = page.locator('#password')
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 })

  await emailInput.fill(email)
  await passwordInput.fill(password)
  const emailSubmitButton = page.getByRole('button', { name: /^Sign In with Email$/i }).first()
  if (await emailSubmitButton.count()) {
    await emailSubmitButton.click()
  } else {
    await page.locator('form:has(#email) button[type="submit"]').first().click()
  }

  // Ensure we actually left /login and reached an authenticated area.
  try {
    await page.waitForURL(url => {
      const path = url.pathname.toLowerCase()
      return !path.startsWith('/login') &&
        (path.startsWith('/dashboard') || path.startsWith('/matches') || path.startsWith('/profile'))
    }, { timeout: 60000 })
  } catch {
    const loginErrorText = await page.locator('p.text-red-600').first().textContent().catch(() => null)
    throw new Error(`Credential login did not navigate away from /login. UI error: ${loginErrorText || 'none'}`)
  }

  // Avoid race conditions where navigation completed but auth cookies/session are not yet fully established.
  const deadline = Date.now() + 15000
  let lastSessionStatus = 0
  let lastSessionBody = ''
  while (Date.now() < deadline) {
    try {
      const sessionRes = await page.request.get('/api/auth/session')
      lastSessionStatus = sessionRes.status()
      const sessionData = await sessionRes.json().catch(() => null)
      if (sessionRes.ok() && sessionData?.user?.email) {
        return
      }
      lastSessionBody = JSON.stringify(sessionData)
    } catch (error) {
      lastSessionBody = String(error)
    }
    await page.waitForTimeout(300)
  }

  throw new Error(
    `Credential login navigated but session was not established. /api/auth/session status=${lastSessionStatus}, body=${lastSessionBody.slice(0, 400)}`
  )
}

export async function loginViaApiCredentials(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string = DEFAULT_PASSWORD
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()

  const csrfRes = await request.get(`${baseURL}/api/auth/csrf`)
  if (!csrfRes.ok()) {
    throw new Error(`Failed to fetch CSRF token (${csrfRes.status()}): ${await csrfRes.text()}`)
  }
  const csrfData = await csrfRes.json().catch(() => null)
  const csrfToken = csrfData?.csrfToken
  if (!csrfToken || typeof csrfToken !== 'string') {
    throw new Error(`Invalid CSRF payload: ${JSON.stringify(csrfData)}`)
  }

  const signInRes = await request.post(`${baseURL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email: normalizedEmail,
      password,
      callbackUrl: `${baseURL}/dashboard`,
      json: 'true',
    },
  })

  // NextAuth credentials callback may return 200 with JSON or 302 redirect chain.
  if (!signInRes.ok() && signInRes.status() !== 302) {
    throw new Error(`Credentials callback failed (${signInRes.status()}): ${await signInRes.text()}`)
  }

  const sessionRes = await request.get(`${baseURL}/api/auth/session`)
  const sessionData = await sessionRes.json().catch(() => null)
  if (!sessionRes.ok() || !sessionData?.user?.email) {
    throw new Error(
      `Session not established after API credentials login. status=${sessionRes.status()} body=${JSON.stringify(sessionData)}`
    )
  }
}

export async function adminLoginViaUi(page: Page): Promise<void> {
  await page.goto('/admin/login')
  await page.fill('input[placeholder="Enter username"]', 'admin')
  await page.fill('input[placeholder="Enter password"]', 'vivaah2024')
  await page.getByRole('button', { name: /Sign In/i }).click()
}
