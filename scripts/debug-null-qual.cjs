/**
 * Debug null/empty qualifications
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      qualification: true,
      university: true,
      user: { select: { name: true } }
    }
  });

  console.log('Checking all profiles for null/empty qualification:\n');

  for (const p of profiles) {
    const isNull = p.qualification === null;
    const isEmpty = p.qualification === '';
    const isUndefined = p.qualification === undefined;

    if (isNull || isEmpty || isUndefined) {
      console.log('Profile: ' + p.user.name);
      console.log('  ID: ' + p.id);
      console.log('  qualification value: "' + p.qualification + '"');
      console.log('  isNull: ' + isNull);
      console.log('  isEmpty: ' + isEmpty);
      console.log('  University: ' + p.university);
      console.log('');
    }
  }

  // Also check with different where conditions
  const nullQual = await prisma.profile.count({ where: { qualification: null } });
  const emptyQual = await prisma.profile.count({ where: { qualification: '' } });

  console.log('Count with qualification = null:', nullQual);
  console.log('Count with qualification = "":', emptyQual);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
