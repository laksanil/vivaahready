import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { isMutualMatch } from '@/lib/matching'
import { sendNewMatchAvailableEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Minimum hours between new match notifications to avoid spam
const MIN_HOURS_BETWEEN_NOTIFICATIONS = 24

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
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            subscription: {
              select: {
                profilePaid: true,
              }
            }
          }
        }
      }
    })

    // Calculate payment stats
    const paidCount = profiles.filter(p => p.user.subscription?.profilePaid).length
    const unpaidCount = profiles.length - paidCount

    return NextResponse.json({
      profiles,
      stats: {
        total: profiles.length,
        paid: paidCount,
        unpaid: unpaidCount,
      }
    })
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

    // If approving profiles, notify matching users who haven't logged in recently
    if (action === 'approve') {
      // Get the full approved profiles for matching
      const approvedProfiles = await prisma.profile.findMany({
        where: { id: { in: idsToProcess } },
      })

      // Notify matching users in the background (don't block the response)
      notifyMatchingUsers(approvedProfiles).catch(err => {
        console.error('Error notifying matching users:', err)
      })
    }

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

/**
 * Notify users who match with newly approved profiles and haven't logged in recently
 * This runs in the background to avoid blocking the approval response
 */
async function notifyMatchingUsers(approvedProfiles: any[]) {
  const now = new Date()
  const notificationCutoff = new Date(now.getTime() - MIN_HOURS_BETWEEN_NOTIFICATIONS * 60 * 60 * 1000)
  const loginCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

  for (const approvedProfile of approvedProfiles) {
    try {
      // Find all active profiles of the opposite gender
      const potentialMatches = await prisma.profile.findMany({
        where: {
          gender: approvedProfile.gender === 'male' ? 'female' : 'male',
          isActive: true,
          approvalStatus: 'approved',
          userId: { not: approvedProfile.userId },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              lastLogin: true,
              lastNewMatchNotificationAt: true,
            }
          }
        }
      })

      // Filter to users who:
      // 1. Match with the approved profile (mutual preferences)
      // 2. Haven't logged in in the last 24 hours
      // 3. Haven't been notified about new matches in the last 24 hours
      const usersToNotify = potentialMatches.filter(candidate => {
        // Check mutual match
        if (!isMutualMatch(approvedProfile, candidate)) {
          return false
        }

        // Check if user hasn't logged in recently (or never logged in)
        const lastLogin = candidate.user.lastLogin
        if (lastLogin && lastLogin > loginCutoff) {
          return false // User logged in recently, skip notification
        }

        // Check if user hasn't been notified recently
        const lastNotification = candidate.user.lastNewMatchNotificationAt
        if (lastNotification && lastNotification > notificationCutoff) {
          return false // User was notified recently, skip
        }

        return true
      })

      console.log(`[NEW MATCH NOTIFICATION] Approved profile ${approvedProfile.id} matches ${usersToNotify.length} users to notify`)

      // Send emails to matching users
      for (const match of usersToNotify) {
        if (!match.user.email) continue

        try {
          console.log(`[NEW MATCH NOTIFICATION] Sending email to ${match.user.email}`)

          await sendNewMatchAvailableEmail(
            match.user.email,
            match.user.name || 'there',
            1
          )

          // Update the user's last notification timestamp
          await prisma.user.update({
            where: { id: match.user.id },
            data: { lastNewMatchNotificationAt: now }
          })

          console.log(`[NEW MATCH NOTIFICATION] Email sent successfully to ${match.user.email}`)
        } catch (emailError) {
          console.error(`[NEW MATCH NOTIFICATION] Failed to send email to ${match.user.email}:`, emailError)
        }
      }
    } catch (profileError) {
      console.error(`[NEW MATCH NOTIFICATION] Error processing approved profile ${approvedProfile.id}:`, profileError)
    }
  }
}
