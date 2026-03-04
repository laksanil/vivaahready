const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TEST_USER_IDS = [
  "test_user_arjun_001",
  "test_user_vikram_002",
  "test_user_rahul_003",
  "test_user_karthik_004",
  "test_user_priya_005",
  "test_user_ananya_006",
  "test_user_meera_007",
  "test_user_divya_008",
];

const TEST_EMAILS_PATTERN = "%@vivaahready.com";

async function main() {
  console.log("=== VivaahReady Test Data Cleanup ===\n");

  // Step 1: Find all test users (by ID and email pattern)
  const testUsersByEmail = await prisma.user.findMany({
    where: { email: { endsWith: "@vivaahready.com" } },
    select: { id: true, email: true, name: true },
  });

  const testUsersByIds = await prisma.user.findMany({
    where: { id: { in: TEST_USER_IDS } },
    select: { id: true, email: true, name: true },
  });

  // Merge unique user IDs
  const allTestUserIds = [
    ...new Set([
      ...testUsersByEmail.map((u) => u.id),
      ...testUsersByIds.map((u) => u.id),
    ]),
  ];

  console.log(`Found ${allTestUserIds.length} test users to remove:`);
  for (const user of [...testUsersByEmail, ...testUsersByIds]) {
    console.log(`  - ${user.name} (${user.email}) [${user.id}]`);
  }
  console.log("");

  if (allTestUserIds.length === 0) {
    console.log("No test users found. Nothing to clean up.");
    return;
  }

  // Step 2: Clean up DeclinedProfile records referencing test users
  const declinedDeleted = await prisma.declinedProfile.deleteMany({
    where: {
      OR: [
        { userId: { in: allTestUserIds } },
        { declinedUserId: { in: allTestUserIds } },
      ],
    },
  });
  console.log(`Deleted ${declinedDeleted.count} DeclinedProfile records`);

  // Step 3: Clean up Match records referencing test users
  const matchesDeleted = await prisma.match.deleteMany({
    where: {
      OR: [
        { senderId: { in: allTestUserIds } },
        { receiverId: { in: allTestUserIds } },
      ],
    },
  });
  console.log(`Deleted ${matchesDeleted.count} Match records`);

  // Step 4: Clean up Message records referencing test users
  const messagesDeleted = await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: { in: allTestUserIds } },
        { receiverId: { in: allTestUserIds } },
      ],
    },
  });
  console.log(`Deleted ${messagesDeleted.count} Message records`);

  // Step 5: Delete the User records (cascades to Profile, Notification, Report, etc.)
  const usersDeleted = await prisma.user.deleteMany({
    where: { id: { in: allTestUserIds } },
  });
  console.log(`Deleted ${usersDeleted.count} User records (+ cascaded profiles, notifications, etc.)`);

  console.log("\n=== Cleanup Complete ===");
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
