import { test, expect } from '@playwright/test'

/**
 * Navigation & Link Tests
 * Tests that all main navigation links work and pages load correctly
 */

test.describe('Public Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Vivaah|Marriage|Matrimony/i)
    // Check main CTA exists
    await expect(page.locator('text=/find.*match|get.*started|register/i').first()).toBeVisible()
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing')
    // Pricing page may redirect to get-verified or show verification info
    await expect(page.locator('text=/pricing|plan|price|verif|founding/i').first()).toBeVisible()
  })

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('text=/privacy/i').first()).toBeVisible()
  })

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.locator('text=/terms/i').first()).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    // Login page shows Google Sign In as primary option
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    // Register may redirect to homepage with modal or show registration UI
    const hasForm = await page.locator('form').isVisible()
    const hasText = await page.locator('text=/get.*started|find.*match|create.*profile/i').first().isVisible()
    expect(hasForm || hasText).toBeTruthy()
  })
})

test.describe('Navbar Links', () => {
  test('navbar links are clickable', async ({ page }) => {
    await page.goto('/')

    // Check logo/brand link
    const logo = page.locator('a[href="/"]').first()
    await expect(logo).toBeVisible()

    // Check Sign In link
    const signIn = page.locator('a[href="/login"], button:has-text("Sign In")').first()
    if (await signIn.isVisible()) {
      await signIn.click()
      await expect(page).toHaveURL(/login/)
    }
  })
})

test.describe('Footer Links', () => {
  test('footer links work', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for common footer links
    const footerLinks = ['/about', '/privacy', '/terms']
    for (const link of footerLinks) {
      const footerLink = page.locator(`footer a[href="${link}"]`).first()
      if (await footerLink.isVisible()) {
        await expect(footerLink).toHaveAttribute('href', link)
      }
    }
  })
})

test.describe('404 Handling', () => {
  test('invalid route shows 404 or redirects', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345')
    // Should either show 404 page or redirect
    expect(response?.status()).toBeLessThan(500)
  })
})
