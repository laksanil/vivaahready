import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnose() {
  console.log('=== MATCH DIAGNOSIS ===\n')

  // 1. Count total profiles
  const totalProfiles = await prisma.profile.count()
  console.log(`Total Profiles: ${totalProfiles}`)

  // 2. Count by gender
  const maleProfiles = await prisma.profile.count({ where: { gender: 'male' } })
  const femaleProfiles = await prisma.profile.count({ where: { gender: 'female' } })
  console.log(`Male Profiles: ${maleProfiles}`)
  console.log(`Female Profiles: ${femaleProfiles}`)

  // 3. Count active profiles
  const activeProfiles = await prisma.profile.count({ where: { isActive: true } })
  console.log(`Active Profiles: ${activeProfiles}`)

  // 4. Count approved profiles
  const approvedProfiles = await prisma.profile.count({ where: { approvalStatus: 'approved' } })
  console.log(`Approved Profiles: ${approvedProfiles}`)

  // 5. List all profiles with key info
  console.log('\n=== PROFILE DETAILS ===\n')
  const profiles = await prisma.profile.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  })

  for (const p of profiles) {
    console.log(`--- ${p.user.name || 'No Name'} ---`)
    console.log(`  Gender: ${p.gender}`)
    console.log(`  Location: ${p.currentLocation || 'Not set'}`)
    console.log(`  Pref Location: ${p.prefLocation || 'Not set'}`)
    console.log(`  Qualification: ${p.qualification || 'Not set'}`)
    console.log(`  Pref Qualification: ${p.prefQualification || 'Not set'}`)
    console.log(`  Caste: ${p.caste || 'Not set'}`)
    console.log(`  Pref Caste: ${p.prefCaste || 'Not set'}`)
    console.log(`  Diet: ${p.dietaryPreference || 'Not set'}`)
    console.log(`  Pref Diet: ${p.prefDiet || 'Not set'}`)
    console.log(`  Active: ${p.isActive}`)
    console.log(`  Approval: ${p.approvalStatus}`)
    console.log('')
  }

  // 6. Check why matches might not work
  console.log('\n=== POTENTIAL ISSUES ===\n')

  if (maleProfiles === 0 || femaleProfiles === 0) {
    console.log('❌ ISSUE: Need profiles of BOTH genders for matches to work!')
    console.log(`   Currently have ${maleProfiles} male and ${femaleProfiles} female profiles`)
  }

  if (activeProfiles === 0) {
    console.log('❌ ISSUE: No active profiles! All profiles have isActive=false')
  }

  // Check for strict location preferences
  const strictLocationProfiles = await prisma.profile.findMany({
    where: {
      prefLocation: { not: null, notIn: ['doesnt_matter', 'usa', 'open_to_relocation', 'any'] }
    },
    select: { user: { select: { name: true } }, prefLocation: true, currentLocation: true }
  })

  if (strictLocationProfiles.length > 0) {
    console.log('\n⚠️  Profiles with specific location preferences:')
    for (const p of strictLocationProfiles) {
      console.log(`   ${p.user.name}: wants "${p.prefLocation}", is in "${p.currentLocation}"`)
    }
  }

  await prisma.$disconnect()
}

diagnose().catch(console.error)
