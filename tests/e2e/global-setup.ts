import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

function ensureSafeDatabase(databaseUrl: string) {
  const isSafe =
    databaseUrl.includes('schema=') ||
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1')

  if (!isSafe && !process.env.E2E_ALLOW_UNSAFE_DB) {
    throw new Error(
      'Refusing to run E2E tests against a non-test database. ' +
      'Set DATABASE_URL_E2E with ?schema=playwright or set E2E_ALLOW_UNSAFE_DB=1 to override.'
    )
  }
}

export default async function globalSetup() {
  if (process.env.E2E_SKIP_DB_SETUP === '1') {
    return
  }

  const databaseUrl = process.env.DATABASE_URL_E2E || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL_E2E or DATABASE_URL must be set for E2E tests.')
  }

  ensureSafeDatabase(databaseUrl)

  execSync('npx prisma db push', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  })

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  })

  const truncateSql =
    'TRUNCATE "Message", "Match", "Report", "DeclinedProfile", "DeletionRequest", "Profile", "Subscription", "User" CASCADE;'

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await prisma.$executeRawUnsafe(truncateSql)
      break
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  await prisma.$disconnect()
}
