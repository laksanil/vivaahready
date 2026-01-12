import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create a new report
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportedUserId, reason } = body

    if (!reportedUserId) {
      return NextResponse.json({ error: 'Reported user ID is required' }, { status: 400 })
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide a reason for the report' }, { status: 400 })
    }

    if (reason.length > 1000) {
      return NextResponse.json({ error: 'Reason must be less than 1000 characters' }, { status: 400 })
    }

    // Check if user is reporting themselves
    if (reportedUserId === session.user.id) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 })
    }

    // Check if reported user exists
    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
    })

    if (!reportedUser) {
      return NextResponse.json({ error: 'Reported user not found' }, { status: 404 })
    }

    // Check if there's already a pending report from this user about this person
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        reportedUserId: reportedUserId,
        status: 'pending',
      },
    })

    if (existingReport) {
      return NextResponse.json({ error: 'You already have a pending report against this user' }, { status: 400 })
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedUserId: reportedUserId,
        reason: reason.trim(),
        status: 'pending',
      },
    })

    return NextResponse.json({ message: 'Report submitted successfully', reportId: report.id }, { status: 201 })
  } catch (error) {
    console.error('Report creation error:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

// GET - Get user's own reports (optional, for viewing report history)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.report.findMany({
      where: { reporterId: session.user.id },
      include: {
        reportedUser: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Report fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
