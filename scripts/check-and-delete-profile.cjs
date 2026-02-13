const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = 'lak.watersort@gmail.com'
  
  console.log(`Checking profile for: ${email}`)
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  })
  
  if (!user) {
    console.log(`❌ User not found: ${email}`)
    return
  }
  
  console.log(`✓ Found user: ${user.id}`)
  
  if (user.profile) {
    console.log(`✓ Found profile: ${user.profile.id}`)
    console.log(`  Details:`)
    console.log(`    - signupStep: ${user.profile.signupStep}`)
    console.log(`    - approvalStatus: ${user.profile.approvalStatus}`)
    console.log(`    - createdAt: ${user.profile.createdAt}`)
    
    // Delete profile
    await prisma.profile.delete({
      where: { id: user.profile.id }
    })
    console.log(`✓ Profile deleted successfully`)
  } else {
    console.log(`❌ No profile found for user ${email}`)
  }
}

main()
  .catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
