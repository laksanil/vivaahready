import { PrismaClient } from "@prisma/client";
import { isMutualMatch } from "../src/lib/matching";
const prisma = new PrismaClient();

async function test() {
  const lakshmi = await prisma.user.findFirst({
    where: { email: "laksanil@gmail.com" },
  });
  
  if (!lakshmi) return;
  
  const myProfile = await prisma.profile.findUnique({
    where: { userId: lakshmi.id },
  });
  
  if (!myProfile) {
    console.log("No profile");
    return;
  }
  
  // Get candidates (opposite gender)
  const candidates = await prisma.profile.findMany({
    where: {
      gender: myProfile.gender === "male" ? "female" : "male",
      isActive: true,
      userId: { not: lakshmi.id },
    },
    include: { user: true }
  });
  
  console.log("Total opposite gender profiles:", candidates.length);
  
  // Filter by mutual match
  const matchingProfiles = candidates.filter(c => isMutualMatch(myProfile as any, c as any));
  console.log("After isMutualMatch filter:", matchingProfiles.length);
  
  // Get interests sent/received
  const sentInterests = await prisma.match.findMany({
    where: { senderId: lakshmi.id },
    select: { receiverId: true }
  });
  const sentToIds = new Set(sentInterests.map(m => m.receiverId));
  console.log("Sent interest to:", sentToIds.size, "users");
  
  const receivedInterests = await prisma.match.findMany({
    where: { receiverId: lakshmi.id },
    select: { senderId: true }
  });
  const receivedFromIds = new Set(receivedInterests.map(m => m.senderId));
  console.log("Received interest from:", receivedFromIds.size, "users");
  
  // Filter fresh profiles
  const freshProfiles = matchingProfiles.filter(m => 
    !sentToIds.has(m.userId) && !receivedFromIds.has(m.userId)
  );
  console.log("Fresh profiles (no interaction):", freshProfiles.length);
  
  if (freshProfiles.length > 0) {
    console.log("\nFresh matches:");
    freshProfiles.slice(0, 5).forEach(p => console.log("  -", p.user.name));
  }
  
  await prisma.$disconnect();
}
test();
