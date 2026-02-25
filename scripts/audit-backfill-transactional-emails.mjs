import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()

const SUCCESS_EVENTS = new Set(['delivered', 'opened', 'clicked'])
const FAILED_EVENTS = new Set(['failed', 'bounced', 'suppressed', 'canceled'])

function parseArgs(argv) {
  const out = {
    apply: false,
    retryFailed: false,
    maxPages: 60,
    sendLimit: Infinity,
    reportJson: false,
    since: null,
    types: new Set(['welcome', 'new_interest', 'interest_accepted', 'profile_approved']),
  }

  for (const arg of argv) {
    if (arg === '--apply') out.apply = true
    else if (arg === '--retry-failed') out.retryFailed = true
    else if (arg === '--report-json') out.reportJson = true
    else if (arg.startsWith('--max-pages=')) out.maxPages = Number(arg.split('=')[1] || 60)
    else if (arg.startsWith('--send-limit=')) out.sendLimit = Number(arg.split('=')[1] || Infinity)
    else if (arg.startsWith('--since=')) out.since = new Date(arg.split('=')[1])
    else if (arg.startsWith('--types=')) {
      out.types = new Set(
        String(arg.split('=')[1] || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      )
    }
  }

  if (Number.isNaN(out.maxPages) || out.maxPages < 1) out.maxPages = 60
  if (Number.isNaN(out.sendLimit) || out.sendLimit < 1) out.sendLimit = Infinity
  if (out.since && Number.isNaN(out.since.getTime())) out.since = null

  return out
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function firstName(name) {
  const value = String(name || '').trim()
  return value ? value.split(/\s+/)[0] : 'Someone'
}

function classifyType(subject) {
  const s = String(subject || '')
  if (s === 'Welcome to VivaahReady!') return 'welcome'
  if (/is interested in you on VivaahReady!/i.test(s)) return 'new_interest'
  if (/accepted your interest on VivaahReady/i.test(s)) return 'interest_accepted'
  if (s === 'Your VivaahReady profile is approved!') return 'profile_approved'
  if (/You have .* on VivaahReady/i.test(s)) return 'new_match'
  return 'other'
}

function eventState(lastEvent) {
  const e = String(lastEvent || '').toLowerCase()
  if (SUCCESS_EVENTS.has(e)) return 'success'
  if (FAILED_EVENTS.has(e)) return 'failed'
  return 'other'
}

function makeKey(type, to, subject) {
  return `${type}|${normalizeEmail(to)}|${String(subject || '').trim()}`
}

async function fetchAllResendEmails({ apiKey, maxPages }) {
  let after
  const rows = []

  for (let page = 1; page <= maxPages; page += 1) {
    const qs = new URLSearchParams({ limit: '100' })
    if (after) qs.set('after', after)
    const url = `https://api.resend.com/emails?${qs.toString()}`

    let res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (res.status === 429) {
      await sleep(1250)
      res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    }
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Resend API ${res.status}: ${text.slice(0, 250)}`)
    }

    const payload = await res.json()
    const data = payload?.data || []
    if (!data.length) break

    rows.push(...data)
    after = data[data.length - 1]?.id
    await sleep(250)
  }

  return rows
}

function buildResendIndex(resendRows) {
  const byKey = new Map()
  let earliest = null

  for (const row of resendRows) {
    const subject = String(row.subject || '')
    const type = classifyType(subject)
    const to = Array.isArray(row.to) ? row.to[0] : row.to
    const email = normalizeEmail(to)
    if (!email) continue

    const createdAt = new Date(row.created_at)
    if (!Number.isNaN(createdAt.getTime()) && (!earliest || createdAt < earliest)) {
      earliest = createdAt
    }

    const key = makeKey(type, email, subject)
    const state = eventState(row.last_event)

    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, {
        type,
        to: email,
        subject,
        states: new Set([state]),
        ids: row.id ? [row.id] : [],
        events: [
          {
            id: row.id,
            createdAt: row.created_at,
            lastEvent: row.last_event,
          },
        ],
      })
    } else {
      prev.states.add(state)
      if (row.id) prev.ids.push(row.id)
      prev.events.push({
        id: row.id,
        createdAt: row.created_at,
        lastEvent: row.last_event,
      })
    }
  }

  return { byKey, earliest }
}

async function collectExpectedEvents({ since, enabledTypes }) {
  const expected = []

  if (enabledTypes.has('welcome')) {
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: since },
        email: { not: '' },
        profile: {
          is: {
            isImported: false,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    for (const user of users) {
      expected.push({
        type: 'welcome',
        eventId: `welcome:${user.id}`,
        eventAt: user.createdAt,
        to: user.email,
        subject: 'Welcome to VivaahReady!',
        meta: {
          userId: user.id,
          name: user.name,
        },
      })
    }
  }

  const matchBaseSelect = {
    id: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    sender: {
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            id: true,
            firstName: true,
          },
        },
      },
    },
    receiver: {
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            id: true,
            firstName: true,
          },
        },
      },
    },
  }

  const matches = await prisma.match.findMany({
    where: {
      createdAt: { gte: since },
    },
    select: matchBaseSelect,
    orderBy: { createdAt: 'asc' },
  })

  if (enabledTypes.has('new_interest')) {
    for (const match of matches) {
      const receiverEmail = normalizeEmail(match.receiver?.email)
      if (!receiverEmail) continue

      // If a row was created already accepted and never updated, it came from immediate mutual flow.
      // In that path, "interest accepted" is sent instead of "new interest".
      const createdAsAccepted =
        match.status === 'accepted' &&
        Math.abs(new Date(match.updatedAt).getTime() - new Date(match.createdAt).getTime()) < 2_000
      if (createdAsAccepted) continue

      const senderFirstName =
        match.sender?.profile?.firstName || firstName(match.sender?.name) || 'Someone'

      expected.push({
        type: 'new_interest',
        eventId: `new_interest:${match.id}`,
        eventAt: match.createdAt,
        to: receiverEmail,
        subject: `💝 ${senderFirstName} is interested in you on VivaahReady!`,
        meta: {
          matchId: match.id,
          senderUserId: match.sender?.id || null,
          senderProfileId: match.sender?.profile?.id || null,
          senderFirstName,
          receiverUserId: match.receiver?.id || null,
        },
      })
    }
  }

  if (enabledTypes.has('interest_accepted')) {
    for (const match of matches) {
      if (match.status !== 'accepted') continue

      // Accepted in a later action; immediate mutual create has equal created/updated timestamps.
      const acceptedLater =
        new Date(match.updatedAt).getTime() - new Date(match.createdAt).getTime() >= 2_000
      if (!acceptedLater) continue

      const senderEmail = normalizeEmail(match.sender?.email)
      if (!senderEmail) continue

      const receiverFirstName =
        match.receiver?.profile?.firstName || firstName(match.receiver?.name) || 'Someone'

      expected.push({
        type: 'interest_accepted',
        eventId: `interest_accepted:${match.id}`,
        eventAt: match.updatedAt,
        to: senderEmail,
        subject: `🎉 It's a Match! ${receiverFirstName} accepted your interest on VivaahReady`,
        meta: {
          matchId: match.id,
          senderUserId: match.sender?.id || null,
          receiverUserId: match.receiver?.id || null,
          receiverProfileId: match.receiver?.profile?.id || null,
          receiverFirstName,
        },
      })
    }
  }

  if (enabledTypes.has('profile_approved')) {
    const approved = await prisma.profile.findMany({
      where: {
        approvalStatus: 'approved',
        approvalDate: { gte: since },
      },
      select: {
        id: true,
        userId: true,
        approvalDate: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { approvalDate: 'asc' },
    })

    for (const profile of approved) {
      const email = normalizeEmail(profile.user?.email)
      if (!email) continue

      expected.push({
        type: 'profile_approved',
        eventId: `profile_approved:${profile.id}`,
        eventAt: profile.approvalDate,
        to: email,
        subject: 'Your VivaahReady profile is approved!',
        meta: {
          profileId: profile.id,
          userId: profile.userId,
          name: profile.user?.name || 'there',
        },
      })
    }
  }

  return expected
}

function compareExpectedVsSent(expectedEvents, resendIndex) {
  const summary = {
    expected: expectedEvents.length,
    sentSuccess: 0,
    sentPending: 0,
    sentButFailed: 0,
    missing: 0,
  }

  const missing = []
  const failed = []
  const pending = []
  const ok = []

  for (const event of expectedEvents) {
    const key = makeKey(event.type, event.to, event.subject)
    const hit = resendIndex.byKey.get(key)

    if (!hit) {
      summary.missing += 1
      missing.push(event)
      continue
    }

    if (hit.states.has('success')) {
      summary.sentSuccess += 1
      ok.push({ event, hit })
      continue
    }

    // Provider has accepted the email but final delivery event may still be pending.
    if (hit.states.has('other')) {
      summary.sentPending += 1
      ok.push({ event, hit })
      pending.push({ event, hit })
      continue
    }

    if (hit.states.has('failed')) {
      summary.sentButFailed += 1
      failed.push({ event, hit })
      continue
    }
  }

  return { summary, missing, failed, pending, ok }
}

function buildEmailPayload(event) {
  const appUrl = 'https://vivaahready.com'
  const support = 'support@vivaahready.com'

  switch (event.type) {
    case 'welcome': {
      const name = firstName(event.meta?.name)
      const text = [
        `Hi ${name},`,
        '',
        'Welcome to VivaahReady.',
        'Your account is active. Complete your profile to start receiving meaningful matches.',
        '',
        `Continue: ${appUrl}/profile`,
        '',
        `Need help? ${support}`,
      ].join('\n')
      const html = `<p>Hi ${name},</p><p>Welcome to VivaahReady.</p><p>Your account is active. Complete your profile to start receiving meaningful matches.</p><p><a href="${appUrl}/profile">Continue to your profile</a></p><p>Need help? ${support}</p>`
      return { subject: event.subject, text, html }
    }
    case 'new_interest': {
      const sender = event.meta?.senderFirstName || 'Someone'
      const text = [
        `Hi,`,
        '',
        `${sender} is interested in you on VivaahReady.`,
        'Open Matches to review and respond.',
        '',
        `${appUrl}/matches`,
      ].join('\n')
      const html = `<p>Hi,</p><p><strong>${sender}</strong> is interested in you on VivaahReady.</p><p><a href="${appUrl}/matches">Open Matches</a> to review and respond.</p>`
      return { subject: event.subject, text, html }
    }
    case 'interest_accepted': {
      const receiver = event.meta?.receiverFirstName || 'Someone'
      const text = [
        'Great news,',
        '',
        `${receiver} accepted your interest on VivaahReady.`,
        'Open Connections to continue.',
        '',
        `${appUrl}/connections`,
      ].join('\n')
      const html = `<p>Great news,</p><p><strong>${receiver}</strong> accepted your interest on VivaahReady.</p><p><a href="${appUrl}/connections">Open Connections</a> to continue.</p>`
      return { subject: event.subject, text, html }
    }
    case 'profile_approved': {
      const name = firstName(event.meta?.name)
      const text = [
        `Hi ${name},`,
        '',
        'Your VivaahReady profile is approved.',
        'You can now view matches and start connecting.',
        '',
        `${appUrl}/matches`,
      ].join('\n')
      const html = `<p>Hi ${name},</p><p>Your VivaahReady profile is approved.</p><p>You can now view matches and start connecting.</p><p><a href="${appUrl}/matches">View Matches</a></p>`
      return { subject: event.subject, text, html }
    }
    default:
      return null
  }
}

async function sendBackfillEmails({ resendClient, candidates, sendLimit }) {
  const domainVerified = process.env.RESEND_DOMAIN_VERIFIED === 'true'
  const from = domainVerified
    ? 'VivaahReady <noreply@vivaahready.com>'
    : 'VivaahReady <onboarding@resend.dev>'

  const attempted = []
  let sent = 0

  for (const event of candidates) {
    if (sent >= sendLimit) break
    const to = normalizeEmail(event.to)
    if (!to || to.endsWith('@example.com')) continue

    const payload = buildEmailPayload(event)
    if (!payload) continue

    try {
      const result = await resendClient.emails.send({
        from,
        to: [to],
        replyTo: 'noreply@vivaahready.com',
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      })

      if (result?.error) {
        attempted.push({
          eventId: event.eventId,
          type: event.type,
          to,
          status: 'error',
          error: result.error,
        })
      } else {
        sent += 1
        attempted.push({
          eventId: event.eventId,
          type: event.type,
          to,
          status: 'sent',
          resendId: result?.data?.id,
        })
      }
    } catch (error) {
      attempted.push({
        eventId: event.eventId,
        type: event.type,
        to,
        status: 'exception',
        error: String(error),
      })
    }

    await sleep(275)
  }

  return attempted
}

function summarizeByType(events) {
  const byType = {}
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1
  }
  return byType
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    throw new Error('RESEND_API_KEY is required')
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  const resendRows = await fetchAllResendEmails({
    apiKey: resendKey,
    maxPages: args.maxPages,
  })
  const resendIndex = buildResendIndex(resendRows)

  const inferredSince = resendIndex.earliest || new Date('2026-01-01T00:00:00.000Z')
  const since = args.since || inferredSince

  const expected = await collectExpectedEvents({
    since,
    enabledTypes: args.types,
  })

  const compared = compareExpectedVsSent(expected, resendIndex)
  const missing = compared.missing
  const failed = compared.failed.map((x) => x.event)
  const sendCandidates = args.retryFailed ? [...missing, ...failed] : missing

  let attempted = []
  if (args.apply && sendCandidates.length > 0) {
    const resendClient = new Resend(resendKey)
    attempted = await sendBackfillEmails({
      resendClient,
      candidates: sendCandidates,
      sendLimit: args.sendLimit,
    })
  }

  const result = {
    generatedAt: new Date().toISOString(),
    mode: args.apply ? 'apply' : 'dry-run',
    retryFailed: args.retryFailed,
    since: since.toISOString(),
    resendRowsScanned: resendRows.length,
    expectedSummary: {
      total: compared.summary.expected,
      byType: summarizeByType(expected),
    },
    coverageSummary: {
      sentSuccess: compared.summary.sentSuccess,
      sentPending: compared.summary.sentPending,
      sentButFailed: compared.summary.sentButFailed,
      missing: compared.summary.missing,
      missingByType: summarizeByType(missing),
      failedByType: summarizeByType(failed),
    },
    sampleMissing: missing.slice(0, 25),
    sampleFailed: failed.slice(0, 25),
    samplePending: compared.pending.slice(0, 25).map((x) => x.event),
    attempted: attempted.slice(0, 200),
    attemptedCount: attempted.length,
    attemptedSentCount: attempted.filter((a) => a.status === 'sent').length,
    attemptedFailedCount: attempted.filter((a) => a.status !== 'sent').length,
  }

  if (args.reportJson) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log('=== Transactional Email Audit ===')
  console.log(`Mode: ${result.mode}`)
  console.log(`Since: ${result.since}`)
  console.log(`Resend rows scanned: ${result.resendRowsScanned}`)
  console.log('')
  console.log('Expected events:', result.expectedSummary.total, result.expectedSummary.byType)
  console.log('Coverage:', result.coverageSummary)
  if (!args.apply) {
    console.log('Dry run only. Re-run with --apply to send missing emails.')
  } else {
    console.log('Backfill send results:', {
      attempted: result.attemptedCount,
      sent: result.attemptedSentCount,
      failed: result.attemptedFailedCount,
    })
  }
}

main()
  .catch((error) => {
    console.error(error?.stack || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
