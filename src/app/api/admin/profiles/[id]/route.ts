import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            subscription: {
              select: {
                plan: true,
                status: true,
                profilePaid: true,
                profilePaymentId: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Admin profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get the profile to find the userId
    const existingProfile = await prisma.profile.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Extract user-related fields that need to be updated separately
    const { firstName, lastName, user, userId, id, createdAt, updatedAt, ...profileData } = body

    // Update user name if firstName/lastName provided
    if (firstName || lastName) {
      const currentUser = await prisma.user.findUnique({
        where: { id: existingProfile.userId },
        select: { name: true }
      })

      const nameParts = currentUser?.name?.split(' ') || ['', '']
      const newFirstName = firstName || nameParts[0] || ''
      const newLastName = lastName || nameParts.slice(1).join(' ') || ''
      const newName = `${newFirstName} ${newLastName}`.trim()

      if (newName) {
        await prisma.user.update({
          where: { id: existingProfile.userId },
          data: { name: newName }
        })
      }
    }

    // Update profile with only valid profile fields
    const profile = await prisma.profile.update({
      where: { id: params.id },
      data: profileData
    })

    return NextResponse.json({ message: 'Profile updated', profile })
  } catch (error) {
    console.error('Admin profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the profile to find the user
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Delete the profile (user deletion is optional)
    await prisma.profile.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Profile deleted' })
  } catch (error) {
    console.error('Admin profile delete error:', error)
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
  }
}
