import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const envContent = readFileSync('.env', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  process.env[key] = val
}

const prisma = new PrismaClient()

async function main() {
  // Check total notifications in prod
  const totalNotifs = await prisma.notification.count()
  console.log('Total notifications in production DB:', totalNotifs)

  // Check if storeNotification function is imported properly
  // Let's also look for any interest-related notifications at all
  const interestNotifs = await prisma.notification.findMany({
    where: { type: 'new_interest' },
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  console.log('new_interest notifications:', interestNotifs.length)
  interestNotifs.forEach(n => console.log(`  ${n.createdAt.toISOString()} | userId: ${n.userId} | ${n.title}`))

  // Check all notification types
  const types = await prisma.notification.groupBy({
    by: ['type'],
    _count: true,
    orderBy: { _count: { type: 'desc' } }
  })
  console.log('\nNotification counts by type:')
  types.forEach(t => console.log(`  ${t.type}: ${t._count}`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
