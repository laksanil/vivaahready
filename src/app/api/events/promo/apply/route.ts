import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Apply a promo code to a registration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, registrationId } = await request.json()

    if (!code || !registrationId) {
      return NextResponse.json({ error: 'Code and registrationId are required' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim()

    // Validate the code
    const promoCode = await prisma.eventPromoCode.findUnique({
      where: { code: normalizedCode },
    })

    if (!promoCode || !promoCode.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive promo code' }, { status: 400 })
    }

    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 400 })
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 })
    }

    // Verify registration belongs to current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { profile: { select: { id: true } } },
    })

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    })

    if (!registration || registration.profileId !== user?.profile?.id) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (registration.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'This registration is already paid' }, { status: 400 })
    }

    // Check event slug match
    if (promoCode.eventSlug && promoCode.eventSlug !== registration.event.slug) {
      return NextResponse.json({ error: 'This code is not valid for this event' }, { status: 400 })
    }

    // Check if this user already used a promo code for this registration
    if (registration.promoCode) {
      return NextResponse.json({ error: 'A promo code has already been applied' }, { status: 400 })
    }

    const basePrice = registration.event.price || 25
    const isFree = promoCode.discountPercent === 100
    const discountedPrice = Math.round(basePrice * (1 - promoCode.discountPercent / 100) * 100) / 100

    // Use transaction to apply code and increment usage atomically
    await prisma.$transaction([
      // Update registration with promo code
      prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          promoCode: normalizedCode,
          discountPercent: promoCode.discountPercent,
          ...(isFree ? {
            paymentStatus: 'paid',
            paymentId: `promo_${normalizedCode}`,
            amountPaid: 0,
          } : {}),
        },
      }),
      // Increment usage count
      prisma.eventPromoCode.update({
        where: { id: promoCode.id },
        data: { usedCount: { increment: 1 } },
      }),
    ])

    return NextResponse.json({
      success: true,
      isFree,
      discountPercent: promoCode.discountPercent,
      discountedPrice,
    })
  } catch (error) {
    console.error('Error applying promo code:', error)
    return NextResponse.json({ error: 'Failed to apply promo code' }, { status: 500 })
  }
}
