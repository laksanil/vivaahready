/**
 * Fix education qualifications for profiles
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updates = [
    // Profiles with null that should have values
    { name: 'Akhshaya B.', checkNull: true, newQual: 'undergrad', reason: 'BS = Bachelors' },
    { name: 'Diwa A.', checkNull: false, newQual: 'undergrad', reason: 'B.S. = Bachelors' },
    { name: 'Monishaa S.', checkNull: false, newQual: 'masters', reason: 'JD is professional doctorate' },
    { name: 'Mythili K.', checkNull: false, newQual: 'undergrad', reason: 'Says Undergraduate' },
    { name: 'Prathima P.', checkNull: false, newQual: 'undergrad', reason: 'BA = Bachelors' },

    // Wrong qualification
    { name: 'Krithika S.', checkNull: false, newQual: 'phd', reason: 'Post Doc requires PhD' },
    { name: 'Sruthi N.', checkNull: false, newQual: 'masters', reason: 'Says Masters' },
  ];

  console.log('Fixing education qualifications:');
  console.log('='.repeat(80));

  for (const update of updates) {
    const searchName = update.name.replace('.', '');
    const profiles = await prisma.profile.findMany({
      where: {
        user: { name: { contains: searchName } }
      },
      include: { user: { select: { name: true } } }
    });

    for (const profile of profiles) {
      // For Akhshaya B., only update the one with null qualification
      if (update.checkNull && profile.qualification !== null) {
        continue;
      }

      console.log('Updating: ' + profile.user.name);
      console.log('  Old qualification: ' + profile.qualification);
      console.log('  New qualification: ' + update.newQual);
      console.log('  Reason: ' + update.reason);

      await prisma.profile.update({
        where: { id: profile.id },
        data: { qualification: update.newQual }
      });

      console.log('  ✓ Done\n');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Verification - Current qualifications:');

  const allProfiles = await prisma.profile.findMany({
    select: { qualification: true, user: { select: { name: true } } },
    orderBy: { user: { name: 'asc' } }
  });

  const summary = {};
  for (const p of allProfiles) {
    const q = p.qualification || 'null';
    summary[q] = (summary[q] || 0) + 1;
  }
  for (const [qual, count] of Object.entries(summary).sort()) {
    console.log('  ' + qual + ': ' + count);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
