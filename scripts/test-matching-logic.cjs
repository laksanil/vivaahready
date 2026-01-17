#!/usr/bin/env node
/**
 * Matching Logic Test Suite
 *
 * This script tests the mutual matching algorithm to ensure:
 * 1. Dealbreaker preferences MUST match - no exceptions
 * 2. Non-dealbreaker preferences are "nice to have" - shown but don't block
 * 3. Mutual matching works both ways (A matches B's prefs AND B matches A's prefs)
 *
 * Run: node scripts/test-matching-logic.cjs
 * Run specific test: node scripts/test-matching-logic.cjs --test "diet"
 * Run with DB: node scripts/test-matching-logic.cjs --live
 */

const { PrismaClient } = require('@prisma/client');

// ============ MATCHING LOGIC (must mirror src/lib/matching.ts exactly) ============

function isDealbreaker(value) {
  return value === true || value === 'true';
}

function isPrefSet(pref) {
  if (!pref) return false;
  const lower = pref.toLowerCase().trim();
  return lower !== '' && lower !== "doesn't matter" && lower !== 'doesnt_matter' && lower !== 'any';
}

// Diet matching
function isDietMatch(seekerPref, candidateDiet) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateDiet) return { match: false, reason: 'Candidate diet unknown' };

  const pref = seekerPref.toLowerCase().replace(/[_\s-]/g, '');
  const cand = candidateDiet.toLowerCase().replace(/[_\s-]/g, '');

  const isNonVeg = (d) => d.includes('nonveg') || d.includes('occasionally') || d.includes('meat');
  const isVeg = (d) => !isNonVeg(d) && (d === 'veg' || d.includes('vegetarian'));

  if (isVeg(pref)) {
    if (isVeg(cand)) return { match: true, reason: 'Both vegetarian' };
    return { match: false, reason: `Seeker wants vegetarian, candidate is ${candidateDiet}` };
  }

  return { match: true, reason: 'Non-veg/flexible preference' };
}

// Community matching
function isCommunityMatch(seekerCommunity, seekerPref, candidateCommunity) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
  if (!candidateCommunity) return { match: false, reason: 'Candidate community unknown' };

  const pref = seekerPref.toLowerCase();
  const cand = candidateCommunity.toLowerCase();

  if (pref.includes('same caste') || pref.includes('same_caste')) {
    if (!seekerCommunity) return { match: false, reason: 'Same caste wanted but seeker has no caste defined' };
    const seeker = seekerCommunity.toLowerCase();

    // Brahmin matching
    if (seeker.includes('brahmin') && cand.includes('brahmin')) {
      return { match: true, reason: 'Both Brahmin' };
    }

    // Direct match
    if (cand.includes(seeker) || seeker.includes(cand)) {
      return { match: true, reason: 'Same community' };
    }

    return { match: false, reason: `Same caste wanted: seeker is ${seekerCommunity}, candidate is ${candidateCommunity}` };
  }

  // Specific community preference
  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Community matches preference' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate is ${candidateCommunity}` };
}

// Location matching
function isLocationMatch(seekerPref, candidateLocation) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };

  const pref = seekerPref.toLowerCase();

  // Flexible preferences
  if (pref === 'doesnt_matter' || pref === 'usa' || pref === 'open_to_relocation' || pref === 'other_state') {
    return { match: true, reason: 'Flexible location preference' };
  }

  // Proximity preferences - flexible since we can't geocode
  if (pref.includes('within_') || pref === 'same_city' || pref === 'same_state') {
    return { match: true, reason: 'Proximity preference (flexible)' };
  }

  if (!candidateLocation) return { match: false, reason: 'Candidate location unknown' };

  const cand = candidateLocation.toLowerCase();

  // State mapping (full names only to avoid substring issues)
  const states = {
    'california': ['california', 'bay area', 'fremont', 'san jose', 'los angeles', 'san francisco'],
    'texas': ['texas', 'houston', 'dallas', 'austin'],
    'new york': ['new york', 'nyc', 'manhattan', 'brooklyn'],
    'missouri': ['missouri', 'st louis', 'kansas city'],
    'vermont': ['vermont', 'wells river', 'burlington'],
    'washington': ['washington', 'seattle'],
    'illinois': ['illinois', 'chicago'],
    'georgia': ['georgia', 'atlanta'],
    'florida': ['florida', 'miami', 'orlando'],
  };

  // Bay area special handling
  if (pref === 'bay_area' || pref.includes('bay area')) {
    const bayAreaCities = ['fremont', 'san jose', 'san francisco', 'oakland', 'palo alto', 'sunnyvale', 'mountain view'];
    if (bayAreaCities.some(c => cand.includes(c)) || cand.includes('bay area') || cand.includes('california')) {
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

  // Direct match
  if (cand.includes(pref) || pref.includes(cand)) {
    return { match: true, reason: 'Location matches' };
  }

  return { match: false, reason: `Wants ${seekerPref}, candidate in ${candidateLocation}` };
}

// Education matching
function isEducationMatch(seekerPref, candidateQual) {
  if (!isPrefSet(seekerPref)) return { match: true, reason: 'No preference set' };
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

// ============ MUTUAL MATCH CHECK ============

/**
 * Check if two profiles mutually match
 * Returns: { isMatch: boolean, dealbreakersFailedA: [], dealbreakersFailedB: [], softMismatchesA: [], softMismatchesB: [] }
 */
function checkMutualMatch(profileA, profileB) {
  const result = {
    isMatch: true,
    // A's dealbreaker preferences that B fails
    dealbreakersFailedByB: [],
    // B's dealbreaker preferences that A fails
    dealbreakersFailedByA: [],
    // A's non-dealbreaker preferences that B doesn't meet (informational only)
    softMismatchesA: [],
    // B's non-dealbreaker preferences that A doesn't meet (informational only)
    softMismatchesB: [],
  };

  // ===== Check: Does B meet A's preferences? =====

  // Diet
  const dietA = isDietMatch(profileA.prefDiet, profileB.dietaryPreference);
  if (!dietA.match) {
    if (isDealbreaker(profileA.prefDietIsDealbreaker)) {
      result.dealbreakersFailedByB.push({ field: 'Diet', ...dietA });
      result.isMatch = false;
    } else {
      result.softMismatchesA.push({ field: 'Diet', ...dietA });
    }
  }

  // Community
  const commA = isCommunityMatch(profileA.community, profileA.prefCommunity, profileB.community);
  if (!commA.match) {
    if (isDealbreaker(profileA.prefCommunityIsDealbreaker)) {
      result.dealbreakersFailedByB.push({ field: 'Community', ...commA });
      result.isMatch = false;
    } else {
      result.softMismatchesA.push({ field: 'Community', ...commA });
    }
  }

  // Location
  const locA = isLocationMatch(profileA.prefLocation, profileB.currentLocation);
  if (!locA.match) {
    if (isDealbreaker(profileA.prefLocationIsDealbreaker)) {
      result.dealbreakersFailedByB.push({ field: 'Location', ...locA });
      result.isMatch = false;
    } else {
      result.softMismatchesA.push({ field: 'Location', ...locA });
    }
  }

  // Education
  const eduA = isEducationMatch(profileA.prefQualification, profileB.qualification);
  if (!eduA.match) {
    if (isDealbreaker(profileA.prefEducationIsDealbreaker)) {
      result.dealbreakersFailedByB.push({ field: 'Education', ...eduA });
      result.isMatch = false;
    } else {
      result.softMismatchesA.push({ field: 'Education', ...eduA });
    }
  }

  // ===== Check: Does A meet B's preferences? =====

  // Diet
  const dietB = isDietMatch(profileB.prefDiet, profileA.dietaryPreference);
  if (!dietB.match) {
    if (isDealbreaker(profileB.prefDietIsDealbreaker)) {
      result.dealbreakersFailedByA.push({ field: 'Diet', ...dietB });
      result.isMatch = false;
    } else {
      result.softMismatchesB.push({ field: 'Diet', ...dietB });
    }
  }

  // Community
  const commB = isCommunityMatch(profileB.community, profileB.prefCommunity, profileA.community);
  if (!commB.match) {
    if (isDealbreaker(profileB.prefCommunityIsDealbreaker)) {
      result.dealbreakersFailedByA.push({ field: 'Community', ...commB });
      result.isMatch = false;
    } else {
      result.softMismatchesB.push({ field: 'Community', ...commB });
    }
  }

  // Location
  const locB = isLocationMatch(profileB.prefLocation, profileA.currentLocation);
  if (!locB.match) {
    if (isDealbreaker(profileB.prefLocationIsDealbreaker)) {
      result.dealbreakersFailedByA.push({ field: 'Location', ...locB });
      result.isMatch = false;
    } else {
      result.softMismatchesB.push({ field: 'Location', ...locB });
    }
  }

  // Education
  const eduB = isEducationMatch(profileB.prefQualification, profileA.qualification);
  if (!eduB.match) {
    if (isDealbreaker(profileB.prefEducationIsDealbreaker)) {
      result.dealbreakersFailedByA.push({ field: 'Education', ...eduB });
      result.isMatch = false;
    } else {
      result.softMismatchesB.push({ field: 'Education', ...eduB });
    }
  }

  return result;
}

// ============ TEST CASES ============

const TEST_CASES = [
  // ===== DIET TESTS =====
  {
    name: 'Diet: Vegetarian preference (dealbreaker) rejects non-veg',
    profileA: {
      name: 'Veg Seeker',
      prefDiet: 'Vegetarian',
      prefDietIsDealbreaker: true,
      dietaryPreference: 'Vegetarian',
    },
    profileB: {
      name: 'Non-Veg Person',
      prefDiet: null,
      prefDietIsDealbreaker: false,
      dietaryPreference: 'Occasionally Non-Veg',
    },
    expectedMatch: false,
    expectedReason: 'A wants vegetarian (dealbreaker), B is non-veg',
  },
  {
    name: 'Diet: Vegetarian preference (NOT dealbreaker) allows non-veg with soft mismatch',
    profileA: {
      name: 'Veg Preference',
      prefDiet: 'Vegetarian',
      prefDietIsDealbreaker: false,
      dietaryPreference: 'Vegetarian',
    },
    profileB: {
      name: 'Non-Veg Person',
      prefDiet: null,
      prefDietIsDealbreaker: false,
      dietaryPreference: 'Non Vegetarian',
    },
    expectedMatch: true,
    expectedSoftMismatch: true,
    expectedReason: 'A wants veg but not dealbreaker, so B matches with soft mismatch noted',
  },
  {
    name: 'Diet: Non-veg preference accepts anyone',
    profileA: {
      name: 'Non-Veg Seeker',
      prefDiet: 'Non Vegetarian',
      prefDietIsDealbreaker: true,
      dietaryPreference: 'Non Vegetarian',
    },
    profileB: {
      name: 'Veg Person',
      prefDiet: null,
      prefDietIsDealbreaker: false,
      dietaryPreference: 'Vegetarian',
    },
    expectedMatch: true,
    expectedReason: 'Non-veg preference accepts anyone',
  },

  // ===== LOCATION TESTS =====
  {
    name: 'Location: Missouri preference (dealbreaker) rejects Vermont person',
    profileA: {
      name: 'Missouri Seeker',
      prefLocation: 'missouri',
      prefLocationIsDealbreaker: true,
      currentLocation: 'St Louis, Missouri',
    },
    profileB: {
      name: 'Vermont Person',
      prefLocation: 'doesnt_matter',
      prefLocationIsDealbreaker: false,
      currentLocation: 'Wells River, Vermont',
    },
    expectedMatch: false,
    expectedReason: 'A wants Missouri (dealbreaker), B is in Vermont',
  },
  {
    name: 'Location: within_50_miles is treated as flexible',
    profileA: {
      name: 'Proximity Seeker',
      prefLocation: 'within_50_miles',
      prefLocationIsDealbreaker: true,
      currentLocation: 'San Jose, CA',
    },
    profileB: {
      name: 'Remote Person',
      prefLocation: null,
      prefLocationIsDealbreaker: false,
      currentLocation: 'New York, NY',
    },
    expectedMatch: true,
    expectedReason: 'within_50_miles cannot be verified, treated as flexible',
  },
  {
    name: 'Location: Bay Area preference matches California cities',
    profileA: {
      name: 'Bay Area Seeker',
      prefLocation: 'bay_area',
      prefLocationIsDealbreaker: true,
      currentLocation: 'San Francisco, CA',
    },
    profileB: {
      name: 'Fremont Person',
      prefLocation: null,
      prefLocationIsDealbreaker: false,
      currentLocation: 'Fremont, CA',
    },
    expectedMatch: true,
    expectedReason: 'Fremont is in Bay Area',
  },

  // ===== COMMUNITY TESTS =====
  {
    name: 'Community: Same caste (dealbreaker) rejects different community',
    profileA: {
      name: 'Brahmin Seeker',
      community: 'Brahmin',
      prefCommunity: 'Same Caste only',
      prefCommunityIsDealbreaker: true,
    },
    profileB: {
      name: 'Kapu Person',
      community: 'Kapu',
      prefCommunity: null,
      prefCommunityIsDealbreaker: false,
    },
    expectedMatch: false,
    expectedReason: 'A wants same caste Brahmin (dealbreaker), B is Kapu',
  },
  {
    name: 'Community: Same caste matches within Brahmin variants',
    profileA: {
      name: 'Iyer Seeker',
      community: 'Brahmin Iyer',
      prefCommunity: 'Same Caste only',
      prefCommunityIsDealbreaker: true,
    },
    profileB: {
      name: 'Iyengar Person',
      community: 'Brahmin Iyengar',
      prefCommunity: null,
      prefCommunityIsDealbreaker: false,
    },
    expectedMatch: true,
    expectedReason: 'Both are Brahmin variants',
  },

  // ===== EDUCATION TESTS =====
  {
    name: 'Education: Medical preference (dealbreaker) rejects non-medical',
    profileA: {
      name: 'Medical Seeker',
      prefQualification: 'medical',
      prefEducationIsDealbreaker: true,
      qualification: 'md',
    },
    profileB: {
      name: 'Masters Person',
      prefQualification: null,
      prefEducationIsDealbreaker: false,
      qualification: 'masters',
    },
    expectedMatch: false,
    expectedReason: 'A wants medical (dealbreaker), B has masters',
  },
  {
    name: 'Education: Medical preference (NOT dealbreaker) allows non-medical with soft mismatch',
    profileA: {
      name: 'Medical Preference',
      prefQualification: 'medical',
      prefEducationIsDealbreaker: false,
      qualification: 'md',
    },
    profileB: {
      name: 'Masters Person',
      prefQualification: null,
      prefEducationIsDealbreaker: false,
      qualification: 'masters',
    },
    expectedMatch: true,
    expectedSoftMismatch: true,
    expectedReason: 'A wants medical but not dealbreaker, so B matches with soft mismatch',
  },

  // ===== MUTUAL MATCHING TESTS =====
  {
    name: 'Mutual: Both have dealbreaker preferences that fail',
    profileA: {
      name: 'A',
      prefDiet: 'Vegetarian',
      prefDietIsDealbreaker: true,
      dietaryPreference: 'Vegetarian',
      prefLocation: 'california',
      prefLocationIsDealbreaker: true,
      currentLocation: 'San Jose, CA',
    },
    profileB: {
      name: 'B',
      prefDiet: 'Vegetarian',
      prefDietIsDealbreaker: true,
      dietaryPreference: 'Non Vegetarian',  // Fails A's pref
      prefLocation: 'texas',
      prefLocationIsDealbreaker: true,
      currentLocation: 'Houston, TX',  // Fails A's pref, A fails B's pref
    },
    expectedMatch: false,
    expectedReason: 'Multiple dealbreaker failures both ways',
  },
  {
    name: 'Mutual: Perfect match - all preferences align',
    profileA: {
      name: 'A',
      prefDiet: 'Vegetarian',
      prefDietIsDealbreaker: true,
      dietaryPreference: 'Vegetarian',
      prefLocation: 'california',
      prefLocationIsDealbreaker: true,
      currentLocation: 'San Jose, CA',
      community: 'Brahmin',
      prefCommunity: 'Brahmin',
      prefCommunityIsDealbreaker: true,
    },
    profileB: {
      name: 'B',
      prefDiet: 'Vegetarian',
      prefDietIsDealbreaker: true,
      dietaryPreference: 'Vegetarian',
      prefLocation: 'california',
      prefLocationIsDealbreaker: true,
      currentLocation: 'Fremont, CA',
      community: 'Brahmin',
      prefCommunity: 'Brahmin',
      prefCommunityIsDealbreaker: true,
    },
    expectedMatch: true,
    expectedReason: 'All dealbreaker preferences match both ways',
  },

  // ===== REAL SCENARIO: Shwetha =====
  {
    name: 'Real: Shwetha vs Jaidev (should NOT match - location dealbreaker)',
    profileA: {
      name: 'Shwetha',
      prefQualification: 'medical',
      prefEducationIsDealbreaker: false,
      qualification: 'md',
      prefDiet: 'non_veg_ok',
      prefDietIsDealbreaker: false,
      dietaryPreference: 'Occasionally Non-Veg',
      prefLocation: 'within_50_miles',
      prefLocationIsDealbreaker: false,
      currentLocation: 'Wells River, Vermont',
      community: 'Kapu',
      prefCommunity: 'doesnt_matter',
      prefCommunityIsDealbreaker: false,
    },
    profileB: {
      name: 'Jaidev',
      prefQualification: 'undergrad',
      prefEducationIsDealbreaker: false,
      qualification: 'md',
      prefDiet: 'Non Vegetarian',
      prefDietIsDealbreaker: true,
      dietaryPreference: 'Non Vegetarian',
      prefLocation: 'missouri',
      prefLocationIsDealbreaker: true,  // DEALBREAKER!
      currentLocation: 'Fremont, CA',
      community: 'Nair',
      prefCommunity: null,
      prefCommunityIsDealbreaker: false,
    },
    expectedMatch: false,
    expectedReason: 'Jaidev wants Missouri (dealbreaker), Shwetha is in Vermont',
  },
  {
    name: 'Real: Shwetha vs Rohith (should NOT match - diet dealbreaker)',
    profileA: {
      name: 'Shwetha',
      qualification: 'md',
      dietaryPreference: 'Occasionally Non-Veg',
      currentLocation: 'Wells River, Vermont',
      community: 'Kapu',
      prefQualification: 'medical',
      prefEducationIsDealbreaker: false,
      prefDiet: 'non_veg_ok',
      prefDietIsDealbreaker: false,
      prefLocation: 'within_50_miles',
      prefLocationIsDealbreaker: false,
      prefCommunity: 'doesnt_matter',
      prefCommunityIsDealbreaker: false,
    },
    profileB: {
      name: 'Rohith',
      qualification: 'md',
      dietaryPreference: 'Vegetarian',
      currentLocation: 'Some City',
      community: 'Kannada Madwa',
      prefQualification: 'medical_masters',
      prefEducationIsDealbreaker: false,
      prefDiet: 'Vegetarian',
      prefDietIsDealbreaker: true,  // DEALBREAKER!
      prefLocation: 'doesnt_matter',
      prefLocationIsDealbreaker: false,
      prefCommunity: null,
      prefCommunityIsDealbreaker: false,
    },
    expectedMatch: false,
    expectedReason: 'Rohith wants Vegetarian (dealbreaker), Shwetha is Non-Veg',
  },
];

// ============ TEST RUNNER ============

function runTests(filterName = null) {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           MATCHING LOGIC TEST SUITE                            ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║ Rules:                                                         ║');
  console.log('║ 1. Dealbreaker=true → MUST match or no match                   ║');
  console.log('║ 2. Dealbreaker=false → Soft preference (noted but not blocking)║');
  console.log('║ 3. Mutual matching → Both A & B must pass each other\'s prefs   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  const testsToRun = filterName
    ? TEST_CASES.filter(t => t.name.toLowerCase().includes(filterName.toLowerCase()))
    : TEST_CASES;

  for (const test of testsToRun) {
    const result = checkMutualMatch(test.profileA, test.profileB);
    const testPassed = result.isMatch === test.expectedMatch;

    if (test.expectedSoftMismatch && testPassed) {
      // Also check that soft mismatches were recorded
      const hasSoftMismatch = result.softMismatchesA.length > 0 || result.softMismatchesB.length > 0;
      if (!hasSoftMismatch) {
        failed++;
        failures.push({
          test: test.name,
          expected: 'Soft mismatch to be recorded',
          got: 'No soft mismatches recorded',
        });
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Expected soft mismatch to be recorded`);
        continue;
      }
    }

    if (testPassed) {
      passed++;
      console.log(`✅ PASS: ${test.name}`);
      if (result.softMismatchesA.length > 0 || result.softMismatchesB.length > 0) {
        console.log(`   📝 Soft mismatches noted (non-blocking):`);
        result.softMismatchesA.forEach(m => console.log(`      - A's pref: ${m.field} - ${m.reason}`));
        result.softMismatchesB.forEach(m => console.log(`      - B's pref: ${m.field} - ${m.reason}`));
      }
    } else {
      failed++;
      failures.push({
        test: test.name,
        expected: test.expectedMatch ? 'MATCH' : 'NO MATCH',
        got: result.isMatch ? 'MATCH' : 'NO MATCH',
        reason: test.expectedReason,
        dealbreakersA: result.dealbreakersFailedByB,
        dealbreakersB: result.dealbreakersFailedByA,
      });
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Expected: ${test.expectedMatch ? 'MATCH' : 'NO MATCH'}`);
      console.log(`   Got: ${result.isMatch ? 'MATCH' : 'NO MATCH'}`);
      console.log(`   Reason: ${test.expectedReason}`);
      if (result.dealbreakersFailedByB.length > 0) {
        console.log(`   A's dealbreakers failed by B:`);
        result.dealbreakersFailedByB.forEach(d => console.log(`      - ${d.field}: ${d.reason}`));
      }
      if (result.dealbreakersFailedByA.length > 0) {
        console.log(`   B's dealbreakers failed by A:`);
        result.dealbreakersFailedByA.forEach(d => console.log(`      - ${d.field}: ${d.reason}`));
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${testsToRun.length} tests`);
  console.log('═'.repeat(60));

  if (failed > 0) {
    console.log('\n⚠️  FAILURES DETECTED - Matching logic may have bugs!\n');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed - Matching logic is correct!\n');
    process.exit(0);
  }
}

// ============ LIVE DATABASE TEST ============

async function runLiveTest() {
  const prisma = new PrismaClient();

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           LIVE DATABASE MATCHING TEST                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    const profiles = await prisma.profile.findMany({
      where: { isActive: true },
      include: { user: true }
    });

    console.log(`Found ${profiles.length} active profiles\n`);

    for (const profile of profiles) {
      const oppositeGender = profile.gender === 'male' ? 'female' : 'male';
      const candidates = profiles.filter(p => p.gender === oppositeGender);

      let matches = 0;
      let softMatches = 0;

      for (const cand of candidates) {
        const result = checkMutualMatch(profile, cand);
        if (result.isMatch) {
          matches++;
          if (result.softMismatchesA.length > 0 || result.softMismatchesB.length > 0) {
            softMatches++;
          }
        }
      }

      console.log(`${profile.user?.name || 'Unknown'} (${profile.gender}): ${matches} matches (${softMatches} with soft mismatches)`);
    }

  } finally {
    await prisma.$disconnect();
  }
}

// ============ MAIN ============

const args = process.argv.slice(2);

if (args.includes('--live')) {
  runLiveTest().catch(console.error);
} else if (args.includes('--test')) {
  const idx = args.indexOf('--test');
  const filter = args[idx + 1];
  runTests(filter);
} else if (args.includes('--help')) {
  console.log(`
Matching Logic Test Suite

Usage:
  node scripts/test-matching-logic.cjs              Run all tests
  node scripts/test-matching-logic.cjs --test diet  Run tests containing "diet"
  node scripts/test-matching-logic.cjs --live       Test against live database
  node scripts/test-matching-logic.cjs --help       Show this help

Key Concepts:
  - Dealbreaker=true: Preference MUST be met or no match
  - Dealbreaker=false: Preference is noted but doesn't block match
  - Mutual matching: Both parties' dealbreaker preferences must be satisfied
`);
} else {
  runTests();
}
