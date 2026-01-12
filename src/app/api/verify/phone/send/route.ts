import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    if (!user.phone) {
      return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
    }

    if (user.phoneVerified) {
      return NextResponse.json({ error: 'Phone already verified' }, { status: 400 })
    }

    // Generate and store OTP
    const otp = generateOtp()
    setOtp('phone', session.user.id, otp, 10) // 10 minutes expiry

    // In production, send SMS here using a service like Twilio
    console.log(`[DEV] Phone OTP for ${user.phone}: ${otp}`)

    // TODO: Implement actual SMS sending
    // await sendSms({
    //   to: user.phone,
    //   body: `Your VivaahReady verification code is: ${otp}. It expires in 10 minutes.`,
    // })

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your phone',
      // In development, include OTP for testing (remove in production!)
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    })
  } catch (error) {
    console.error('Error sending phone OTP:', error)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
