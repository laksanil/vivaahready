import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { approvalStatus: true }
    })

    return NextResponse.json({
      hasPaid: subscription?.profilePaid === true,
      isApproved: profile?.approvalStatus === 'approved',
      approvalStatus: profile?.approvalStatus || null,
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 })
  }
}
