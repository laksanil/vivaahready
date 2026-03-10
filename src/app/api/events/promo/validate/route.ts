import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Validate a promo code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, eventSlug } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Code is required' })
    }

    const normalizedCode = code.toUpperCase().trim()

    const promoCode = await prisma.eventPromoCode.findUnique({
      where: { code: normalizedCode },
    })

    if (!promoCode) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code' })
    }

    if (!promoCode.isActive) {
      return NextResponse.json({ valid: false, error: 'This code is no longer active' })
    }

    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return NextResponse.json({ valid: false, error: 'This code has expired' })
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({ valid: false, error: 'This code has reached its usage limit' })
    }

    if (promoCode.eventSlug && eventSlug && promoCode.eventSlug !== eventSlug) {
      return NextResponse.json({ valid: false, error: 'This code is not valid for this event' })
    }

    const basePrice = 25
    const discountedPrice = Math.round(basePrice * (1 - promoCode.discountPercent / 100) * 100) / 100

    return NextResponse.json({
      valid: true,
      discountPercent: promoCode.discountPercent,
      discountedPrice,
      isFree: promoCode.discountPercent === 100,
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json({ valid: false, error: 'Failed to validate code' })
  }
}
