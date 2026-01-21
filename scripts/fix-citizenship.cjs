const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCitizenship() {
  const profiles = await prisma.profile.findMany({
    where: { isImported: true }
  });

  console.log('Checking', profiles.length, 'profiles for citizenship...');

  const usPlaces = ['california', 'ca', 'texas', 'tx', 'new jersey', 'nj', 'mountain view', 'fremont',
                    'michigan', 'ohio', 'virginia', 'va', 'alabama', 'maryland', 'boston', 'massachusetts',
                    'ma', 'new york', 'ny', 'seattle', 'wa', 'colorado', 'pittsburgh', 'pa', 'princeton',
                    'reno', 'nevada', 'detroit', 'san jose', 'santa clara', 'newark', 'usa', 'u.s.a', 'torrance',
                    'huntsville'];

  const indianPlaces = ['bangalore', 'bengaluru', 'india', 'trichy', 'hyderabad', 'chennai', 'mumbai',
                        'delhi', 'kolkata', 'pune', 'karnataka'];

  for (const p of profiles) {
    const pob = (p.placeOfBirth || '').toLowerCase();
    let newCitizenship = p.citizenship;

    if (usPlaces.some(place => pob.includes(place))) {
      newCitizenship = 'USA';
    } else if (indianPlaces.some(place => pob.includes(place))) {
      newCitizenship = 'India';
    }

    if (newCitizenship !== p.citizenship) {
      await prisma.profile.update({
        where: { id: p.id },
        data: { citizenship: newCitizenship }
      });
      console.log('Updated ' + p.firstName + ' ' + p.lastName + ': place=' + p.placeOfBirth + ' -> citizenship=' + newCitizenship);
    }
  }

  console.log('Done!');
}

fixCitizenship().finally(() => prisma.$disconnect());
