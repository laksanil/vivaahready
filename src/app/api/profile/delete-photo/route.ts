import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'
import { getTargetUserId } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const targetUser = await getTargetUserId(request, session)
    if (!targetUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photoUrl, profileId } = body

    if (!photoUrl) {
      return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 })
    }

    // Get the profile - either by profileId (for admin) or by userId
    let profile
    if (profileId) {
      profile = await prisma.profile.findUnique({
        where: { id: profileId }
      })
      if (profile && !targetUser.isAdminView && profile.userId !== targetUser.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      profile = await prisma.profile.findUnique({
        where: { userId: targetUser.userId }
      })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get current photos
    const existingPhotos = profile.photoUrls ? profile.photoUrls.split(',').filter(Boolean) : []

    // Remove the photo from the list
    const updatedPhotos = existingPhotos.filter(url => url !== photoUrl)

    // Try to delete from Cloudinary (extract public_id from URL)
    try {
      const urlParts = photoUrl.split('/')
      const publicIdWithExt = urlParts.slice(-2).join('/') // Get folder/filename
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '') // Remove extension
      await cloudinary.uploader.destroy(publicId)
    } catch (cloudinaryError) {
      console.error('Failed to delete from Cloudinary:', cloudinaryError)
      // Continue even if Cloudinary delete fails
    }

    // Update profile
    const newPrimaryPhoto = updatedPhotos[0] || null
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        photoUrls: updatedPhotos.join(',') || null,
        // Update primary photo if the deleted one was primary
        profileImageUrl: profile.profileImageUrl === photoUrl ? newPrimaryPhoto : profile.profileImageUrl
      }
    })

    return NextResponse.json({
      message: 'Photo deleted successfully',
      remainingPhotos: updatedPhotos
    })
  } catch (error) {
    console.error('Delete photo error:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}
