import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const profileId = formData.get('profileId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
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

    // Verify profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check photo limit (max 3)
    const existingPhotoCount = profile.photoUrls ? profile.photoUrls.split(',').filter(Boolean).length : 0
    if (existingPhotoCount >= 3) {
      return NextResponse.json({
        error: 'Maximum 3 photos allowed. Please delete a photo before adding a new one.'
      }, { status: 400 })
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
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
  }
}
