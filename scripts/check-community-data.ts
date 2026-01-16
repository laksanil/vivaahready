import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const profiles = await prisma.profile.findMany({
    where: { community: { not: null } },
    select: {
      caste: true,
      community: true,
      subCommunity: true,
      user: { select: { name: true } }
    },
    take: 15
  })

  console.log('Profiles with community field populated:\n')
  profiles.forEach(p => {
    console.log(`${p.user.name}:`)
    console.log(`  Caste: ${p.caste || 'null'}`)
    console.log(`  Community: ${p.community}`)
    console.log(`  SubCommunity: ${p.subCommunity || 'null'}`)
    console.log('')
  })

  const total = await prisma.profile.count({ where: { community: { not: null } } })
  const withSub = await prisma.profile.count({ where: { subCommunity: { not: null } } })
  console.log(`\nTotal with community: ${total}`)
  console.log(`Total with subCommunity: ${withSub}`)
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
