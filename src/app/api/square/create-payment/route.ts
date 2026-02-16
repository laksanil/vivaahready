import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { squareClient, getLocationId, dollarsToCents } from '@/lib/square'
import { randomUUID } from 'crypto'

type SquareErrorItem = {
  category?: string
  code?: string
  detail?: string
  message?: string
}

function extractSquareErrors(error: unknown): SquareErrorItem[] {
  if (!error || typeof error !== 'object') return []

  const err = error as Record<string, unknown>
  const candidate =
    err.errors ||
    (typeof err.body === 'object' && err.body !== null ? (err.body as Record<string, unknown>).errors : undefined) ||
    (typeof err.result === 'object' && err.result !== null ? (err.result as Record<string, unknown>).errors : undefined)

  return Array.isArray(candidate) ? (candidate as SquareErrorItem[]) : []
}

function firstSquareErrorMessage(squareErrors: SquareErrorItem[]): string | null {
  const first = squareErrors.find(item => (item?.detail && item.detail.trim()) || (item?.message && item.message.trim()))
  if (!first) return null
  return first.detail?.trim() || first.message?.trim() || null
}

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

    const squareErrors = extractSquareErrors(error)
    if (squareErrors.length > 0) {
      const message =
        firstSquareErrorMessage(squareErrors) ||
        'Payment could not be processed. Please check card details or try a different card.'

      console.error('Square payment error details:', { message, details: squareErrors })
      return NextResponse.json(
        { error: message, details: squareErrors },
        { status: 400 }
      )
    }

    const fallbackMessage =
      error && typeof error === 'object' && typeof (error as any).message === 'string'
        ? (error as any).message
        : 'Payment processing failed'

    console.error('Square payment error details:', { message: fallbackMessage })

    return NextResponse.json(
      { error: fallbackMessage },
      { status: 500 }
    )
  }
}
