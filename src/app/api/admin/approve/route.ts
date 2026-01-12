import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']
const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

// Helper to check admin authentication (either via cookie or NextAuth session)
async function isAdminAuthenticated(): Promise<boolean> {
  // Check admin cookie first
  const adminSession = cookies().get('admin_session')
  if (adminSession?.value === ADMIN_TOKEN) {
    return true
  }

  // Check NextAuth session
  const session = await getServerSession(authOptions)
  if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
    return true
  }

  return false
}

export const dynamic = 'force-dynamic'

// GET - List pending profiles for approval
export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const profiles = await prisma.profile.findMany({
      where: {
        approvalStatus: status as 'pending' | 'approved' | 'rejected',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        gender: true,
        currentLocation: true,
        occupation: true,
        qualification: true,
        caste: true,
        aboutMe: true,
        createdAt: true,
        rejectionReason: true,
        linkedinProfile: true,
        facebookInstagram: true,
        photoUrls: true,
        profileImageUrl: true,
        drivePhotosLink: true,
        referralSource: true,
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
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
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
