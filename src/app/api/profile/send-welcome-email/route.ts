import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Get the profile with user info
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: true },
    })

    if (!profile || !profile.user || !profile.user.email) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if welcome email was already sent (signupStep >= 9 means profile is complete)
    if (profile.signupStep >= 9) {
      console.log('Welcome email already sent for profile:', profileId)
      return NextResponse.json({ success: true, alreadySent: true })
    }

    // Send welcome email
    await sendWelcomeEmail(profile.user.email, profile.user.name || profile.firstName || 'there')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
