const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detailedMatchCheck() {
  const shwetha = await prisma.profile.findFirst({
    where: { user: { name: { contains: 'shwetha', mode: 'insensitive' } } }
  });
  
  const males = await prisma.profile.findMany({
    where: { 
      user: { name: { in: ['Jaidev M.', 'Rohith R.', 'Srinivas A.', 'Harish R.'] } }
    },
    include: { user: true }
  });
  
  console.log('=== Detailed Match Analysis ===\n');
  console.log('SHWETHA: marital=' + shwetha.maritalStatus + ', children=' + shwetha.hasChildren + ', diet=' + shwetha.dietaryPreference + ', caste=' + shwetha.caste + '\n');
  
  for (const male of males) {
    console.log('--- ' + male.user.name + ' ---');
    
    // Location
    const prefLoc = (male.prefLocation || '').toLowerCase();
    const locMatch = !male.prefLocation || prefLoc === 'doesnt_matter' || prefLoc.includes('doesnt');
    console.log('  Location: pref="' + male.prefLocation + '" => ' + (locMatch ? 'PASS' : 'FAIL'));
    
    // Diet  
    const prefDiet = (male.prefDiet || '').toLowerCase();
    // Vegetarian pref should NOT match non-veg person
    const dietMatch = !male.prefDiet || prefDiet.includes('non') || prefDiet === 'doesnt_matter' || prefDiet.includes('doesnt');
    console.log('  Diet: pref="' + male.prefDiet + '" => ' + (dietMatch ? 'PASS' : 'FAIL'));
    
    // Caste
    const prefCaste = (male.prefCaste || '').toLowerCase();
    const casteMatch = !male.prefCaste || prefCaste.includes("doesn't") || prefCaste === 'any' || prefCaste.includes('doesnt');
    console.log('  Caste: pref="' + male.prefCaste + '" => ' + (casteMatch ? 'PASS' : 'FAIL'));
    
    // Marital
    const maritalMatch = !male.prefMaritalStatus;
    console.log('  Marital: pref="' + male.prefMaritalStatus + '" (DB=' + male.prefMaritalStatusIsDealbreaker + ') => ' + (maritalMatch ? 'PASS (no pref)' : 'CHECK'));
    
    // Children
    const childMatch = !male.prefHasChildren;
    console.log('  Children: pref="' + male.prefHasChildren + '" => ' + (childMatch ? 'PASS (no pref)' : 'CHECK'));
    
    console.log('');
  }
  
  await prisma.$disconnect();
}
detailedMatchCheck();
