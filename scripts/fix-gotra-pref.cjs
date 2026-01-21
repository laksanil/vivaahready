const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGotraPref() {
  // Get profiles where gotra dealbreaker is true but prefGotra doesn't have "Not" prefix
  const profiles = await prisma.profile.findMany({
    where: {
      prefGotraIsDealbreaker: true,
      gotra: { not: null }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gotra: true,
      prefGotra: true,
      prefGotraIsDealbreaker: true
    }
  });

  console.log('Profiles with gotra dealbreaker:', profiles.length);
  console.log('');

  let fixed = 0;
  for (const p of profiles) {
    // Check if prefGotra doesn't have "Not" prefix
    if (p.gotra && (!p.prefGotra || !p.prefGotra.includes('Not '))) {
      const newPrefGotra = 'Not ' + p.gotra;
      await prisma.profile.update({
        where: { id: p.id },
        data: { prefGotra: newPrefGotra }
      });
      console.log('Fixed ' + p.firstName + ' ' + p.lastName + ': gotra=' + p.gotra + ' -> prefGotra="' + newPrefGotra + '"');
      fixed++;
    }
  }

  console.log('\nFixed ' + fixed + ' profiles');
  await prisma.$disconnect();
}

fixGotraPref();
