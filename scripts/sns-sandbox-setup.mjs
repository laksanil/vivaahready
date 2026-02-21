#!/usr/bin/env node
/**
 * SNS SMS Sandbox Setup
 * Adds a phone number to the sandbox and verifies it
 *
 * Usage:
 *   node scripts/sns-sandbox-setup.mjs add +15103968605
 *   node scripts/sns-sandbox-setup.mjs verify +15103968605 123456
 *   node scripts/sns-sandbox-setup.mjs list
 */
import {
  SNSClient,
  CreateSMSSandboxPhoneNumberCommand,
  VerifySMSSandboxPhoneNumberCommand,
  ListSMSSandboxPhoneNumbersCommand,
  GetSMSSandboxAccountStatusCommand,
} from '@aws-sdk/client-sns'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
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
  if (!process.env[key]) process.env[key] = val
}

const client = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const action = process.argv[2]
const phone = process.argv[3]
const otp = process.argv[4]

async function main() {
  // Check sandbox status
  try {
    const status = await client.send(new GetSMSSandboxAccountStatusCommand({}))
    console.log(`Account SMS sandbox status: ${status.IsInSandbox ? 'IN SANDBOX' : 'PRODUCTION'}`)
    if (!status.IsInSandbox) {
      console.log('Your account is in production mode - no sandbox setup needed!')
      return
    }
    console.log('Your account is in sandbox mode. You must verify destination phone numbers.\n')
  } catch (err) {
    console.error('Could not check sandbox status:', err.message)
  }

  if (action === 'list') {
    const result = await client.send(new ListSMSSandboxPhoneNumbersCommand({}))
    console.log('Sandbox phone numbers:')
    if (!result.PhoneNumbers?.length) {
      console.log('  (none)')
    } else {
      for (const p of result.PhoneNumbers) {
        console.log(`  ${p.PhoneNumber} - ${p.Status}`)
      }
    }
  } else if (action === 'add') {
    if (!phone) {
      console.error('Usage: node scripts/sns-sandbox-setup.mjs add +15103968605')
      process.exit(1)
    }
    console.log(`Adding ${phone} to SMS sandbox...`)
    await client.send(new CreateSMSSandboxPhoneNumberCommand({ PhoneNumber: phone }))
    console.log(`OK! A verification code has been sent to ${phone} via SMS.`)
    console.log(`Run: node scripts/sns-sandbox-setup.mjs verify ${phone} <code>`)
  } else if (action === 'verify') {
    if (!phone || !otp) {
      console.error('Usage: node scripts/sns-sandbox-setup.mjs verify +15103968605 123456')
      process.exit(1)
    }
    console.log(`Verifying ${phone} with code ${otp}...`)
    await client.send(new VerifySMSSandboxPhoneNumberCommand({
      PhoneNumber: phone,
      OneTimePassword: otp,
    }))
    console.log(`OK! ${phone} is now verified. You can send test SMS to this number.`)
  } else {
    console.log('Usage:')
    console.log('  node scripts/sns-sandbox-setup.mjs list')
    console.log('  node scripts/sns-sandbox-setup.mjs add +15103968605')
    console.log('  node scripts/sns-sandbox-setup.mjs verify +15103968605 123456')
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
