/**
 * Check all profiles' education qualifications
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    select: {
      qualification: true,
      university: true,
      user: { select: { name: true } }
    },
    orderBy: { user: { name: 'asc' } }
  });

  console.log('All profiles qualification status:');
  console.log('='.repeat(100));

  const summary = {};
  for (const p of profiles) {
    const q = p.qualification || 'NULL/EMPTY';
    summary[q] = (summary[q] || 0) + 1;

    if (!p.qualification || p.qualification === '') {
      console.log('MISSING: ' + p.user.name + ' | University: ' + (p.university || 'none'));
    }
  }

  console.log('\nSummary:');
  for (const [qual, count] of Object.entries(summary).sort()) {
    console.log('  ' + qual + ': ' + count);
  }

  console.log('\nTotal profiles:', profiles.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
