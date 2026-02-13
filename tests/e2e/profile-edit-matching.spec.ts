import { test, expect, request as apiRequest, type APIRequestContext, type BrowserContext } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  uploadProfilePhoto,
  adminLogin,
  adminApproveProfile,
  loginViaUi,
  DEFAULT_PASSWORD,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

async function dismissCookieBanner(page: import('@playwright/test').Page) {
  const cookieButton = page.getByRole('button', { name: /Got it/i }).first()
  if (await cookieButton.isVisible().catch(() => false)) {
    await cookieButton.click({ force: true })
  }
}

async function openEducationEditor(page: import('@playwright/test').Page) {
  await page.goto('/profile')
  await dismissCookieBanner(page)
  const heading = page.getByRole('heading', { name: /^Education & Career$/i }).first()
  await expect(heading).toBeVisible()
  await heading.locator('xpath=../button[contains(., "Edit")]').click()
  await expect(page.getByRole('heading', { name: /Edit Education & Career/i })).toBeVisible()
}

async function openPartnerPreferencesEditor(page: import('@playwright/test').Page) {
  await page.goto('/profile?tab=preferences')
  await dismissCookieBanner(page)
  const heading = page.getByRole('heading', { name: /^Partner Preferences$/i }).first()
  await expect(heading).toBeVisible()
  await heading.locator('xpath=../button[contains(., "Edit")]').click()
  await expect(page.getByRole('heading', { name: /Edit Partner Preferences/i })).toBeVisible()
}

test.describe.serial('Profile edit flow + matching regression coverage', () => {
  test.describe.configure({ timeout: 180000 })

  let adminRequest: APIRequestContext
  let seekerContext: BrowserContext | null = null

  let seekerUserId = ''
  let seekerProfileId = ''
  let compatibleUserId = ''
  let incompatibleUserId = ''

  const seekerEmailRef = { value: '' }

  test.beforeAll(async ({ request, browser }) => {
    adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)
    const seeker = buildTestUser(`${suffix}-seeker`, 'male')
    const compatible = buildTestUser(`${suffix}-compatible`, 'female')
    const incompatible = buildTestUser(`${suffix}-blocked`, 'female')
    seekerEmailRef.value = seeker.email

    const seekerCreated = await createUserWithProfile(request, baseURL, seeker, DEFAULT_PASSWORD, {
      firstName: `Seeker${suffix}`,
      aboutMe: 'I value family, growth, and a meaningful long-term relationship.',
      referralSource: 'google',
      linkedinProfile: 'no_linkedin',
      qualification: 'bachelors_cs',
      university: 'San Jose State University',
      occupation: 'software_engineer',
      employerName: 'Seeker Engineering',
      annualIncome: '100k-150k',
      openToRelocation: 'yes',
      prefAgeMin: '28',
      prefAgeMax: '40',
      prefHeightMin: `5'0"`,
      prefHeightMax: `6'2"`,
      prefMaritalStatus: 'never_married',
      prefReligions: ['Hindu'],
      prefReligion: 'Hindu',
      prefAgeIsDealbreaker: true,
      prefHeightIsDealbreaker: true,
      prefMaritalStatusIsDealbreaker: true,
      prefReligionIsDealbreaker: true,
      religion: 'Hindu',
      community: 'Iyer',
      maritalStatus: 'never_married',
      height: `5'10"`,
      dateOfBirth: '01/01/1992',
    })

    const compatibleCreated = await createUserWithProfile(request, baseURL, compatible, DEFAULT_PASSWORD, {
      firstName: `Compatible${suffix}`,
      religion: 'Hindu',
      community: 'Iyer',
      maritalStatus: 'never_married',
      height: `5'6"`,
      dateOfBirth: '01/01/1995',
      occupation: 'software_engineer',
      employerName: 'Compatible Labs',
      university: 'Santa Clara University',
      qualification: 'bachelors_cs',
      annualIncome: '75k-100k',
      openToRelocation: 'yes',
      linkedinProfile: 'no_linkedin',
      referralSource: 'google',
    })

    const incompatibleCreated = await createUserWithProfile(request, baseURL, incompatible, DEFAULT_PASSWORD, {
      firstName: `Blocked${suffix}`,
      religion: 'Christian',
      community: 'Roman Catholic',
      maritalStatus: 'never_married',
      height: `5'6"`,
      dateOfBirth: '01/01/1995',
      occupation: 'software_engineer',
      employerName: 'Blocked Labs',
      university: 'University of Texas at Austin',
      qualification: 'bachelors_cs',
      annualIncome: '75k-100k',
      openToRelocation: 'yes',
      linkedinProfile: 'no_linkedin',
      referralSource: 'google',
    })

    seekerUserId = seekerCreated.userId
    seekerProfileId = seekerCreated.profileId
    compatibleUserId = compatibleCreated.userId
    incompatibleUserId = incompatibleCreated.userId

    await uploadProfilePhoto(request, baseURL, seekerProfileId)
    await uploadProfilePhoto(request, baseURL, compatibleCreated.profileId)
    await uploadProfilePhoto(request, baseURL, incompatibleCreated.profileId)

    await adminApproveProfile(adminRequest, baseURL, seekerProfileId)
    await adminApproveProfile(adminRequest, baseURL, compatibleCreated.profileId)
    await adminApproveProfile(adminRequest, baseURL, incompatibleCreated.profileId)

    const markSignupComplete = async (profileId: string, userId: string) => {
      const response = await adminRequest.put(`/api/profile/${profileId}?viewAsUser=${userId}`, {
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
      })

      if (!response.ok()) {
        const body = await response.text()
        throw new Error(`Failed to mark profile ${profileId} complete (${response.status()}): ${body}`)
      }
    }

    await markSignupComplete(seekerProfileId, seekerUserId)
    await markSignupComplete(compatibleCreated.profileId, compatibleUserId)
    await markSignupComplete(incompatibleCreated.profileId, incompatibleUserId)

    seekerContext = await browser.newContext({ baseURL })
    const seekerPage = await seekerContext.newPage()
    await loginViaUi(seekerPage, seeker.email, DEFAULT_PASSWORD)
    await seekerPage.waitForURL(url => {
      const path = url.pathname.toLowerCase()
      return !path.startsWith('/login') &&
        (path.startsWith('/dashboard') || path.startsWith('/matches') || path.startsWith('/profile'))
    }, { timeout: 60000 })
    await seekerPage.close()
  })

  test.afterAll(async () => {
    await adminRequest?.dispose()
    await seekerContext?.close()
  })

  test('captures, updates, and persists key profile fields via API', async () => {
    const profileRes = await adminRequest.get(`/api/profile?viewAsUser=${seekerUserId}`)
    expect(profileRes.ok()).toBeTruthy()
    const profile = await profileRes.json()

    expect(profile.id).toBe(seekerProfileId)
    expect(profile.userId).toBe(seekerUserId)
    expect(profile.qualification).toBe('bachelors_cs')
    expect(profile.university).toBe('San Jose State University')
    expect(profile.occupation).toBe('software_engineer')
    expect(profile.employerName).toBe('Seeker Engineering')
    expect(Number(profile.signupStep || 0)).toBeGreaterThanOrEqual(9)

    const invalidLocationUpdate = await adminRequest.put(`/api/profile?viewAsUser=${seekerUserId}`, {
      data: {
        _editSection: 'location_education',
        occupation: 'software_engineer',
        employerName: '',
        qualification: 'masters_cs',
        university: 'San Jose State University',
        annualIncome: '150k-200k',
        openToRelocation: 'no',
        country: 'USA',
        grewUpIn: 'USA',
        citizenship: 'USA',
        zipCode: '95014',
      },
    })
    expect(invalidLocationUpdate.status()).toBe(400)
    const invalidLocationPayload = await invalidLocationUpdate.json()
    expect(String(invalidLocationPayload.error || '')).toMatch(/Company\/Organization is required/i)

    const validLocationUpdate = await adminRequest.put(`/api/profile?viewAsUser=${seekerUserId}`, {
      data: {
        _editSection: 'location_education',
        occupation: 'software_engineer',
        employerName: 'Vivaah QA Labs',
        qualification: 'masters_cs',
        university: 'Santa Clara University',
        annualIncome: '150k-200k',
        openToRelocation: 'no',
        country: 'USA',
        grewUpIn: 'USA',
        citizenship: 'USA',
        zipCode: '95014',
      },
    })
    expect(validLocationUpdate.ok()).toBeTruthy()

    const invalidPrefUpdate = await adminRequest.put(`/api/profile?viewAsUser=${seekerUserId}`, {
      data: {
        _editSection: 'preferences_1',
        prefAgeMin: '27',
        prefAgeMax: '36',
        prefHeightMin: `5'2"`,
        prefHeightMax: `6'0"`,
        prefMaritalStatus: 'doesnt_matter',
        prefMaritalStatusIsDealbreaker: true,
        prefReligion: 'doesnt_matter',
        prefReligions: [],
        prefReligionIsDealbreaker: true,
      },
    })
    expect(invalidPrefUpdate.status()).toBe(400)
    const invalidPrefPayload = await invalidPrefUpdate.json()
    expect(String(invalidPrefPayload.error || '')).toMatch(/required/i)

    const validPrefUpdate = await adminRequest.put(`/api/profile?viewAsUser=${seekerUserId}`, {
      data: {
        _editSection: 'preferences_1',
        prefAgeMin: '27',
        prefAgeMax: '36',
        prefHeightMin: `5'2"`,
        prefHeightMax: `6'0"`,
        prefMaritalStatus: 'never_married, doesnt_matter',
        prefMaritalStatusIsDealbreaker: true,
        prefReligions: ['Hindu'],
        prefReligion: 'Hindu',
        prefReligionIsDealbreaker: true,
      },
    })
    expect(validPrefUpdate.ok()).toBeTruthy()

    const updatedRes = await adminRequest.get(`/api/profile?viewAsUser=${seekerUserId}`)
    expect(updatedRes.ok()).toBeTruthy()
    const updated = await updatedRes.json()
    expect(updated.qualification).toBe('masters_cs')
    expect(updated.university).toBe('Santa Clara University')
    expect(updated.employerName).toBe('Vivaah QA Labs')
    expect(updated.prefAgeMin).toBe('27')
    expect(updated.prefAgeMax).toBe('36')
    expect(updated.prefMaritalStatus).toContain('never_married')
    expect(updated.prefMaritalStatus).not.toContain('doesnt_matter')
    expect(updated.prefReligions).toContain('Hindu')
    expect(updated.prefAgeIsDealbreaker).toBe(true)
    expect(updated.prefHeightIsDealbreaker).toBe(true)
    expect(updated.prefMaritalStatusIsDealbreaker).toBe(true)
    expect(updated.prefReligionIsDealbreaker).toBe(true)
  })

  test('edit profile UI pre-populates values and enforces required fields', async ({ browser }) => {
    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()
    await loginViaUi(page, seekerEmailRef.value, DEFAULT_PASSWORD)
    await page.waitForURL(url => {
      const path = url.pathname.toLowerCase()
      return !path.startsWith('/login') &&
        (path.startsWith('/dashboard') || path.startsWith('/matches') || path.startsWith('/profile'))
    }, { timeout: 60000 })

    await openEducationEditor(page)
    await expect(page.locator('select[name="qualification"]')).toHaveValue('masters_cs')
    await expect(page.locator('input[placeholder="Type to search universities..."]').first()).toHaveValue(/Santa Clara University/i)
    await expect(page.locator('input[name="employerName"]')).toHaveValue('Vivaah QA Labs')

    await page.fill('input[name="employerName"]', '')
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeDisabled()
    await expect(page.getByText(/Company\/Organization is required/i)).toBeVisible()

    await page.fill('input[name="employerName"]', 'Vivaah Match Systems')
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeEnabled()
    await dismissCookieBanner(page)
    await page.getByRole('button', { name: /Save Changes/i }).click({ force: true })
    await expect(page.getByRole('heading', { name: /Edit Education & Career/i })).toHaveCount(0)

    await openEducationEditor(page)
    await expect(page.locator('input[name="employerName"]')).toHaveValue('Vivaah Match Systems')

    await context.close()
  })

  test('partner preference deal-breaker UX behaves correctly in edit modal', async ({ browser }) => {
    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()
    await loginViaUi(page, seekerEmailRef.value, DEFAULT_PASSWORD)
    await page.waitForURL(url => {
      const path = url.pathname.toLowerCase()
      return !path.startsWith('/login') &&
        (path.startsWith('/dashboard') || path.startsWith('/matches') || path.startsWith('/profile'))
    }, { timeout: 60000 })

    await openPartnerPreferencesEditor(page)

    const maritalToggle = page
      .getByRole('heading', { name: /Marital Status \*/i })
      .locator('xpath=../label[contains(., "Deal-breaker")]//input[@type="checkbox"]')
    await expect(maritalToggle).toBeChecked()
    await expect(page.locator('div:has(h4:has-text("Marital Status")) label:has-text("Any")')).toHaveCount(0)

    await maritalToggle.click()
    await expect(maritalToggle).not.toBeChecked()
    await expect(page.locator('div:has(h4:has-text("Marital Status")) label:has-text("Any")')).toHaveCount(1)

    await page.locator('div:has(h4:has-text("Marital Status")) label:has-text("Any") input[type="checkbox"]').check()
    await maritalToggle.click()
    await expect(maritalToggle).toBeChecked()
    await expect(page.locator('div:has(h4:has-text("Marital Status")) label:has-text("Any")')).toHaveCount(0)

    await context.close()
  })

  test('matching excludes deal-breaker failures and includes compatible profiles', async () => {
    const matchesRes = await adminRequest.get(`/api/matches/auto?viewAsUser=${seekerUserId}`)
    expect(matchesRes.ok()).toBeTruthy()
    const matchesPayload = await matchesRes.json()

    const matchUserIds = new Set<string>(
      (matchesPayload.matches || []).map((item: { userId: string }) => item.userId)
    )
    const nearMatchUserIds = new Set<string>(
      (matchesPayload.nearMatches || [])
        .map((item: { profile?: { userId?: string } }) => item.profile?.userId)
        .filter((value: string | undefined): value is string => !!value)
    )

    expect(matchUserIds.has(compatibleUserId)).toBe(true)
    expect(matchUserIds.has(incompatibleUserId)).toBe(false)
    expect(nearMatchUserIds.has(incompatibleUserId)).toBe(false)
  })
})
