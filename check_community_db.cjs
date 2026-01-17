const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const males = await prisma.profile.findMany({
    where: { 
      user: { name: { in: ['Srinivas A.', 'Harish R.'] } }
    },
    include: { user: true }
  });
  
  for (const male of males) {
    console.log('--- ' + male.user.name + ' ---');
    console.log('  prefCommunity:', male.prefCommunity);
    console.log('  prefCommunityIsDealbreaker:', male.prefCommunityIsDealbreaker);
  }
  
  await prisma.$disconnect();
}
check();
