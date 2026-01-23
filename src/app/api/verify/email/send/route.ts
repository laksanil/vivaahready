import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOtp, setOtp } from '@/lib/otpStore'
import { sendEmailVerificationCode } from '@/lib/email'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'No email address on file' }, { status: 400 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Generate 4-digit OTP and store it
    const otp = generateOtp(4)
    setOtp('email', session.user.id, otp, 10) // 10 minutes expiry

    // Send verification email
    const emailResult = await sendEmailVerificationCode(user.email, otp)

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    console.log(`Email verification code sent to ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    })
  } catch (error) {
    console.error('Error sending email OTP:', error)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
