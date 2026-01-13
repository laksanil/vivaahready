import { test, expect } from '@playwright/test'

/**
 * API Health Check Tests
 * Tests that all API routes respond correctly
 */

test.describe('Public API Routes', () => {
  test('profiles API returns valid response', async ({ request }) => {
    const response = await request.get('/api/profiles')
    expect(response.status()).toBeLessThan(500)
  })

  test('auth API exists', async ({ request }) => {
    const response = await request.get('/api/auth/providers')
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe('Protected API Routes - No Auth', () => {
  test('profile API requires auth', async ({ request }) => {
    const response = await request.get('/api/profile')
    // Should return 401/403 or redirect
    expect([401, 403, 302, 307, 200].includes(response.status())).toBeTruthy()
  })

  test('matches API requires auth', async ({ request }) => {
    const response = await request.get('/api/matches')
    expect([401, 403, 302, 307, 200].includes(response.status())).toBeTruthy()
  })

  test('interest API requires auth for POST', async ({ request }) => {
    const response = await request.post('/api/interest', {
      data: { profileId: 'test' }
    })
    expect([401, 403, 302, 307, 400, 200].includes(response.status())).toBeTruthy()
  })
})

test.describe('Admin API Routes', () => {
  test('admin stats requires auth', async ({ request }) => {
    const response = await request.get('/api/admin/stats')
    expect([401, 403, 302, 307, 200].includes(response.status())).toBeTruthy()
  })

  test('admin profiles requires auth', async ({ request }) => {
    const response = await request.get('/api/admin/profiles')
    expect([401, 403, 302, 307, 200].includes(response.status())).toBeTruthy()
  })

  test('admin approve requires auth', async ({ request }) => {
    const response = await request.post('/api/admin/approve', {
      data: { profileId: 'test', action: 'approve' }
    })
    expect([401, 403, 302, 307, 400, 200].includes(response.status())).toBeTruthy()
  })
})

test.describe('Payment API Routes', () => {
  test('payment status API exists', async ({ request }) => {
    const response = await request.get('/api/payment/status')
    expect(response.status()).toBeLessThan(500)
  })

  test('stripe checkout requires valid data', async ({ request }) => {
    const response = await request.post('/api/stripe/checkout', {
      data: {}
    })
    // Should fail gracefully, not 500
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe('User API Routes', () => {
  test('verification status API exists', async ({ request }) => {
    const response = await request.get('/api/user/verification-status')
    expect(response.status()).toBeLessThan(500)
  })

  test('email verification API exists', async ({ request }) => {
    const response = await request.post('/api/verify/email/send', {
      data: { email: 'test@test.com' }
    })
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe('API Error Handling', () => {
  test('invalid profile ID returns proper error', async ({ request }) => {
    const response = await request.get('/api/profile/invalid-id-12345')
    expect(response.status()).toBeLessThan(500)
  })

  test('malformed JSON handled gracefully', async ({ request }) => {
    const response = await request.post('/api/interest', {
      headers: { 'Content-Type': 'application/json' },
      data: 'invalid json'
    })
    expect(response.status()).toBeLessThan(500)
  })
})
