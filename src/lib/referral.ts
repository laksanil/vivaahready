import { prisma } from '@/lib/prisma'

/**
 * Generate a short, unique referral code (6 alphanumeric characters).
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid ambiguous chars (0/O, 1/I)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Get or create a referral code for a profile.
 * If the profile already has a code, return it.
 * Otherwise, generate a unique one and save it.
 */
export async function getOrCreateReferralCode(profileId: string): Promise<string | null> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { referralCode: true },
    })

    if (!profile) return null
    if (profile.referralCode) return profile.referralCode

    // Generate a unique code (retry if collision)
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferralCode()
      try {
        await prisma.profile.update({
          where: { id: profileId },
          data: { referralCode: code },
        })
        return code
      } catch {
        // Unique constraint violation — retry with a new code
        continue
      }
    }

    return null
  } catch (error) {
    console.error('Error generating referral code:', error)
    return null
  }
}

/**
 * Count how many profiles were referred by a given referral code.
 */
export async function getReferralCount(referralCode: string): Promise<number> {
  try {
    return await prisma.profile.count({
      where: { referredBy: referralCode },
    })
  } catch {
    return 0
  }
}
