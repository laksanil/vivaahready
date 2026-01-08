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

async function listFiles() {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const query = process.argv[2] || '';
  const folderId = process.argv[3] || null;

  let queryString = "trashed = false";

  if (query) {
    queryString += ` and name contains '${query}'`;
  }

  if (folderId) {
    queryString += ` and '${folderId}' in parents`;
  }

  try {
    const response = await drive.files.list({
      q: queryString,
      pageSize: 50,
      fields: 'files(id, name, mimeType, modifiedTime, size, parents)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files;

    if (!files || files.length === 0) {
      console.log('No files found.');
      return;
    }

    console.log('\n📁 Google Drive Files:\n');
    console.log('─'.repeat(80));

    for (const file of files) {
      const type = getFileType(file.mimeType);
      const size = file.size ? formatBytes(parseInt(file.size)) : '-';
      const modified = new Date(file.modifiedTime).toLocaleDateString();

      console.log(`${type}  ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Modified: ${modified} | Size: ${size}`);
      console.log('');
    }

    console.log('─'.repeat(80));
    console.log(`Total: ${files.length} files\n`);
    console.log('To export a Google Sheet to CSV:');
    console.log('  npm run export -- <FILE_ID> <output.csv>\n');

  } catch (err) {
    console.error('Error listing files:', err.message);
  }
}

function getFileType(mimeType) {
  const types = {
    'application/vnd.google-apps.folder': '📁',
    'application/vnd.google-apps.spreadsheet': '📊',
    'application/vnd.google-apps.document': '📄',
    'application/vnd.google-apps.presentation': '📽️',
    'application/pdf': '📕',
    'image/': '🖼️',
    'video/': '🎬',
    'audio/': '🎵',
  };

  for (const [key, emoji] of Object.entries(types)) {
    if (mimeType.includes(key)) return emoji;
  }
  return '📄';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

listFiles().catch(console.error);
