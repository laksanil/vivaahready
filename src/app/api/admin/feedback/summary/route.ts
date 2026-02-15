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
    const where = buildFeedbackWhere(searchParams)

    const [uniquePhonesCount, verifiedCount, totalFeedbackCount] = await Promise.all([
      prisma.feedback.groupBy({ by: ['userPhone'], where, _count: true }).then((rows) => rows.length),
      prisma.feedback.count({ where: { ...where, isVerified: true } }),
      prisma.feedback.count({ where }),
    ])

    const avgStars = await prisma.feedback.aggregate({ where, _avg: { overallStars: true } })

    const topPhones = await prisma.feedback.groupBy({
      by: ['userPhone', 'userName'],
      where,
      _count: { id: true },
      _avg: { overallStars: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    return NextResponse.json({
      totalFeedbackCount,
      uniquePhonesCount,
      verifiedUsersPct: totalFeedbackCount > 0 ? Math.round((verifiedCount / totalFeedbackCount) * 100) : 0,
      avgStars: avgStars._avg.overallStars ? Number(avgStars._avg.overallStars.toFixed(1)) : null,
      topPhonesByFeedbackCount: topPhones.map((row) => ({
        userPhone: row.userPhone,
        userName: row.userName,
        count: row._count.id,
        avgStars: row._avg.overallStars ? Number(row._avg.overallStars.toFixed(1)) : null,
      })),
    })
  } catch (error) {
    console.error('Admin feedback summary error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback summary' }, { status: 500 })
  }
}
