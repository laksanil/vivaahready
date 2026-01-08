import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH) || !fs.existsSync(TOKEN_PATH)) {
    console.log('❌ Not authenticated. Run: npm run auth');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret);
  oauth2Client.setCredentials(token);

  return oauth2Client;
}

async function readSheet() {
  const spreadsheetId = process.argv[2];
  const range = process.argv[3] || 'Sheet1';

  if (!spreadsheetId) {
    console.log('Usage: node read-sheet.js <SPREADSHEET_ID> [RANGE]');
    console.log('\nExamples:');
    console.log('  node read-sheet.js 1abc123xyz');
    console.log('  node read-sheet.js 1abc123xyz "Sheet1!A1:Z100"');
    console.log('\nTo get SPREADSHEET_ID, run: npm run list');
    process.exit(1);
  }

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties.title',
    });

    console.log(`\n📊 Spreadsheet: ${metadata.data.properties.title}`);
    console.log(`   Sheets: ${metadata.data.sheets.map(s => s.properties.title).join(', ')}\n`);

    // Get data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return;
    }

    console.log(`📋 Data from "${range}" (${rows.length} rows):`);
    console.log('─'.repeat(80));

    // Print header row
    if (rows.length > 0) {
      const headers = rows[0];
      console.log('\n🔹 Headers:', headers.join(' | '));
      console.log('');
    }

    // Print data rows (limit to first 20 for preview)
    const dataRows = rows.slice(1, 21);
    dataRows.forEach((row, i) => {
      console.log(`Row ${i + 1}:`, row.join(' | '));
    });

    if (rows.length > 21) {
      console.log(`\n... and ${rows.length - 21} more rows`);
    }

    console.log('─'.repeat(80));

    // Output as JSON for easy consumption
    const outputPath = path.join(__dirname, 'downloads', 'sheet-data.json');
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    // Convert to objects using headers
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n✅ Full data saved to: ${outputPath}\n`);

  } catch (err) {
    console.error('Error reading spreadsheet:', err.message);
  }
}

readSheet().catch(console.error);
