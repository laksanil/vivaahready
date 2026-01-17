const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find Shwetha
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'shwetha', mode: 'insensitive' } },
        { name: { contains: 'swetha', mode: 'insensitive' } },
        { email: { contains: 'shwetha', mode: 'insensitive' } },
      ]
    },
    include: {
      profile: {
        select: {
          id: true,
          gender: true,
          approvalStatus: true,
          isVerified: true,
          isSuspended: true,
          prefAgeMin: true,
          prefAgeMax: true,
          prefLocation: true,
          prefCommunity: true,
          dateOfBirth: true,
          currentLocation: true,
          community: true,
        }
      }
    }
  });
  
  console.log('Found users:', JSON.stringify(users, null, 2));
  
  if (users.length > 0 && users[0].profile) {
    const shwethaProfile = users[0].profile;
    const shwethaGender = shwethaProfile.gender;
    const oppositeGender = shwethaGender === 'female' ? 'male' : 'female';
    
    console.log('\nShwetha gender:', shwethaGender);
    console.log('Looking for:', oppositeGender);
    
    // Count potential matches
    const potentialMatches = await prisma.profile.count({
      where: {
        gender: oppositeGender,
        approvalStatus: 'approved',
        isSuspended: false,
        userId: { not: users[0].id }
      }
    });
    
    console.log('\nTotal potential matches (opposite gender, approved, not suspended):', potentialMatches);
    
    // Get a few sample profiles
    const sampleMatches = await prisma.profile.findMany({
      where: {
        gender: oppositeGender,
        approvalStatus: 'approved',
        isSuspended: false,
        userId: { not: users[0].id }
      },
      take: 5,
      include: {
        user: { select: { name: true } }
      }
    });
    
    console.log('\nSample matches:');
    sampleMatches.forEach(m => console.log('  - ' + m.user.name + ' (' + m.id + ')'));
  }
}

main().then(() => prisma.$disconnect()).catch(e => {
  console.error(e);
  prisma.$disconnect();
});
