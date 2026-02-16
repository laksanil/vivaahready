import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { squareClient, getLocationId, dollarsToCents } from '@/lib/square'
import { randomUUID } from 'crypto'

// Get current price from database
async function getCurrentPrice(): Promise<number> {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) return 50 // Default

    // Check if promo is active
    const now = new Date()
    if (settings.promoPrice && settings.promoEndDate && new Date(settings.promoEndDate) > now) {
      return settings.promoPrice
    }

    return settings.verificationPrice
  } catch {
    return 50 // Default on error
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sourceId, verificationToken } = await request.json()

    if (!sourceId) {
      return NextResponse.json({ error: 'Payment source ID is required' }, { status: 400 })
    }

    // Get the user's profile and subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        subscription: true,
      },
    })

    if (!user?.profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if already paid
    if (user.subscription?.profilePaid) {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    // Get the active price from database
    const amount = await getCurrentPrice()
    const locationId = await getLocationId()

    // Create payment with Square
    const response = await squareClient.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: dollarsToCents(amount),
        currency: 'USD',
      },
      locationId,
      verificationToken,
      autocomplete: true,
      note: `VivaahReady Verification - ${user.profile.odNumber || user.profile.id}`,
      buyerEmailAddress: user.email || undefined,
      referenceId: user.profile.id,
    })

    if (!response.payment) {
      console.error('Square payment failed:', response.errors)
      return NextResponse.json(
        { error: 'Payment failed', details: response.errors },
        { status: 400 }
      )
    }

    const payment = response.payment
    if (payment.status !== 'COMPLETED') {
      console.error('Square payment not completed:', {
        status: payment.status,
        paymentId: payment.id,
      })
      return NextResponse.json(
        { error: 'Payment was not completed. Please try again.' },
        { status: 400 }
      )
    }

    // Payment successful - update subscription
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          profilePaid: true,
          profilePaymentId: payment.id,
        },
      })
    } else {
      // Create subscription if it doesn't exist
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'active',
          profilePaid: true,
          profilePaymentId: payment.id,
        },
      })
    }

    // Update profile verification status
    await prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        isVerified: true,
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      receiptUrl: payment.receiptUrl,
    })
  } catch (error: unknown) {
    console.error('Square payment error:', error)

    // Extract meaningful error details from Square SDK errors
    let message = 'Payment processing failed'
    let details: unknown = undefined

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>

      // Square SDK v44 throws errors with an `errors` array
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        const sqErr = err.errors[0] as Record<string, string>
        message = sqErr.detail || sqErr.message || message
        details = err.errors
      } else if (err.message && typeof err.message === 'string') {
        message = err.message
      }
    }

    console.error('Square payment error details:', { message, details })

    return NextResponse.json(
      { error: message, details },
      { status: 500 }
    )
  }
}
