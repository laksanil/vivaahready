import * as fs from "fs";

// Parse CSV (handles quoted fields with commas)
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let fields: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++; // skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else if ((char === "\n" || (char === "\r" && next === "\n")) && !inQuotes) {
      fields.push(current);
      rows.push(fields);
      fields = [];
      current = "";
      if (char === "\r") i++; // skip \n
    } else if (char === "\r" && !inQuotes) {
      fields.push(current);
      rows.push(fields);
      fields = [];
      current = "";
    } else {
      current += char;
    }
  }
  // Last field/row
  if (current || fields.length > 0) {
    fields.push(current);
    rows.push(fields);
  }
  return rows;
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  // Check if phone has "(India)" suffix - these are Indian numbers
  const isIndia = /\(india\)/i.test(trimmed);

  // If already has a country code prefix (+91, +1, +44, etc.), just strip spaces/dashes
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.replace(/[^0-9]/g, "");
  }

  // Strip non-digits
  const digits = trimmed.replace(/[^0-9]/g, "");

  if (isIndia) {
    // Indian numbers: 10 digits without country code
    if (digits.length === 10) {
      return "+91" + digits;
    }
    // 12 digits starting with 91 = already has country code
    if (digits.length === 12 && digits.startsWith("91")) {
      return "+" + digits;
    }
    return "+91" + digits;
  }

  // If 10 digits, assume US/Canada number
  if (digits.length === 10) {
    return "+1" + digits;
  }
  // If 11 digits starting with 1, already has country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }
  // Otherwise just prepend +1
  return "+1" + digits;
}

function main() {
  const csvContent = fs.readFileSync("bsna-leads.csv", "utf-8");
  const rows = parseCSV(csvContent);

  // Header is row 0
  const header = rows[0];
  console.log("Columns found:", header.length);

  // Find phone column index - column 5 is "What is your phone number"
  // Also get name columns: col 8 = First Name, col 7 = Last Name
  // Contact phone: col 25
  const phoneColIdx = 4; // "What is your phone number(USA/Canada only)"
  const nameColIdx = 3; // "What is your name (last name, first name)?"
  const candidateFirstIdx = 8; // Candidate First Name
  const candidateLastIdx = 7; // Candidate Last Name
  const contactPhoneIdx = 25; // Contact phone number

  interface Contact {
    name: string;
    phone: string;
    normalized: string;
    waNumber: string;
  }

  const contacts: Contact[] = [];
  const seenPhones = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 10) continue;

    // Get candidate name
    const candidateFirst = (row[candidateFirstIdx] || "").trim();
    const candidateLast = (row[candidateLastIdx] || "").trim();
    const fillerName = (row[nameColIdx] || "").trim();
    const name = candidateFirst
      ? `${candidateFirst} ${candidateLast}`.trim()
      : fillerName || "Unknown";

    // Try filler's phone first, then contact phone
    let phone = (row[phoneColIdx] || "").trim();
    if (!phone || phone.length < 7) {
      phone = (row[contactPhoneIdx] || "").trim();
    }
    if (!phone || phone.length < 7) continue;

    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 10) continue;

    // Deduplicate by normalized phone
    if (seenPhones.has(normalized)) continue;
    seenPhones.add(normalized);

    const waNumber = normalized.replace("+", "");
    contacts.push({ name, phone, normalized, waNumber });
  }

  console.log(`Found ${contacts.length} unique contacts with phone numbers`);

  const message = `Hello,

Welcome to VivaahReady - a premium, tech-forward, trust-first matrimonial platform for South Asian families in the U.S.

VivaahReady eliminates outdated profiles and the guesswork of whether you meet the other person's preferences by showing mutual matches only in a private, respectful workflow.

Started by Brahmins, VivaahReady is built with a deep understanding of our community's values, traditions, and preferences.

How VivaahReady works:

- Create your profile (free)
- View mutual matches only (your preferences match theirs, and theirs match yours)
- Express/accept interest on the website
- Contact details are shared only after mutual interest

Privacy & Trust:

- Names and photos are visible only to verified members

Founding Members Offer (ends March 1, 2026):
Get 50% off verification.

Create your free profile:
https://vivaahready.com

Questions:
support@vivaahready.com
WhatsApp: +1 (925) 819-3653

Warmly,
Team VivaahReady`;

  // Build HTML rows
  let htmlRows = "";
  contacts.forEach((c, i) => {
    const num = i + 1;
    htmlRows += `
      <tr id="row-${num}">
        <td style="padding:8px;border-bottom:1px solid #eee;">${num}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <input type="checkbox" onchange="updateCount()" class="sent-check" />
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;"><strong>${c.name}</strong></td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${c.phone} &rarr; <strong>${c.normalized}</strong></td>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <button onclick="openWA('${c.waNumber}')"
             style="background:#25D366;color:white;padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:14px;">
            Send via WhatsApp
          </button>
        </td>
      </tr>`;
  });

  const count = contacts.length;
  const jsMessage = message.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VivaahReady - Lead Outreach via WhatsApp</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 1000px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #dc2626; }
    .counter { position: sticky; top: 0; background: white; padding: 16px 0; font-size: 18px; border-bottom: 2px solid #eee; z-index: 10; }
    .copy-btn { background: #6b7280; color: white; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; margin-top: 10px; }
    .copy-btn:hover { background: #4b5563; }
    .msg-box { background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 16px 0; white-space: pre-wrap; font-size: 13px; max-height: 200px; overflow-y: auto; }
  </style>
  <script>
    var MSG = \`${jsMessage}\`;

    function openWA(phone) {
      var url = 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + encodeURIComponent(MSG);
      window.open(url, '_blank');
    }

    function updateCount() {
      var checks = document.querySelectorAll('.sent-check');
      var sent = 0;
      checks.forEach(function(c) { if (c.checked) sent++; });
      document.getElementById('counter').textContent = 'Sent: ' + sent + ' / ${count}';
    }

    function copyMessage() {
      navigator.clipboard.writeText(MSG).then(function() {
        var btn = document.getElementById('copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy Message'; }, 2000);
      });
    }
  </script>
</head>
<body>
  <h1>VivaahReady - Lead Outreach (BSNA)</h1>
  <div class="counter" id="counter">Sent: 0 / ${count}</div>
  <p>Click each button to open WhatsApp with a pre-filled message. Check the box after sending.</p>
  <details>
    <summary style="cursor:pointer;color:#dc2626;font-weight:bold;">View / Copy Message</summary>
    <div class="msg-box">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    <button class="copy-btn" id="copy-btn" onclick="copyMessage()">Copy Message</button>
  </details>
  <br>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Sent</th>
        <th>Name</th>
        <th>Phone</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${htmlRows}
    </tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync("vivaahready-leads-whatsapp.html", html);
  console.log(`Generated vivaahready-leads-whatsapp.html with ${count} contacts`);

  // Print summary
  console.log("\n=== PHONE NORMALIZATION SUMMARY ===");
  contacts.forEach((c) => {
    const prefix = c.phone.trim().startsWith("+") ? "KEPT AS-IS" : "ADDED +1";
    console.log(`${c.name}: ${c.phone} → ${c.normalized} [${prefix}]`);
  });
}

main();
