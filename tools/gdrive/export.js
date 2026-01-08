import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const DOWNLOADS_PATH = path.join(__dirname, 'downloads');

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

async function exportFile() {
  const fileId = process.argv[2];
  const outputName = process.argv[3];

  if (!fileId) {
    console.log('Usage: npm run export -- <FILE_ID> [output_name]');
    console.log('\nTo get FILE_ID, run: npm run list');
    process.exit(1);
  }

  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  // Create downloads directory
  if (!fs.existsSync(DOWNLOADS_PATH)) {
    fs.mkdirSync(DOWNLOADS_PATH, { recursive: true });
  }

  try {
    // Get file metadata
    const fileInfo = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    });

    const { name, mimeType } = fileInfo.data;
    console.log(`\n📥 Exporting: ${name}`);
    console.log(`   Type: ${mimeType}\n`);

    let outputPath;
    let exportMimeType;

    // Handle Google Workspace files
    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      exportMimeType = 'text/csv';
      outputPath = path.join(DOWNLOADS_PATH, outputName || `${name}.csv`);

      const response = await drive.files.export(
        { fileId, mimeType: exportMimeType },
        { responseType: 'stream' }
      );

      const dest = fs.createWriteStream(outputPath);
      await new Promise((resolve, reject) => {
        response.data
          .on('end', resolve)
          .on('error', reject)
          .pipe(dest);
      });

      console.log(`✅ Exported to: ${outputPath}\n`);

      // Also show preview
      const content = fs.readFileSync(outputPath, 'utf8');
      const lines = content.split('\n').slice(0, 10);
      console.log('📋 Preview (first 10 rows):');
      console.log('─'.repeat(60));
      lines.forEach(line => console.log(line.substring(0, 100)));
      console.log('─'.repeat(60));

    } else if (mimeType === 'application/vnd.google-apps.document') {
      exportMimeType = 'text/plain';
      outputPath = path.join(DOWNLOADS_PATH, outputName || `${name}.txt`);

      const response = await drive.files.export(
        { fileId, mimeType: exportMimeType },
        { responseType: 'stream' }
      );

      const dest = fs.createWriteStream(outputPath);
      await new Promise((resolve, reject) => {
        response.data
          .on('end', resolve)
          .on('error', reject)
          .pipe(dest);
      });

      console.log(`✅ Exported to: ${outputPath}\n`);

    } else {
      // Regular file - download directly
      outputPath = path.join(DOWNLOADS_PATH, outputName || name);

      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const dest = fs.createWriteStream(outputPath);
      await new Promise((resolve, reject) => {
        response.data
          .on('end', resolve)
          .on('error', reject)
          .pipe(dest);
      });

      console.log(`✅ Downloaded to: ${outputPath}\n`);
    }

  } catch (err) {
    console.error('Error exporting file:', err.message);
  }
}

exportFile().catch(console.error);
