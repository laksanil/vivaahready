import { test, expect } from '@playwright/test'
import { adminLogin, buildTestUser, createUserWithProfile, loginViaUi } from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

function uniqueSuffix(label: string) {
  return `${Date.now().toString(36)}-${label}-${Math.random().toString(36).slice(2, 7)}`
}

test.describe.serial('Admin feedback access and rendering', () => {
  test.describe.configure({ timeout: 120000 })

  test('logged-out users are blocked from /admin/feedback', async ({ page }) => {
    await page.goto('/admin/feedback')
    await page.waitForURL((url) => url.pathname === '/admin/login', { timeout: 30000 })
  })

  test('logged-in non-admin users are blocked from /admin/feedback', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('admin-blocked'), 'female')
    await createUserWithProfile(request, baseURL, user)

    await loginViaUi(page, user.email)
    await page.goto('/admin/feedback')

    await page.waitForURL((url) => url.pathname === '/admin/login', { timeout: 30000 })
  })

  test('admin APIs enforce access and admin UI renders masked phone + drilldown detail page', async ({ page, request }) => {
    // Non-admin request context is blocked.
    const blockedFeedback = await request.get('/api/admin/feedback')
    expect(blockedFeedback.status()).toBe(401)
    const blockedSummary = await request.get('/api/admin/feedback/summary')
    expect(blockedSummary.status()).toBe(401)

    // Login as admin (cookie-based) in this same browser context.
    const adminLoginResponse = await page.request.post('/api/admin/login', {
      data: { username: 'admin', password: 'vivaah2024' },
    })
    expect(adminLoginResponse.ok()).toBeTruthy()

    const feedbackId = `fb-${uniqueSuffix('detail')}`
    const summaryText = `E2E admin feedback ${uniqueSuffix('row')}`
    const mockedFeedback = {
      id: feedbackId,
      userId: 'user-e2e-1',
      userPhone: '+14085551234',
      userPhoneLast4: '1234',
      userName: 'E2E Admin View',
      isVerified: false,
      profileId: 'profile-e2e-1',
      matchesCount: 7,
      interestsSentCount: 3,
      interestsReceivedCount: 4,
      fromUrl: '/matches',
      submitUrl: '/feedback',
      userAgent: 'playwright',
      overallStars: 4,
      primaryIssue: 'technical',
      summaryText,
      stepBData: '{"techTags":["Slow loading"]}',
      nps: 8,
      referralSource: 'friend',
      wantsFollowup: false,
      followupContact: null,
      followupTimeWindow: null,
      severity: 'major',
      issueTags: '["Slow loading"]',
      screenshotUrl: null,
      createdAt: new Date().toISOString(),
    }

    await page.route('**/api/admin/feedback**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/admin/feedback') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            feedbacks: [mockedFeedback],
            total: 1,
            page: 1,
            totalPages: 1,
            summary: {
              totalFeedbackCount: 1,
              uniquePhonesCount: 1,
              verifiedUsersPct: 0,
              avgStars: 4,
            },
          }),
        })
        return
      }

      if (url.pathname === `/api/admin/feedback/${feedbackId}`) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ feedback: mockedFeedback }),
        })
        return
      }

      await route.continue()
    })

    // Admin page loads and renders masked phone + copy/verified UI.
    await page.goto('/admin/feedback')
    await expect(page).toHaveURL(/\/admin\/feedback/)
    await expect(page.getByRole('heading', { name: /user feedback/i })).toBeVisible()

    await page.fill('input[placeholder*="Search by name, phone, or content"]', summaryText)
    await page.keyboard.press('Enter')

    const row = page.locator('tbody tr').filter({ hasText: summaryText }).first()
    await expect(row).toBeVisible()
    await expect(row).toContainText(/\+1\*+\d{4}/)
    await expect(row).toContainText(/Unverified|Verified/)
    await expect(row.getByTitle('Copy').first()).toBeVisible()

    await row.getByRole('link', { name: 'Details' }).click()
    await page.waitForURL((url) => url.pathname === `/admin/feedback/${feedbackId}`, { timeout: 30000 })
    await expect(page.getByRole('heading', { name: /feedback details/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /view all feedback from this number/i })).toBeVisible()
    await expect(page.getByTitle('Copy').first()).toBeVisible()
  })

  test('admin API helper login works for request context', async ({ request }) => {
    await adminLogin(request, baseURL)
    const response = await request.get('/api/admin/check')
    expect(response.ok()).toBeTruthy()
  })
})
