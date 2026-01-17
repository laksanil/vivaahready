#!/usr/bin/env node
/**
 * Match Checker Utility
 *
 * Usage:
 *   node scripts/check-matches.cjs <name>           - Check matches for a user
 *   node scripts/check-matches.cjs <name> --detail  - Show detailed breakdown
 *   node scripts/check-matches.cjs --all            - Summary of all users
 *
 * Examples:
 *   node scripts/check-matches.cjs shwetha
 *   node scripts/check-matches.cjs "Jaidev" --detail
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ MATCHING LOGIC (mirrors src/lib/matching.ts) ============

function isDealbreaker(value) {
  if (value === true || value === 'true') return true;
  return false;
}

function isPrefSet(pref) {
  if (!pref) return false;
  const lower = pref.toLowerCase().trim();
  return lower !== '' && lower !== "doesn't matter" && lower !== 'doesnt_matter' && lower !== 'any';
}

// Diet matching
function isDietMatch(seekerPref, candidateDiet) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference' };
  if (!candidateDiet) return { match: false, reason: 'Candidate diet unknown' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidateDiet.toLowerCase().replace(/[_\s-]/g, '');

  const isNonVeg = (d) => d.includes('nonveg') || d.includes('non') || d.includes('meat') || d.includes('occasionally');
  const isVeg = (d) => !isNonVeg(d) && (d === 'veg' || d.includes('vegetarian'));

  if (isVeg(pref)) {
    if (isVeg(cand)) return { match: true, reason: 'Both vegetarian' };
    return { match: false, reason: `Wants vegetarian, candidate is ${candidateDiet}` };
  }

  return { match: true, reason: 'Non-veg preference matches anyone' };
}

// Community/Caste matching
function isCommunityMatch(seekerCommunity, seekerPref, candidateCommunity) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference' };
  if (!candidateCommunity) return { match: false, reason: 'Candidate community unknown' };

  const pref = seekerPref.toLowerCase();
  const cand = candidateCommunity.toLowerCase();

  if (pref.includes('same caste') || pref.includes('same_caste')) {
    if (!seekerCommunity) return { match: false, reason: 'Same caste wanted but seeker has no caste' };
    const seeker = seekerCommunity.toLowerCase();
    // Simple check - both contain similar words
    if (cand.includes(seeker) || seeker.includes(cand)) {
      return { match: true, reason: 'Same caste match' };
    }
    // Brahmin check
    if (seeker.includes('brahmin') && cand.includes('brahmin')) {
      return { match: true, reason: 'Both Brahmin' };
    }
    return { match: false, reason: `Same caste wanted: ${seekerCommunity} vs ${candidateCommunity}` };
  }

  // Specific community preference
  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Community matches' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate is ${candidateCommunity}` };
}

// Location matching
function isLocationMatch(seekerPref, candidateLocation) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference' };

  const pref = seekerPref.toLowerCase();

  // Flexible preferences - ONLY these are flexible
  if (pref === 'doesnt_matter' || pref === 'usa' ||
      pref === 'open_to_relocation' || pref === 'other_state') {
    return { match: true, reason: 'Flexible location preference' };
  }

  // Proximity preferences - treat as flexible since we can't geocode
  if (pref.includes('within_') || pref === 'same_city' || pref === 'same_state') {
    return { match: true, reason: 'Proximity preference (flexible)' };
  }

  if (!candidateLocation) return { match: false, reason: 'Candidate location unknown' };

  const cand = candidateLocation.toLowerCase();

  // State matching - use full state names to avoid substring issues (e.g., "mo" in "vermont")
  const states = {
    'california': ['california', 'bay area', 'fremont', 'san jose', 'los angeles', 'san francisco', 'oakland', 'palo alto'],
    'texas': ['texas', 'houston', 'dallas', 'austin', 'san antonio'],
    'new york': ['new york', 'nyc', 'manhattan', 'brooklyn'],
    'new jersey': ['new jersey', 'jersey city', 'newark'],
    'missouri': ['missouri', 'st louis', 'kansas city'],
    'vermont': ['vermont', 'wells river', 'burlington'],
    'washington': ['washington', 'seattle', 'tacoma'],
    'illinois': ['illinois', 'chicago'],
    'massachusetts': ['massachusetts', 'boston', 'cambridge'],
    'georgia': ['georgia', 'atlanta'],
    'virginia': ['virginia', 'richmond', 'norfolk'],
    'florida': ['florida', 'miami', 'orlando', 'tampa'],
    'pennsylvania': ['pennsylvania', 'philadelphia', 'pittsburgh'],
    'ohio': ['ohio', 'columbus', 'cleveland', 'cincinnati'],
    'michigan': ['michigan', 'detroit', 'ann arbor'],
    'arizona': ['arizona', 'phoenix', 'tucson'],
    'colorado': ['colorado', 'denver', 'boulder'],
    'maryland': ['maryland', 'baltimore'],
    'north carolina': ['north carolina', 'charlotte', 'raleigh', 'durham'],
  };

  // Bay area special handling
  if (pref === 'bay_area' || pref.includes('bay area')) {
    const bayAreaCities = ['fremont', 'san jose', 'san francisco', 'oakland', 'palo alto', 'sunnyvale', 'mountain view', 'cupertino', 'santa clara'];
    if (bayAreaCities.some(c => cand.includes(c)) || cand.includes('bay area')) {
      return { match: true, reason: 'Both in Bay Area' };
    }
    return { match: false, reason: `Wants Bay Area, candidate in ${candidateLocation}` };
  }

  for (const [state, keywords] of Object.entries(states)) {
    if (pref === state || pref === state.replace(' ', '_') || keywords.some(k => pref === k)) {
      if (cand.includes(state) || keywords.some(k => cand.includes(k))) {
        return { match: true, reason: `Both in ${state}` };
      }
      return { match: false, reason: `Wants ${seekerPref}, candidate in ${candidateLocation}` };
    }
  }

  // Direct match for other cases
  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Location matches' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate in ${candidateLocation}` };
}

// Education matching
function isEducationMatch(seekerPref, candidateQual) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference' };
  if (!candidateQual) return { match: false, reason: 'Candidate qualification unknown' };

  const pref = seekerPref.toLowerCase();
  const cand = candidateQual.toLowerCase();

  // Medical preference
  if (pref === 'medical' || pref === 'medical_masters' || pref === 'medical_undergrad') {
    const medicalQuals = ['md', 'mbbs', 'bds', 'dm_mch', 'doctor'];
    if (medicalQuals.some(m => cand.includes(m))) {
      return { match: true, reason: 'Medical qualification matches' };
    }
    return { match: false, reason: `Wants medical, candidate has ${candidateQual}` };
  }

  // Level-based matching
  const levels = { 'high_school': 1, 'undergrad': 2, 'bachelors': 2, 'masters': 3, 'mba': 3, 'phd': 4, 'doctorate': 4, 'md': 4 };
  const prefLevel = levels[pref] || 2;
  const candLevel = levels[cand] || 2;

  if (candLevel >= prefLevel) {
    return { match: true, reason: `${candidateQual} meets ${seekerPref} requirement` };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate has ${candidateQual}` };
}

// Full mutual match check
function checkMutualMatch(seeker, candidate, detailed = false) {
  const results = {
    seekerName: seeker.user?.name || 'Unknown',
    candidateName: candidate.user?.name || 'Unknown',
    seekerMatchesCandidate: { pass: true, checks: [] },
    candidateMatchesSeeker: { pass: true, checks: [] },
    mutualMatch: true,
    failReasons: []
  };

  // === Does CANDIDATE match SEEKER's preferences? ===
  const checks1 = [];

  // Diet
  const diet1 = isDietMatch(seeker.prefDiet, candidate.dietaryPreference);
  checks1.push({ name: 'Diet', ...diet1, pref: seeker.prefDiet, value: candidate.dietaryPreference, isDB: isDealbreaker(seeker.prefDietIsDealbreaker) });
  if (!diet1.match && isDealbreaker(seeker.prefDietIsDealbreaker)) {
    results.seekerMatchesCandidate.pass = false;
    results.failReasons.push(`${seeker.user?.name} wants ${seeker.prefDiet}, ${candidate.user?.name} is ${candidate.dietaryPreference}`);
  }

  // Community
  const comm1 = isCommunityMatch(seeker.community, seeker.prefCommunity, candidate.community);
  checks1.push({ name: 'Community', ...comm1, pref: seeker.prefCommunity, value: candidate.community, isDB: isDealbreaker(seeker.prefCommunityIsDealbreaker) });
  if (!comm1.match && isDealbreaker(seeker.prefCommunityIsDealbreaker)) {
    results.seekerMatchesCandidate.pass = false;
    results.failReasons.push(`${seeker.user?.name} wants ${seeker.prefCommunity} community, ${candidate.user?.name} is ${candidate.community}`);
  }

  // Location
  const loc1 = isLocationMatch(seeker.prefLocation, candidate.currentLocation);
  checks1.push({ name: 'Location', ...loc1, pref: seeker.prefLocation, value: candidate.currentLocation, isDB: isDealbreaker(seeker.prefLocationIsDealbreaker) });
  if (!loc1.match && isDealbreaker(seeker.prefLocationIsDealbreaker)) {
    results.seekerMatchesCandidate.pass = false;
    results.failReasons.push(`${seeker.user?.name} wants ${seeker.prefLocation}, ${candidate.user?.name} is in ${candidate.currentLocation}`);
  }

  // Education
  const edu1 = isEducationMatch(seeker.prefQualification, candidate.qualification);
  checks1.push({ name: 'Education', ...edu1, pref: seeker.prefQualification, value: candidate.qualification, isDB: isDealbreaker(seeker.prefEducationIsDealbreaker) });
  if (!edu1.match && isDealbreaker(seeker.prefEducationIsDealbreaker)) {
    results.seekerMatchesCandidate.pass = false;
    results.failReasons.push(`${seeker.user?.name} wants ${seeker.prefQualification}, ${candidate.user?.name} has ${candidate.qualification}`);
  }

  results.seekerMatchesCandidate.checks = checks1;

  // === Does SEEKER match CANDIDATE's preferences? (Reverse) ===
  const checks2 = [];

  // Diet
  const diet2 = isDietMatch(candidate.prefDiet, seeker.dietaryPreference);
  checks2.push({ name: 'Diet', ...diet2, pref: candidate.prefDiet, value: seeker.dietaryPreference, isDB: isDealbreaker(candidate.prefDietIsDealbreaker) });
  if (!diet2.match && isDealbreaker(candidate.prefDietIsDealbreaker)) {
    results.candidateMatchesSeeker.pass = false;
    results.failReasons.push(`${candidate.user?.name} wants ${candidate.prefDiet}, ${seeker.user?.name} is ${seeker.dietaryPreference}`);
  }

  // Community
  const comm2 = isCommunityMatch(candidate.community, candidate.prefCommunity, seeker.community);
  checks2.push({ name: 'Community', ...comm2, pref: candidate.prefCommunity, value: seeker.community, isDB: isDealbreaker(candidate.prefCommunityIsDealbreaker) });
  if (!comm2.match && isDealbreaker(candidate.prefCommunityIsDealbreaker)) {
    results.candidateMatchesSeeker.pass = false;
    results.failReasons.push(`${candidate.user?.name} wants ${candidate.prefCommunity} community, ${seeker.user?.name} is ${seeker.community}`);
  }

  // Location
  const loc2 = isLocationMatch(candidate.prefLocation, seeker.currentLocation);
  checks2.push({ name: 'Location', ...loc2, pref: candidate.prefLocation, value: seeker.currentLocation, isDB: isDealbreaker(candidate.prefLocationIsDealbreaker) });
  if (!loc2.match && isDealbreaker(candidate.prefLocationIsDealbreaker)) {
    results.candidateMatchesSeeker.pass = false;
    results.failReasons.push(`${candidate.user?.name} wants ${candidate.prefLocation}, ${seeker.user?.name} is in ${seeker.currentLocation}`);
  }

  // Education
  const edu2 = isEducationMatch(candidate.prefQualification, seeker.qualification);
  checks2.push({ name: 'Education', ...edu2, pref: candidate.prefQualification, value: seeker.qualification, isDB: isDealbreaker(candidate.prefEducationIsDealbreaker) });
  if (!edu2.match && isDealbreaker(candidate.prefEducationIsDealbreaker)) {
    results.candidateMatchesSeeker.pass = false;
    results.failReasons.push(`${candidate.user?.name} wants ${candidate.prefQualification}, ${seeker.user?.name} has ${seeker.qualification}`);
  }

  results.candidateMatchesSeeker.checks = checks2;
  results.mutualMatch = results.seekerMatchesCandidate.pass && results.candidateMatchesSeeker.pass;

  return results;
}

// ============ MAIN ============

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Match Checker Utility

Usage:
  node scripts/check-matches.cjs <name>           Check matches for a user
  node scripts/check-matches.cjs <name> --detail  Show detailed breakdown
  node scripts/check-matches.cjs --all            Summary of all users

Examples:
  node scripts/check-matches.cjs shwetha
  node scripts/check-matches.cjs "Jaidev" --detail
`);
    process.exit(0);
  }

  const detailed = args.includes('--detail');
  const showAll = args.includes('--all');

  if (showAll) {
    // Show summary for all profiles
    const profiles = await prisma.profile.findMany({
      where: { isActive: true },
      include: { user: true }
    });

    console.log('=== All Profiles Match Summary ===\n');

    for (const profile of profiles) {
      const oppositeGender = profile.gender === 'male' ? 'female' : 'male';
      const candidates = await prisma.profile.findMany({
        where: { gender: oppositeGender, isActive: true },
        include: { user: true }
      });

      let matchCount = 0;
      for (const cand of candidates) {
        const result = checkMutualMatch(profile, cand);
        if (result.mutualMatch) matchCount++;
      }

      console.log(`${profile.user?.name} (${profile.gender}): ${matchCount} matches out of ${candidates.length} candidates`);
    }
  } else {
    // Check specific user
    const searchName = args.filter(a => !a.startsWith('--'))[0];

    const profile = await prisma.profile.findFirst({
      where: { user: { name: { contains: searchName, mode: 'insensitive' } } },
      include: { user: true }
    });

    if (!profile) {
      console.log(`No profile found for "${searchName}"`);
      process.exit(1);
    }

    console.log(`\n=== Checking matches for ${profile.user?.name} ===\n`);
    console.log('Profile:');
    console.log(`  Gender: ${profile.gender}`);
    console.log(`  Qualification: ${profile.qualification}`);
    console.log(`  Diet: ${profile.dietaryPreference}`);
    console.log(`  Community: ${profile.community}`);
    console.log(`  Location: ${profile.currentLocation}`);
    console.log(`  Marital: ${profile.maritalStatus}`);
    console.log('');
    console.log('Preferences:');
    console.log(`  prefQualification: ${profile.prefQualification} (DB: ${profile.prefEducationIsDealbreaker})`);
    console.log(`  prefDiet: ${profile.prefDiet} (DB: ${profile.prefDietIsDealbreaker})`);
    console.log(`  prefCommunity: ${profile.prefCommunity} (DB: ${profile.prefCommunityIsDealbreaker})`);
    console.log(`  prefLocation: ${profile.prefLocation} (DB: ${profile.prefLocationIsDealbreaker})`);
    console.log('');

    const oppositeGender = profile.gender === 'male' ? 'female' : 'male';
    const candidates = await prisma.profile.findMany({
      where: { gender: oppositeGender, isActive: true },
      include: { user: true }
    });

    console.log(`Checking against ${candidates.length} ${oppositeGender} candidates...\n`);

    const matches = [];
    const nonMatches = [];

    for (const cand of candidates) {
      const result = checkMutualMatch(profile, cand, detailed);
      if (result.mutualMatch) {
        matches.push(result);
      } else {
        nonMatches.push(result);
      }
    }

    console.log(`✅ MATCHES: ${matches.length}`);
    for (const m of matches) {
      console.log(`   - ${m.candidateName}`);
    }

    console.log(`\n❌ NON-MATCHES: ${nonMatches.length}`);
    for (const m of nonMatches) {
      if (detailed) {
        console.log(`\n   --- ${m.candidateName} ---`);
        console.log(`   Fail reasons:`);
        m.failReasons.forEach(r => console.log(`     - ${r}`));
      } else {
        console.log(`   - ${m.candidateName}: ${m.failReasons[0] || 'Unknown'}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
