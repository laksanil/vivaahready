import { Resend } from 'resend'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  process.env[key] = val
}

const resend = new Resend(process.env.RESEND_API_KEY)

async function main() {
  const { data, error } = await resend.emails.list()
  if (error) { console.error(error); return }

  const allEmails = data?.data || []
  console.log('Total emails in Resend:', allEmails.length)

  const durgaEmails = allEmails.filter(e => {
    const to = Array.isArray(e.to) ? e.to.join(' ').toLowerCase() : (e.to || '').toLowerCase()
    const subject = (e.subject || '').toLowerCase()
    return to.includes('durga') || subject.includes('durga')
  })

  console.log('\nEmails matching "durga":', durgaEmails.length)
  durgaEmails.forEach(e => {
    console.log('---')
    console.log('To:', e.to)
    console.log('Subject:', e.subject)
    console.log('Status:', e.last_event)
    console.log('Created:', e.created_at)
  })

  if (durgaEmails.length === 0) {
    console.log('\nNo emails found matching "durga" in recipient or subject.')
    console.log('\nListing all recent emails:')
    allEmails.slice(0, 25).forEach(e => {
      console.log(`  ${e.created_at} | To: ${Array.isArray(e.to) ? e.to.join(', ') : e.to} | Subject: ${e.subject} | Status: ${e.last_event}`)
    })
  }
}

main()
