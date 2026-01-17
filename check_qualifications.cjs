const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  // Find Novely Joshi
  const novely = await prisma.user.findFirst({
    where: { name: { contains: 'Novely', mode: 'insensitive' } },
    include: { profile: true }
  })
  
  console.log('=== Novely Joshi ===')
  console.log('Name:', novely?.name)
  console.log('Qualification in DB:', novely?.profile?.qualification)
  console.log('')
  
  // Get all profiles with their qualifications
  const profiles = await prisma.profile.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('=== All Profile Qualifications ===')
  console.log('Total profiles:', profiles.length)
  console.log('')
  
  // Group by qualification value
  const qualGroups = {}
  for (const p of profiles) {
    const qual = p.qualification || '(empty)'
    if (!qualGroups[qual]) qualGroups[qual] = []
    qualGroups[qual].push(p.user?.name || 'Unknown')
  }
  
  console.log('Qualification values found:')
  for (const [qual, names] of Object.entries(qualGroups)) {
    console.log(`\n"${qual}" (${names.length} profiles):`)
    names.forEach(n => console.log(`  - ${n}`))
  }
  
  await prisma.$disconnect()
}

check().catch(console.error)
