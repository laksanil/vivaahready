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
  console.log('Checking PRODUCTION database\n')

  // Get Durga's profile
  const durgaProfile = await prisma.profile.findFirst({
    where: { odNumber: 'VR2026011925' },
    include: { user: true }
  })

  if (!durgaProfile) {
    console.log('Durga profile not found')
    return
  }

  console.log(`Durga: userId=${durgaProfile.userId}, email=${durgaProfile.user.email}`)
  console.log(`Profile approved: ${durgaProfile.approvalStatus}, active: ${durgaProfile.isActive}, verified: ${durgaProfile.isVerified}\n`)

  // Get all her matches (interests)
  const interests = await prisma.match.findMany({
    where: { senderId: durgaProfile.userId },
    include: {
      receiver: {
        select: {
          id: true, name: true, email: true,
          profile: {
            select: {
              id: true, firstName: true, lastName: true,
              approvalStatus: true, isActive: true, isVerified: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Durga's interests: ${interests.length}\n`)
  for (const i of interests) {
    const p = i.receiver.profile
    console.log(`${i.receiver.name} (${i.receiver.email})`)
    console.log(`  Match created: ${i.createdAt.toISOString()} | Status: ${i.status}`)
    if (p) {
      console.log(`  Profile: ${p.firstName} ${p.lastName} | approved: ${p.approvalStatus} | active: ${p.isActive} | verified: ${p.isVerified}`)
    } else {
      console.log(`  Profile: NONE`)
    }

    // Check if any notifications exist for this receiver at all
    const allNotifs = await prisma.notification.findMany({
      where: { userId: i.receiverId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { type: true, title: true, createdAt: true }
    })
    if (allNotifs.length > 0) {
      console.log(`  Recent notifications: ${allNotifs.map(n => `${n.type} (${n.createdAt.toISOString().split('T')[0]})`).join(', ')}`)
    } else {
      console.log(`  Recent notifications: NONE`)
    }
    console.log()
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
