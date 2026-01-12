import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyOtp } from '@/lib/otpStore'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { otp } = await request.json()

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Verify OTP
    const result = verifyOtp('email', session.user.id, otp)

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // OTP is valid - update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { emailVerified: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('Error verifying email OTP:', error)
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 })
  }
}
