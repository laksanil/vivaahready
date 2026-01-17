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

// Comprehensive qualification mapping - maps free text to highest appropriate qualification
const QUALIFICATION_MAP = {
  // Direct mappings
  'masters': 'masters',
  'master': 'masters',
  "master's": 'masters',
  'ms': 'masters',
  'm.s': 'masters',
  'm.s.': 'masters',
  'mtech': 'masters',
  'm.tech': 'masters',
  'm tech': 'masters',
  'msc': 'masters',
  'm.sc': 'masters',
  'm.sc.': 'masters',
  'ma': 'masters',
  'm.a': 'masters',
  'm.a.': 'masters',
  'mcom': 'masters',
  'm.com': 'masters',
  'post graduate': 'masters',
  'postgraduate': 'masters',
  'pg': 'masters',
  
  'bachelors': 'undergrad',
  'bachelor': 'undergrad',
  "bachelor's": 'undergrad',
  'undergraduate': 'undergrad',
  'undergrad': 'undergrad',
  'bs': 'undergrad',
  'b.s': 'undergrad',
  'b.s.': 'undergrad',
  'btech': 'undergrad',
  'b.tech': 'undergrad',
  'b tech': 'undergrad',
  'be': 'undergrad',
  'b.e': 'undergrad',
  'b.e.': 'undergrad',
  'bsc': 'undergrad',
  'b.sc': 'undergrad',
  'b.sc.': 'undergrad',
  'ba': 'undergrad',
  'b.a': 'undergrad',
  'b.a.': 'undergrad',
  'bcom': 'undergrad',
  'b.com': 'undergrad',
  'bba': 'undergrad',
  
  'phd': 'phd',
  'ph.d': 'phd',
  'ph.d.': 'phd',
  'doctorate': 'phd',
  'doctoral': 'phd',
  
  'mba': 'mba',
  'm.b.a': 'mba',
  'm.b.a.': 'mba',
  
  'md': 'md',
  'm.d': 'md',
  'm.d.': 'md',
  'doctor': 'md',
  
  'mbbs': 'mbbs',
  'm.b.b.s': 'mbbs',
  'm.b.b.s.': 'mbbs',
  
  'high school': 'high_school',
  'highschool': 'high_school',
  '12th': 'high_school',
  '+2': 'high_school',
  
  'diploma': 'diploma',
  
  'ca': 'ca_cpa',
  'cpa': 'ca_cpa',
  'chartered accountant': 'ca_cpa',
  
  'llb': 'llb',
  'l.l.b': 'llb',
  'law': 'llb',
  
  'llm': 'llm',
  'l.l.m': 'llm',
};

// Function to determine highest qualification from free text
function mapQualification(text) {
  if (!text) return null;
  
  const lowerText = text.toLowerCase().trim();
  
  // Direct match first
  if (QUALIFICATION_MAP[lowerText]) {
    return QUALIFICATION_MAP[lowerText];
  }
  
  // Check for keywords indicating highest qualification
  // Priority order: PhD > MD > Masters/MBA > Bachelors
  
  if (lowerText.includes('phd') || lowerText.includes('ph.d') || lowerText.includes('doctorate')) {
    return 'phd';
  }
  
  if (lowerText.includes('md') || lowerText.includes('m.d') || (lowerText.includes('doctor') && !lowerText.includes('doctorate'))) {
    return 'md';
  }
  
  if (lowerText.includes('mbbs') || lowerText.includes('m.b.b.s')) {
    return 'mbbs';
  }
  
  if (lowerText.includes('mba') || lowerText.includes('m.b.a')) {
    return 'mba';
  }
  
  // Check for masters indicators
  if (lowerText.includes('masters') || lowerText.includes("master's") || 
      lowerText.includes(' ms ') || lowerText.includes(' ms,') || lowerText.startsWith('ms ') || lowerText.endsWith(' ms') || lowerText === 'ms' ||
      lowerText.includes('m.s') || lowerText.includes('mtech') || lowerText.includes('m.tech') ||
      lowerText.includes('msc') || lowerText.includes('m.sc') ||
      lowerText.includes('post graduate') || lowerText.includes('postgraduate') ||
      lowerText.includes('m.e') || lowerText.includes(' me ') || lowerText.startsWith('me ') ||
      lowerText.includes('mca') || lowerText.includes('m.c.a')) {
    return 'masters';
  }
  
  // Check for bachelors indicators
  if (lowerText.includes('bachelor') || lowerText.includes('undergraduate') || lowerText.includes('undergrad') ||
      lowerText.includes('b.s') || lowerText.includes('btech') || lowerText.includes('b.tech') ||
      lowerText.includes('b.e') || lowerText.includes('bsc') || lowerText.includes('b.sc') ||
      lowerText.includes('b.a') || lowerText.includes('bcom') || lowerText.includes('b.com') ||
      lowerText.includes('bba') || lowerText.includes('bca')) {
    return 'undergrad';
  }
  
  // Default to other if can't determine
  return 'other';
}

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

async function fixQualifications() {
  console.log('🔧 Fixing qualification mappings from spreadsheet data...\n');

  const auth = await getAuthClient();
  
  // Collect all email -> qualification mappings from spreadsheet
  const qualificationsByEmail = {};
  
  // Fetch brides
  console.log('📊 Fetching Bride spreadsheet data...');
  const brideData1 = await fetchSheetData(auth, BRIDE_SHEET_ID, 'Form Responses 1');
  const brideData2 = await fetchSheetData(auth, BRIDE_SHEET_ID, 'Form Responses 2');
  
  for (const sheetData of [brideData1, brideData2]) {
    if (sheetData.length > 1) {
      const headers = sheetData[0];
      const emailIdx = headers.findIndex(h => h.toLowerCase().includes('email'));
      const qualIdx = headers.indexOf('Qualification');
      
      console.log(`   Headers: ${headers.slice(0, 10).join(', ')}...`);
      console.log(`   Email column index: ${emailIdx}, Qualification column index: ${qualIdx}`);
      
      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        const email = row[emailIdx]?.toLowerCase().trim();
        const qualification = row[qualIdx];
        
        if (email && qualification) {
          qualificationsByEmail[email] = qualification;
        }
      }
    }
  }
  
  // Fetch grooms
  console.log('📊 Fetching Groom spreadsheet data...');
  const groomData = await fetchSheetData(auth, GROOM_SHEET_ID, 'Form Responses 1');
  
  if (groomData.length > 1) {
    const headers = groomData[0];
    const emailIdx = headers.findIndex(h => h.toLowerCase().includes('email'));
    const qualIdx = headers.indexOf('Qualification');
    
    console.log(`   Headers: ${headers.slice(0, 10).join(', ')}...`);
    console.log(`   Email column index: ${emailIdx}, Qualification column index: ${qualIdx}`);
    
    for (let i = 1; i < groomData.length; i++) {
      const row = groomData[i];
      const email = row[emailIdx]?.toLowerCase().trim();
      const qualification = row[qualIdx];
      
      if (email && qualification) {
        qualificationsByEmail[email] = qualification;
      }
    }
  }
  
  console.log(`\n📋 Found ${Object.keys(qualificationsByEmail).length} qualification entries from spreadsheet\n`);
  
  // Show all spreadsheet qualifications
  console.log('=== Spreadsheet Qualifications ===');
  for (const [email, qual] of Object.entries(qualificationsByEmail)) {
    const mapped = mapQualification(qual);
    console.log(`${email}: "${qual}" -> ${mapped}`);
  }
  
  // Now update the database
  console.log('\n=== Updating Database ===');
  
  let updated = 0;
  let noChange = 0;
  let notFound = 0;
  
  for (const [email, spreadsheetQual] of Object.entries(qualificationsByEmail)) {
    const mappedQual = mapQualification(spreadsheetQual);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user || !user.profile) {
      console.log(`❌ No profile found for: ${email}`);
      notFound++;
      continue;
    }
    
    const currentQual = user.profile.qualification;
    
    if (currentQual !== mappedQual) {
      console.log(`✅ ${user.name}: "${currentQual}" -> "${mappedQual}" (spreadsheet: "${spreadsheetQual}")`);
      
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: { qualification: mappedQual }
      });
      updated++;
    } else {
      noChange++;
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Updated: ${updated}`);
  console.log(`No change needed: ${noChange}`);
  console.log(`Not found in DB: ${notFound}`);
  
  await prisma.$disconnect();
}

fixQualifications().catch(console.error);
