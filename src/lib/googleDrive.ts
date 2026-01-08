/**
 * Google Drive URL Parsing Utilities
 * Extracts file IDs from various Google Drive URL formats and converts to displayable thumbnail URLs
 */

// Google Drive URL patterns
// https://drive.google.com/file/d/FILE_ID/view
// https://drive.google.com/open?id=FILE_ID
// https://drive.google.com/uc?id=FILE_ID
// https://drive.google.com/drive/folders/FOLDER_ID

/**
 * Extract file ID from various Google Drive URL formats
 */
export function extractFileId(driveUrl: string): string | null {
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

/**
 * Check if a URL is a Google Drive folder link
 */
export function isDriveFolder(url: string): boolean {
  return url?.includes('/folders/') || url?.includes('folder')
}

/**
 * Convert a Google Drive file URL to a direct thumbnail URL
 * @param driveUrl - Original Google Drive URL
 * @param size - Thumbnail size (w100, w200, w400, w800, etc.)
 */
export function convertToThumbnailUrl(driveUrl: string, size: string = 'w400'): string | null {
  const fileId = extractFileId(driveUrl)
  if (!fileId) return null

  // Don't convert folder URLs to thumbnails
  if (isDriveFolder(driveUrl)) return null

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`
}

/**
 * Convert to direct download/view URL
 */
export function convertToDirectUrl(driveUrl: string): string | null {
  const fileId = extractFileId(driveUrl)
  if (!fileId) return null

  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

/**
 * Parse comma-separated photoUrls field and extract individual URLs
 */
export function parsePhotoUrls(photoUrls: string | null): string[] {
  if (!photoUrls) return []

  // Split by comma and clean up
  return photoUrls
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'))
}

/**
 * Extract all photo thumbnails from the photoUrls field
 */
export function extractPhotoThumbnails(photoUrls: string | null, size: string = 'w400'): string[] {
  const urls = parsePhotoUrls(photoUrls)

  return urls
    .filter(url => !isDriveFolder(url))
    .map(url => convertToThumbnailUrl(url, size))
    .filter((url): url is string => url !== null)
}

/**
 * Get the first valid photo URL as the primary profile image
 */
export function getPrimaryPhotoUrl(photoUrls: string | null, size: string = 'w400'): string | null {
  const thumbnails = extractPhotoThumbnails(photoUrls, size)
  return thumbnails.length > 0 ? thumbnails[0] : null
}

/**
 * Extract folder link from photoUrls if present
 */
export function extractDriveFolderLink(photoUrls: string | null): string | null {
  const urls = parsePhotoUrls(photoUrls)
  const folderUrl = urls.find(url => isDriveFolder(url))
  return folderUrl || null
}

/**
 * Get profile image URL with fallback logic
 * Priority: profileImageUrl > first photo from photoUrls > null
 */
export function getProfileImageUrl(profile: {
  profileImageUrl?: string | null
  photoUrls?: string | null
}, size: string = 'w400'): string | null {
  // If profileImageUrl is set, use it directly
  if (profile.profileImageUrl) {
    // If it's a Google Drive URL, convert it
    if (profile.profileImageUrl.includes('drive.google.com')) {
      return convertToThumbnailUrl(profile.profileImageUrl, size)
    }
    return profile.profileImageUrl
  }

  // Otherwise, try to extract from photoUrls
  return getPrimaryPhotoUrl(profile.photoUrls || null, size)
}

/**
 * Get user initials for avatar fallback
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
