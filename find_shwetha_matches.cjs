const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMatches() {
  const shwetha = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'shwetha', mode: 'insensitive' } } }
  });
  
  const males = await prisma.profile.findMany({
    where: { gender: 'male', isActive: true },
    include: { user: true }
  });
  
  console.log('Shwetha profile:');
  console.log('  qualification:', shwetha.qualification);
  console.log('  community:', shwetha.community);
  console.log('  diet:', shwetha.dietaryPreference);
  console.log('  location:', shwetha.currentLocation);
  console.log('  maritalStatus:', shwetha.maritalStatus);
  console.log('');
  console.log('Shwetha wants:');
  console.log('  prefQualification:', shwetha.prefQualification);
  console.log('');
  
  console.log('=== Checking all males ===\n');
  
  let potentialMatches = 0;
  
  for (const male of males) {
    let passes = true;
    let reasons = [];
    
    // Check if male meets Shwetha's prefs
    const isMedical = ['md', 'mbbs', 'bds', 'dm_mch'].includes((male.qualification || '').toLowerCase());
    if (shwetha.prefQualification === 'medical' && !isMedical) {
      passes = false;
      reasons.push('Not medical qualification');
    }
    
    // Check if Shwetha meets male's prefs (reverse matching)
    
    // Diet check
    const malePrefDiet = (male.prefDiet || '').toLowerCase();
    const shwethaDiet = (shwetha.dietaryPreference || '').toLowerCase();
    if (malePrefDiet.includes('vegetarian') && !malePrefDiet.includes('non')) {
      if (shwethaDiet.includes('non')) {
        passes = false;
        reasons.push('He wants vegetarian, she is non-veg');
      }
    }
    
    // Community check
    const malePrefCommunity = (male.prefCommunity || '').toLowerCase();
    if (malePrefCommunity && malePrefCommunity !== 'doesnt_matter' && !malePrefCommunity.includes("doesn't")) {
      const shwethaCommunity = (shwetha.community || '').toLowerCase();
      if (!shwethaCommunity.includes(malePrefCommunity) && !malePrefCommunity.includes(shwethaCommunity)) {
        passes = false;
        reasons.push('Community mismatch: he wants ' + male.prefCommunity + ', she is ' + shwetha.community);
      }
    }
    
    // Location check
    const malePrefLoc = (male.prefLocation || '').toLowerCase();
    if (malePrefLoc && malePrefLoc !== 'doesnt_matter' && !malePrefLoc.includes("doesn't") && malePrefLoc !== 'usa') {
      // Simple check - if he specifies a state and she's not there
      if (!malePrefLoc.includes('within') && !malePrefLoc.includes('same')) {
        passes = false;
        reasons.push('Location: he wants ' + male.prefLocation);
      }
    }
    
    if (passes) {
      console.log('✓ POTENTIAL MATCH: ' + male.user.name);
      console.log('  His qualification:', male.qualification);
      console.log('  His prefDiet:', male.prefDiet);
      console.log('  His prefCommunity:', male.prefCommunity);
      console.log('  His prefLocation:', male.prefLocation);
      potentialMatches++;
    } else if (isMedical) {
      // Only show medical males that failed
      console.log('✗ ' + male.user.name + ' (MEDICAL but fails reverse match)');
      reasons.forEach(r => console.log('    - ' + r));
    }
  }
  
  console.log('\n=== Summary ===');
  console.log('Potential matches for Shwetha:', potentialMatches);
  
  await prisma.$disconnect();
}
findMatches();
