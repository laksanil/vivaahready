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

test.describe.serial('Dashboard engagement rewards priority', () => {
  test.describe.configure({ timeout: 180000 })

  let userEmail = ''

  test.beforeAll(async ({ request }) => {
    const adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)
    const user = buildTestUser(`${suffix}-eng`, 'male')
    userEmail = user.email

    const { profileId } = await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD)

    const userRequest = await apiRequest.newContext({ baseURL })
    await loginViaApiCredentials(userRequest, baseURL, user.email, DEFAULT_PASSWORD)
    const photoUploadRes = await uploadProfilePhoto(userRequest, baseURL, profileId)
    if (!photoUploadRes.ok()) {
      throw new Error(`Photo upload failed (${photoUploadRes.status()}): ${await photoUploadRes.text()}`)
    }
    await userRequest.dispose()

    await adminApproveProfile(adminRequest, baseURL, profileId)

    await adminRequest.dispose()
  })

  test('shows points and conversion model prominently on dashboard', async ({ browser }) => {
    const userRequest = await apiRequest.newContext({ baseURL })
    await loginViaApiCredentials(userRequest, baseURL, userEmail, DEFAULT_PASSWORD)
    const storageState = await userRequest.storageState()
    await userRequest.dispose()

    const context = await browser.newContext({ baseURL, storageState })
    const page = await context.newPage()

    try {
      await page.goto('/dashboard')
      await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 20000 })
      await expect(page.getByRole('heading', { name: /Engagement Rewards/i })).toBeVisible({ timeout: 20000 })
      await expect(page.getByText(/Point Earning Actions/i)).toBeVisible({ timeout: 20000 })
      await expect(page.getByText(/100 points = 1 coin, 5 coins = 1 boost \(7 days priority\)/i)).toBeVisible({ timeout: 20000 })

      const rewardsHeader = page.getByRole('heading', { name: /Engagement Rewards/i }).first()
      const eventBanner = page.getByText(/VivaahReady Mixer/i).first()
      const rewardsBox = await rewardsHeader.boundingBox()
      const eventBox = await eventBanner.boundingBox()
      expect(rewardsBox).not.toBeNull()
      expect(eventBox).not.toBeNull()
      expect((rewardsBox as { y: number }).y).toBeLessThan((eventBox as { y: number }).y)
    } finally {
      await context.close()
    }
  })
})
