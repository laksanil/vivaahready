import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Professional-looking placeholder photos for testing
// Using UI Avatars for generated avatars and pravatar.cc for realistic photos
const testPhotos = {
  'laksanil+testmale1@yahoo.com': {
    // Rahul - Male profile
    profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    photoUrls: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=800&fit=crop&crop=face',
    ].join(','),
  },
  'laksanil+testmale2@yahoo.com': {
    // Arjun - Male profile
    profileImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    photoUrls: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=800&fit=crop&crop=face',
    ].join(','),
  },
  'laksanil+testfemale1@yahoo.com': {
    // Priya - Female profile
    profileImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    photoUrls: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=800&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=800&fit=crop&crop=face',
    ].join(','),
  },
}

async function main() {
  console.log('Updating test profiles with photos...\n')

  for (const [email, photos] of Object.entries(testPhotos)) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      console.log(`User ${email} not found, skipping...`)
      continue
    }

    if (!user.profile) {
      console.log(`Profile for ${email} not found, skipping...`)
      continue
    }

    // Update profile with photos
    await prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        profileImageUrl: photos.profileImageUrl,
        photoUrls: photos.photoUrls,
        photoVisibility: 'verified_only', // Photos visible to all verified members
      },
    })

    console.log(`Updated photos for: ${user.name} (${email})`)
    console.log(`  Profile Image: ${photos.profileImageUrl.substring(0, 60)}...`)
    console.log(`  Photo Count: ${photos.photoUrls.split(',').length}\n`)
  }

  console.log('Done! All test profiles updated with photos.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
