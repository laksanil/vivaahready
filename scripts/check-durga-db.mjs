import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const envContent = readFileSync('.env.local', 'utf-8')
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
  // Search for Durga in users
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'durga', mode: 'insensitive' } },
        { email: { contains: 'durga', mode: 'insensitive' } },
      ]
    },
    select: { id: true, name: true, email: true }
  })
  console.log('Users matching "durga":', users.length)
  users.forEach(u => console.log(`  ${u.id} | ${u.name} | ${u.email}`))

  // Search in profiles
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { firstName: { contains: 'durga', mode: 'insensitive' } },
        { lastName: { contains: 'durga', mode: 'insensitive' } },
      ]
    },
    select: { id: true, userId: true, firstName: true, lastName: true }
  })
  console.log('\nProfiles matching "durga":', profiles.length)
  profiles.forEach(p => console.log(`  ${p.id} | userId: ${p.userId} | ${p.firstName} ${p.lastName}`))

  // Check notifications for any durga user
  for (const u of users) {
    const notifCount = await prisma.notification.count({ where: { userId: u.id } })
    const notifs = await prisma.notification.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, type: true, title: true, createdAt: true, read: true }
    })
    console.log(`\nNotifications for ${u.name} (${u.email}): ${notifCount} total`)
    notifs.forEach(n => console.log(`  ${n.createdAt.toISOString()} | ${n.type} | ${n.title} | read: ${n.read}`))
  }

  // Search support messages
  const support = await prisma.supportMessage.findMany({
    where: {
      OR: [
        { name: { contains: 'durga', mode: 'insensitive' } },
        { email: { contains: 'durga', mode: 'insensitive' } },
        { message: { contains: 'durga', mode: 'insensitive' } },
      ]
    },
    select: { id: true, name: true, email: true, subject: true, status: true, createdAt: true }
  })
  console.log('\nSupport messages mentioning "durga":', support.length)
  support.forEach(s => console.log(`  ${s.createdAt.toISOString()} | ${s.name} | ${s.email} | ${s.subject} | ${s.status}`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
