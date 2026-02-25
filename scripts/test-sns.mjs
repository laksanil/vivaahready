#!/usr/bin/env node
/**
 * Local SNS Test Script
 * Usage: node scripts/test-sns.mjs +19251234567
 */
import { SNSClient, PublishCommand, GetSMSAttributesCommand } from '@aws-sdk/client-sns'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually (no dotenv dependency)
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
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  if (!process.env[key]) process.env[key] = val
}

const phoneNumber = process.argv[2]

if (!phoneNumber) {
  console.error('Usage: node scripts/test-sns.mjs +19251234567')
  process.exit(1)
}

const region = process.env.AWS_REGION || 'us-east-1'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in .env.local')
  process.exit(1)
}

console.log('--- SNS Configuration ---')
console.log(`Region:        ${region}`)
console.log(`Access Key:    ${accessKeyId.slice(0, 8)}...`)
console.log(`Sender ID:     ${process.env.SNS_SMS_SENDER_ID || '(not set)'}`)
console.log(`Phone:         ${phoneNumber}`)
console.log('')

const client = new SNSClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
})

// Send a test SMS
console.log('Sending test SMS to', phoneNumber, '...')
try {
  const messageAttributes = {
    'AWS.SNS.SMS.SMSType': {
      DataType: 'String',
      StringValue: 'Transactional',
    },
  }

  if (process.env.SNS_SMS_SENDER_ID) {
    messageAttributes['AWS.SNS.SMS.SenderID'] = {
      DataType: 'String',
      StringValue: process.env.SNS_SMS_SENDER_ID,
    }
  }

  const result = await client.send(
    new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: 'VivaahReady test: Your SNS integration is working! This is a test message.',
      MessageAttributes: messageAttributes,
    })
  )
  console.log(`  OK - SMS sent! MessageId: ${result.MessageId}`)
  console.log('\n--- SUCCESS: SNS is fully working ---')
  console.log('Check your phone for the test message.')
} catch (err) {
  console.error(`  FAIL - SMS sending failed: ${err.message}`)
  if (err.name === 'AuthorizationErrorException') {
    console.error('  -> The IAM user does not have sns:Publish permission for SMS.')
  }
  process.exit(1)
}
