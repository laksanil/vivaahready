import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { buildFeedbackWhere } from '@/lib/feedbackAdmin'
import { isTestAdminRequest } from '@/lib/testAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const isAdmin = (await isAdminAuthenticated()) || isTestAdminRequest(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const format = searchParams.get('format') // 'csv' for export

    const where = buildFeedbackWhere(searchParams)

    // CSV export — return all matching rows
    if (format === 'csv') {
      const all = await prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })

      const headers = [
        'ID', 'Date', 'User Phone', 'User Name', 'Verified', 'User ID', 'Profile ID',
        'Matches Count', 'Interests Sent', 'Interests Received',
        'Overall Stars', 'Primary Issue', 'Summary', 'NPS',
        'Referral Source', 'Wants Followup', 'Followup Contact', 'Followup Time',
        'Severity', 'Issue Tags', 'From URL', 'User Agent',
      ]

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const rows = all.map((fb) => [
        fb.id,
        fb.createdAt.toISOString(),
        fb.userPhone,
        fb.userName || '',
        fb.isVerified ? 'Yes' : 'No',
        fb.userId,
        fb.profileId || '',
        fb.matchesCount ?? '',
        fb.interestsSentCount ?? '',
        fb.interestsReceivedCount ?? '',
        fb.overallStars,
        fb.primaryIssue,
        fb.summaryText || '',
        fb.nps ?? '',
        fb.referralSource || '',
        fb.wantsFollowup ? 'Yes' : 'No',
        fb.followupContact || '',
        fb.followupTimeWindow || '',
        fb.severity || '',
        fb.issueTags || '',
        fb.fromUrl || '',
        fb.userAgent || '',
      ].map(escapeCsv).join(','))

      const csv = [headers.join(','), ...rows].join('\n')
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=feedback-export-${new Date().toISOString().split('T')[0]}.csv`,
        },
      })
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feedback.count({ where }),
    ])

    // Compute summary stats
    const [uniquePhonesCount, verifiedCount, totalFeedbackCount] = await Promise.all([
      prisma.feedback.groupBy({ by: ['userPhone'], where, _count: true }).then((r) => r.length),
      prisma.feedback.count({ where: { ...where, isVerified: true } }),
      prisma.feedback.count({ where }),
    ])

    const avgStars = await prisma.feedback.aggregate({ where, _avg: { overallStars: true } })

    // Top 10 phones by feedback count
    const topPhones = await prisma.feedback.groupBy({
      by: ['userPhone', 'userName'],
      where,
      _count: { id: true },
      _avg: { overallStars: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const summary = {
      totalFeedbackCount,
      uniquePhonesCount,
      verifiedUsersPct: totalFeedbackCount > 0 ? Math.round((verifiedCount / totalFeedbackCount) * 100) : 0,
      avgStars: avgStars._avg.overallStars ? Number(avgStars._avg.overallStars.toFixed(1)) : null,
      topPhonesByFeedbackCount: topPhones.map((tp) => ({
        userPhone: tp.userPhone,
        userName: tp.userName,
        count: tp._count.id,
        avgStars: tp._avg.overallStars ? Number(tp._avg.overallStars.toFixed(1)) : null,
      })),
    }

    return NextResponse.json({
      feedbacks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary,
    })
  } catch (error) {
    console.error('Admin feedback error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
