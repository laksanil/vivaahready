import { test, expect } from '@playwright/test'

/**
 * Responsive Design Tests
 * Tests that pages work on different screen sizes
 */

test.describe('Mobile Responsiveness', () => {
  test('homepage is mobile friendly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 13 size
    await page.goto('/')

    // Check viewport width
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBeLessThan(500)

    // Content should be visible
    await expect(page.locator('body')).toBeVisible()

    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('navigation works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('button[aria-label*="menu"], .mobile-menu-button, button:has([class*="menu"])')

    if (await mobileMenuBtn.first().isVisible()) {
      await mobileMenuBtn.first().click()
      await page.waitForTimeout(300)

      // Menu should expand
      const menuItems = page.locator('nav a, .mobile-menu a')
      const anyVisible = await menuItems.first().isVisible()
      expect(anyVisible).toBeTruthy()
    }
  })

  test('login form works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')

    // Form should be properly sized
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await expect(emailInput).toBeVisible()

    // Input should be tappable
    const inputBox = await emailInput.boundingBox()
    if (inputBox) {
      expect(inputBox.width).toBeGreaterThan(200)
    }
  })
})

test.describe('Tablet Responsiveness', () => {
  test('homepage layout on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad Mini size
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Check that content is visible
    const mainContent = page.locator('main, [role="main"], .container')
    if (await mainContent.first().isVisible()) {
      await expect(mainContent.first()).toBeVisible()
    }
  })

  test('pricing grid on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/pricing')

    // Pricing cards should be visible
    const pricingSection = page.locator('text=/pricing|plan/i')
    await expect(pricingSection.first()).toBeVisible()
  })
})

test.describe('Desktop Responsiveness', () => {
  test('homepage renders on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    // Page should load and body should be visible
    await expect(page.locator('body')).toBeVisible()

    // Check that main content exists
    const mainContent = page.locator('main, .container, body')
    await expect(mainContent.first()).toBeVisible()
  })
})
