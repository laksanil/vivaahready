import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

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

const prisma = new PrismaClient()

async function main() {
  console.log('Connected to PRODUCTION database\n')

  // Get Durga's profile and interests
  const durgaProfile = await prisma.profile.findFirst({
    where: { odNumber: 'VR2026011925' },
    include: { user: { select: { id: true, name: true } } }
  })

  if (!durgaProfile) {
    console.log('Durga profile not found')
    return
  }

  const senderName = durgaProfile.firstName || durgaProfile.user?.name?.split(' ')[0] || 'Someone'
  console.log(`Sender: ${senderName} (${durgaProfile.userId})\n`)

  const interests = await prisma.match.findMany({
    where: { senderId: durgaProfile.userId },
    include: {
      receiver: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Creating notifications for ${interests.length} receivers...\n`)

  for (const interest of interests) {
    // Check if notification already exists to avoid duplicates
    const existing = await prisma.notification.findFirst({
      where: {
        userId: interest.receiverId,
        type: 'new_interest',
        title: { contains: senderName },
      }
    })

    if (existing) {
      console.log(`  ⊘ ${interest.receiver.name} (${interest.receiver.email}) - Already has notification, skipping`)
      continue
    }

    const notif = await prisma.notification.create({
      data: {
        userId: interest.receiverId,
        type: 'new_interest',
        title: `${senderName} is Interested!`,
        body: `${senderName} has expressed interest in your profile. Log in to view and respond.`,
        url: '/matches?tab=received',
        read: false,
        createdAt: interest.createdAt,
      }
    })

    console.log(`  ✓ ${interest.receiver.name} (${interest.receiver.email}) - Notification created (${notif.id})`)
  }

  // Verify
  const totalNotifs = await prisma.notification.count()
  console.log(`\nTotal notifications in production DB now: ${totalNotifs}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
