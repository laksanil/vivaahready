import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']

export const dynamic = 'force-dynamic'

// GET - List pending profiles for approval
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const profiles = await prisma.profile.findMany({
      where: {
        approvalStatus: status as 'pending' | 'approved' | 'rejected',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Admin approve GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}

// POST - Approve or reject a profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profileId, action, rejectionReason } = body

    if (!profileId || !action) {
      return NextResponse.json({ error: 'Missing profileId or action' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: true }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        approvalDate: new Date(),
        rejectionReason: action === 'reject' ? rejectionReason : null,
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      message: `Profile ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      profile: updatedProfile
    })
  } catch (error) {
    console.error('Admin approve POST error:', error)
    return NextResponse.json({ error: 'Failed to update profile status' }, { status: 500 })
  }
}
