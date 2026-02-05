import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile with preferences
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get match count
    const candidates = await prisma.profile.count({
      where: {
        gender: profile.gender === 'male' ? 'female' : 'male',
        isActive: true,
        userId: { not: session.user.id },
      },
    })

    // Build preferences summary
    const preferences = [
      { name: 'Age Range', value: `${profile.prefAgeMin || 'Any'} - ${profile.prefAgeMax || 'Any'}`, dealbreaker: profile.prefAgeIsDealbreaker },
      { name: 'Location', value: profile.prefLocation || profile.prefLocationList || 'Any', dealbreaker: profile.prefLocationIsDealbreaker },
      { name: 'Religion', value: profile.prefReligion || 'Any', dealbreaker: profile.prefReligionIsDealbreaker },
      { name: 'Marital Status', value: profile.prefMaritalStatus || 'Any', dealbreaker: profile.prefMaritalStatusIsDealbreaker },
      { name: 'Diet', value: profile.prefDiet || 'Any', dealbreaker: profile.prefDietIsDealbreaker },
      { name: 'Height', value: `${profile.prefHeightMin || 'Any'} - ${profile.prefHeightMax || 'Any'}`, dealbreaker: profile.prefHeightIsDealbreaker },
      { name: 'Smoking', value: profile.prefSmoking || 'Any', dealbreaker: profile.prefSmokingIsDealbreaker },
      { name: 'Drinking', value: profile.prefDrinking || 'Any', dealbreaker: profile.prefDrinkingIsDealbreaker },
      { name: 'Education', value: profile.prefQualification || 'Any', dealbreaker: profile.prefEducationIsDealbreaker },
      { name: 'Income', value: profile.prefIncome || 'Any', dealbreaker: profile.prefIncomeIsDealbreaker },
    ]

    const preferencesHtml = preferences.map(p =>
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.value}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.dealbreaker ? '⚠️ Yes' : 'No'}</td>
      </tr>`
    ).join('')

    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vivaahready.com'}/admin/profile/${profile.userId}`
    const currentYear = new Date().getFullYear()

    // Send email to admin
    await sendEmail({
      to: 'usdesivivah@gmail.com',
      subject: `[Match Review Request] ${session.user.name || 'User'} - ${profile.odNumber || 'No OD'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Match Review Request</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">User Information</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px; font-weight: bold; width: 150px;">Name:</td>
                <td style="padding: 8px;">${session.user.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Email:</td>
                <td style="padding: 8px;"><a href="mailto:${session.user.email}">${session.user.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">OD Number:</td>
                <td style="padding: 8px;">${profile.odNumber || 'Not assigned'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Location:</td>
                <td style="padding: 8px;">${profile.currentLocation || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Potential Candidates:</td>
                <td style="padding: 8px;">${candidates}</td>
              </tr>
            </table>

            <h2 style="color: #1f2937;">Partner Preferences</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; border-radius: 8px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Preference</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Value</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Deal-breaker?</th>
                </tr>
              </thead>
              <tbody>
                ${preferencesHtml}
              </tbody>
            </table>

            <div style="margin-top: 24px;">
              <a href="${adminUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                View Profile in Admin
              </a>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <h3 style="color: #374151;">Suggested Actions:</h3>
              <ul style="color: #6b7280;">
                <li>Review deal-breaker settings - too many may limit matches</li>
                <li>Check if location preference is too restrictive</li>
                <li>Verify profile is complete and appealing</li>
                <li>Consider widening age range if narrow</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Match Review Request\n\nUser: ${session.user.name || 'Not provided'}\nEmail: ${session.user.email}\nOD Number: ${profile.odNumber || 'Not assigned'}\nLocation: ${profile.currentLocation || 'Not specified'}\nPotential Candidates: ${candidates}\n\nView profile: ${adminUrl}`
    })

    // Send confirmation to user
    const firstName = (session.user.name || 'User').split(' ')[0]
    await sendEmail({
      to: session.user.email!,
      subject: 'We received your match review request - VivaahReady',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">VivaahReady</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Match Review Request Received</p>
            </div>

            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0;">Thank you, ${firstName}!</h2>

              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                We've received your request for a profile and preference review. Our team will analyze your profile
                and preferences to help you get more matches.
              </p>

              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;"><strong>What happens next?</strong></p>
                <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li>Our team will review your profile within 24-48 hours</li>
                  <li>We'll check your preferences for any potential improvements</li>
                  <li>You'll receive personalized suggestions via email</li>
                </ul>
              </div>

              <p style="color: #4b5563; line-height: 1.6;">
                In the meantime, you can also try adjusting your preferences directly in your profile settings.
              </p>

              <p style="color: #4b5563; margin-top: 24px;">
                Warm regards,<br>
                <strong>The VivaahReady Team</strong>
              </p>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${currentYear} VivaahReady. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Thank you, ${firstName}!\n\nWe've received your request for a profile and preference review. Our team will analyze your profile and preferences to help you get more matches.\n\nWhat happens next?\n- Our team will review your profile within 24-48 hours\n- We'll check your preferences for any potential improvements\n- You'll receive personalized suggestions via email\n\nWarm regards,\nThe VivaahReady Team`
    })

    console.log(`Match review requested by user ${session.user.id} (${session.user.email})`)

    return NextResponse.json({
      success: true,
      message: 'Review request submitted successfully',
    })
  } catch (error) {
    console.error('Error processing match review request:', error)
    return NextResponse.json(
      { error: 'Failed to submit review request' },
      { status: 500 }
    )
  }
}
