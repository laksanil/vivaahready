import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

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
const resend = new Resend(process.env.RESEND_API_KEY)

async function main() {
  // Find Durga - search broadly
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'durga', mode: 'insensitive' } },
        { email: { contains: 'durga', mode: 'insensitive' } },
      ]
    }
  })

  // Also search profiles
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { firstName: { contains: 'durga', mode: 'insensitive' } },
        { lastName: { contains: 'durga', mode: 'insensitive' } },
      ]
    },
    include: { user: { select: { id: true, name: true, email: true } } }
  })

  let durgaUserId = null
  if (users.length > 0) {
    console.log('Found user:', users[0].name, users[0].email)
    durgaUserId = users[0].id
  } else if (profiles.length > 0) {
    console.log('Found profile:', profiles[0].firstName, profiles[0].lastName, '| User:', profiles[0].user?.email)
    durgaUserId = profiles[0].userId
  } else {
    console.log('No user/profile named Durga found. Searching all interests sent today...')
  }

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Find interests (matches) sent today
  const query = durgaUserId
    ? { senderId: durgaUserId, createdAt: { gte: today, lt: tomorrow } }
    : { createdAt: { gte: today, lt: tomorrow } }

  const interests = await prisma.match.findMany({
    where: query,
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\nInterests sent today: ${interests.length}`)
  interests.forEach(i => {
    console.log(`  ${i.createdAt.toISOString()} | From: ${i.sender.name} (${i.sender.email}) → To: ${i.receiver.name} (${i.receiver.email}) | Status: ${i.status}`)
  })

  // Check Resend for "interested" emails sent today
  const { data: emailData, error: emailError } = await resend.emails.list()
  if (emailError) {
    console.error('Resend error:', emailError)
  } else {
    const allEmails = emailData?.data || []
    const interestEmails = allEmails.filter(e => {
      const subject = (e.subject || '').toLowerCase()
      return subject.includes('interested')
    })
    console.log(`\nResend "interested" emails (recent):`, interestEmails.length)
    interestEmails.forEach(e => {
      console.log(`  ${e.created_at} | To: ${Array.isArray(e.to) ? e.to.join(', ') : e.to} | Subject: ${e.subject} | Status: ${e.last_event}`)
    })

    // Cross-reference: for each interest sent today, was an email sent to the receiver?
    console.log('\n--- Cross-reference: Interest → Email ---')
    for (const interest of interests) {
      const receiverEmail = interest.receiver.email
      const matchingEmail = allEmails.find(e => {
        const to = Array.isArray(e.to) ? e.to : [e.to]
        return to.some(t => t === receiverEmail) && (e.subject || '').toLowerCase().includes('interested')
      })
      if (matchingEmail) {
        console.log(`  ✓ ${interest.receiver.name} (${receiverEmail}) - Email sent: ${matchingEmail.last_event}`)
      } else {
        console.log(`  ✗ ${interest.receiver.name} (${receiverEmail}) - NO email found in Resend`)
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
