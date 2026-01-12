import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  // Get lakshmi's user and profile
  const lakshmi = await prisma.user.findFirst({
    where: { email: "laksanil@gmail.com" },
  });
  
  if (!lakshmi) {
    console.log("User not found");
    return;
  }
  
  console.log("User:", lakshmi.name, "| ID:", lakshmi.id);
  
  // Count interests sent
  const sent = await prisma.match.count({ where: { senderId: lakshmi.id } });
  console.log("Interests sent:", sent);
  
  // Count interests received  
  const received = await prisma.match.count({ where: { receiverId: lakshmi.id } });
  console.log("Interests received:", received);
  
  // Count declined
  const declined = await prisma.declinedProfile.count({ where: { userId: lakshmi.id } });
  console.log("Profiles declined:", declined);
  
  // Total interactions
  console.log("\nTotal interactions:", sent + received + declined);
  console.log("(If this equals 16, all matches have been interacted with)");
  
  await prisma.$disconnect();
}
check();
