import type { APIRequestContext, Page, APIResponse } from '@playwright/test'
import path from 'path'
import fs from 'fs'

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
  return { userId: data.userId as string }
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
  // Click to expand email form (hidden by default, Google is primary)
  const emailToggle = page.getByRole('button', { name: /Don\'t have Gmail|Use another email|Sign in with email/i }).first()
  if (await emailToggle.isVisible().catch(() => false)) {
    await emailToggle.click()
  }
  await page.waitForTimeout(300)
  await page.fill('#email', email)
  await page.fill('#password', password)
  const emailSubmitButton = page.getByRole('button', { name: /^Sign In with Email$/i }).first()
  if (await emailSubmitButton.count()) {
    await emailSubmitButton.click()
  } else {
    await page.locator('form:has(#email) button[type="submit"]').first().click()
  }

  // Ensure we actually left /login and reached an authenticated area.
  await page.waitForURL(url => {
    const path = url.pathname.toLowerCase()
    return !path.startsWith('/login') &&
      (path.startsWith('/dashboard') || path.startsWith('/matches') || path.startsWith('/profile'))
  }, { timeout: 60000 })
}

export async function adminLoginViaUi(page: Page): Promise<void> {
  await page.goto('/admin/login')
  await page.fill('input[placeholder="Enter username"]', 'admin')
  await page.fill('input[placeholder="Enter password"]', 'vivaah2024')
  await page.getByRole('button', { name: /Sign In/i }).click()
}
