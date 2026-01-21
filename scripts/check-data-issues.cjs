const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDataIssues() {
  const profiles = await prisma.profile.findMany({
    include: { user: { select: { email: true } } }
  });

  console.log('=== DATA QUALITY CHECK FOR MATCHING ===\n');

  let issues = [];

  for (const p of profiles) {
    let profileIssues = [];

    // 1. Check required fields for matching
    if (!p.age) profileIssues.push('Missing age');
    if (!p.height) profileIssues.push('Missing height');
    if (!p.gender) profileIssues.push('Missing gender');
    if (!p.dietaryPreference) profileIssues.push('Missing diet');

    // 2. Check age preferences
    if (!p.prefAgeMin) profileIssues.push('Missing prefAgeMin');
    if (!p.prefAgeMax) profileIssues.push('Missing prefAgeMax');
    if (p.prefAgeMin && p.prefAgeMax) {
      const minAge = parseInt(p.prefAgeMin);
      const maxAge = parseInt(p.prefAgeMax);
      if (minAge > maxAge) profileIssues.push('prefAgeMin > prefAgeMax (' + minAge + ' > ' + maxAge + ')');
      if (p.age) {
        const ownAge = parseInt(p.age);
        if (p.gender === 'female' && minAge < ownAge) {
          // Females want same age or older - min should be >= own age
          // Actually this might be intentional, skip this check
        }
        if (p.gender === 'male' && maxAge > ownAge) {
          // Males want same age or younger - max should be <= own age
          // Actually this might be intentional, skip this check
        }
      }
    }

    // 3. Check height format (should be like 5'4")
    if (p.height && !p.height.match(/^\d+'\d+"?$/)) {
      profileIssues.push('Invalid height format: ' + p.height);
    }
    if (p.prefHeightMin && !p.prefHeightMin.match(/^\d+'\d+"?$/)) {
      profileIssues.push('Invalid prefHeightMin format: ' + p.prefHeightMin);
    }
    if (p.prefHeightMax && !p.prefHeightMax.match(/^\d+'\d+"?$/)) {
      profileIssues.push('Invalid prefHeightMax format: ' + p.prefHeightMax);
    }

    // 4. Check height preferences logic
    if (p.prefHeightMin && p.prefHeightMax) {
      const minFeet = parseInt(p.prefHeightMin.split("'")[0]);
      const minInches = parseInt(p.prefHeightMin.split("'")[1]) || 0;
      const maxFeet = parseInt(p.prefHeightMax.split("'")[0]);
      const maxInches = parseInt(p.prefHeightMax.split("'")[1]) || 0;
      const minTotal = minFeet * 12 + minInches;
      const maxTotal = maxFeet * 12 + maxInches;
      if (minTotal > maxTotal) {
        profileIssues.push('prefHeightMin > prefHeightMax (' + p.prefHeightMin + ' > ' + p.prefHeightMax + ')');
      }
    }

    // 5. Check for males without prefHeightMax (should have been fixed)
    if (p.gender === 'male' && !p.prefHeightMax) {
      profileIssues.push('Male missing prefHeightMax');
    }

    // 6. Check diet values are normalized
    const validDiets = ['vegetarian', 'Vegetarian', 'non_vegetarian', 'Non Vegetarian', 'eggetarian', 'Eggetarian', 'vegan', 'No Preference'];
    if (p.dietaryPreference && !validDiets.some(d => d.toLowerCase() === p.dietaryPreference.toLowerCase())) {
      profileIssues.push('Non-standard diet value: ' + p.dietaryPreference);
    }

    // 7. Check gotra preferences (should have "Not" prefix for deal-breaker)
    if (p.gotra && p.prefGotraIsDealbreaker && p.prefGotra && !p.prefGotra.includes('Not ')) {
      profileIssues.push('Gotra dealbreaker but prefGotra does not exclude own gotra');
    }

    // 8. Check citizenship values
    if (p.citizenship && !['USA', 'India'].includes(p.citizenship)) {
      profileIssues.push('Non-standard citizenship: ' + p.citizenship);
    }

    // 9. Check for duplicate profiles (same name)
    // Will check separately

    // 10. Check deal-breaker flags make sense
    if (p.prefHeightIsDealbreaker && !p.prefHeightMin && !p.prefHeightMax) {
      profileIssues.push('Height is dealbreaker but no height preference set');
    }
    if (p.prefAgeIsDealbreaker && !p.prefAgeMin && !p.prefAgeMax) {
      profileIssues.push('Age is dealbreaker but no age preference set');
    }

    if (profileIssues.length > 0) {
      issues.push({
        name: p.firstName + ' ' + p.lastName,
        email: p.user.email,
        gender: p.gender,
        issues: profileIssues
      });
    }
  }

  // Check for duplicates
  const nameCount = {};
  for (const p of profiles) {
    const name = p.firstName + ' ' + p.lastName;
    nameCount[name] = (nameCount[name] || 0) + 1;
  }
  const duplicates = Object.entries(nameCount).filter(([name, count]) => count > 1);

  console.log('--- INDIVIDUAL PROFILE ISSUES ---\n');
  if (issues.length === 0) {
    console.log('No issues found!\n');
  } else {
    issues.forEach(i => {
      console.log(i.name + ' (' + i.email + ') [' + i.gender + ']:');
      i.issues.forEach(issue => console.log('  - ' + issue));
      console.log('');
    });
  }

  console.log('--- DUPLICATE NAMES ---\n');
  if (duplicates.length === 0) {
    console.log('No duplicates found!\n');
  } else {
    duplicates.forEach(([name, count]) => {
      console.log(name + ': ' + count + ' profiles');
      const dups = profiles.filter(p => (p.firstName + ' ' + p.lastName) === name);
      dups.forEach(d => console.log('  - ' + d.user.email + ' (Age: ' + d.age + ', Location: ' + d.currentLocation + ')'));
    });
    console.log('');
  }

  // Summary stats
  console.log('--- SUMMARY ---\n');
  console.log('Total profiles:', profiles.length);
  console.log('Profiles with issues:', issues.length);
  console.log('Duplicate names:', duplicates.length);

  // Check matching potential
  const females = profiles.filter(p => p.gender === 'female');
  const males = profiles.filter(p => p.gender === 'male');
  console.log('\nFemales:', females.length);
  console.log('Males:', males.length);

  // Check if any profiles have impossible preferences (no matches possible)
  console.log('\n--- IMPOSSIBLE PREFERENCE CHECK ---\n');

  for (const f of females) {
    // Check if any male can match this female's age preference
    const minAge = parseInt(f.prefAgeMin) || 0;
    const maxAge = parseInt(f.prefAgeMax) || 100;
    const matchingMales = males.filter(m => {
      const mAge = parseInt(m.age);
      return mAge >= minAge && mAge <= maxAge;
    });
    if (matchingMales.length === 0) {
      console.log(f.firstName + ' ' + f.lastName + ': No males in age range ' + minAge + '-' + maxAge);
    }
  }

  for (const m of males) {
    // Check if any female can match this male's age preference
    const minAge = parseInt(m.prefAgeMin) || 0;
    const maxAge = parseInt(m.prefAgeMax) || 100;
    const matchingFemales = females.filter(f => {
      const fAge = parseInt(f.age);
      return fAge >= minAge && fAge <= maxAge;
    });
    if (matchingFemales.length === 0) {
      console.log(m.firstName + ' ' + m.lastName + ': No females in age range ' + minAge + '-' + maxAge);
    }
  }

  await prisma.$disconnect();
}

checkDataIssues();
