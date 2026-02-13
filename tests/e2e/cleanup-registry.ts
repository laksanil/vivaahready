import fs from 'node:fs'
import path from 'node:path'

interface CleanupRecord {
  userId?: string
  email?: string
  source?: string
  createdAt: string
}

const REGISTRY_DIR = path.join(process.cwd(), 'test-results', 'playwright')
const REGISTRY_FILE = path.join(REGISTRY_DIR, 'created-test-users.jsonl')
const TEST_EMAIL_PATTERN = /^(e2e-[a-z0-9-]+|qa\.profile\.[a-z0-9-]+)@example\.com$/i

export function isCleanupEligibleEmail(email: string): boolean {
  return TEST_EMAIL_PATTERN.test(String(email || '').trim().toLowerCase())
}

function appendRecord(record: CleanupRecord): void {
  fs.mkdirSync(REGISTRY_DIR, { recursive: true })
  fs.appendFileSync(REGISTRY_FILE, `${JSON.stringify(record)}\n`)
}

export function recordCreatedTestEmail(email: string, source: string = 'e2e-ui-signup'): void {
  if (!isCleanupEligibleEmail(email)) return
  appendRecord({
    email: email.trim().toLowerCase(),
    source,
    createdAt: new Date().toISOString(),
  })
}

export function recordCreatedTestUser(userId: string, email: string, source: string = 'e2e-register'): void {
  if (!userId || !isCleanupEligibleEmail(email)) return
  appendRecord({
    userId: userId.trim(),
    email: email.trim().toLowerCase(),
    source,
    createdAt: new Date().toISOString(),
  })
}

export function readCleanupRecords(): CleanupRecord[] {
  if (!fs.existsSync(REGISTRY_FILE)) return []
  const raw = fs.readFileSync(REGISTRY_FILE, 'utf8')
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as CleanupRecord
      } catch {
        return null
      }
    })
    .filter((record): record is CleanupRecord => Boolean(record))
}

export function clearCleanupRecords(): void {
  if (!fs.existsSync(REGISTRY_FILE)) return
  fs.unlinkSync(REGISTRY_FILE)
}

