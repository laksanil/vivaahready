/**
 * Migration script to move Google Drive photos to Cloudinary
 *
 * Usage: npx ts-node scripts/migrate-drive-photos.ts
 * Or: npx tsx scripts/migrate-drive-photos.ts
 */

import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const prisma = new PrismaClient()

/**
 * Extract file ID from Google Drive URL
 */
function extractDriveFileId(driveUrl: string): string | null {
  // Format: https://drive.google.com/file/d/FILE_ID/view
  let match = driveUrl.match(/\/file\/d\/([^/]+)/)
  if (match) return match[1]

  // Format: https://drive.google.com/open?id=FILE_ID
  match = driveUrl.match(/[?&]id=([^&]+)/)
  if (match) return match[1]

  // Format: https://drive.google.com/uc?id=FILE_ID
  match = driveUrl.match(/uc\?.*id=([^&]+)/)
  if (match) return match[1]

  return null
}

/**
 * Get multiple URL formats to try for a Google Drive file
 */
function getDriveUrls(driveUrl: string): string[] {
  // Handle googleusercontent URLs directly
  if (driveUrl.includes('googleusercontent.com')) {
    return [driveUrl]
  }

  const fileId = extractDriveFileId(driveUrl)
  if (!fileId) return []

  // Return multiple URL formats to try (in order of preference)
  return [
    // Thumbnail URL (works well for images)
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    // Direct view URL
    `https://lh3.googleusercontent.com/d/${fileId}=w800`,
    // Export URL
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    // Download URL (often triggers HTML response)
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ]
}

/**
 * Upload image from URL to Cloudinary, trying multiple URL formats
 */
async function uploadToCloudinary(imageUrls: string[], profileId: string): Promise<string | null> {
  for (const imageUrl of imageUrls) {
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: `vivaahready/profiles/${profileId}`,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 800, height: 800, crop: 'limit' }
        ],
        resource_type: 'image',
      })
      return result.secure_url
    } catch (error: unknown) {
      // Try next URL format
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      if (!errorMsg.includes('HTML response')) {
        console.error(`  Error with ${imageUrl.substring(0, 50)}...: ${errorMsg}`)
      }
    }
  }
  return null
}

/**
 * Check if URL is a Google Drive URL
 */
function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('googleusercontent.com')
}

/**
 * Check if URL is already a Cloudinary URL
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com')
}

async function migrateProfile(profile: {
  id: string
  userId: string
  photoUrls: string | null
  profileImageUrl: string | null
}) {
  console.log(`\nProcessing profile: ${profile.id}`)

  let updatedPhotoUrls: string[] = []
  let updatedProfileImageUrl: string | null = profile.profileImageUrl
  let hasChanges = false

  // Process photoUrls
  if (profile.photoUrls) {
    const urls = profile.photoUrls.split(',').map(u => u.trim()).filter(Boolean)

    for (const url of urls) {
      if (isCloudinaryUrl(url)) {
        // Already Cloudinary, keep it
        updatedPhotoUrls.push(url)
      } else if (isGoogleDriveUrl(url)) {
        // Convert and upload - try multiple URL formats
        console.log(`  Migrating: ${url.substring(0, 50)}...`)
        const urlsToTry = getDriveUrls(url)
        if (urlsToTry.length > 0) {
          const cloudinaryUrl = await uploadToCloudinary(urlsToTry, profile.id)
          if (cloudinaryUrl) {
            console.log(`  ✓ Uploaded to Cloudinary`)
            updatedPhotoUrls.push(cloudinaryUrl)
            hasChanges = true
          } else {
            console.log(`  ✗ Failed to upload (tried ${urlsToTry.length} URL formats)`)
          }
        } else {
          console.log(`  ✗ Could not parse Drive URL`)
        }
      } else if (url.startsWith('http')) {
        // Other URL, keep it
        updatedPhotoUrls.push(url)
      }
    }
  }

  // Process profileImageUrl
  if (profile.profileImageUrl && isGoogleDriveUrl(profile.profileImageUrl)) {
    console.log(`  Migrating profile image...`)
    const urlsToTry = getDriveUrls(profile.profileImageUrl)
    if (urlsToTry.length > 0) {
      const cloudinaryUrl = await uploadToCloudinary(urlsToTry, profile.id)
      if (cloudinaryUrl) {
        console.log(`  ✓ Profile image uploaded`)
        updatedProfileImageUrl = cloudinaryUrl
        hasChanges = true
      }
    }
  }

  // If profileImageUrl is not set but we have photos, use the first one
  if ((!updatedProfileImageUrl || isGoogleDriveUrl(updatedProfileImageUrl)) && updatedPhotoUrls.length > 0) {
    updatedProfileImageUrl = updatedPhotoUrls[0]
    hasChanges = true
  }

  // Update the profile if there were changes
  if (hasChanges) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        photoUrls: updatedPhotoUrls.length > 0 ? updatedPhotoUrls.join(',') : null,
        profileImageUrl: updatedProfileImageUrl,
      },
    })
    console.log(`  ✓ Profile updated with ${updatedPhotoUrls.length} photos`)
    return true
  }

  console.log(`  - No changes needed`)
  return false
}

async function main() {
  console.log('Starting Google Drive to Cloudinary migration...\n')

  // Find all profiles with Google Drive URLs
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { photoUrls: { contains: 'drive.google.com' } },
        { photoUrls: { contains: 'googleusercontent.com' } },
        { profileImageUrl: { contains: 'drive.google.com' } },
        { profileImageUrl: { contains: 'googleusercontent.com' } },
      ],
    },
    select: {
      id: true,
      userId: true,
      photoUrls: true,
      profileImageUrl: true,
    },
  })

  console.log(`Found ${profiles.length} profiles with Google Drive photos\n`)

  let migratedCount = 0
  let failedCount = 0

  for (const profile of profiles) {
    try {
      const migrated = await migrateProfile(profile)
      if (migrated) migratedCount++
    } catch (error) {
      console.error(`  ✗ Error processing profile ${profile.id}:`, error)
      failedCount++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n=== Migration Complete ===')
  console.log(`Total profiles processed: ${profiles.length}`)
  console.log(`Successfully migrated: ${migratedCount}`)
  console.log(`Failed: ${failedCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
