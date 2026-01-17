const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find Shwetha
  const shwetha = await prisma.user.findFirst({
    where: { name: { contains: 'shwetha', mode: 'insensitive' } },
    include: { profile: true }
  });
  
  if (!shwetha || !shwetha.profile) {
    console.log('Shwetha not found or no profile');
    return;
  }
  
  console.log('Shwetha user ID:', shwetha.id);
  console.log('Shwetha profile ID:', shwetha.profile.id);
  console.log('Shwetha gender:', shwetha.profile.gender);
  console.log('Shwetha approval status:', shwetha.profile.approvalStatus);
  console.log('Shwetha isActive:', shwetha.profile.isActive);
  console.log('Shwetha isSuspended:', shwetha.profile.isSuspended);
  console.log('');
  
  // Get candidates like the API does
  const candidates = await prisma.profile.findMany({
    where: {
      gender: shwetha.profile.gender === 'male' ? 'female' : 'male',
      isActive: true,
      userId: { not: shwetha.id },
    },
    include: {
      user: { select: { id: true, name: true } }
    }
  });
  
  console.log('Total candidates (opposite gender, isActive=true):', candidates.length);
  
  // Check approval status of candidates
  const approvedCandidates = candidates.filter(c => c.approvalStatus === 'approved');
  const pendingCandidates = candidates.filter(c => c.approvalStatus === 'pending');
  const suspendedCandidates = candidates.filter(c => c.isSuspended === true);
  
  console.log('Approved candidates:', approvedCandidates.length);
  console.log('Pending candidates:', pendingCandidates.length);
  console.log('Suspended candidates:', suspendedCandidates.length);
  
  console.log('\nApproved candidate names:');
  approvedCandidates.slice(0, 10).forEach(c => {
    console.log('  -', c.user.name, '| isActive:', c.isActive, '| isSuspended:', c.isSuspended);
  });
  
  // Check Shwetha's preferences
  console.log('\n--- Shwetha preferences ---');
  console.log('prefAgeMin:', shwetha.profile.prefAgeMin);
  console.log('prefAgeMax:', shwetha.profile.prefAgeMax);
  console.log('prefLocation:', shwetha.profile.prefLocation);
  console.log('prefCommunity:', shwetha.profile.prefCommunity);
  console.log('prefCaste:', shwetha.profile.prefCaste);
  console.log('prefDiet:', shwetha.profile.prefDiet);
  console.log('prefQualification:', shwetha.profile.prefQualification);
  console.log('prefHeight:', shwetha.profile.prefHeight);
  console.log('prefMaritalStatus:', shwetha.profile.prefMaritalStatus);
}

main().then(() => prisma.$disconnect()).catch(e => {
  console.error(e);
  prisma.$disconnect();
});
