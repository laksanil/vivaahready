import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmailVerificationOtp } from '@/lib/email'
import { generateOtp, setOtp } from '@/lib/otpStore'

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

    // Generate and store OTP
    const otp = generateOtp()
    setOtp('email', session.user.id, otp, 10) // 10 minutes expiry

    const sendResult = await sendEmailVerificationOtp(user.email, otp)
    if (!sendResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Email send failed in development; returning OTP for testing.', sendResult.error)
        return NextResponse.json({
          success: true,
          message: 'Verification code generated (email service not configured).',
          devOtp: otp,
        })
      }

      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    })
  } catch (error) {
    console.error('Error sending email OTP:', error)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
