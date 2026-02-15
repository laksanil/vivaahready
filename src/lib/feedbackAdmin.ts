type FeedbackWhere = Record<string, unknown>

function parseValidDate(input: string | null): Date | null {
  if (!input) return null
  const parsed = new Date(input)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function buildFeedbackWhere(searchParams: URLSearchParams): FeedbackWhere {
  const where: FeedbackWhere = {}

  const search = searchParams.get('search')
  const issueFilter = searchParams.get('issue')
  const verifiedFilter = searchParams.get('verified')
  const phoneFilter = searchParams.get('phone')
  const minStarsFilter = searchParams.get('minStars')
  const startDateFilter = searchParams.get('startDate')
  const endDateFilter = searchParams.get('endDate')

  if (issueFilter) {
    where.primaryIssue = issueFilter
  }

  if (verifiedFilter === 'true') {
    where.isVerified = true
  } else if (verifiedFilter === 'false') {
    where.isVerified = { not: true }
  }

  if (phoneFilter) {
    where.OR = [
      { userPhone: phoneFilter },
      { userPhoneLast4: { contains: phoneFilter } },
      { userPhone: { contains: phoneFilter } },
    ]
  }

  if (minStarsFilter) {
    const minStars = Number(minStarsFilter)
    if (Number.isFinite(minStars) && minStars >= 1 && minStars <= 5) {
      where.overallStars = { gte: minStars }
    }
  }

  if (startDateFilter || endDateFilter) {
    const createdAt: { gte?: Date; lte?: Date } = {}
    const startDate = parseValidDate(startDateFilter)
    const endDate = parseValidDate(endDateFilter)

    if (startDate) {
      createdAt.gte = startDate
    }
    if (endDate) {
      endDate.setUTCHours(23, 59, 59, 999)
      createdAt.lte = endDate
    }
    if (createdAt.gte || createdAt.lte) {
      where.createdAt = createdAt
    }
  }

  if (search) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { userName: { contains: search, mode: 'insensitive' } },
          { userPhone: { contains: search } },
          { userPhoneLast4: { contains: search } },
          { summaryText: { contains: search, mode: 'insensitive' } },
          { stepBData: { contains: search, mode: 'insensitive' } },
          { primaryIssue: { contains: search, mode: 'insensitive' } },
        ],
      },
    ]
  }

  return where
}
