import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const profiles = await prisma.profile.findMany({
    where: { prefCaste: { not: null } },
    select: {
      prefCaste: true,
      prefCommunity: true,
      prefSubCommunity: true,
      community: true,
      subCommunity: true,
      user: { select: { name: true } }
    },
    take: 20
  })

  console.log('Profiles with prefCaste:\n')
  profiles.forEach(p => {
    console.log(`${p.user.name}:`)
    console.log(`  prefCaste: ${p.prefCaste}`)
    console.log(`  prefCommunity: ${p.prefCommunity || 'null'}`)
    console.log(`  prefSubCommunity: ${p.prefSubCommunity || 'null'}`)
    console.log(`  Their community: ${p.community || 'null'}`)
    console.log(`  Their subCommunity: ${p.subCommunity || 'null'}`)
    console.log('')
  })

  const total = await prisma.profile.count({ where: { prefCaste: { not: null } } })
  const withPrefComm = await prisma.profile.count({ where: { prefCommunity: { not: null } } })
  console.log(`Total with prefCaste: ${total}`)
  console.log(`Total with prefCommunity: ${withPrefComm}`)
}

check().catch(console.error).finally(() => prisma.$disconnect())
