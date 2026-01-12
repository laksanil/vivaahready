import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

// GET - Get all reports for admin
export async function GET(request: Request) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession || adminSession.value !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by status: pending, reviewed, resolved, dismissed

    const whereClause = status ? { status } : {}

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                id: true,
                gender: true,
                profileImageUrl: true,
              },
            },
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                id: true,
                gender: true,
                profileImageUrl: true,
                isSuspended: true,
                suspendedReason: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Pending first
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Admin reports fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

// PUT - Update a report (review, resolve, dismiss)
export async function PUT(request: Request) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession || adminSession.value !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, status, adminNotes, actionTaken } = body

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    if (!status || !['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes: adminNotes || null,
        actionTaken: actionTaken || null,
        reviewedAt: status !== 'pending' ? new Date() : null,
      },
    })

    return NextResponse.json({
      message: 'Report updated successfully',
      report: updatedReport,
    })
  } catch (error) {
    console.error('Admin report update error:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}
