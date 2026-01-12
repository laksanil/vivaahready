import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: { name: { contains: "lakshmi", mode: "insensitive" } },
    include: { profile: true }
  });
  
  console.log("Users with lakshmi in name:", users.length);
  for (const u of users) {
    const hasProfile = u.profile ? "Yes" : "No";
    const gender = u.profile ? u.profile.gender : "N/A";
    console.log("  -", u.name, "|", u.email, "| Profile:", hasProfile, "| Gender:", gender);
  }
  
  const byEmail = await prisma.user.findFirst({
    where: { email: "lnagasamudra1@gmail.com" },
    include: { profile: true }
  });
  console.log("\nAdmin (lnagasamudra1@gmail.com):", byEmail?.name || "NOT FOUND", "| Has profile:", byEmail?.profile ? "Yes" : "No");
  
  await prisma.$disconnect();
}
check();
