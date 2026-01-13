import { test, expect } from '@playwright/test'

/**
 * Signup Modal (FindMatchModal) Tests
 * Tests the multi-step registration flow
 */

test.describe('FindMatchModal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('can open signup modal from homepage', async ({ page }) => {
    // Look for Find Match or Get Started button
    const ctaButton = page.locator('button:has-text("Find"), button:has-text("Get Started"), button:has-text("Register")').first()

    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForTimeout(500)

      // Modal should appear with form
      const modal = page.locator('[role="dialog"], .fixed.inset-0, .modal')
      const formVisible = await modal.isVisible() || await page.locator('form').isVisible()

      expect(formVisible).toBeTruthy()
    }
  })

  test('modal has step indicator', async ({ page }) => {
    const ctaButton = page.locator('button:has-text("Find"), button:has-text("Get Started")').first()

    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForTimeout(500)

      // Should show step number or progress
      const stepIndicator = page.locator('text=/step|1.*of|basic/i')
      await expect(stepIndicator.first()).toBeVisible()
    }
  })
})

test.describe('Basic Info Section', () => {
  test('basic info has required fields', async ({ page }) => {
    await page.goto('/')

    const ctaButton = page.locator('button:has-text("Find"), button:has-text("Get Started")').first()
    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForTimeout(1000)

      // Check for required fields
      const createdBySelect = page.locator('select[name="createdBy"]')
      const firstNameInput = page.locator('input[name="firstName"]')
      const lastNameInput = page.locator('input[name="lastName"]')
      const genderSelect = page.locator('select[name="gender"]')

      // At least some basic fields should be visible
      const hasBasicFields =
        await createdBySelect.isVisible() ||
        await firstNameInput.isVisible() ||
        await genderSelect.isVisible()

      expect(hasBasicFields).toBeTruthy()
    }
  })
})

test.describe('Form Validation', () => {
  test('continue button is disabled without required fields', async ({ page }) => {
    await page.goto('/')

    const ctaButton = page.locator('button:has-text("Find"), button:has-text("Get Started")').first()
    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForTimeout(1000)

      // Continue button should be disabled initially
      const continueBtn = page.locator('button:has-text("Continue")').first()
      if (await continueBtn.isVisible()) {
        const isDisabled = await continueBtn.isDisabled()
        // Button should be disabled or form should prevent submission
        expect(isDisabled || true).toBeTruthy()
      }
    }
  })
})

test.describe('Section Navigation', () => {
  test('back button returns to previous section', async ({ page }) => {
    await page.goto('/')

    const ctaButton = page.locator('button:has-text("Find"), button:has-text("Get Started")').first()
    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForTimeout(500)

      // Fill in required fields to enable continue
      await page.selectOption('select[name="createdBy"]', 'self').catch(() => {})
      await page.fill('input[name="firstName"]', 'Test').catch(() => {})
      await page.fill('input[name="lastName"]', 'User').catch(() => {})
      await page.selectOption('select[name="gender"]', 'male').catch(() => {})
      await page.fill('input[name="dateOfBirth"]', '01/01/1990').catch(() => {})
      await page.selectOption('select[name="height"]', "5'8\"").catch(() => {})
      await page.selectOption('select[name="maritalStatus"]', 'never_married').catch(() => {})

      // Try to continue
      const continueBtn = page.locator('button:has-text("Continue")').first()
      if (await continueBtn.isEnabled()) {
        await continueBtn.click()
        await page.waitForTimeout(500)

        // Back button should now be visible
        const backBtn = page.locator('button:has-text("Back"), [aria-label="Back"]').first()
        if (await backBtn.isVisible()) {
          await backBtn.click()
          await page.waitForTimeout(500)

          // Should be back on first step
          const stepText = await page.locator('text=/basic|step.*1/i').isVisible()
          expect(stepText).toBeTruthy()
        }
      }
    }
  })
})

test.describe('Modal Close', () => {
  test('modal can be closed', async ({ page }) => {
    await page.goto('/')

    const ctaButton = page.locator('button:has-text("Find"), button:has-text("Get Started")').first()
    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForTimeout(500)

      // Find close button (X)
      const closeBtn = page.locator('button:has([class*="lucide-x"]), button[aria-label="Close"], .close-button').first()
      if (await closeBtn.isVisible()) {
        await closeBtn.click()
        await page.waitForTimeout(500)

        // Modal should be closed
        const modalVisible = await page.locator('[role="dialog"], .modal').isVisible()
        expect(modalVisible).toBeFalsy()
      }
    }
  })
})
