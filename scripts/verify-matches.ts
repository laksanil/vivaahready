import { PrismaClient } from "@prisma/client";
import { isMutualMatch, matchesSeekerPreferences, calculateMatchScore } from "../src/lib/matching";

const prisma = new PrismaClient();

async function verifyMatches() {
  console.log("=== Verifying Match Algorithm ===\n");

  // Get all active profiles
  const profiles = await prisma.profile.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, email: true } } }
  });

  console.log(`Total active profiles: ${profiles.length}`);

  // Separate by gender
  const males = profiles.filter(p => p.gender === 'male');
  const females = profiles.filter(p => p.gender === 'female');

  console.log(`Males: ${males.length}, Females: ${females.length}\n`);

  // For each male profile, count matches
  console.log("=== Male Profiles Match Count ===");
  for (const male of males) {
    let mutualCount = 0;
    let heMatchesHerPrefs = 0;
    let sheMatchesHisPrefs = 0;

    for (const female of females) {
      const maleMatchesFemalePrefs = matchesSeekerPreferences(female as any, male as any);
      const femaleMatchesMalePrefs = matchesSeekerPreferences(male as any, female as any);

      if (maleMatchesFemalePrefs) heMatchesHerPrefs++;
      if (femaleMatchesMalePrefs) sheMatchesHisPrefs++;

      if (isMutualMatch(male as any, female as any)) {
        mutualCount++;
      }
    }

    console.log(`${male.user.name}: ${mutualCount} mutual matches (he matches ${heMatchesHerPrefs} women's prefs, ${sheMatchesHisPrefs} women match his prefs)`);
  }

  console.log("\n=== Female Profiles Match Count ===");
  for (const female of females) {
    let mutualCount = 0;
    let sheMatchesHisPrefs = 0;
    let heMatchesHerPrefs = 0;

    for (const male of males) {
      const femaleMatchesMalePrefs = matchesSeekerPreferences(male as any, female as any);
      const maleMatchesFemalePrefs = matchesSeekerPreferences(female as any, male as any);

      if (femaleMatchesMalePrefs) sheMatchesHisPrefs++;
      if (maleMatchesFemalePrefs) heMatchesHerPrefs++;

      if (isMutualMatch(female as any, male as any)) {
        mutualCount++;
      }
    }

    console.log(`${female.user.name}: ${mutualCount} mutual matches (she matches ${heMatchesHerPrefs} men's prefs, ${sheMatchesHisPrefs} men match her prefs)`);
  }

  // Pick one profile and show detailed matching info
  console.log("\n=== Detailed Match Analysis for First Male ===");
  if (males.length > 0) {
    const testMale = males[0];
    console.log(`\nAnalyzing: ${testMale.user.name}`);
    console.log(`His preferences:`);
    console.log(`  - Age: ${testMale.prefAgeDiff || 'Any'}`);
    console.log(`  - Location: ${testMale.prefLocation || 'Any'}`);
    console.log(`  - Caste: ${testMale.prefCaste || 'Any'}`);
    console.log(`  - Diet: ${testMale.prefDiet || 'Any'}`);

    console.log(`\nMatches breakdown:`);
    for (const female of females.slice(0, 5)) {
      const maleMatchesFemalePrefs = matchesSeekerPreferences(female as any, testMale as any);
      const femaleMatchesMalePrefs = matchesSeekerPreferences(testMale as any, female as any);
      const isMutual = isMutualMatch(testMale as any, female as any);

      console.log(`\n  ${female.user.name}:`);
      console.log(`    - He matches her prefs: ${maleMatchesFemalePrefs}`);
      console.log(`    - She matches his prefs: ${femaleMatchesMalePrefs}`);
      console.log(`    - Mutual match: ${isMutual}`);

      if (!isMutual) {
        // Show why not mutual
        const hisScore = calculateMatchScore(testMale as any, female as any);
        const herScore = calculateMatchScore(female as any, testMale as any);

        console.log(`    - His prefs check: ${hisScore.totalScore}/${hisScore.maxScore}`);
        console.log(`    - Her prefs check: ${herScore.totalScore}/${herScore.maxScore}`);
      }
    }
  }

  await prisma.$disconnect();
}

verifyMatches().catch(console.error);
