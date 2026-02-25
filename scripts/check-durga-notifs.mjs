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

const receivers = [
  { name: 'Shashank P.', email: 'sunnygovind24@gmail.com' },
  { name: 'Adithya H.', email: 'apv737@gmail.com' },
  { name: 'Harish R.', email: 'vamsiraman13@gmail.com' },
  { name: 'Santosh P.', email: 'santosh.pingali12@gmail.com' },
  { name: 'Rakesh R.', email: 'nagaveena.raju@gmail.com' },
  { name: 'Krishna D.', email: 'avanukur@gmail.com' },
]

async function main() {
  console.log('Checking PRODUCTION database for in-app notifications\n')

  for (const r of receivers) {
    const user = await prisma.user.findFirst({
      where: { email: r.email },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      console.log(`✗ ${r.name} (${r.email}) - User NOT found in DB`)
      continue
    }

    // Check for new_interest notifications
    const notifs = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: 'new_interest',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (notifs.length > 0) {
      console.log(`✓ ${r.name} (${r.email}) - ${notifs.length} "new_interest" notification(s):`)
      notifs.forEach(n => {
        console.log(`    ${n.createdAt.toISOString()} | "${n.title}" | read: ${n.read}`)
      })
    } else {
      console.log(`✗ ${r.name} (${r.email}) - NO "new_interest" notifications found`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
