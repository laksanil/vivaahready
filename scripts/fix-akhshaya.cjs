/**
 * Fix Akhshaya B's qualification
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the Akhshaya B profile with null qualification
  const profile = await prisma.profile.findFirst({
    where: {
      qualification: null,
      user: { name: { contains: 'Akhshaya' } }
    },
    include: { user: { select: { name: true } } }
  });

  if (profile) {
    console.log('Found:', profile.user.name);
    console.log('Current qualification:', profile.qualification);

    await prisma.profile.update({
      where: { id: profile.id },
      data: { qualification: 'undergrad' }
    });

    console.log('Updated to: undergrad');
  } else {
    console.log('No profile found with null qualification');
  }

  // Verify all profiles now have qualifications
  const nullCount = await prisma.profile.count({
    where: { qualification: null }
  });

  console.log('\nProfiles with null qualification:', nullCount);

  // Show final summary
  const profiles = await prisma.profile.findMany({
    select: { qualification: true }
  });

  const summary = {};
  for (const p of profiles) {
    const q = p.qualification || 'null';
    summary[q] = (summary[q] || 0) + 1;
  }

  console.log('\nFinal qualification breakdown:');
  for (const [qual, count] of Object.entries(summary).sort()) {
    console.log('  ' + qual + ': ' + count);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
