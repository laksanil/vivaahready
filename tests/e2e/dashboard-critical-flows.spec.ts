import { test, expect, request as apiRequest, type APIRequestContext } from '@playwright/test'
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

// Skip in CI - requires Cloudinary credentials for photo uploads
test.skip(!!process.env.CI, 'Skipped in CI: requires Cloudinary credentials')

test.describe.serial('Dashboard critical flows', () => {
  test.describe.configure({ timeout: 180000 })

  let adminRequest: APIRequestContext
  let userAId = ''
  let userBId = ''
  let profileAId = ''
  let profileBId = ''
  let profileCId = ''
  let userAEmail = ''
  let userBFirstName = ''

  test.beforeAll(async ({ request }) => {
    adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)
    const userA = buildTestUser(`${suffix}-a`, 'male')
    const userB = buildTestUser(`${suffix}-b`, 'female')
    const userC = buildTestUser(`${suffix}-c`, 'female')
    userAEmail = userA.email
    userBFirstName = userB.firstName

    const createdA = await createUserWithProfile(request, baseURL, userA, DEFAULT_PASSWORD)
    const createdB = await createUserWithProfile(request, baseURL, userB, DEFAULT_PASSWORD)
    const createdC = await createUserWithProfile(request, baseURL, userC, DEFAULT_PASSWORD)
    userAId = createdA.userId
    userBId = createdB.userId
    profileAId = createdA.profileId
    profileBId = createdB.profileId
    profileCId = createdC.profileId

    await uploadProfilePhoto(request, baseURL, profileAId)
    await uploadProfilePhoto(request, baseURL, profileBId)
    await uploadProfilePhoto(request, baseURL, profileCId)

    await adminApproveProfile(adminRequest, baseURL, profileAId)
    await adminApproveProfile(adminRequest, baseURL, profileBId)
    await adminApproveProfile(adminRequest, baseURL, profileCId)

    // Seed one accepted connection between A and B for connections/messages.
    const aToB = await adminRequest.post(`/api/interest?viewAsUser=${userAId}`, {
      data: { profileId: profileBId },
    })
    if (!aToB.ok()) {
      throw new Error(`Seed A->B interest failed (${aToB.status()}): ${await aToB.text()}`)
    }
    const bToA = await adminRequest.post(`/api/interest?viewAsUser=${userBId}`, {
      data: { profileId: profileAId },
    })
    if (!bToA.ok()) {
      throw new Error(`Seed B->A interest failed (${bToA.status()}): ${await bToA.text()}`)
    }
  })

  test.afterAll(async () => {
    await adminRequest?.dispose()
  })

  test('express interest, sent/withdraw, reconsider, connections messaging, and support messages work', async ({ browser }) => {
    const userARequest = await apiRequest.newContext({ baseURL })
    let userAContext: Awaited<ReturnType<typeof browser.newContext>> | null = null

    try {
      await loginViaApiCredentials(userARequest, baseURL, userAEmail, DEFAULT_PASSWORD)
      const userAStorageState = await userARequest.storageState()
      userAContext = await browser.newContext({ baseURL, storageState: userAStorageState })
      const page = await userAContext.newPage()

      // 1) Express interest from Matches and confirm Sent tab.
      await page.goto('/matches')
      await expect(page.locator('h1:has-text("My Matches")')).toBeVisible({ timeout: 20000 })

      const expressInterestButton = page.getByRole('button', { name: /^(Like|Accept)$/ }).first()
      await expect(expressInterestButton).toBeVisible({ timeout: 15000 })
      const expressInterestResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/interest') &&
          response.request().method() === 'POST'
      )
      await expressInterestButton.click()
      expect((await expressInterestResponse).ok()).toBeTruthy()

      await page.goto('/matches?tab=sent')
      await expect(page.locator('h1:has-text("Sent Interest")')).toBeVisible({ timeout: 20000 })

      // 2) Withdraw from Sent Interest and validate Reconsider receives it.
      const withdrawButton = page.getByRole('button', { name: /^Withdraw$/ }).first()
      await expect(withdrawButton).toBeVisible({ timeout: 15000 })
      await withdrawButton.click()

      const withdrawModal = page.locator('div.bg-white.rounded-xl.max-w-sm.w-full.shadow-xl:has(h3:has-text("Withdraw Interest"))').first()
      await expect(withdrawModal).toBeVisible({ timeout: 10000 })
      const withdrawConfirmResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/interest') &&
          response.request().method() === 'PATCH'
      )
      await withdrawModal.getByRole('button', { name: /^Withdraw$/ }).click()
      expect((await withdrawConfirmResponse).ok()).toBeTruthy()

      await page.goto('/reconsider')
      await expect(page.locator('h1:has-text("Passed Profiles")')).toBeVisible({ timeout: 20000 })
      const bringBackButton = page.getByRole('button', { name: /Bring Back/i }).first()
      await expect(bringBackButton).toBeVisible({ timeout: 15000 })
      await bringBackButton.click()
      await page.waitForURL(/\/matches\?tab=sent/, { timeout: 20000 })

      // 3) Connections -> Message send.
      await page.goto('/connections')
      await expect(page.locator('h1:has-text("Connections")')).toBeVisible({ timeout: 20000 })
      const messageButton = page.getByRole('button', { name: /^Message$/ }).first()
      await expect(messageButton).toBeVisible({ timeout: 15000 })
      await messageButton.click()

      const messageModal = page.getByRole('dialog')
      await expect(messageModal).toBeVisible({ timeout: 10000 })
      await messageModal.getByLabel('Type a message').fill('Critical flow test: message from connection.')
      const sendMessageResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/messages') &&
          response.request().method() === 'POST'
      )
      await messageModal.getByRole('button', { name: /Send message/i }).click()
      expect((await sendMessageResponse).ok()).toBeTruthy()
      await messageModal.getByRole('button', { name: /Close conversation/i }).click()

      // 4) Messages list should show conversation partner.
      await page.goto('/messages')
      await expect(page.locator('h1:has-text("Messages")')).toBeVisible({ timeout: 20000 })
      await expect(page.getByText(new RegExp(userBFirstName, 'i')).first()).toBeVisible({ timeout: 15000 })

      // 5) Support Messages page should load.
      await page.goto('/admin-messages')
      await expect(page.locator('h1:has-text("Support Messages")')).toBeVisible({ timeout: 20000 })

      // Interest Received tab route should still load.
      await page.goto('/matches?tab=received')
      await expect(page.locator('h1:has-text("Interest Received")')).toBeVisible({ timeout: 20000 })
    } finally {
      if (userAContext) await userAContext.close()
      await userARequest.dispose()
    }
  })
})
