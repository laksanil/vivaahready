/**
 * Investigate why Aditi S. is showing as a match for Shashank
 * Check all matching criteria and dealbreakers
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function parseHeight(height) {
  if (!height) return null;
  // Handle formats like "5'2\"", "5'2", "5.2", etc.
  const match = height.match(/(\d+)['\.](\d+)/);
  if (match) {
    return parseInt(match[1]) * 12 + parseInt(match[2]); // Convert to inches
  }
  return null;
}

function heightInRange(candidateHeight, minHeight, maxHeight) {
  const candInches = parseHeight(candidateHeight);
  const minInches = parseHeight(minHeight);
  const maxInches = parseHeight(maxHeight);

  if (!candInches) return true; // Can't check if no height
  if (minInches && candInches < minInches) return false;
  if (maxInches && candInches > maxInches) return false;
  return true;
}

async function main() {
  // Find Shashank's profile
  const shashank = await prisma.user.findFirst({
    where: { name: { contains: 'Shashank' } },
    include: { profile: true }
  });

  if (!shashank || !shashank.profile) {
    console.log('Shashank not found');
    return;
  }

  console.log('='.repeat(80));
  console.log('SHASHANK\'S PROFILE');
  console.log('='.repeat(80));
  console.log('Name:', shashank.name);
  console.log('Gender:', shashank.profile.gender);
  console.log('Age DOB:', shashank.profile.dateOfBirth, '-> Age:', calculateAge(shashank.profile.dateOfBirth));
  console.log('Height:', shashank.profile.height);
  console.log('Location:', shashank.profile.currentLocation);
  console.log('Religion:', shashank.profile.religion);
  console.log('Community:', shashank.profile.community);
  console.log('SubCommunity:', shashank.profile.subCommunity);
  console.log('Gotra:', shashank.profile.gotra);
  console.log('Diet:', shashank.profile.dietaryPreference);
  console.log('Qualification:', shashank.profile.qualification);
  console.log('Income:', shashank.profile.annualIncome);
  console.log('MaritalStatus:', shashank.profile.maritalStatus);

  console.log('\n' + '='.repeat(80));
  console.log('SHASHANK\'S PREFERENCES (Dealbreakers marked with *)');
  console.log('='.repeat(80));

  const prefs = {
    'Age': { min: shashank.profile.prefAgeMin, max: shashank.profile.prefAgeMax, isDealbreaker: shashank.profile.prefAgeIsDealbreaker },
    'Height': { min: shashank.profile.prefHeightMin, max: shashank.profile.prefHeightMax, isDealbreaker: shashank.profile.prefHeightIsDealbreaker },
    'Location': { value: shashank.profile.prefLocation || shashank.profile.prefLocationList, isDealbreaker: shashank.profile.prefLocationIsDealbreaker },
    'Community': { value: shashank.profile.prefCommunity, isDealbreaker: shashank.profile.prefCommunityIsDealbreaker },
    'SubCommunity': { value: shashank.profile.prefSubCommunity, isDealbreaker: shashank.profile.prefSubCommunityIsDealbreaker },
    'Gotra': { value: shashank.profile.prefGotra, isDealbreaker: shashank.profile.prefGotraIsDealbreaker },
    'Diet': { value: shashank.profile.prefDiet, isDealbreaker: shashank.profile.prefDietIsDealbreaker },
    'Education': { value: shashank.profile.prefQualification, isDealbreaker: shashank.profile.prefEducationIsDealbreaker },
    'Income': { value: shashank.profile.prefIncome, isDealbreaker: shashank.profile.prefIncomeIsDealbreaker },
    'MaritalStatus': { value: shashank.profile.prefMaritalStatus, isDealbreaker: shashank.profile.prefMaritalStatusIsDealbreaker },
    'Religion': { value: shashank.profile.prefReligion, isDealbreaker: shashank.profile.prefReligionIsDealbreaker },
  };

  for (const [name, pref] of Object.entries(prefs)) {
    const marker = pref.isDealbreaker ? '*' : '';
    if (pref.min || pref.max) {
      console.log(`${name}${marker}: ${pref.min || 'any'} - ${pref.max || 'any'}`);
    } else if (pref.value) {
      console.log(`${name}${marker}: ${pref.value}`);
    } else {
      console.log(`${name}${marker}: (not set)`);
    }
  }

  // Now find all female profiles that could match
  console.log('\n' + '='.repeat(80));
  console.log('ANALYZING ALL FEMALE PROFILES FOR SHASHANK');
  console.log('='.repeat(80));

  const femaleProfiles = await prisma.profile.findMany({
    where: {
      gender: 'female',
      approvalStatus: 'approved',
      isActive: true,
      isSuspended: false,
    },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  console.log(`\nFound ${femaleProfiles.length} approved female profiles\n`);

  for (const candidate of femaleProfiles) {
    console.log('-'.repeat(80));
    console.log(`CANDIDATE: ${candidate.user.name}`);
    console.log('-'.repeat(80));

    const candidateAge = calculateAge(candidate.dateOfBirth);

    console.log('Profile:');
    console.log(`  Age: ${candidateAge} (DOB: ${candidate.dateOfBirth})`);
    console.log(`  Height: ${candidate.height}`);
    console.log(`  Location: ${candidate.currentLocation}`);
    console.log(`  Religion: ${candidate.religion}`);
    console.log(`  Community: ${candidate.community}`);
    console.log(`  SubCommunity: ${candidate.subCommunity}`);
    console.log(`  Gotra: ${candidate.gotra}`);
    console.log(`  Diet: ${candidate.dietaryPreference}`);
    console.log(`  Qualification: ${candidate.qualification}`);
    console.log(`  Income: ${candidate.annualIncome}`);
    console.log(`  MaritalStatus: ${candidate.maritalStatus}`);

    console.log('\nMatching Analysis:');
    let passesAllDealbreakers = true;
    let failedDealbreakers = [];

    // Check Age
    const prefAgeMin = parseInt(shashank.profile.prefAgeMin) || 0;
    const prefAgeMax = parseInt(shashank.profile.prefAgeMax) || 100;
    const ageMatch = candidateAge >= prefAgeMin && candidateAge <= prefAgeMax;
    const ageStatus = ageMatch ? '✓ PASS' : '✗ FAIL';
    console.log(`  Age: ${candidateAge} in range [${prefAgeMin}-${prefAgeMax}]? ${ageStatus}`);
    if (!ageMatch && shashank.profile.prefAgeIsDealbreaker) {
      passesAllDealbreakers = false;
      failedDealbreakers.push('Age');
    }

    // Check Height
    const heightMatch = heightInRange(candidate.height, shashank.profile.prefHeightMin, shashank.profile.prefHeightMax);
    const heightStatus = heightMatch ? '✓ PASS' : '✗ FAIL';
    console.log(`  Height: ${candidate.height} in range [${shashank.profile.prefHeightMin || 'any'}-${shashank.profile.prefHeightMax || 'any'}]? ${heightStatus}`);
    if (!heightMatch && shashank.profile.prefHeightIsDealbreaker) {
      passesAllDealbreakers = false;
      failedDealbreakers.push('Height');
    }

    // Check Community
    let communityMatch = true;
    if (shashank.profile.prefCommunity && shashank.profile.prefCommunity !== 'doesnt_matter') {
      try {
        const prefCommunities = JSON.parse(shashank.profile.prefCommunity);
        if (Array.isArray(prefCommunities) && prefCommunities.length > 0) {
          communityMatch = prefCommunities.some(pc =>
            pc.toLowerCase() === (candidate.community || '').toLowerCase()
          );
        }
      } catch {
        communityMatch = shashank.profile.prefCommunity.toLowerCase() === (candidate.community || '').toLowerCase();
      }
    }
    const communityStatus = communityMatch ? '✓ PASS' : '✗ FAIL';
    console.log(`  Community: ${candidate.community} matches pref [${shashank.profile.prefCommunity}]? ${communityStatus}`);
    if (!communityMatch && shashank.profile.prefCommunityIsDealbreaker) {
      passesAllDealbreakers = false;
      failedDealbreakers.push('Community');
    }

    // Check Gotra (should be DIFFERENT)
    let gotraMatch = true;
    if (shashank.profile.prefGotra === 'Different Gothra' || shashank.profile.prefGotra === 'different') {
      // Gotra must be different
      gotraMatch = !candidate.gotra || !shashank.profile.gotra ||
                   candidate.gotra.toLowerCase() !== shashank.profile.gotra.toLowerCase();
    }
    const gotraStatus = gotraMatch ? '✓ PASS' : '✗ FAIL';
    console.log(`  Gotra: Shashank=${shashank.profile.gotra}, Candidate=${candidate.gotra}, Pref=${shashank.profile.prefGotra}? ${gotraStatus}`);
    if (!gotraMatch && shashank.profile.prefGotraIsDealbreaker) {
      passesAllDealbreakers = false;
      failedDealbreakers.push('Gotra');
    }

    // Check Diet
    let dietMatch = true;
    if (shashank.profile.prefDiet && shashank.profile.prefDiet !== 'doesnt_matter') {
      dietMatch = (candidate.dietaryPreference || '').toLowerCase().includes(shashank.profile.prefDiet.toLowerCase()) ||
                  shashank.profile.prefDiet.toLowerCase().includes((candidate.dietaryPreference || '').toLowerCase());
    }
    const dietStatus = dietMatch ? '✓ PASS' : '✗ FAIL';
    console.log(`  Diet: ${candidate.dietaryPreference} matches pref [${shashank.profile.prefDiet}]? ${dietStatus}`);
    if (!dietMatch && shashank.profile.prefDietIsDealbreaker) {
      passesAllDealbreakers = false;
      failedDealbreakers.push('Diet');
    }

    // Check Education
    let educationMatch = true;
    if (shashank.profile.prefQualification && shashank.profile.prefQualification !== 'doesnt_matter') {
      const prefEdu = shashank.profile.prefQualification.toLowerCase();
      const candEdu = (candidate.qualification || '').toLowerCase();

      // Check if candidate meets minimum education level
      const eduLevels = ['high_school', 'associates', 'bachelors', 'masters', 'phd', 'md'];
      const prefIndex = eduLevels.findIndex(e => prefEdu.includes(e));
      const candIndex = eduLevels.findIndex(e => candEdu.includes(e));

      if (prefIndex >= 0 && candIndex >= 0) {
        educationMatch = candIndex >= prefIndex;
      } else {
        educationMatch = candEdu.includes(prefEdu) || prefEdu.includes(candEdu);
      }
    }
    const eduStatus = educationMatch ? '✓ PASS' : '✗ FAIL';
    console.log(`  Education: ${candidate.qualification} matches pref [${shashank.profile.prefQualification}]? ${eduStatus}`);
    if (!educationMatch && shashank.profile.prefEducationIsDealbreaker) {
      passesAllDealbreakers = false;
      failedDealbreakers.push('Education');
    }

    // Final verdict
    console.log('\n  VERDICT:');
    if (passesAllDealbreakers) {
      console.log('  ✅ SHOULD BE A MATCH - Passes all dealbreakers');
    } else {
      console.log(`  ❌ SHOULD NOT BE A MATCH - Failed dealbreakers: ${failedDealbreakers.join(', ')}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
