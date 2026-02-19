import { test, expect, request as apiRequest, type APIRequestContext } from '@playwright/test'
import {
  buildTestUser,
  createUserWithProfile,
  uploadProfilePhoto,
  adminLogin,
  adminApproveProfile,
  adminRejectProfile,
  loginViaApiCredentials,
  DEFAULT_PASSWORD,
} from './helpers'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

// Skip in CI - requires Cloudinary credentials for photo uploads
test.skip(!!process.env.CI, 'Skipped in CI: requires Cloudinary credentials')

test.describe.serial('API integration coverage', () => {
  let adminRequest: APIRequestContext
  let userARequest: APIRequestContext
  let userBRequest: APIRequestContext
  let userAId = ''
  let userBId = ''
  let profileAId = ''
  let profileBId = ''

  test.beforeAll(async ({ request }) => {
    adminRequest = await apiRequest.newContext({ baseURL })
    await adminLogin(adminRequest, baseURL)

    const suffix = Date.now().toString(36)
    const userA = buildTestUser(`${suffix}-a`, 'male')
    const userB = buildTestUser(`${suffix}-b`, 'female')

    const createdA = await createUserWithProfile(request, baseURL, userA, DEFAULT_PASSWORD)
    const createdB = await createUserWithProfile(request, baseURL, userB, DEFAULT_PASSWORD)
    userAId = createdA.userId
    userBId = createdB.userId
    profileAId = createdA.profileId
    profileBId = createdB.profileId

    await uploadProfilePhoto(request, baseURL, profileAId)
    await uploadProfilePhoto(request, baseURL, profileBId)

    await adminApproveProfile(adminRequest, baseURL, profileAId)
    await adminApproveProfile(adminRequest, baseURL, profileBId)

    userARequest = await apiRequest.newContext({ baseURL })
    userBRequest = await apiRequest.newContext({ baseURL })
    await loginViaApiCredentials(userARequest, baseURL, userA.email, DEFAULT_PASSWORD)
    await loginViaApiCredentials(userBRequest, baseURL, userB.email, DEFAULT_PASSWORD)

    // Create mutual interest so messaging can be exercised (via admin impersonation)
    await userARequest.post('/api/interest', { data: { profileId: profileBId } })
    await userBRequest.post('/api/interest', { data: { profileId: profileAId } })
  })

  test.afterAll(async () => {
    await adminRequest?.dispose()
    await userARequest?.dispose()
    await userBRequest?.dispose()
  })

  test('public profiles endpoint returns data', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/profiles`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data.profiles)).toBeTruthy()
  })

  test('unauthenticated endpoints reject access', async ({ request }) => {
    const endpoints = [
      '/api/profile',
      '/api/matches/auto',
      '/api/matches',
      '/api/interest',
      '/api/messages',
      '/api/user/verification-status',
      '/api/report',
    ]
    for (const endpoint of endpoints) {
      const response = await request.get(`${baseURL}${endpoint}`)
      expect([401, 403, 405]).toContain(response.status())
    }
  })

  test('profile read/update/visibility endpoints work with auth', async () => {
    const profileRes = await userARequest.get('/api/profile')
    expect(profileRes.ok()).toBeTruthy()
    const profileData = await profileRes.json()
    expect(profileData.id).toBe(profileAId)

    const updateRes = await userARequest.put('/api/profile', {
      data: { aboutMe: 'Updated via API integration test.' },
    })
    expect(updateRes.ok()).toBeTruthy()

    const visibilityRes = await userARequest.post('/api/profile/update-visibility', {
      data: { profileId: profileAId, photoVisibility: 'mutual_interest' },
    })
    expect(visibilityRes.ok()).toBeTruthy()
  })

  test('profile photo upload and delete endpoints', async () => {
    const uploadRes = await uploadProfilePhoto(userARequest, baseURL, profileAId)
    expect(uploadRes.ok()).toBeTruthy()
    const uploadData = await uploadRes.json()
    expect(uploadData.url).toBeTruthy()

    const deleteRes = await userARequest.post('/api/profile/delete-photo', {
      data: { photoUrl: uploadData.url },
    })
    expect(deleteRes.ok()).toBeTruthy()
    const deleteData = await deleteRes.json()
    expect(Array.isArray(deleteData.remainingPhotos)).toBeTruthy()
  })

  test('verification endpoints issue and verify OTPs', async () => {
    const emailSend = await userARequest.post('/api/verify/email/send')
    expect(emailSend.ok()).toBeTruthy()
    const emailData = await emailSend.json()
    expect(emailData.devOtp).toBeTruthy()

    const emailVerify = await userARequest.post('/api/verify/email/verify', {
      data: { otp: emailData.devOtp },
    })
    expect(emailVerify.ok()).toBeTruthy()

    const phoneSend = await userARequest.post('/api/verify/phone/send')
    expect(phoneSend.ok()).toBeTruthy()
    const phoneData = await phoneSend.json()
    expect(phoneData.devOtp).toBeTruthy()

    const phoneVerify = await userARequest.post('/api/verify/phone/verify', {
      data: { otp: phoneData.devOtp },
    })
    expect(phoneVerify.ok()).toBeTruthy()
  })

  test('interest and matches endpoints reflect mutual interest', async () => {
    const sentRes = await userARequest.get('/api/interest?type=sent')
    expect(sentRes.ok()).toBeTruthy()
    const sentData = await sentRes.json()
    expect(Array.isArray(sentData.interests)).toBeTruthy()
    expect((sentData.interests || []).every((interest: { status?: string }) => interest.status !== 'accepted')).toBeTruthy()

    const mutualCheck = await userARequest.get(`/api/interest?checkMutual=true&profileId=${profileBId}`)
    expect(mutualCheck.ok()).toBeTruthy()
    const mutualData = await mutualCheck.json()
    expect(mutualData.mutual).toBeTruthy()

    const autoMatches = await userARequest.get('/api/matches/auto')
    expect(autoMatches.ok()).toBeTruthy()
    const autoMatchesData = await autoMatches.json()
    expect(Array.isArray(autoMatchesData.mutualMatches)).toBeTruthy()
    expect(autoMatchesData.mutualMatches.length).toBeGreaterThan(0)

    const matchesRes = await userARequest.get('/api/matches?type=sent')
    expect(matchesRes.ok()).toBeTruthy()
    const matchesData = await matchesRes.json()
    expect(Array.isArray(matchesData.matches)).toBeTruthy()
  })

  test('non-approved profiles are hidden from match lists and cannot receive new interest', async ({ request }) => {
    const suffix = `${Date.now().toString(36)}-np`
    const userC = buildTestUser(suffix, 'female')
    const createdC = await createUserWithProfile(request, baseURL, userC, DEFAULT_PASSWORD)

    await uploadProfilePhoto(request, baseURL, createdC.profileId)
    await adminApproveProfile(adminRequest, baseURL, createdC.profileId)

    const userCRequest = await apiRequest.newContext({ baseURL })
    try {
      await loginViaApiCredentials(userCRequest, baseURL, userC.email, DEFAULT_PASSWORD)

      const cToAInterest = await userCRequest.post('/api/interest', { data: { profileId: profileAId } })
      expect(cToAInterest.ok()).toBeTruthy()

      const receivedBefore = await userARequest.get('/api/matches?type=received')
      expect(receivedBefore.ok()).toBeTruthy()
      const receivedBeforeData = await receivedBefore.json()
      expect(
        (receivedBeforeData.matches || []).some((match: { userId?: string }) => match.userId === createdC.userId)
      ).toBeTruthy()

      await adminRejectProfile(adminRequest, baseURL, createdC.profileId, 'E2E regression check: mark non-approved.')

      const receivedAfter = await userARequest.get('/api/matches?type=received')
      expect(receivedAfter.ok()).toBeTruthy()
      const receivedAfterData = await receivedAfter.json()
      expect(
        (receivedAfterData.matches || []).some((match: { userId?: string }) => match.userId === createdC.userId)
      ).toBeFalsy()

      const newInterestToRejected = await userARequest.post('/api/interest', {
        data: { profileId: createdC.profileId },
      })
      expect(newInterestToRejected.status()).toBe(404)
    } finally {
      await userCRequest.dispose()
    }
  })

  test('messaging endpoints work with admin impersonation', async () => {
    const sendRes = await adminRequest.post(`/api/messages?viewAsUser=${userAId}`, {
      data: { receiverId: userBId, content: 'Hello from API test.' },
    })
    expect(sendRes.ok()).toBeTruthy()

    const convRes = await userARequest.get('/api/messages')
    expect(convRes.ok()).toBeTruthy()
    const convData = await convRes.json()
    expect(convData.conversations.length).toBeGreaterThan(0)
  })

  test('report endpoints accept reports and admin can read', async () => {
    const reportRes = await userARequest.post('/api/report', {
      data: { reportedUserId: userBId, reason: 'Spam content reported via test.' },
    })
    expect(reportRes.ok()).toBeTruthy()

    const adminReports = await adminRequest.get('/api/admin/reports')
    expect(adminReports.ok()).toBeTruthy()
    const reportsData = await adminReports.json()
    expect(Array.isArray(reportsData)).toBeTruthy()
  })

  test('admin endpoints return data when authenticated', async () => {
    const endpoints = [
      '/api/admin/stats',
      '/api/admin/profiles',
      '/api/admin/matches',
      '/api/admin/users',
    ]
    for (const endpoint of endpoints) {
      const response = await adminRequest.get(endpoint)
      expect(response.ok()).toBeTruthy()
    }

    const userDetail = await adminRequest.get(`/api/admin/users/${userAId}`)
    expect(userDetail.ok()).toBeTruthy()
  })
})
