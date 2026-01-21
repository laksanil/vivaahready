const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCitizenship() {
  const updates = [
    { email: 'bshesh@gmail.com', citizenship: 'USA' },
    { email: 'sureshbabulp@gmail.com', citizenship: 'USA' },
    { email: 'vamsiraman13@gmail.com', citizenship: 'USA' }
  ];

  for (const u of updates) {
    const user = await prisma.user.findUnique({ where: { email: u.email } });
    if (user) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: { citizenship: u.citizenship }
      });
      console.log('Updated ' + u.email + ' -> ' + u.citizenship);
    }
  }

  console.log('Done!');
  await prisma.$disconnect();
}
updateCitizenship();
