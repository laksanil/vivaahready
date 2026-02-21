import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { isAdminAuthenticated } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || 'all').toLowerCase()
    const context = (searchParams.get('context') || 'all').trim()
    const responseKind = (searchParams.get('responseKind') || 'all').toLowerCase()
    const needsResponse = (searchParams.get('needsResponse') || 'all').toLowerCase()
    const search = (searchParams.get('search') || '').trim()
    const limitRaw = Number(searchParams.get('limit') || '100')
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 100

    const validStatuses = new Set(['all', 'new', 'read', 'replied', 'resolved'])
    if (!validStatuses.has(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }

    const validNeedsResponse = new Set(['all', 'yes', 'no'])
    if (!validNeedsResponse.has(needsResponse)) {
      return NextResponse.json({ error: 'Invalid needsResponse filter' }, { status: 400 })
    }

    const validResponseKinds = new Set(['all', 'email', 'sms', 'whatsapp', 'none'])
    if (!validResponseKinds.has(responseKind)) {
      return NextResponse.json({ error: 'Invalid responseKind filter' }, { status: 400 })
    }

    const whereClauses: Prisma.SupportMessageWhereInput[] = []

    if (status !== 'all') {
      whereClauses.push({ status })
    }

    if (context && context !== 'all') {
      whereClauses.push({ context })
    }

    if (needsResponse === 'yes') {
      whereClauses.push({ status: { in: ['new', 'read'] } })
    } else if (needsResponse === 'no') {
      whereClauses.push({ status: { in: ['replied', 'resolved'] } })
    }

    if (responseKind === 'none') {
      whereClauses.push({ respondedVia: null })
    } else if (responseKind !== 'all') {
      whereClauses.push({ respondedVia: responseKind })
    }

    if (search) {
      whereClauses.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    const where: Prisma.SupportMessageWhereInput = whereClauses.length ? { AND: whereClauses } : {}
    const withExtra = (extra: Prisma.SupportMessageWhereInput): Prisma.SupportMessageWhereInput =>
      whereClauses.length ? { AND: [...whereClauses, extra] } : extra

    const [messages, total, newCount, needsResponseCount, repliedCount, resolvedCount] = await Promise.all([
      prisma.supportMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.supportMessage.count({ where }),
      prisma.supportMessage.count({ where: withExtra({ status: 'new' }) }),
      prisma.supportMessage.count({ where: withExtra({ status: { in: ['new', 'read'] } }) }),
      prisma.supportMessage.count({ where: withExtra({ status: 'replied' }) }),
      prisma.supportMessage.count({ where: withExtra({ status: 'resolved' }) }),
    ])

    return NextResponse.json({
      messages,
      total,
      summary: {
        newCount,
        needsResponseCount,
        repliedCount,
        resolvedCount,
      },
    })
  } catch (error) {
    console.error('Error fetching support messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
