const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Citizenship from the form (Column AK)
const formCitizenship = {
  'vijayramaswamy1@gmail.com': 'USA',
  'meena.n.manda@gmail.com': 'USA',
  'akhshaya95@gmail.com': 'USA',
  'sureshbabulp@gmail.com': 'USA',
  'pvn.acharya@gmail.com': 'India',
  'rekhajayasimha@gmail.com': 'India',
  'poornima.hadadi@gmail.com': 'USA',
  'anjana.raichur72@gmail.com': 'USA',
  'ap.misc.home@gmail.com': 'USA',
  'preetygrao@gmail.com': 'USA',
  'karishmasrao@gmail.com': 'USA',
  'rk5000@gmail.com': 'USA',
  'msoogoor1@yahoo.com': 'USA',
  'jayasanthosh608@gmail.com': 'USA',
  'sudha312@gmail.com': 'USA',
  'battulavaani0@gmail.com': 'USA',
  'sssrmatrimony@gmail.com': 'USA',
  'mswamg2@gmail.com': 'USA',
  'soumya.kannan2012@gmail.com': 'USA',
  'ngnagesh1@gmail.com': 'USA',
  'ohmmadp@gmail.com': 'USA',
  'vamsiraman13@gmail.com': 'USA',
  'bshesh@gmail.com': 'USA'
};

async function compare() {
  const profiles = await prisma.profile.findMany({
    select: {
      firstName: true,
      lastName: true,
      citizenship: true,
      user: { select: { email: true } }
    }
  });

  console.log('Profiles needing citizenship correction:\n');
  console.log('Name | Email | Current (Inferred) | Should Be (Form)');
  console.log('---|---|---|---');

  let needsUpdate = 0;
  for (const p of profiles) {
    const formValue = formCitizenship[p.user.email];
    if (formValue && formValue != p.citizenship) {
      console.log(p.firstName + ' ' + p.lastName + ' | ' + p.user.email + ' | ' + p.citizenship + ' | ' + formValue);
      needsUpdate++;
    }
  }

  console.log('\nTotal profiles needing update: ' + needsUpdate);

  await prisma.$disconnect();
}
compare();
