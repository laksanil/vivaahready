import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPayPalOrder } from '@/lib/paypal'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { registrationId } = await request.json()

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID required' }, { status: 400 })
    }

    // Verify the registration exists and belongs to the current user
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Verify the profile belongs to the current user
    const profile = await prisma.profile.findUnique({
      where: { id: registration.profileId },
      select: { userId: true },
    })

    if (!profile || profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (registration.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    const basePrice = registration.event.price || 25
    const discount = registration.discountPercent || 0
    const amount = (basePrice * (1 - discount / 100)).toFixed(2)

    const order = await createPayPalOrder(amount, session.user.email, session.user.id)

    // Track pending payment
    await prisma.pendingPayment.upsert({
      where: { paypalOrderId: order.id },
      update: {
        userId: session.user.id,
        status: 'pending',
      },
      create: {
        userId: session.user.id,
        paypalOrderId: order.id,
        amount,
        status: 'pending',
      },
    })

    return NextResponse.json({
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error creating event payment order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
