import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function list() {
  const users = await prisma.user.findMany({
    include: { profile: { select: { gender: true, approvalStatus: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  console.log("Recent users (showing name | email | hasProfile | gender | approved):");
  for (const u of users) {
    const hasProfile = u.profile ? "Yes" : "No";
    const gender = u.profile?.gender || "N/A";
    const approved = u.profile?.approvalStatus || "N/A";
    console.log(`  ${u.name} | ${u.email} | ${hasProfile} | ${gender} | ${approved}`);
  }
  
  await prisma.$disconnect();
}
list();
