import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

// Load PRODUCTION .env
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

// Also load .env.local for RESEND_API_KEY (may not be in .env)
try {
  const localEnv = readFileSync('.env.local', 'utf-8')
  for (const line of localEnv.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    if (key === 'DATABASE_URL') continue // skip - use prod DB
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

async function main() {
  console.log('Connected to PRODUCTION database\n')

  // Find Durga by VR ID
  const profile = await prisma.profile.findFirst({
    where: { odNumber: 'VR2026011925' },
    include: { user: { select: { id: true, name: true, email: true } } }
  })

  if (!profile) {
    console.log('Profile VR2026011925 NOT found in production DB')
    return
  }

  const durgaUserId = profile.userId
  console.log(`Found: ${profile.firstName} ${profile.lastName}`)
  console.log(`User: ${profile.user?.name} (${profile.user?.email})`)
  console.log(`VR ID: ${profile.vrId}`)

  // Get today's range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Find all interests sent by Durga today
  const todayInterests = await prisma.match.findMany({
    where: { senderId: durgaUserId, createdAt: { gte: today, lt: tomorrow } },
    include: {
      receiver: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\nInterests sent TODAY by ${profile.firstName}: ${todayInterests.length}`)
  todayInterests.forEach(i => {
    console.log(`  ${i.createdAt.toISOString()} | → ${i.receiver.name} (${i.receiver.email}) | Status: ${i.status}`)
  })

  // All interests ever
  const allInterests = await prisma.match.findMany({
    where: { senderId: durgaUserId },
    include: {
      receiver: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\nAll interests from ${profile.firstName} (all time): ${allInterests.length}`)
  allInterests.forEach(i => {
    console.log(`  ${i.createdAt.toISOString()} | → ${i.receiver.name} (${i.receiver.email}) | Status: ${i.status}`)
  })

  // Check Resend for emails about Durga's interests
  const { data: emailData } = await resend.emails.list()
  const allEmails = emailData?.data || []

  console.log('\n--- Cross-reference: Interests → Email notifications ---')
  for (const interest of allInterests) {
    const receiverEmail = interest.receiver.email
    const matchingEmail = allEmails.find(e => {
      const to = Array.isArray(e.to) ? e.to : [e.to]
      const subject = (e.subject || '').toLowerCase()
      return to.some(t => t === receiverEmail) && subject.includes('interested')
    })
    if (matchingEmail) {
      console.log(`  ✓ ${interest.receiver.name} (${receiverEmail}) - Email: ${matchingEmail.last_event} (${matchingEmail.created_at})`)
    } else {
      console.log(`  ✗ ${interest.receiver.name} (${receiverEmail}) - NOT in recent Resend history (may have been sent but outside last 20 emails)`)
    }
  }

  // Also check notifications in DB
  const notifs = await prisma.notification.findMany({
    where: {
      userId: { in: allInterests.map(i => i.receiverId) },
      type: 'new_interest',
      createdAt: { gte: today }
    },
    orderBy: { createdAt: 'desc' }
  })
  console.log(`\nIn-app "new_interest" notifications created today for Durga's receivers: ${notifs.length}`)
  notifs.forEach(n => {
    const interest = allInterests.find(i => i.receiverId === n.userId)
    console.log(`  ${n.createdAt.toISOString()} | To userId: ${n.userId} (${interest?.receiver.name || '?'}) | title: ${n.title}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
