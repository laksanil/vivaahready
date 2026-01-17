const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCasteFields() {
  const males = await prisma.profile.findMany({
    where: { 
      user: { name: { in: ['Jaidev M.', 'Rohith R.', 'Srinivas A.', 'Harish R.'] } }
    },
    include: { user: true }
  });
  
  console.log('=== Caste vs Community Fields ===\n');
  
  for (const male of males) {
    console.log('--- ' + male.user.name + ' ---');
    console.log('  caste:', male.caste);
    console.log('  prefCaste:', male.prefCaste);
    console.log('  community:', male.community);
    console.log('  prefCommunity:', male.prefCommunity);
    console.log('');
  }
  
  const shwetha = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'shwetha', mode: 'insensitive' } } }
  });
  
  console.log('--- Shwetha ---');
  console.log('  caste:', shwetha.caste);
  console.log('  community:', shwetha.community);
  
  await prisma.$disconnect();
}
checkCasteFields();
