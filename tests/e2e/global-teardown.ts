import { request as playwrightRequest } from '@playwright/test'
import {
  clearCleanupRecords,
  isCleanupEligibleEmail,
  readCleanupRecords,
} from './cleanup-registry'

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function lookupUserIdsByEmail(
  adminRequest: import('@playwright/test').APIRequestContext,
  email: string
): Promise<string[]> {
  const ids = new Set<string>()
  const exactEmail = normalizeEmail(email)
  const encodedSearch = encodeURIComponent(email)
  const endpoints = [
    `/api/admin/profiles?search=${encodedSearch}&limit=100`,
    `/api/admin/profiles?filter=no_profile&search=${encodedSearch}&limit=100`,
  ]

  for (const endpoint of endpoints) {
    const response = await adminRequest.get(endpoint)
    if (!response.ok()) continue

    const payload = await response.json().catch(() => null) as { profiles?: Array<{ user?: { id?: string; email?: string } }> } | null
    const profiles = Array.isArray(payload?.profiles) ? payload.profiles : []

    for (const profile of profiles) {
      const rowEmail = String(profile?.user?.email || '').toLowerCase()
      const rowUserId = profile?.user?.id
      if (rowUserId && rowEmail === exactEmail) {
        ids.add(rowUserId)
      }
    }
  }

  return Array.from(ids)
}

export default async function globalTeardown() {
  const records = readCleanupRecords()
  if (!records.length) return

  const adminRequest = await playwrightRequest.newContext({ baseURL })

  try {
    const loginResponse = await adminRequest.post('/api/admin/login', {
      data: {
        username: 'admin',
        password: 'vivaah2024',
      },
    })

    if (!loginResponse.ok()) {
      const status = loginResponse.status()
      console.error(`[e2e-cleanup] Admin login failed (HTTP ${status}). Cleanup records retained for retry.`)
      return
    }

    const userIds = new Set<string>()
    const emails = new Set<string>()
    for (const record of records) {
      if (record.userId) userIds.add(record.userId)
      if (record.email && isCleanupEligibleEmail(record.email)) {
        emails.add(normalizeEmail(record.email))
      }
    }

    for (const email of Array.from(emails)) {
      const idsForEmail = await lookupUserIdsByEmail(adminRequest, email)
      for (const id of idsForEmail) userIds.add(id)
    }

    let deleted = 0
    let missing = 0
    let failed = 0

    for (const userId of Array.from(userIds)) {
      const deleteResponse = await adminRequest.delete(`/api/admin/users/${userId}`)
      if (deleteResponse.ok()) {
        deleted += 1
        continue
      }

      if (deleteResponse.status() === 404) {
        missing += 1
        continue
      }

      failed += 1
      const errorBody = await deleteResponse.text().catch(() => '')
      console.error(`[e2e-cleanup] Failed to delete user ${userId} (HTTP ${deleteResponse.status()}): ${errorBody}`)
    }

    console.log(
      `[e2e-cleanup] attempted=${userIds.size} deleted=${deleted} missing=${missing} failed=${failed}`
    )

    if (failed === 0) {
      clearCleanupRecords()
    }
  } finally {
    await adminRequest.dispose()
  }
}
