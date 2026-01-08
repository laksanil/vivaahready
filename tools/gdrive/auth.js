import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import open from 'open';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

async function authenticate() {
  // Check for credentials
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log('\n❌ credentials.json not found!\n');
    console.log('To set up Google Drive access:\n');
    console.log('1. Go to: https://console.cloud.google.com/');
    console.log('2. Create a new project (or select existing)');
    console.log('3. Enable "Google Drive API" and "Google Sheets API"');
    console.log('4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"');
    console.log('5. Choose "Desktop app" as application type');
    console.log('6. Download the JSON and save it as:');
    console.log(`   ${CREDENTIALS_PATH}\n`);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3333/callback'
  );

  // Check for existing token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(token);
    console.log('✅ Already authenticated! Token found.');

    // Test the token
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      await drive.files.list({ pageSize: 1 });
      console.log('✅ Token is valid.');
      return;
    } catch (err) {
      console.log('⚠️  Token expired, re-authenticating...');
    }
  }

  // Start OAuth flow
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔐 Opening browser for authentication...\n');

  // Create a simple HTTP server to receive the callback
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost:3333');
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');

        if (code) {
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          // Save token
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>✅ Authentication successful!</h1><p>You can close this window.</p></body></html>');

          console.log('✅ Authentication successful! Token saved.');

          server.close();
          process.exit(0);
        }
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      res.writeHead(500);
      res.end('Authentication failed');
      server.close();
      process.exit(1);
    }
  });

  server.listen(3333, () => {
    console.log('Waiting for authentication...');
    open(authUrl);
  });
}

authenticate().catch(console.error);
