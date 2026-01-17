import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

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
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Admin approve GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}

// POST - Approve or reject a profile (single or bulk)
export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profileId, profileIds, action, rejectionReason } = body

    // Determine if this is a bulk operation
    const isBulk = Array.isArray(profileIds) && profileIds.length > 0
    const idsToProcess = isBulk ? profileIds : (profileId ? [profileId] : [])

    if (idsToProcess.length === 0 || !action) {
      return NextResponse.json({ error: 'Missing profileId/profileIds or action' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 })
    }

    // Verify all profiles exist
    const profiles = await prisma.profile.findMany({
      where: { id: { in: idsToProcess } },
      include: { user: true }
    })

    if (profiles.length !== idsToProcess.length) {
      const foundIds = profiles.map(p => p.id)
      const missingIds = idsToProcess.filter((id: string) => !foundIds.includes(id))
      return NextResponse.json({
        error: `Profiles not found: ${missingIds.join(', ')}`
      }, { status: 404 })
    }

    // Bulk update all profiles
    await prisma.profile.updateMany({
      where: { id: { in: idsToProcess } },
      data: {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        approvalDate: new Date(),
        rejectionReason: action === 'reject' ? rejectionReason : null,
      },
    })

    // For single profile, fetch and return the updated profile
    if (!isBulk) {
      const updatedProfile = await prisma.profile.findUnique({
        where: { id: profileId },
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
    }

    return NextResponse.json({
      message: `${idsToProcess.length} profiles ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      count: idsToProcess.length
    })
  } catch (error) {
    console.error('Admin approve POST error:', error)
    return NextResponse.json({ error: 'Failed to update profile status' }, { status: 500 })
  }
}
