import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GDRIVE_PATH = path.join(__dirname, '..', 'tools', 'gdrive');
const TOKEN_PATH = path.join(GDRIVE_PATH, 'token.json');
const CREDENTIALS_PATH = path.join(GDRIVE_PATH, 'credentials.json');

const prisma = new PrismaClient();

// Spreadsheet IDs
const BRIDE_SHEET_ID = '19SaFoxXkgMOU1XDE_yAVCaL72FCSwkXpamsjVlwO7Ac';
const GROOM_SHEET_ID = '1IH6bTHmghTvlJkyodbk__TEcqePbgcww_1wdy0PTMR0';

async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH) || !fs.existsSync(TOKEN_PATH)) {
    console.log('❌ Google Drive not authenticated. Run: cd tools/gdrive && npm run auth');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret);
  oauth2Client.setCredentials(token);

  return oauth2Client;
}

async function fetchSheetData(auth, spreadsheetId, range) {
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

function parseRow(row, headers, gender) {
  const data = {};
  headers.forEach((header, i) => {
    data[header] = row[i] || '';
  });

  // Map form fields to database fields
  return {
    email: data['Email Address'] || '',
    name: data['Full Name'] || '',
    phone: data['Contact phone'] || '',
    gender: gender,
    maritalStatus: data['Marital status'] || '',
    dateOfBirth: data['Date of Birth MM/YYYY'] || '',
    placeOfBirth: data['Place of Birth'] || '',
    height: data['Height'] || '',
    dietaryPreference: data['Dietery Preference'] || data['Dietry Preference'] || '',
    languagesKnown: data['Languages Known'] || data['Languages known'] || '',
    linkedinProfile: data['LinkedIn profile link'] || data['Linkedin Profile link'] || '',
    facebookInstagram: data['Face book and Instagram profiles'] || data['Instagram and Facebook profiles'] || '',
    photoUrls: data['Your photos ( please upload up to 3 photos)'] || data['Your Latest photographs (Upto 3)'] || '',
    fatherName: data["Father's Name"] || '',
    motherName: data["Mother's Name"] || '',
    siblings: data['Siblings'] || '',
    familyLocation: data['Family Location'] || '',
    qualification: data['Qualification'] || '',
    university: data['University (Mention all the universities you have attended)'] || '',
    occupation: data['Occupation/Profession'] || '',
    annualIncome: data['Annual income or any other preference'] || '',
    currentLocation: data['Current Location (City, State)'] || data['Current Location'] || '',
    caste: data['Caste (and/or subcaste)'] || '',
    gotra: data['Gotra'] || '',
    aboutMe: data['About yourself , Hobbies and Interests'] || '',
    // Partner preferences
    prefHeight: data['Height'] && headers.indexOf('Height') !== headers.lastIndexOf('Height')
      ? row[headers.lastIndexOf('Height')] : (data['Height '] || ''),
    prefAgeDiff: data['Age Difference Range'] || '',
    prefLocation: data['Location preference (if any)'] || '',
    prefDiet: data['Dietry prefernce (if any)'] || '',
    prefCaste: data['Caste/Sub caste'] || '',
    prefGotra: data['Gothra'] || '',
    prefQualification: headers.includes('Qualification') ?
      row[headers.lastIndexOf('Qualification')] : '',
    prefIncome: headers.filter(h => h.includes('Annual income')).length > 1 ?
      row[headers.lastIndexOf('Annual income or any other preference')] : '',
    prefLanguage: data['Language Preference '] || '',
    prefCountry: data['Current Location'] || '',
    idealPartnerDesc: data['Describe, in your own words, the qualities you value in an ideal partner.'] || '',
    citizenship: data['Country of Citizenship'] || '',
    promoCode: data['Please add your promo code(if any)'] || '',
    referralSource: data['How did you hear about us?'] || '',
  };
}

async function importProfiles() {
  console.log('🚀 Starting profile import...\n');

  const auth = await getAuthClient();

  // Import Brides from Form Responses 1
  console.log('📊 Fetching Bride profiles (Form Responses 1)...');
  const brideData1 = await fetchSheetData(auth, BRIDE_SHEET_ID, 'Form Responses 1');

  // Import Brides from Form Responses 2
  console.log('📊 Fetching Bride profiles (Form Responses 2)...');
  const brideData2 = await fetchSheetData(auth, BRIDE_SHEET_ID, 'Form Responses 2');

  // Combine both sheets
  const allBrideData = [];
  if (brideData1.length > 1) {
    allBrideData.push({ headers: brideData1[0], rows: brideData1.slice(1) });
  }
  if (brideData2.length > 1) {
    allBrideData.push({ headers: brideData2[0], rows: brideData2.slice(1) });
  }

  for (const sheet of allBrideData) {
    const headers = sheet.headers;
    const rows = sheet.rows;

    console.log(`   Found ${rows.length} bride profiles in this sheet`);

    for (const row of rows) {
      const profile = parseRow(row, headers, 'female');

      if (!profile.email || profile.email === 'lnagasamudra1@gmail.com') continue; // Skip test entries

      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
            }
          });
          console.log(`   ✅ Created user: ${profile.name}`);
        }

        // Check if profile exists
        const existingProfile = await prisma.profile.findUnique({
          where: { userId: user.id }
        });

        if (!existingProfile) {
          await prisma.profile.create({
            data: {
              userId: user.id,
              gender: profile.gender,
              maritalStatus: profile.maritalStatus,
              dateOfBirth: profile.dateOfBirth,
              placeOfBirth: profile.placeOfBirth,
              height: profile.height,
              dietaryPreference: profile.dietaryPreference,
              languagesKnown: profile.languagesKnown,
              linkedinProfile: profile.linkedinProfile,
              facebookInstagram: profile.facebookInstagram,
              photoUrls: profile.photoUrls,
              fatherName: profile.fatherName,
              motherName: profile.motherName,
              siblings: profile.siblings,
              familyLocation: profile.familyLocation,
              qualification: profile.qualification,
              university: profile.university,
              occupation: profile.occupation,
              annualIncome: profile.annualIncome,
              currentLocation: profile.currentLocation,
              caste: profile.caste,
              gotra: profile.gotra,
              aboutMe: profile.aboutMe,
              prefHeight: profile.prefHeight,
              prefAgeDiff: profile.prefAgeDiff,
              prefLocation: profile.prefLocation,
              prefDiet: profile.prefDiet,
              prefCaste: profile.prefCaste,
              prefGotra: profile.prefGotra,
              prefQualification: profile.prefQualification,
              prefIncome: profile.prefIncome,
              idealPartnerDesc: profile.idealPartnerDesc,
              citizenship: profile.citizenship,
              promoCode: profile.promoCode,
              referralSource: profile.referralSource,
              isImported: true,
              isVerified: true,
            }
          });
          console.log(`   ✅ Created profile: ${profile.name}`);
        } else {
          console.log(`   ⏭️  Profile exists: ${profile.name}`);
        }
      } catch (err) {
        console.log(`   ❌ Error with ${profile.name}: ${err.message}`);
      }
    }
  }

  // Import Grooms
  console.log('\n📊 Fetching Groom profiles...');
  const groomData = await fetchSheetData(auth, GROOM_SHEET_ID, 'Form Responses 1');

  if (groomData.length > 1) {
    const headers = groomData[0];
    const rows = groomData.slice(1);

    console.log(`   Found ${rows.length} groom profiles`);

    for (const row of rows) {
      const profile = parseRow(row, headers, 'male');

      if (!profile.email) continue;

      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
            }
          });
          console.log(`   ✅ Created user: ${profile.name}`);
        }

        const existingProfile = await prisma.profile.findUnique({
          where: { userId: user.id }
        });

        if (!existingProfile) {
          await prisma.profile.create({
            data: {
              userId: user.id,
              gender: profile.gender,
              maritalStatus: profile.maritalStatus,
              dateOfBirth: profile.dateOfBirth,
              placeOfBirth: profile.placeOfBirth,
              height: profile.height,
              dietaryPreference: profile.dietaryPreference,
              languagesKnown: profile.languagesKnown,
              linkedinProfile: profile.linkedinProfile,
              facebookInstagram: profile.facebookInstagram,
              photoUrls: profile.photoUrls,
              fatherName: profile.fatherName,
              motherName: profile.motherName,
              siblings: profile.siblings,
              familyLocation: profile.familyLocation,
              qualification: profile.qualification,
              university: profile.university,
              occupation: profile.occupation,
              annualIncome: profile.annualIncome,
              currentLocation: profile.currentLocation,
              caste: profile.caste,
              gotra: profile.gotra,
              aboutMe: profile.aboutMe,
              prefHeight: profile.prefHeight,
              prefAgeDiff: profile.prefAgeDiff,
              prefLocation: profile.prefLocation,
              prefDiet: profile.prefDiet,
              prefCaste: profile.prefCaste,
              prefGotra: profile.prefGotra,
              prefQualification: profile.prefQualification,
              prefIncome: profile.prefIncome,
              prefLanguage: profile.prefLanguage,
              idealPartnerDesc: profile.idealPartnerDesc,
              citizenship: profile.citizenship,
              promoCode: profile.promoCode,
              referralSource: profile.referralSource,
              isImported: true,
              isVerified: true,
            }
          });
          console.log(`   ✅ Created profile: ${profile.name}`);
        } else {
          console.log(`   ⏭️  Profile exists: ${profile.name}`);
        }
      } catch (err) {
        console.log(`   ❌ Error with ${profile.name}: ${err.message}`);
      }
    }
  }

  // Summary
  const userCount = await prisma.user.count();
  const profileCount = await prisma.profile.count();
  const brideCount = await prisma.profile.count({ where: { gender: 'female' } });
  const groomCount = await prisma.profile.count({ where: { gender: 'male' } });

  console.log('\n═══════════════════════════════════════');
  console.log('📊 Import Summary:');
  console.log(`   Total Users: ${userCount}`);
  console.log(`   Total Profiles: ${profileCount}`);
  console.log(`   Brides: ${brideCount}`);
  console.log(`   Grooms: ${groomCount}`);
  console.log('═══════════════════════════════════════\n');

  await prisma.$disconnect();
}

importProfiles().catch(console.error);
