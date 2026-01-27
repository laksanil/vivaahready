import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateReferralCode, getReferralCount } from '@/lib/referral'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findFirst({
      where: { user: { email: session.user.email } },
      select: { id: true, referralCode: true, referralBoostStart: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const referralCode = await getOrCreateReferralCode(profile.id)
    if (!referralCode) {
      return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 })
    }

    const referralCount = await getReferralCount(referralCode)

    // Calculate boost status
    let boostActive = false
    let boostExpiresAt: string | null = null
    if (profile.referralBoostStart && referralCount >= 3) {
      const expiryDate = new Date(profile.referralBoostStart.getTime() + 30 * 24 * 60 * 60 * 1000)
      if (expiryDate > new Date()) {
        boostActive = true
        boostExpiresAt = expiryDate.toISOString()
      }
    }

    return NextResponse.json({
      referralCode,
      referralCount,
      referralLink: `https://vivaahready.com/register?ref=${referralCode}`,
      boostActive,
      boostExpiresAt,
    })
  } catch (error) {
    console.error('Referral API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
