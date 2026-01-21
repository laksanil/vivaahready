const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Profiles that need community set to "Brahmin" with subCommunity
const fixes = [
  { community: 'Brahmin (Dravida)', newCommunity: 'Brahmin', subCommunity: 'Dravida' },
  { community: 'Brahmin (Smartha)', newCommunity: 'Brahmin', subCommunity: 'Smartha' },
  { community: 'Brahmin Aruvela Niyogi', newCommunity: 'Brahmin', subCommunity: 'Aruvela Niyogi' },
  { community: 'Brahmin Vaidiki Velanadu', newCommunity: 'Brahmin', subCommunity: 'Vaidiki Velanadu' },
  { community: 'Brahmin Vaishnav Madhwa', newCommunity: 'Brahmin', subCommunity: 'Vaishnav Madhwa' },
  { community: 'Brahmin, Madhwa', newCommunity: 'Brahmin', subCommunity: 'Madhwa' },
  { community: 'Brahmins', newCommunity: 'Brahmin', subCommunity: null },
  { community: 'Kannada Madwa', newCommunity: 'Brahmin', subCommunity: 'Kannada Madhwa' },
  { community: 'Tamil Brahmin', newCommunity: 'Brahmin', subCommunity: 'Tamil Brahmin' },
  { community: 'Telugu Brahmin', newCommunity: 'Brahmin', subCommunity: 'Telugu Brahmin' },
];

async function fixCommunity() {
  console.log('Fixing remaining Brahmin sub-communities...\n');

  let updated = 0;
  for (const fix of fixes) {
    const result = await prisma.profile.updateMany({
      where: { community: fix.community },
      data: {
        community: fix.newCommunity,
        subCommunity: fix.subCommunity
      }
    });

    if (result.count > 0) {
      console.log('Updated ' + result.count + ' profile(s): "' + fix.community + '" -> community="' + fix.newCommunity + '", subCommunity="' + (fix.subCommunity || '') + '"');
      updated += result.count;
    }
  }

  console.log('\nTotal updated:', updated);

  // Show final community breakdown
  console.log('\n--- Final Community Breakdown ---\n');
  const profiles = await prisma.profile.findMany({
    orderBy: [{ community: 'asc' }, { subCommunity: 'asc' }],
    select: {
      firstName: true,
      lastName: true,
      community: true,
      subCommunity: true
    }
  });

  console.log('Name | Community | Sub-Community');
  console.log('---|---|---');
  profiles.forEach(p => {
    console.log(p.firstName + ' ' + p.lastName + ' | ' + (p.community || '-') + ' | ' + (p.subCommunity || '-'));
  });

  // Summary
  const communities = {};
  profiles.forEach(p => {
    const c = p.community || 'Not specified';
    communities[c] = (communities[c] || 0) + 1;
  });

  console.log('\n--- Community Summary ---');
  Object.entries(communities).sort((a, b) => b[1] - a[1]).forEach(([c, count]) => {
    console.log(c + ': ' + count);
  });

  await prisma.$disconnect();
}

fixCommunity();
