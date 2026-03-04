const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LAKSHMI_USER_ID = "cmm8jy79q0000trt57evg76ku";

function getDatabaseHost(databaseUrl) {
  if (!databaseUrl) return null;
  try {
    return new URL(databaseUrl).hostname || null;
  } catch {
    return null;
  }
}

function isLocalDatabaseHost(host) {
  if (!host) return false;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

function assertSafeSeedTarget() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const host = getDatabaseHost(databaseUrl);
  const allowUnsafeSeed = process.env.ALLOW_TEST_DATA_SEED === "true";

  if (allowUnsafeSeed) {
    console.warn("WARNING: ALLOW_TEST_DATA_SEED=true; bypassing non-local DB guard.");
    return;
  }

  if (!host || !isLocalDatabaseHost(host)) {
    throw new Error(
      `Refusing to seed test data on non-local database host (${host || "unknown"}). ` +
      "Use a local DB or set ALLOW_TEST_DATA_SEED=true for an explicit override."
    );
  }
}

// All male test profiles since Lakshmi is female
const testUsers = [
  {
    id: "test_user_arjun_001",
    email: "arjun.test@vivaahready.com",
    name: "Arjun S.",
    phone: "+15550001001",
    profile: {
      firstName: "Arjun",
      lastName: "Sharma",
      gender: "male",
      height: "5'10\"",
      currentLocation: "San Jose, California",
      religion: "Hindu",
      dietaryPreference: "Vegetarian",
      maritalStatus: "Never Married",
      motherTongue: "Hindi",
      profileImageUrl: "https://picsum.photos/seed/arjun1/400/500",
      dateOfBirth: "06/15/1993",
      occupation: "Software Engineer",
      educationLevel: "Masters",
      fieldOfStudy: "Computer Science",
      university: "Stanford University",
      annualIncome: "150-200K",
      aboutMe: "Passionate software engineer who loves hiking and cooking.",
    },
  },
  {
    id: "test_user_vikram_002",
    email: "vikram.test@vivaahready.com",
    name: "Vikram R.",
    phone: "+15550001002",
    profile: {
      firstName: "Vikram",
      lastName: "Reddy",
      gender: "male",
      height: "5'11\"",
      currentLocation: "Sunnyvale, California",
      religion: "Hindu",
      dietaryPreference: "Non Vegetarian",
      maritalStatus: "Never Married",
      motherTongue: "Telugu",
      profileImageUrl: "https://picsum.photos/seed/vikram2/400/500",
      dateOfBirth: "03/22/1991",
      occupation: "Product Manager",
      educationLevel: "Masters",
      fieldOfStudy: "Business Administration",
      university: "UC Berkeley",
      annualIncome: "200-250K",
      aboutMe: "Product manager at a tech company. Love traveling and photography.",
    },
  },
  {
    id: "test_user_rahul_003",
    email: "rahul.test@vivaahready.com",
    name: "Rahul M.",
    phone: "+15550001003",
    profile: {
      firstName: "Rahul",
      lastName: "Mehta",
      gender: "male",
      height: "5'9\"",
      currentLocation: "Fremont, California",
      religion: "Jain",
      dietaryPreference: "Vegetarian",
      maritalStatus: "Never Married",
      motherTongue: "Gujarati",
      profileImageUrl: "https://picsum.photos/seed/rahul3/400/500",
      dateOfBirth: "11/08/1992",
      occupation: "Data Scientist",
      educationLevel: "Masters",
      fieldOfStudy: "Statistics",
      university: "MIT",
      annualIncome: "150-200K",
      aboutMe: "Data scientist with a love for music and meditation.",
    },
  },
  {
    id: "test_user_karthik_004",
    email: "karthik.test@vivaahready.com",
    name: "Karthik P.",
    phone: "+15550001004",
    profile: {
      firstName: "Karthik",
      lastName: "Patel",
      gender: "male",
      height: "6'0\"",
      currentLocation: "Cupertino, California",
      religion: "Hindu",
      dietaryPreference: "Vegetarian",
      maritalStatus: "Never Married",
      motherTongue: "Tamil",
      profileImageUrl: "https://picsum.photos/seed/karthik4/400/500",
      dateOfBirth: "07/30/1990",
      occupation: "Engineering Manager",
      educationLevel: "Masters",
      fieldOfStudy: "Computer Engineering",
      university: "Georgia Tech",
      annualIncome: "250-300K",
      aboutMe: "Engineering manager who enjoys cricket and reading.",
    },
  },
  {
    id: "test_user_priya_005",
    email: "priya.test@vivaahready.com",
    name: "Priya K.",
    phone: "+15550001005",
    profile: {
      firstName: "Priya",
      lastName: "Krishnan",
      gender: "female",
      height: "5'4\"",
      currentLocation: "Mountain View, California",
      religion: "Hindu",
      dietaryPreference: "Vegetarian",
      maritalStatus: "Never Married",
      motherTongue: "Tamil",
      profileImageUrl: "https://picsum.photos/seed/priya5/400/500",
      dateOfBirth: "02/14/1994",
      occupation: "UX Designer",
      educationLevel: "Masters",
      fieldOfStudy: "Design",
      university: "Carnegie Mellon",
      annualIncome: "100-150K",
      aboutMe: "UX designer passionate about creating inclusive products.",
    },
  },
  {
    id: "test_user_ananya_006",
    email: "ananya.test@vivaahready.com",
    name: "Ananya S.",
    phone: "+15550001006",
    profile: {
      firstName: "Ananya",
      lastName: "Srinivasan",
      gender: "female",
      height: "5'5\"",
      currentLocation: "Palo Alto, California",
      religion: "Hindu",
      dietaryPreference: "Vegetarian",
      maritalStatus: "Never Married",
      motherTongue: "Tamil",
      profileImageUrl: "https://picsum.photos/seed/ananya6/400/500",
      dateOfBirth: "09/20/1993",
      occupation: "Doctor",
      educationLevel: "Doctorate",
      fieldOfStudy: "Medicine",
      university: "Johns Hopkins",
      annualIncome: "200-250K",
      aboutMe: "Physician who loves yoga, classical dance, and cooking.",
    },
  },
  {
    id: "test_user_meera_007",
    email: "meera.test@vivaahready.com",
    name: "Meera R.",
    phone: "+15550001007",
    profile: {
      firstName: "Meera",
      lastName: "Raghavan",
      gender: "female",
      height: "5'3\"",
      currentLocation: "Santa Clara, California",
      religion: "Hindu",
      dietaryPreference: "Eggetarian",
      maritalStatus: "Never Married",
      motherTongue: "Malayalam",
      profileImageUrl: "https://picsum.photos/seed/meera7/400/500",
      dateOfBirth: "12/05/1992",
      occupation: "Financial Analyst",
      educationLevel: "Masters",
      fieldOfStudy: "Finance",
      university: "Wharton",
      annualIncome: "150-200K",
      aboutMe: "Finance professional who enjoys painting and hiking.",
    },
  },
  {
    id: "test_user_divya_008",
    email: "divya.test@vivaahready.com",
    name: "Divya T.",
    phone: "+15550001008",
    profile: {
      firstName: "Divya",
      lastName: "Thakur",
      gender: "female",
      height: "5'6\"",
      currentLocation: "San Francisco, California",
      religion: "Jain",
      dietaryPreference: "Vegetarian",
      maritalStatus: "Never Married",
      motherTongue: "Hindi",
      profileImageUrl: "https://picsum.photos/seed/divya8/400/500",
      dateOfBirth: "04/18/1994",
      occupation: "Marketing Manager",
      educationLevel: "Masters",
      fieldOfStudy: "Marketing",
      university: "Northwestern",
      annualIncome: "100-150K",
      aboutMe: "Marketing manager who loves traveling and trying new cuisines.",
    },
  },
];

async function main() {
  assertSafeSeedTarget();
  console.log("=== VivaahReady Test Data Seeder ===\n");

  // Step 1: Update Lakshmi's profile to approved
  console.log("1. Updating Lakshmi's profile to approved...");
  await prisma.profile.update({
    where: { userId: LAKSHMI_USER_ID },
    data: {
      approvalStatus: "approved",
      approvalDate: new Date(),
      isActive: true,
    },
  });
  console.log("   Done: Lakshmi's approvalStatus set to 'approved'\n");

  // Step 2: Create 8 test users + profiles
  console.log("2. Creating 8 test users with profiles...");
  for (const tu of testUsers) {
    const { profile: profileData, ...userData } = tu;

    // Upsert user
    const user = await prisma.user.upsert({
      where: { id: tu.id },
      update: {
        name: userData.name,
        phone: userData.phone,
      },
      create: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        emailVerified: new Date(),
      },
    });

    // Upsert profile
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        ...profileData,
        approvalStatus: "approved",
        approvalDate: new Date(),
        isActive: true,
        signupStep: 10,
      },
      create: {
        userId: user.id,
        ...profileData,
        approvalStatus: "approved",
        approvalDate: new Date(),
        isActive: true,
        isVerified: true,
        signupStep: 10,
      },
    });

    console.log(`   Created: ${userData.name} (${userData.email}) - ${profileData.gender}`);
  }
  console.log("");

  // Step 3: Create Match records
  // We use the 4 male profiles for matching with Lakshmi (since Lakshmi is female)
  const maleUserIds = testUsers.filter((u) => u.profile.gender === "male").map((u) => u.id);

  console.log("3. Creating Match records...");

  // 3a. 2 interests received: test users sent interest to Lakshmi (pending)
  const interestsReceived = [
    { senderId: maleUserIds[0], receiverId: LAKSHMI_USER_ID, status: "pending" }, // Arjun -> Lakshmi
    { senderId: maleUserIds[1], receiverId: LAKSHMI_USER_ID, status: "pending" }, // Vikram -> Lakshmi
  ];

  for (const match of interestsReceived) {
    await prisma.match.upsert({
      where: {
        senderId_receiverId: {
          senderId: match.senderId,
          receiverId: match.receiverId,
        },
      },
      update: { status: match.status },
      create: match,
    });
    const senderName = testUsers.find((u) => u.id === match.senderId)?.name;
    console.log(`   Interest received: ${senderName} -> Lakshmi (pending)`);
  }

  // 3b. 2 interests sent: Lakshmi sent interest to test users (pending)
  const interestsSent = [
    { senderId: LAKSHMI_USER_ID, receiverId: maleUserIds[2], status: "pending" }, // Lakshmi -> Rahul
    { senderId: LAKSHMI_USER_ID, receiverId: maleUserIds[3], status: "pending" }, // Lakshmi -> Karthik
  ];

  for (const match of interestsSent) {
    await prisma.match.upsert({
      where: {
        senderId_receiverId: {
          senderId: match.senderId,
          receiverId: match.receiverId,
        },
      },
      update: { status: match.status },
      create: match,
    });
    const receiverName = testUsers.find((u) => u.id === match.receiverId)?.name;
    console.log(`   Interest sent: Lakshmi -> ${receiverName} (pending)`);
  }

  // 3c. 2 connections: accepted matches
  // For connections we need matches in both directions or just one with accepted status
  // Using one Match record with status "accepted" as the schema uses a single row per pair
  const femaleUserIds = testUsers.filter((u) => u.profile.gender === "female").map((u) => u.id);

  // Let's use 2 male users who are not already in pending matches for connections
  // Actually, the requirement says 2 connections total. We have 4 male profiles.
  // maleUserIds[0] and [1] are used for interests received
  // maleUserIds[2] and [3] are used for interests sent
  // For connections, let's use 2 female profiles (since they exist too) 
  // But wait - connections should be with profiles that would match Lakshmi
  // Let's create accepted matches between Lakshmi and 2 female test users for testing purposes
  // Actually, let's just create 2 more male test match records as accepted
  // We need separate users for these. Let's reuse the same male users but create reverse matches
  // Actually the @@unique([senderId, receiverId]) means we can't have duplicates
  // Let's create accepted matches with the female test users for connections display
  const connections = [
    { senderId: femaleUserIds[0], receiverId: LAKSHMI_USER_ID, status: "accepted" }, // Priya <-> Lakshmi
    { senderId: LAKSHMI_USER_ID, receiverId: femaleUserIds[1], status: "accepted" }, // Lakshmi <-> Ananya
  ];

  for (const match of connections) {
    await prisma.match.upsert({
      where: {
        senderId_receiverId: {
          senderId: match.senderId,
          receiverId: match.receiverId,
        },
      },
      update: { status: match.status },
      create: match,
    });
    const otherName =
      match.senderId === LAKSHMI_USER_ID
        ? testUsers.find((u) => u.id === match.receiverId)?.name
        : testUsers.find((u) => u.id === match.senderId)?.name;
    console.log(`   Connection: Lakshmi <-> ${otherName} (accepted)`);
  }
  console.log("");

  // Step 4: Create DeclinedProfile records
  console.log("4. Creating DeclinedProfile records (for reconsider)...");
  const declinedUsers = [femaleUserIds[2], femaleUserIds[3]]; // Meera, Divya

  for (const declinedUserId of declinedUsers) {
    await prisma.declinedProfile.upsert({
      where: {
        userId_declinedUserId: {
          userId: LAKSHMI_USER_ID,
          declinedUserId: declinedUserId,
        },
      },
      update: {},
      create: {
        userId: LAKSHMI_USER_ID,
        declinedUserId: declinedUserId,
        hiddenFromReconsider: false,
        source: "matching",
      },
    });
    const declinedName = testUsers.find((u) => u.id === declinedUserId)?.name;
    console.log(`   Declined: Lakshmi declined ${declinedName}`);
  }
  console.log("");

  // Summary
  console.log("=== Seed Complete ===");
  console.log("Summary:");
  console.log(`  - Lakshmi's profile: approved`);
  console.log(`  - Test users created: ${testUsers.length}`);
  console.log(`  - Interests received (pending): 2 (Arjun, Vikram -> Lakshmi)`);
  console.log(`  - Interests sent (pending): 2 (Lakshmi -> Rahul, Karthik)`);
  console.log(`  - Connections (accepted): 2 (Lakshmi <-> Priya, Ananya)`);
  console.log(`  - Declined profiles: 2 (Lakshmi declined Meera, Divya)`);
}

main()
  .then(() => {
    console.log("\nDone!");
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error("Error:", err);
    return prisma.$disconnect().then(() => process.exit(1));
  });
