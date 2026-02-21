import { test, expect, request as apiRequest } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  uploadProfilePhoto,
  adminLogin,
  adminApproveProfile,
  loginViaApiCredentials,
  DEFAULT_PASSWORD,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

test.describe.serial('Sidebar reconsider count', () => {
  test.describe.configure({ timeout: 180000 })

  let userAEmail = ''
  let userBEmail = ''

  test.beforeAll(async ({ request }) => {
    const adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)
    const userA = buildTestUser(`${suffix}-recon-a`, 'male')
    const userB = buildTestUser(`${suffix}-recon-b`, 'female')
    userAEmail = userA.email
    userBEmail = userB.email

    const createdA = await createUserWithProfile(request, baseURL, userA, DEFAULT_PASSWORD)
    const createdB = await createUserWithProfile(request, baseURL, userB, DEFAULT_PASSWORD)

    // Upload one photo for each user via authenticated user sessions.
    const userARequest = await apiRequest.newContext({ baseURL })
    await loginViaApiCredentials(userARequest, baseURL, userAEmail, DEFAULT_PASSWORD)
    const userAPhotoRes = await uploadProfilePhoto(userARequest, baseURL, createdA.profileId)
    if (!userAPhotoRes.ok()) {
      throw new Error(`User A photo upload failed (${userAPhotoRes.status()}): ${await userAPhotoRes.text()}`)
    }
    await userARequest.dispose()

    const userBRequest = await apiRequest.newContext({ baseURL })
    await loginViaApiCredentials(userBRequest, baseURL, userBEmail, DEFAULT_PASSWORD)
    const userBPhotoRes = await uploadProfilePhoto(userBRequest, baseURL, createdB.profileId)
    if (!userBPhotoRes.ok()) {
      throw new Error(`User B photo upload failed (${userBPhotoRes.status()}): ${await userBPhotoRes.text()}`)
    }
    await userBRequest.dispose()

    await adminApproveProfile(adminRequest, baseURL, createdA.profileId)
    await adminApproveProfile(adminRequest, baseURL, createdB.profileId)
    await adminRequest.dispose()
  })

  test('shows reconsider count badge in sidebar', async ({ browser }) => {
    const userRequest = await apiRequest.newContext({ baseURL })
    await loginViaApiCredentials(userRequest, baseURL, userAEmail, DEFAULT_PASSWORD)
    const storageState = await userRequest.storageState()
    await userRequest.dispose()

    const context = await browser.newContext({ baseURL, storageState })
    const page = await context.newPage()

    try {
      await page.goto('/matches')
      await expect(page.locator('h1:has-text("My Matches")')).toBeVisible({ timeout: 20000 })

      const passButton = page.getByTitle('Pass').first()
      await expect(passButton).toBeVisible({ timeout: 15000 })
      const declineResponse = page.waitForResponse(
        response =>
          response.url().includes('/api/matches/decline') &&
          response.request().method() === 'POST'
      )
      await passButton.click()
      expect((await declineResponse).ok()).toBeTruthy()

      await page.goto('/reconsider')
      await expect(page.locator('h1:has-text("Passed Profiles")')).toBeVisible({ timeout: 20000 })
      await expect(page.getByText(/1 passed profile/i)).toBeVisible({ timeout: 10000 })

      const reconsiderLink = page.locator('aside nav a').filter({ hasText: 'Reconsider' }).first()
      await expect(reconsiderLink).toContainText('(1)', { timeout: 10000 })
    } finally {
      await context.close()
    }
  })
})
