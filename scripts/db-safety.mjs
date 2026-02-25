#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = process.cwd()

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const content = fs.readFileSync(filePath, 'utf8')
  const env = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq < 0) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function defaultPort(protocol) {
  switch (protocol) {
    case 'postgresql:':
    case 'postgres:':
      return '5432'
    case 'mysql:':
      return '3306'
    case 'mongodb:':
    case 'mongodb+srv:':
      return '27017'
    default:
      return ''
  }
}

function normalizeDbUrl(value) {
  if (!value) return null
  try {
    const u = new URL(value)
    const protocol = u.protocol.toLowerCase()
    const hostname = u.hostname.toLowerCase()
    const port = u.port || defaultPort(protocol)
    const database = u.pathname.replace(/^\/+/, '')
    return `${protocol}//${hostname}:${port}/${database}`
  } catch {
    return String(value).trim()
  }
}

function summarizeDbUrl(value) {
  if (!value) return '(missing)'
  try {
    const u = new URL(value)
    const protocol = u.protocol.replace(':', '')
    const host = u.hostname
    const port = u.port ? `:${u.port}` : ''
    const database = u.pathname.replace(/^\/+/, '') || '(no-db)'
    return `${protocol}://${host}${port}/${database}`
  } catch {
    return '(unparseable DATABASE_URL)'
  }
}

function fail(message) {
  console.error(`[db-safety] ${message}`)
  process.exit(1)
}

function runIsolationCheck() {
  const envPath = path.join(root, '.env')
  const envLocalPath = path.join(root, '.env.local')

  const env = parseEnvFile(envPath)
  const envLocal = parseEnvFile(envLocalPath)

  const prodUrl = env.DATABASE_URL || process.env.PROD_DATABASE_URL || null
  const localUrl = envLocal.DATABASE_URL || null
  const effectiveUrl = process.env.DATABASE_URL || localUrl

  if (!localUrl) {
    fail('Missing DATABASE_URL in .env.local. Refusing to run local/dev commands.')
  }

  const normalizedProd = normalizeDbUrl(prodUrl)
  const normalizedLocal = normalizeDbUrl(localUrl)
  const normalizedEffective = normalizeDbUrl(effectiveUrl)

  if (normalizedProd && normalizedLocal && normalizedProd === normalizedLocal) {
    fail(
      [
        'Local database matches production baseline.',
        `- .env DATABASE_URL: ${summarizeDbUrl(prodUrl)}`,
        `- .env.local DATABASE_URL: ${summarizeDbUrl(localUrl)}`,
        'Set .env.local DATABASE_URL to a separate development database before continuing.',
      ].join('\n')
    )
  }

  if (normalizedProd && normalizedEffective && normalizedProd === normalizedEffective) {
    fail(
      [
        'Current DATABASE_URL resolves to production baseline.',
        `- Effective DATABASE_URL: ${summarizeDbUrl(effectiveUrl)}`,
        `- Production baseline: ${summarizeDbUrl(prodUrl)}`,
        'Unset shell DATABASE_URL or point it to a non-production database.',
      ].join('\n')
    )
  }

  console.log(
    [
      '[db-safety] OK: local DB isolation verified.',
      `- local (.env.local): ${summarizeDbUrl(localUrl)}`,
      normalizedProd ? `- prod baseline (.env): ${summarizeDbUrl(prodUrl)}` : '- prod baseline (.env): not set',
    ].join('\n')
  )

  return { envLocal, localUrl }
}

function runPrisma(args) {
  if (args.length === 0) {
    fail('No prisma arguments supplied. Example: node scripts/db-safety.mjs prisma db push')
  }

  const { envLocal, localUrl } = runIsolationCheck()
  const child = spawn('npx', ['prisma', ...args], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envLocal,
      DATABASE_URL: localUrl,
    },
  })

  child.on('exit', (code) => {
    process.exit(code ?? 1)
  })
}

function main() {
  const [mode, ...rest] = process.argv.slice(2)

  if (!mode || mode === 'check') {
    runIsolationCheck()
    return
  }

  if (mode === 'prisma') {
    runPrisma(rest)
    return
  }

  fail(`Unknown mode "${mode}". Use "check" or "prisma".`)
}

main()
