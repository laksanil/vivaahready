const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDealbreakers() {
  const males = await prisma.profile.findMany({
    where: { 
      user: { name: { in: ['Jaidev M.', 'Rohith R.', 'Srinivas A.', 'Harish R.'] } }
    },
    include: { user: true }
  });
  
  console.log('=== Dealbreaker Flags ===\n');
  
  for (const male of males) {
    console.log('--- ' + male.user.name + ' ---');
    console.log('  prefDietIsDealbreaker:', male.prefDietIsDealbreaker);
    console.log('  prefCasteIsDealbreaker:', male.prefCasteIsDealbreaker);
    console.log('  prefLocationIsDealbreaker:', male.prefLocationIsDealbreaker);
    console.log('  prefMaritalStatusIsDealbreaker:', male.prefMaritalStatusIsDealbreaker);
    console.log('');
  }
  
  await prisma.$disconnect();
}
checkDealbreakers();
