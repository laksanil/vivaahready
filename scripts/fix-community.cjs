const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sub-communities that should have "Brahmin" as the main community
const brahminSubCommunities = [
  'iyengar',
  'madhwa',
  'havyaka',
  'vadama',
  'shivalli',
  'smartha',
  'aruvela niyogi',
  'iyer',
  'vaidiki',
  'dravida',
  'vaishnav'
];

async function fixCommunity() {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      community: true,
      subCommunity: true
    }
  });

  console.log('Checking', profiles.length, 'profiles for community/subCommunity fixes...\n');

  let updated = 0;
  for (const p of profiles) {
    if (!p.community) continue;

    const communityLower = p.community.toLowerCase();

    // Check if community contains any Brahmin sub-community
    const matchedSubCommunity = brahminSubCommunities.find(sub => communityLower.includes(sub));

    if (matchedSubCommunity && !communityLower.startsWith('brahmin')) {
      // This is a Brahmin sub-community stored as community
      // Move it to subCommunity and set community to Brahmin
      const newSubCommunity = p.community; // Keep original as subCommunity
      const newCommunity = 'Brahmin';

      await prisma.profile.update({
        where: { id: p.id },
        data: {
          community: newCommunity,
          subCommunity: newSubCommunity
        }
      });

      console.log(p.firstName + ' ' + p.lastName + ':');
      console.log('  community: "' + p.community + '" -> "' + newCommunity + '"');
      console.log('  subCommunity: "' + (p.subCommunity || '') + '" -> "' + newSubCommunity + '"');
      console.log('');
      updated++;
    }
  }

  console.log('Updated', updated, 'profiles\n');

  // Show current community values
  console.log('--- Current Community Values ---\n');
  const updatedProfiles = await prisma.profile.findMany({
    orderBy: { community: 'asc' },
    select: {
      firstName: true,
      lastName: true,
      community: true,
      subCommunity: true
    }
  });

  console.log('Name | Community | Sub-Community');
  console.log('---|---|---');
  updatedProfiles.forEach(p => {
    console.log(p.firstName + ' ' + p.lastName + ' | ' + (p.community || '-') + ' | ' + (p.subCommunity || '-'));
  });

  await prisma.$disconnect();
}

fixCommunity();
