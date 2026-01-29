import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { profile: { isNot: null } },
    select: {
      name: true,
      phone: true,
      profile: {
        select: {
          country: true,
          currentLocation: true,
          placeOfBirthCountry: true,
        },
      },
    },
  });

  for (const u of users) {
    const phone = u.phone || "NO PHONE";
    const country = u.profile?.country || "N/A";
    const location = u.profile?.currentLocation || "N/A";
    const birthCountry = u.profile?.placeOfBirthCountry || "N/A";
    console.log(
      `${u.name} | ${phone} | country: ${country} | location: ${location} | birthCountry: ${birthCountry}`
    );
  }

  await prisma.$disconnect();
}

main();
