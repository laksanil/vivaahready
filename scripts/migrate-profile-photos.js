/**
 * Migration Script: Extract photos and mark existing profiles as paid
 *
 * This script:
 * 1. Marks all imported profiles as having paid (grandfathered)
 * 2. Extracts the first photo URL from photoUrls and sets it as profileImageUrl
 * 3. Extracts Google Drive folder links and sets them as drivePhotosLink
 *
 * Run with: node scripts/migrate-profile-photos.js
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Google Drive URL parsing functions
function extractFileId(driveUrl) {
  if (!driveUrl) return null

  const trimmedUrl = driveUrl.trim()

  // Pattern: /file/d/FILE_ID/
  const filePattern = /\/file\/d\/([a-zA-Z0-9_-]+)/
  const fileMatch = trimmedUrl.match(filePattern)
  if (fileMatch) return fileMatch[1]

  // Pattern: ?id=FILE_ID or &id=FILE_ID
  const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/
  const idMatch = trimmedUrl.match(idPattern)
  if (idMatch) return idMatch[1]

  // Pattern: /folders/FOLDER_ID
  const folderPattern = /\/folders\/([a-zA-Z0-9_-]+)/
  const folderMatch = trimmedUrl.match(folderPattern)
  if (folderMatch) return folderMatch[1]

  return null
}

function isDriveFolder(url) {
  return url?.includes('/folders/') || url?.includes('folder')
}

function convertToThumbnailUrl(driveUrl, size = 'w400') {
  const fileId = extractFileId(driveUrl)
  if (!fileId) return null

  // Don't convert folder URLs to thumbnails
  if (isDriveFolder(driveUrl)) return null

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`
}

function parsePhotoUrls(photoUrls) {
  if (!photoUrls) return []

  return photoUrls
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'))
}

function getPrimaryPhotoUrl(photoUrls) {
  const urls = parsePhotoUrls(photoUrls)

  for (const url of urls) {
    if (!isDriveFolder(url)) {
      return convertToThumbnailUrl(url, 'w400')
    }
  }

  return null
}

function extractDriveFolderLink(photoUrls) {
  const urls = parsePhotoUrls(photoUrls)
  return urls.find(url => isDriveFolder(url)) || null
}

async function migrateProfiles() {
  console.log('Starting profile migration...\n')

  try {
    // Get all profiles with photoUrls
    const profiles = await prisma.profile.findMany({
      where: {
        photoUrls: { not: null }
      },
      select: {
        id: true,
        photoUrls: true,
        profileImageUrl: true,
        drivePhotosLink: true,
        userId: true,
        isImported: true,
        user: {
          select: {
            name: true,
            subscription: {
              select: {
                id: true,
                profilePaid: true
              }
            }
          }
        }
      }
    })

    console.log(`Found ${profiles.length} profiles with photoUrls\n`)

    let updatedProfiles = 0
    let updatedSubscriptions = 0

    for (const profile of profiles) {
      const updates = {}

      // Extract primary photo URL if not already set
      if (!profile.profileImageUrl) {
        const primaryPhoto = getPrimaryPhotoUrl(profile.photoUrls)
        if (primaryPhoto) {
          updates.profileImageUrl = primaryPhoto
        }
      }

      // Extract drive folder link if not already set
      if (!profile.drivePhotosLink) {
        const folderLink = extractDriveFolderLink(profile.photoUrls)
        if (folderLink) {
          updates.drivePhotosLink = folderLink
        }
      }

      // Update profile if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: updates
        })
        updatedProfiles++
        console.log(`Updated profile: ${profile.user.name}`)
        if (updates.profileImageUrl) console.log(`  - profileImageUrl: ${updates.profileImageUrl}`)
        if (updates.drivePhotosLink) console.log(`  - drivePhotosLink: ${updates.drivePhotosLink}`)
      }

      // Mark subscription as paid for imported profiles
      if (profile.isImported && profile.user.subscription && !profile.user.subscription.profilePaid) {
        await prisma.subscription.update({
          where: { id: profile.user.subscription.id },
          data: { profilePaid: true }
        })
        updatedSubscriptions++
        console.log(`  - Marked subscription as paid (grandfathered)`)
      }
    }

    // Also mark any profiles without photoUrls but that are imported
    const importedProfiles = await prisma.profile.findMany({
      where: { isImported: true },
      include: {
        user: {
          select: {
            subscription: {
              select: {
                id: true,
                profilePaid: true
              }
            }
          }
        }
      }
    })

    for (const profile of importedProfiles) {
      if (profile.user.subscription && !profile.user.subscription.profilePaid) {
        await prisma.subscription.update({
          where: { id: profile.user.subscription.id },
          data: { profilePaid: true }
        })
        updatedSubscriptions++
        console.log(`Marked imported profile as paid: ${profile.id}`)
      }
    }

    console.log('\n--- Migration Summary ---')
    console.log(`Total profiles processed: ${profiles.length}`)
    console.log(`Profiles updated with photo URLs: ${updatedProfiles}`)
    console.log(`Subscriptions marked as paid: ${updatedSubscriptions}`)
    console.log('Migration complete!')

  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateProfiles()
  .catch(console.error)
