import { test, expect } from '@playwright/test'
import { buildTestUser, createUserWithProfile, loginViaUi } from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

function uniqueSuffix(label: string) {
  return `${Date.now().toString(36)}-${label}-${Math.random().toString(36).slice(2, 7)}`
}

test.describe.serial('Feedback auth and widget flows', () => {
  test.describe.configure({ timeout: 120000 })

  test('logged-out user visiting /feedback is redirected to login with callbackUrl', async ({ page }) => {
    await page.goto('/feedback?from=%2Fmatches')

    await page.waitForURL((url) => url.pathname === '/login', { timeout: 30000 })
    const current = new URL(page.url())
    const callbackUrl = current.searchParams.get('callbackUrl')
    expect(callbackUrl).toBe('/feedback?from=%2Fmatches')
  })

  test('logged-in user with phone can load /feedback', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('feedback-page'), 'female')
    await createUserWithProfile(request, baseURL, user)

    await loginViaUi(page, user.email)
    await page.goto('/feedback?from=%2Fmatches')

    await expect(page).toHaveURL(/\/feedback/)
    await expect(page.getByRole('heading', { name: /share your feedback/i })).toBeVisible()
  })

  test('feedback widget sends logged-out users to login with return callback', async ({ page }) => {
    await page.goto('/about')

    const feedbackLink = page.getByRole('link', { name: /give feedback/i })
    await expect(feedbackLink).toBeVisible()
    await feedbackLink.click()

    await page.waitForURL((url) => url.pathname === '/login', { timeout: 30000 })
    const callbackUrl = new URL(page.url()).searchParams.get('callbackUrl')
    expect(callbackUrl).toBe('/feedback?from=%2Fabout')
  })

  test('feedback widget sends logged-in users directly to /feedback?from=current-page', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('feedback-widget-auth'), 'male')
    await createUserWithProfile(request, baseURL, user)

    await loginViaUi(page, user.email)
    await page.goto('/dashboard')

    const feedbackLink = page.getByRole('link', { name: /give feedback/i })
    await expect(feedbackLink).toBeVisible()
    await feedbackLink.click()

    await page.waitForURL((url) => url.pathname === '/feedback', { timeout: 30000 })
    const from = new URL(page.url()).searchParams.get('from')
    expect(from).toBe('/dashboard')
  })
})
