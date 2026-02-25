import { expect, test } from '@playwright/test'

const AUTH_SESSION = {
  user: {
    id: 'test-user-1',
    name: 'Square Tester',
    email: 'square-tester@example.com',
    hasProfile: true,
    approvalStatus: 'pending',
    subscriptionPlan: 'free',
  },
  expires: '2099-01-01T00:00:00.000Z',
}

async function mockAuthenticatedSession(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AUTH_SESSION),
    })
  })
}

async function mockSquareSdk(page: import('@playwright/test').Page) {
  await page.route(/https:\/\/(sandbox\.)?web\.squarecdn\.com\/v1\/square\.js/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.Square = {
          payments: async () => ({
            card: async () => ({
              attach: async () => {},
              tokenize: async () => ({ status: 'OK', token: 'test-source-token' }),
              destroy: async () => {}
            }),
            verifyBuyer: async () => ({ token: 'test-verification-token' })
          })
        };
      `,
    })
  })
}

test.describe('Square payment flows', () => {
  test('get-verified flow initializes Square and posts payment payload', async ({ page }) => {
    await mockAuthenticatedSession(page)
    await mockSquareSdk(page)

    await page.route('**/api/pricing', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ price: 50, isPromo: false, regularPrice: 50 }),
      })
    })

    await page.route('**/api/payment/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasPaid: false, isApproved: false, approvalStatus: 'pending' }),
      })
    })

    await page.route('**/api/square/location', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ locationId: 'LOC-MOCK-1' }),
      })
    })

    let squareCreatePayload: Record<string, unknown> | null = null
    await page.route('**/api/square/create-payment', async route => {
      squareCreatePayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, paymentId: 'PAY-MOCK-1' }),
      })
    })

    await page.goto('/get-verified')

    await expect(page.getByText('Complete Verification')).toBeVisible()
    await expect(page.locator('#card-container')).toBeVisible()
    await page.getByRole('button', { name: 'Pay $50' }).click()

    await expect.poll(() => squareCreatePayload).not.toBeNull()
    expect(squareCreatePayload).toMatchObject({
      sourceId: 'test-source-token',
      verificationToken: 'test-verification-token',
    })

    await page.waitForURL('**/dashboard**', { timeout: 15000 })
  })

  test('get-verified shows initialization error when location api fails', async ({ page }) => {
    await mockAuthenticatedSession(page)
    await mockSquareSdk(page)

    await page.route('**/api/pricing', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ price: 50, isPromo: false, regularPrice: 50 }),
      })
    })

    await page.route('**/api/payment/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasPaid: false, isApproved: false, approvalStatus: 'pending' }),
      })
    })

    await page.route('**/api/square/location', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Square misconfigured' }),
      })
    })

    await page.goto('/get-verified')

    await expect(page.getByText(/failed to initialize payment form/i)).toBeVisible()
    await expect(page.getByText(/square misconfigured/i)).toBeVisible()
  })

  test('march event payment flow posts to event payment api and shows success', async ({ page }) => {
    await mockAuthenticatedSession(page)
    await mockSquareSdk(page)

    await page.route('**/api/square/location', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ locationId: 'LOC-MOCK-2' }),
      })
    })

    let eventPaymentPayload: Record<string, unknown> | null = null
    await page.route('**/api/events/march-2025/payment', async route => {
      eventPaymentPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Payment successful! You are registered.' }),
      })
    })

    await page.goto('/marchevent/payment?registrationId=reg-mock-1')

    await expect(page.getByRole('heading', { name: 'Complete Payment' })).toBeVisible()
    await expect(page.locator('#card-container')).toBeVisible()

    await page.getByRole('button', { name: /Pay \$\d+/ }).click()

    await expect.poll(() => eventPaymentPayload).not.toBeNull()
    expect(eventPaymentPayload).toMatchObject({
      registrationId: 'reg-mock-1',
      sourceId: 'test-source-token',
      verificationToken: 'test-verification-token',
    })

    await expect(page.getByRole('heading', { name: "You're Registered!" })).toBeVisible()
  })
})
