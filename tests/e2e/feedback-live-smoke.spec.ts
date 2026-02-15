import { test, expect } from '@playwright/test'
import { adminLogin, buildTestUser, createUserWithProfile, loginViaUi } from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

function uniqueSuffix(label: string) {
  return `${Date.now().toString(36)}-${label}-${Math.random().toString(36).slice(2, 7)}`
}

test.describe.serial('Live feedback smoke (unmocked)', () => {
  test.describe.configure({ timeout: 120000 })

  test('user can submit feedback and admin can read it from API list/detail', async ({ page, request }) => {
    const user = buildTestUser(uniqueSuffix('live-feedback'), 'female')
    await createUserWithProfile(request, baseURL, user)

    await loginViaUi(page, user.email)
    let profileStatusBody: { authenticated?: boolean; hasProfile?: boolean; profileId?: string | null } | null = null
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const profileStatus = await page.request.get('/api/user/profile-status')
      profileStatusBody = await profileStatus.json()
      if (profileStatusBody?.authenticated) break
      await page.waitForTimeout(500)
    }
    expect(
      profileStatusBody?.authenticated,
      `expected authenticated profile status after login, got: ${JSON.stringify(profileStatusBody)}`
    ).toBeTruthy()
    await page.goto('/feedback')
    await expect(page.getByRole('heading', { name: /share your feedback/i })).toBeVisible()

    const marker = `live-feedback-${uniqueSuffix('marker')}`
    const submitResult = await page.evaluate(async ({ marker, ip }) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({
          fromUrl: '/matches',
          submitUrl: '/feedback',
          userAgent: 'playwright-live-smoke',
          overallStars: 5,
          primaryIssue: 'technical',
          summaryText: marker,
          stepBData: { techTags: ['Slow loading'], bugDescription: 'Intermittent lag in list view' },
          issueTags: ['Slow loading'],
        }),
      })

      return {
        ok: response.ok,
        status: response.status,
        body: await response.text(),
      }
    }, {
      marker,
      ip: `10.99.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`,
    })

    const submitBodyText = submitResult.body
    expect(
      submitResult.ok,
      `feedback submit failed: status=${submitResult.status} body=${submitBodyText}`
    ).toBeTruthy()
    const submitData = JSON.parse(submitBodyText) as { id?: string }
    const feedbackId = submitData.id as string
    expect(feedbackId).toBeTruthy()

    await adminLogin(request, baseURL)

    const listResponse = await request.get(`/api/admin/feedback?search=${encodeURIComponent(marker)}`)
    expect(listResponse.ok()).toBeTruthy()
    const listData = await listResponse.json()
    const row = (listData.feedbacks || []).find((entry: { id: string }) => entry.id === feedbackId)
    expect(row).toBeTruthy()
    expect(row.userPhone).toBeTruthy()
    expect(row.userId).toBeTruthy()
    expect(row.primaryIssue).toBe('technical')

    const detailResponse = await request.get(`/api/admin/feedback/${feedbackId}`)
    expect(detailResponse.ok()).toBeTruthy()
    const detailData = await detailResponse.json()
    expect(detailData.feedback.id).toBe(feedbackId)
    expect(detailData.feedback.summaryText).toBe(marker)

    const summaryResponse = await request.get('/api/admin/feedback/summary')
    expect(summaryResponse.ok()).toBeTruthy()
    const summaryData = await summaryResponse.json()
    expect(summaryData.totalFeedbackCount).toBeGreaterThan(0)
  })
})
