import { test, expect, type Page } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  registerUser,
  loginViaUi,
  DEFAULT_PASSWORD,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

function uniqueSuffix(label: string) {
  return `${Date.now().toString(36)}-${label}-${Math.random().toString(36).slice(2, 7)}`
}

async function openEmailSignIn(page: Page) {
  const toggle = page.getByRole('button', { name: /Don\'t have Gmail|Sign in with email/i }).first()
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
}

async function submitEmailSignIn(
  page: Page,
  email: string,
  password: string = DEFAULT_PASSWORD
) {
  await openEmailSignIn(page)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.getByRole('button', { name: /^Sign In with Email$/i }).click()
}

test.describe('Login UI', () => {
  test('login page shows Google-first auth and collapsible email form', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible()
    await expect(page.locator('#email')).toHaveCount(0)
    await openEmailSignIn(page)
  })

  test('invalid credentials keep user on login with an error', async ({ page }) => {
    await page.goto('/login')
    await submitEmailSignIn(page, `no-user-${uniqueSuffix('invalid')}@example.com`, 'WrongPass123!')

    await page.waitForTimeout(1200)
    await expect(page).toHaveURL(/\/login/)

    const errorBannerVisible = await page.locator('.bg-red-50').first().isVisible().catch(() => false)
    const errorTextVisible = await page.getByText(/invalid|no account|signin failed|error/i).first().isVisible().catch(() => false)
    expect(errorBannerVisible || errorTextVisible).toBeTruthy()
  })
})

test.describe.serial('Credential Login Routing', () => {
  test.describe.configure({ timeout: 120000 })

  test('profiled user logs in with mixed-case email and honors callbackUrl', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('callback'), 'male')
    await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD)

    await page.goto(`/login?callbackUrl=${encodeURIComponent('/matches')}`)
    await submitEmailSignIn(page, user.email.toUpperCase(), DEFAULT_PASSWORD)

    await page.waitForURL(url => url.pathname.startsWith('/matches'), { timeout: 60000 })
  })

  test('external callbackUrl is ignored after successful login', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('external-callback'), 'female')
    await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD)

    await page.goto('/login?callbackUrl=https://evil.example/phish')
    await submitEmailSignIn(page, user.email, DEFAULT_PASSWORD)

    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 60000 })
    const current = new URL(page.url())
    expect(current.origin).toBe(baseURL)
    expect(current.pathname.startsWith('/dashboard')).toBeTruthy()
  })

  test('user without profile is routed to profile completion and profile is created', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('no-profile'), 'male')
    await registerUser(request, baseURL, user, DEFAULT_PASSWORD)

    await page.goto('/login')
    await submitEmailSignIn(page, user.email, DEFAULT_PASSWORD)

    await page.waitForURL(url => url.pathname.startsWith('/profile/complete'), { timeout: 60000 })

    const statusResponse = await page.request.get(`${baseURL}/api/user/profile-status`)
    expect(statusResponse.ok()).toBeTruthy()
    const statusData = await statusResponse.json()
    expect(statusData.hasProfile).toBeTruthy()
  })
})

test.describe.serial('Auto Sign-In', () => {
  test.describe.configure({ timeout: 120000 })

  test('autoSignIn logs user in and clears temporary session storage keys', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('autosignin'), 'female')
    await registerUser(request, baseURL, user, DEFAULT_PASSWORD)

    await page.goto('/login')
    await page.evaluate(({ email, password }) => {
      sessionStorage.setItem('autoSignInEmail', email)
      sessionStorage.setItem('autoSignInPassword', password)
      sessionStorage.setItem('autoSignInName', 'Auto Signin User')
      sessionStorage.setItem('profileCreationData', JSON.stringify({ gender: 'female' }))
    }, { email: user.email, password: DEFAULT_PASSWORD })

    await page.goto('/login?registered=true&autoSignIn=true')
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 60000 })
    expect(new URL(page.url()).pathname.startsWith('/profile/complete')).toBeTruthy()

    const leftovers = await page.evaluate(() => ({
      autoSignInEmail: sessionStorage.getItem('autoSignInEmail'),
      autoSignInPassword: sessionStorage.getItem('autoSignInPassword'),
      autoSignInName: sessionStorage.getItem('autoSignInName'),
      profileCreationData: sessionStorage.getItem('profileCreationData'),
    }))
    expect(leftovers.autoSignInEmail).toBeNull()
    expect(leftovers.autoSignInPassword).toBeNull()
    expect(leftovers.autoSignInName).toBeNull()
    expect(leftovers.profileCreationData).toBeNull()
  })

  test('autoSignIn handles corrupted profileCreationData without breaking login', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('autosignin-corrupt'), 'male')
    await registerUser(request, baseURL, user, DEFAULT_PASSWORD)

    await page.goto('/login')
    await page.evaluate(({ email, password }) => {
      sessionStorage.setItem('autoSignInEmail', email)
      sessionStorage.setItem('autoSignInPassword', password)
      sessionStorage.setItem('autoSignInName', 'Corrupt Data User')
      sessionStorage.setItem('profileCreationData', '{bad-json')
    }, { email: user.email, password: DEFAULT_PASSWORD })

    await page.goto('/login?registered=true&autoSignIn=true')
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 60000 })

    const path = new URL(page.url()).pathname
    expect(path.startsWith('/profile/complete') || path.startsWith('/dashboard')).toBeTruthy()
  })
})

test.describe.serial('Authenticated Login Redirect', () => {
  test('authenticated users visiting /login are redirected to callback path', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('already-authed'), 'female')
    await createUserWithProfile(request, baseURL, user, DEFAULT_PASSWORD)

    await loginViaUi(page, user.email, DEFAULT_PASSWORD)
    await page.goto('/login?callbackUrl=%2Fmatches')

    await page.waitForURL(url => url.pathname.startsWith('/matches'), { timeout: 60000 })
  })
})
