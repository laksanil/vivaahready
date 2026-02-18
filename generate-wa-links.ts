import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();

  // If already has a country code prefix (+91, +1, +44, etc.), just strip spaces/dashes
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.replace(/[^0-9]/g, "");
  }

  // Otherwise it's a US number — strip non-digits and add +1
  const digits = trimmed.replace(/[^0-9]/g, "");
  return "+1" + digits;
}

async function main() {
  const users = await prisma.user.findMany({
    where: { profile: { isNot: null } },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

  const message = `Hi! This is VivaahReady (vivaahready.com).

We sincerely apologize for the delay in getting back to you. We've been working hard to build a better platform, and your profile is now LIVE on our brand new website!

As a token of our apology, we have waived the verification fee for your profile. Your profile has been verified and approved at no cost.

Please log in at https://vivaahready.com to explore your profile, browse matches, and connect with potential partners.

If you signed up with Gmail, just click "Continue with Google" to log in. Otherwise, use the "Sign in with Email" option with the email you registered with.

Thank you for your patience and trust in VivaahReady!

For any questions, reach us at support@vivaahready.com or WhatsApp: +1 (925) 577-7559`;

  // Generate VCF
  let vcf = "";
  for (const u of users) {
    if (!u.phone) continue;
    const normalized = normalizePhone(u.phone);
    const nameParts = (u.name || "Unknown").split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    vcf += `BEGIN:VCARD\n`;
    vcf += `VERSION:3.0\n`;
    vcf += `N:${lastName} (VR);${firstName};;;\n`;
    vcf += `FN:${firstName} ${lastName} (VR)\n`;
    vcf += `TEL;TYPE=CELL:${normalized}\n`;
    if (u.email) vcf += `EMAIL:${u.email}\n`;
    vcf += `END:VCARD\n\n`;
  }

  fs.writeFileSync("vivaahready-contacts.vcf", vcf);
  console.log("Generated vivaahready-contacts.vcf");

  // Build contacts data array for the HTML page
  const contacts: { name: string; phone: string; normalized: string; waNumber: string }[] = [];
  for (const u of users) {
    if (!u.phone) continue;
    const normalized = normalizePhone(u.phone);
    const waNumber = normalized.replace("+", "");
    contacts.push({
      name: u.name || "Unknown",
      phone: u.phone,
      normalized,
      waNumber,
    });
  }

  let rows = "";
  contacts.forEach((c, i) => {
    const num = i + 1;
    rows += `
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

  // Escape the message for embedding in JS (handle backticks, backslashes, etc.)
  const jsMessage = message.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VivaahReady WhatsApp Announcements</title>
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
  <h1>VivaahReady WhatsApp Announcements</h1>
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
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync("vivaahready-whatsapp-links.html", html);
  console.log("Generated vivaahready-whatsapp-links.html");
  console.log(`Total contacts: ${count}`);

  // Print summary of normalizations
  console.log("\n=== PHONE NORMALIZATION SUMMARY ===");
  for (const u of users) {
    if (!u.phone) continue;
    const normalized = normalizePhone(u.phone);
    const prefix = u.phone.trim().startsWith("+") ? "KEPT AS-IS" : "ADDED +1";
    console.log(`${u.name}: ${u.phone} → ${normalized} [${prefix}]`);
  }

  await prisma.$disconnect();
}

main();
