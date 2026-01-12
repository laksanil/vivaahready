import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check all users
  const users = await prisma.user.findMany({
    include: { profile: true },
  })

  console.log('--- All Users ---')
  users.forEach(u => {
    console.log(`${u.name} (${u.email}): profile=${u.profile ? `gender=${u.profile.gender}, approved=${u.profile.approvalStatus}` : 'NO PROFILE'}`)
  })

  console.log('\n--- All Profiles ---')
  const profiles = await prisma.profile.findMany({
    include: { user: { select: { name: true, email: true } } }
  })
  profiles.forEach(p => {
    console.log(`${p.user.name}: gender=${p.gender}, approved=${p.approvalStatus}`)
  })

  console.log('\n--- All Matches ---')
  const matches = await prisma.match.findMany({
    include: {
      sender: { select: { name: true } },
      receiver: { select: { name: true } }
    }
  })
  matches.forEach(m => {
    console.log(`${m.sender.name} -> ${m.receiver.name}: ${m.status}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
