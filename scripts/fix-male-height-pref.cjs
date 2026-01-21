const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMaleHeightPref() {
  // Get all male profiles where prefHeightMax is null
  const males = await prisma.profile.findMany({
    where: {
      gender: 'male',
      prefHeightMax: null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      height: true,
      prefHeightMin: true,
      prefHeightMax: true
    }
  });

  console.log('Males with null prefHeightMax:', males.length);
  console.log('');

  for (const m of males) {
    if (m.height) {
      await prisma.profile.update({
        where: { id: m.id },
        data: { prefHeightMax: m.height }
      });
      console.log('Updated ' + m.firstName + ' ' + m.lastName + ': prefHeightMax = ' + m.height + ' (own height)');
    }
  }

  console.log('\nDone!');

  // Show updated values
  console.log('\nUpdated male height preferences:');
  const updatedMales = await prisma.profile.findMany({
    where: { gender: 'male' },
    orderBy: { firstName: 'asc' },
    select: {
      firstName: true,
      lastName: true,
      height: true,
      prefHeightMin: true,
      prefHeightMax: true
    }
  });

  console.log('Name | Height | Pref Height Min | Pref Height Max');
  console.log('---|---|---|---');
  updatedMales.forEach(m => {
    console.log(m.firstName + ' ' + m.lastName + ' | ' + m.height + ' | ' + (m.prefHeightMin || 'any') + ' | ' + (m.prefHeightMax || 'any'));
  });

  await prisma.$disconnect();
}

fixMaleHeightPref();
