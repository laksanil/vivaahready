import { test, expect, request as apiRequest, type APIRequestContext } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  uploadProfilePhoto,
  adminLogin,
  adminApproveProfile,
  loginViaUi,
  loginViaApiCredentials,
  adminLoginViaUi,
  DEFAULT_PASSWORD,
  DEFAULT_PHOTO_PATH,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

async function trialClickVisible(page: any) {
  const elements = page.locator('button, a[href]')
  const count = await elements.count()
  for (let i = 0; i < count; i += 1) {
    const el = elements.nth(i)
    if (!(await el.isVisible())) continue
    const ariaDisabled = await el.getAttribute('aria-disabled')
    if (ariaDisabled === 'true') continue
    const isDisabled = await el.isDisabled().catch(() => false)
    if (isDisabled) continue
    // Some elements are intentionally covered or off-canvas; skip them quickly.
    await el.click({ trial: true, timeout: 1000 }).catch(() => {})
  }
}

test.describe.serial('UI feature coverage (non-payment)', () => {
  test.describe.configure({ timeout: 180000 })
  let adminRequest: APIRequestContext
  let userAId = ''
  let userBId = ''
  let userCId = ''
  let profileAId = ''
  let profileBId = ''
  let profileCId = ''
  let userAEmail = ''
  let userBEmail = ''
  let userCEmail = ''

  test.beforeAll(async ({ request }) => {
    adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)
    const userA = buildTestUser(`${suffix}-a`, 'male')
    const userB = buildTestUser(`${suffix}-b`, 'female')
    const userC = buildTestUser(`${suffix}-c`, 'female')
    userAEmail = userA.email
    userBEmail = userB.email
    userCEmail = userC.email

    const createdA = await createUserWithProfile(request, baseURL, userA, DEFAULT_PASSWORD)
    const createdB = await createUserWithProfile(request, baseURL, userB, DEFAULT_PASSWORD)
    const createdC = await createUserWithProfile(request, baseURL, userC, DEFAULT_PASSWORD)
    userAId = createdA.userId
    userBId = createdB.userId
    userCId = createdC.userId
    profileAId = createdA.profileId
    profileBId = createdB.profileId
    profileCId = createdC.profileId

    await uploadProfilePhoto(request, baseURL, profileAId)
    await uploadProfilePhoto(request, baseURL, profileBId)
    await uploadProfilePhoto(request, baseURL, profileCId)

    await adminApproveProfile(adminRequest, baseURL, profileAId)
    await adminApproveProfile(adminRequest, baseURL, profileBId)
    await adminApproveProfile(adminRequest, baseURL, profileCId)

    const userARequest = await apiRequest.newContext({ baseURL })
    const userBRequest = await apiRequest.newContext({ baseURL })
    await loginViaApiCredentials(userARequest, baseURL, userA.email, DEFAULT_PASSWORD)
    await loginViaApiCredentials(userBRequest, baseURL, userB.email, DEFAULT_PASSWORD)

    // Mutual interest between A and B for connections/messages
    await userARequest.post('/api/interest', { data: { profileId: profileBId } })
    await userBRequest.post('/api/interest', { data: { profileId: profileAId } })

    // Send one message using admin impersonation to populate conversations
    await adminRequest.post(`/api/messages?viewAsUser=${userAId}`, {
      data: { receiverId: userBId, content: 'Seed message for UI coverage.' },
    })

    await userARequest.dispose()
    await userBRequest.dispose()
  })

  test.afterAll(async () => {
    await adminRequest?.dispose()
  })

  test('user-facing flows cover matches, reconsider, connections, messages, profile, and verification', async ({ page }) => {
    await loginViaUi(page, userAEmail, DEFAULT_PASSWORD)
    await page.waitForURL(/dashboard|matches/, { timeout: 60000 })

    // Matches: pass a profile to populate reconsider
    await page.goto('/matches')
    await expect(page.locator('h1:has-text("My Matches")')).toBeVisible({ timeout: 20000 })
    await page.goto('/matches?tab=sent')
    await expect(page.locator('h1:has-text("Sent Interest")')).toBeVisible({ timeout: 20000 })
    await page.goto('/matches?tab=received')
    await expect(page.locator('h1:has-text("Interest Received")')).toBeVisible({ timeout: 20000 })
    await page.goto('/matches')
    const passButton = page.getByTitle('Pass').first()
    if (await passButton.isVisible()) {
      await passButton.click()
    }

    // Reconsider: bring back the passed profile
    await page.goto('/reconsider')
    await expect(page.locator('h1:has-text("Passed Profiles")')).toBeVisible({ timeout: 20000 })
    const bringBack = page.getByRole('button', { name: /Bring Back/i }).first()
    if (await bringBack.isVisible()) {
      await bringBack.click()
    }

    // Connections: open report modal and submit
    await page.goto('/connections')
    await expect(page.locator('h1:has-text("Connections")')).toBeVisible({ timeout: 20000 })
    const reportButton = page.getByRole('button', { name: /Report user/i }).first()
    if (await reportButton.isVisible()) {
      await reportButton.click()
      const dialog = page.locator('div.bg-white.rounded-xl.shadow-xl:has(h3:has-text("Report User"))').first()
      await expect(dialog).toBeVisible()
      await dialog.getByPlaceholder(/Please describe the issue/i).fill('Reporting via E2E coverage test.')
      await dialog.getByRole('button', { name: /Submit Report/i }).click()
      await expect(dialog).toBeHidden()
    }

    // Messages page: open conversation list
    await page.goto('/messages')
    await expect(page.locator('h1:has-text("Messages")')).toBeVisible({ timeout: 20000 })
    const conversationButton = page.getByRole('button', { name: /Open conversation/i }).first()
    if (await conversationButton.isVisible()) {
      await conversationButton.click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      await modal.getByRole('button', { name: /Close conversation/i }).click()
    }

    // Notifications page
    await page.goto('/notifications')
    await expect(page.locator('h1:has-text("Notifications")')).toBeVisible({ timeout: 20000 })

    // Dashboard page
    await page.goto('/dashboard')
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 20000 })

    // Support Messages page
    await page.goto('/admin-messages')
    await expect(page.locator('h1:has-text("Support Messages")')).toBeVisible({ timeout: 20000 })

    // Settings page
    await page.goto('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 20000 })

    // Profile: open edit modal and cancel, then upload and delete a photo
    await page.goto('/profile')
    const aboutHeading = page.getByRole('heading', { name: /About Me/i }).first()
    await expect(aboutHeading).toBeVisible()
    const editButton = aboutHeading.locator('..').getByRole('button', { name: /Edit/i })
    if (await editButton.isVisible()) {
      await editButton.click()
      await expect(page.getByRole('heading', { name: /Edit About Me/i })).toBeVisible()
      await page.getByRole('button', { name: /Cancel/i }).click()
      await expect(page.getByRole('heading', { name: /Edit About Me/i })).toBeHidden()
    }

    const fileInput = page.locator('input[type="file"]').first()
    if (await fileInput.count()) {
      await fileInput.setInputFiles(DEFAULT_PHOTO_PATH)
      await page.waitForTimeout(2000)
    }
    const deleteButton = page.getByTitle('Delete photo').first()
    if (await deleteButton.count()) {
      await deleteButton.click({ force: true })
      await page.waitForTimeout(1000)
    }

    // Verification flow
    await page.goto('/verify')
    await expect(page.getByRole('heading', { name: /Verify Your Account/i })).toBeVisible()
    const emailSection = page.locator('div', { has: page.getByRole('heading', { name: /Email Verification/i }) }).first()
    const emailSendButton = emailSection.getByRole('button', { name: /Send Verification Code/i })
    if (await emailSendButton.count()) {
      const emailSend = page.waitForResponse((res) => res.url().includes('/api/verify/email/send'))
      await emailSendButton.first().click()
      const emailData = await (await emailSend).json()
      if (emailData.devOtp) {
        await emailSection.getByPlaceholder(/Enter code/i).fill(emailData.devOtp)
        await emailSection.getByRole('button', { name: /^Verify$/i }).click()
      }
    }

    const phoneSection = page.locator('div', { has: page.getByRole('heading', { name: /Phone Verification/i }) }).first()
    const phoneSendButton = phoneSection.getByRole('button', { name: /Send Verification Code/i })
    if (await phoneSendButton.count()) {
      const phoneSend = page.waitForResponse((res) => res.url().includes('/api/verify/phone/send'))
      await phoneSendButton.first().click()
      const phoneData = await (await phoneSend).json()
      if (phoneData.devOtp) {
        await phoneSection.getByPlaceholder(/Enter code/i).fill(phoneData.devOtp)
        await phoneSection.getByRole('button', { name: /^Verify$/i }).click()
      }
    }

    // Search page
    await page.goto('/search')
    await expect(page.getByRole('heading', { name: /Your Matches|Browse Profiles/i })).toBeVisible()

    await trialClickVisible(page)
  })

  test('admin pages and actions are reachable', async ({ page }) => {
    await adminLoginViaUi(page)
    await page.waitForURL(/\/admin/, { timeout: 60000 })

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    await page.goto('/admin/approvals')
    await expect(page.getByRole('heading', { name: /Profile Approvals/i })).toBeVisible()

    await page.goto('/admin/profiles')
    await expect(page.getByRole('heading', { name: /Profiles/i })).toBeVisible()
    const searchInput = page.getByPlaceholder(/Search by name, email, VR ID/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill(userAEmail)
      await searchInput.press('Enter')
    }

    const viewAsUserLink = page.locator('a:has-text("View as User")').first()
    if (await viewAsUserLink.isVisible()) {
      const href = await viewAsUserLink.getAttribute('href')
      expect(href || '').toContain('viewAsUser')
    }

    await page.goto('/admin/matches')
    await expect(page.getByRole('heading', { name: /Matches & Activity/i })).toBeVisible()

    await page.goto('/admin/reports')
    await expect(page.getByRole('heading', { name: /Reported Problems/i })).toBeVisible()

    await page.goto(`/admin/users/${userAId}`)
    await expect(page.getByText(/User Details|Profile/i).first()).toBeVisible()

    await trialClickVisible(page)
  })
})
