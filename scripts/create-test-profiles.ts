import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('TestPass123!', 10)

  // Test profiles - all emails to laksanil@yahoo.com using + alias
  const testUsers = [
    {
      email: 'laksanil+testmale1@yahoo.com',
      name: 'Rahul S.',
      phone: '+19255551001',
      profile: {
        firstName: 'Rahul',
        lastName: 'Sharma',
        gender: 'male',
        dateOfBirth: '03/15/1997', // ~27 years old
        height: "5'10\"",
        currentLocation: 'San Francisco, CA',
        zipCode: '94102',
        occupation: 'Software Engineer',
        qualification: 'masters_cs',
        university: 'Stanford University',
        annualIncome: '150-200K',
        religion: 'Hindu',
        community: 'Brahmin',
        subCommunity: 'Smartha',
        gotra: 'Bharadwaj',
        motherTongue: 'Telugu',
        maritalStatus: 'never_married',
        dietaryPreference: 'Vegetarian',
        citizenship: 'US Citizen',
        aboutMe: 'Software engineer at a tech startup. Love hiking, reading, and trying new cuisines. Looking for a life partner who shares similar values.',
        approvalStatus: 'approved',
        isVerified: true,
        // Preferences - compatible with female profile
        prefAgeMin: '24',
        prefAgeMax: '30',
        prefHeightMin: "5'2\"",
        prefHeightMax: "5'8\"",
        prefReligion: 'Hindu',
        prefCommunity: '["Brahmin", "doesnt_matter"]',
        prefDiet: 'Vegetarian',
        prefLocation: 'California',
        prefMaritalStatus: 'never_married',
      }
    },
    {
      email: 'laksanil+testmale2@yahoo.com',
      name: 'Arjun K.',
      phone: '+19255551002',
      profile: {
        firstName: 'Arjun',
        lastName: 'Kumar',
        gender: 'male',
        dateOfBirth: '07/22/1996', // ~28 years old
        height: "5'11\"",
        currentLocation: 'San Jose, CA',
        zipCode: '95112',
        occupation: 'Product Manager',
        qualification: 'mba',
        university: 'UC Berkeley',
        annualIncome: '175-225K',
        religion: 'Hindu',
        community: 'Brahmin',
        subCommunity: 'Iyengar',
        gotra: 'Kashyap',
        motherTongue: 'Tamil',
        maritalStatus: 'never_married',
        dietaryPreference: 'Vegetarian',
        citizenship: 'US Citizen',
        aboutMe: 'Product manager passionate about building great products. Enjoy traveling, music, and spending time with family. Seeking a thoughtful partner.',
        approvalStatus: 'approved',
        isVerified: true,
        // Preferences - compatible with female profile
        prefAgeMin: '23',
        prefAgeMax: '29',
        prefHeightMin: "5'0\"",
        prefHeightMax: "5'7\"",
        prefReligion: 'Hindu',
        prefCommunity: '["Brahmin", "doesnt_matter"]',
        prefDiet: 'Vegetarian',
        prefLocation: 'California',
        prefMaritalStatus: 'never_married',
      }
    },
    {
      email: 'laksanil+testfemale1@yahoo.com',
      name: 'Priya R.',
      phone: '+19255551003',
      profile: {
        firstName: 'Priya',
        lastName: 'Reddy',
        gender: 'female',
        dateOfBirth: '11/08/1998', // ~26 years old
        height: "5'5\"",
        currentLocation: 'Palo Alto, CA',
        zipCode: '94301',
        occupation: 'Data Scientist',
        qualification: 'masters_science',
        university: 'MIT',
        annualIncome: '140-180K',
        religion: 'Hindu',
        community: 'Brahmin',
        subCommunity: 'Smartha',
        gotra: 'Vasishta',
        motherTongue: 'Telugu',
        maritalStatus: 'never_married',
        dietaryPreference: 'Vegetarian',
        citizenship: 'US Citizen',
        aboutMe: 'Data scientist who loves solving complex problems. Enjoy yoga, cooking, and exploring new places. Looking for someone kind, ambitious, and family-oriented.',
        approvalStatus: 'approved',
        isVerified: true,
        // Preferences - compatible with male profiles
        prefAgeMin: '26',
        prefAgeMax: '32',
        prefHeightMin: "5'8\"",
        prefHeightMax: "6'2\"",
        prefReligion: 'Hindu',
        prefCommunity: '["Brahmin", "doesnt_matter"]',
        prefDiet: 'Vegetarian',
        prefLocation: 'California',
        prefMaritalStatus: 'never_married',
      }
    }
  ]

  console.log('Creating test profiles...\n')

  for (const userData of testUsers) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existing) {
      console.log(`User ${userData.email} already exists, skipping...`)
      continue
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        password: password,
        emailVerified: new Date(),
        phoneVerified: new Date(),
      }
    })

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        ...userData.profile,
        signupStep: 10,
        profileScore: 85,
      }
    })

    // Create subscription (mark as paid)
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'premium',
        status: 'active',
        profilePaid: true,
      }
    })

    console.log(`Created: ${userData.name} (${userData.email})`)
    console.log(`  Profile ID: ${profile.id}`)
    console.log(`  User ID: ${user.id}\n`)
  }

  console.log('Done! All test profiles created.')
  console.log('\nAll emails will go to: laksanil@yahoo.com')
  console.log('Password for all accounts: TestPass123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
