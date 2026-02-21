import { readFileSync } from 'fs'
import { Resend } from 'resend'

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

const targetEmails = [
  'sunnygovind24@gmail.com',
  'apv737@gmail.com',
  'vamsiraman13@gmail.com',
  'santosh.pingali12@gmail.com',
  'nagaveena.raju@gmail.com',
  'avanukur@gmail.com',
]

async function main() {
  // Resend list only returns 20 by default. Try fetching more.
  // Check if we can use pagination or search
  let allEmails = []
  let hasMore = true
  let lastId = undefined

  // Paginate through all emails
  while (hasMore) {
    const params = lastId ? { starting_after: lastId } : {}
    const { data, error } = await resend.emails.list(params)
    if (error) {
      console.error('Error:', error)
      break
    }
    const emails = data?.data || []
    if (emails.length === 0) {
      hasMore = false
    } else {
      allEmails = allEmails.concat(emails)
      lastId = emails[emails.length - 1].id
      // Safety limit
      if (allEmails.length > 200) {
        hasMore = false
      }
    }
  }

  console.log(`Total emails fetched from Resend: ${allEmails.length}`)

  for (const target of targetEmails) {
    const matching = allEmails.filter(e => {
      const to = Array.isArray(e.to) ? e.to : [e.to]
      return to.some(t => t === target)
    })
    if (matching.length > 0) {
      matching.forEach(m => {
        console.log(`✓ ${target} | Subject: ${m.subject} | Status: ${m.last_event} | Sent: ${m.created_at}`)
      })
    } else {
      console.log(`✗ ${target} | No email found in Resend history`)
    }
  }
}

main()
