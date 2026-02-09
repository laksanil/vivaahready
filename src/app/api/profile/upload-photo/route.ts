import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'
import { isTestMode } from '@/lib/testMode'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File exceeds 10MB limit'
      }, { status: 400 })
    }

    // Get user's profile (ensure user can only upload to their own profile)
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profileId = profile.id

    // Check photo limit (max 3)
    const existingPhotoCount = profile.photoUrls ? profile.photoUrls.split(',').filter(Boolean).length : 0
    if (existingPhotoCount >= 3) {
      return NextResponse.json({
        error: 'Maximum 3 photos allowed. Please delete a photo before adding a new one.'
      }, { status: 400 })
    }

    if (isTestMode) {
      const placeholderUrl = process.env.E2E_TEST_PHOTO_URL || 'https://vivaahready.com/logo-icon.png'
      const existingPhotos = profile.photoUrls ? profile.photoUrls.split(',').filter(Boolean) : []
      const updatedPhotos = [...existingPhotos, placeholderUrl]

      await prisma.profile.update({
        where: { id: profileId },
        data: {
          photoUrls: updatedPhotos.join(','),
          profileImageUrl: profile.profileImageUrl || placeholderUrl
        }
      })

      return NextResponse.json({
        message: 'Photo uploaded successfully (test mode)',
        url: placeholderUrl
      })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `vivaahready/profiles/${profileId}`,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as { secure_url: string })
        }
      )
      uploadStream.end(buffer)
    })

    // Update profile with new photo URL
    const existingPhotos = profile.photoUrls ? profile.photoUrls.split(',').filter(Boolean) : []
    const updatedPhotos = [...existingPhotos, result.secure_url]

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        photoUrls: updatedPhotos.join(','),
        // Set as primary photo if it's the first one
        profileImageUrl: profile.profileImageUrl || result.secure_url
      }
    })

    return NextResponse.json({
      message: 'Photo uploaded successfully',
      url: result.secure_url
    })
  } catch (error) {
    console.error('Upload error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
