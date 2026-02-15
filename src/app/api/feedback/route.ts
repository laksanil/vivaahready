import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPhoneLast4, normalizePhoneE164 } from '@/lib/phone'
import { getTestAuthUser, resolveSessionUserId } from '@/lib/testAuth'

// Simple in-memory rate limiting: max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

const VALID_ISSUES = ['ease_of_use', 'match_quality', 'profile_experience', 'communication', 'technical', 'pricing', 'trust_safety', 'other']

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ ok: false, error: 'Too many submissions. Please try again later.' }, { status: 429 })
    }

    // ─── AUTH REQUIRED ─────────────────────────────
    const session = await getServerSession(authOptions)
    const sessionUserId = resolveSessionUserId(request, session)
    if (!sessionUserId) {
      return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const body = await request.json()

    // Honeypot check — silently accept to avoid revealing to bots
    if (body.honeypot) {
      return NextResponse.json({ ok: true })
    }

    const {
      fromUrl,
      submitUrl,
      userAgent,
      overallStars,
      primaryIssue,
      summaryText,
      stepBData,
      nps,
      referralSource,
      wantsFollowup,
      followupContact,
      followupTimeWindow,
      severity,
      issueTags,
      screenshotUrl,
    } = body

    // ─── Validation ─────────────────────────────────

    const stars = Number(overallStars)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Overall rating must be between 1 and 5' }, { status: 400 })
    }

    if (!primaryIssue || !VALID_ISSUES.includes(primaryIssue)) {
      return NextResponse.json({ error: 'Please select a valid issue category' }, { status: 400 })
    }

    const cleanSummary = typeof summaryText === 'string' ? summaryText.trim().slice(0, 140) : null

    let cleanNps: number | null = null
    if (nps !== null && nps !== undefined) {
      const n = Number(nps)
      if (Number.isInteger(n) && n >= 0 && n <= 10) cleanNps = n
    }

    let stepBJson: string | null = null
    if (stepBData && typeof stepBData === 'object') {
      const serialized = JSON.stringify(stepBData)
      if (serialized.length <= 10240) stepBJson = serialized
    }

    let issueTagsJson: string | null = null
    if (Array.isArray(issueTags) && issueTags.length > 0) {
      issueTagsJson = JSON.stringify(issueTags.slice(0, 20))
    }

    let cleanScreenshot: string | null = null
    if (typeof screenshotUrl === 'string' && screenshotUrl.startsWith('data:image/')) {
      if (screenshotUrl.length <= 2 * 1024 * 1024) cleanScreenshot = screenshotUrl
    }

    const sanitize = (val: unknown, max: number): string | null => {
      if (typeof val !== 'string') return null
      const trimmed = val.trim().slice(0, max)
      return trimmed || null
    }

    // ─── Server-side user context enrichment ─────────
    // Never trust client-provided userId/isVerified/phone — fetch from DB
    const testAuthUser = getTestAuthUser(request)

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: {
        id: true,
        phone: true,
        name: true,
        profile: {
          select: {
            id: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            sentMatches: true,
            receivedMatches: true,
          },
        },
      },
    }) || (testAuthUser ? {
      id: testAuthUser.id,
      phone: testAuthUser.phone,
      name: testAuthUser.name,
      profile: {
        id: testAuthUser.profileId,
        isVerified: testAuthUser.isVerified,
      },
      _count: {
        sentMatches: 0,
        receivedMatches: 0,
      },
    } : null)

    if (!dbUser) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 401 })
    }

    // ─── Phone validation (derived from profile, never from client) ──
    if (!dbUser.phone) {
      return NextResponse.json({ ok: false, error: 'PHONE_REQUIRED' }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneE164(dbUser.phone)
    if (!normalizedPhone) {
      return NextResponse.json({ ok: false, error: 'PHONE_REQUIRED' }, { status: 400 })
    }

    const phoneLast4 = getPhoneLast4(normalizedPhone)

    // Count interests sent/received
    let interestsSent = 0
    let interestsReceived = 0
    if (!testAuthUser) {
      ;[interestsSent, interestsReceived] = await Promise.all([
        prisma.match.count({ where: { senderId: dbUser.id } }),
        prisma.match.count({ where: { receiverId: dbUser.id } }),
      ])
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: dbUser.id,
        userPhone: normalizedPhone,
        userPhoneLast4: phoneLast4,
        userName: dbUser.name || null,
        isVerified: dbUser.profile?.isVerified ?? null,
        profileId: dbUser.profile?.id || null,
        matchesCount: dbUser._count.sentMatches + dbUser._count.receivedMatches,
        interestsSentCount: interestsSent,
        interestsReceivedCount: interestsReceived,
        fromUrl: sanitize(fromUrl, 500),
        submitUrl: sanitize(submitUrl, 500),
        userAgent: sanitize(userAgent, 500),
        overallStars: stars,
        primaryIssue,
        summaryText: cleanSummary,
        stepBData: stepBJson,
        nps: cleanNps,
        referralSource: sanitize(referralSource, 100),
        wantsFollowup: !!wantsFollowup,
        followupContact: sanitize(followupContact, 200),
        followupTimeWindow: sanitize(followupTimeWindow, 200),
        severity: sanitize(severity, 20),
        issueTags: issueTagsJson,
        screenshotUrl: cleanScreenshot,
      },
    })

    return NextResponse.json({ ok: true, id: feedback.id })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
