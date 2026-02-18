import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    if (amount !== 50) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    // Check if user has a profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Please create a profile first' }, { status: 400 })
    }

    // For now, we'll simulate a successful payment
    // In production, payments are processed via PayPal or Zelle

    // Update or create subscription with payment info
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: 'basic',
        status: 'active',
        profilePaid: true,
        profilePaymentId: `PAY_${Date.now()}_${session.user.id}`,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        plan: 'basic',
        status: 'active',
        profilePaid: true,
        profilePaymentId: `PAY_${Date.now()}_${session.user.id}`,
      },
    })

    // Update profile to pending approval (if not already approved)
    if (profile.approvalStatus !== 'approved') {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          approvalStatus: 'pending',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment successful. Your profile is now pending approval.',
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}
