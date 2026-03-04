import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/strength - Returns profile strength score and tips
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      phone: true,
      createdAt: true,
      profile: {
        select: {
          profileImageUrl: true,
          photoUrls: true,
          aboutMe: true,
          idealPartnerDesc: true,
          qualification: true,
          occupation: true,
          employerName: true,
          hobbies: true,
          fitness: true,
          interests: true,
          dietaryPreference: true,
          familyType: true,
          linkedinProfile: true,
          instagram: true,
          facebook: true,
          isVerified: true,
          signupStep: true,
          createdAt: true,
          approvalDate: true,
        },
      },
    },
  })

  if (!user?.profile) {
    return NextResponse.json({ score: 0, sections: [], tips: [], memberSince: null, approvedDate: null })
  }

  const p = user.profile
  const photoCount = p.photoUrls ? p.photoUrls.split(',').filter(Boolean).length : 0
  const hasLinkedIn = !!p.linkedinProfile && p.linkedinProfile !== 'no_linkedin'
  const hasSocialLink = !!(hasLinkedIn || p.instagram || p.facebook)

  const sections = [
    {
      name: 'Profile Photo',
      score: p.profileImageUrl ? 100 : 0,
      weight: 15,
      tip: !p.profileImageUrl ? 'Add a profile photo — profiles with photos get 3x more interest' : null,
    },
    {
      name: 'Photo Gallery',
      score: photoCount >= 3 ? 100 : photoCount >= 1 ? 60 : 0,
      weight: 10,
      tip: photoCount < 3 ? `Add ${3 - photoCount} more photo${3 - photoCount > 1 ? 's' : ''} — profiles with 3+ photos get more matches` : null,
    },
    {
      name: 'About Me',
      score: p.aboutMe && p.aboutMe.length > 50 ? 100 : p.aboutMe && p.aboutMe.length > 0 ? 50 : 0,
      weight: 15,
      tip: !p.aboutMe || p.aboutMe.length <= 50 ? 'Write a detailed About Me (50+ characters) to stand out' : null,
    },
    {
      name: 'Education & Career',
      score: [p.qualification, p.occupation, p.employerName].filter(Boolean).length >= 2 ? 100 : [p.qualification, p.occupation].filter(Boolean).length >= 1 ? 60 : 0,
      weight: 10,
      tip: !p.occupation ? 'Add your occupation details' : !p.employerName ? 'Adding your employer builds credibility' : null,
    },
    {
      name: 'Lifestyle & Interests',
      score: [p.hobbies, p.fitness, p.interests, p.dietaryPreference].filter(Boolean).length >= 3 ? 100 : [p.hobbies, p.interests].filter(Boolean).length >= 1 ? 50 : 0,
      weight: 10,
      tip: !p.hobbies ? 'Add your hobbies to find like-minded matches' : null,
    },
    {
      name: 'Family Details',
      score: p.familyType ? 100 : 0,
      weight: 5,
      tip: !p.familyType ? 'Complete family details for better matches' : null,
    },
    {
      name: 'Partner Preferences',
      score: (p.signupStep || 0) >= 9 ? 100 : 50,
      weight: 15,
      tip: (p.signupStep || 0) < 9 ? 'Complete all preference sections for accurate matching' : null,
    },
    {
      name: 'Ideal Partner',
      score: p.idealPartnerDesc && p.idealPartnerDesc.length > 30 ? 100 : 0,
      weight: 10,
      tip: !p.idealPartnerDesc || p.idealPartnerDesc.length <= 30 ? 'Describe your ideal partner to attract better matches' : null,
    },
    {
      name: 'Social Links',
      score: hasSocialLink ? 100 : 0,
      weight: 5,
      tip: !(hasLinkedIn || p.instagram) ? 'Add social links to build trust' : null,
    },
    {
      name: 'Verification',
      score: p.isVerified ? 100 : 0,
      weight: 5,
      tip: !p.isVerified ? 'Get verified for higher visibility in match results' : null,
    },
  ]

  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0)
  const weightedScore = sections.reduce((sum, s) => sum + (s.score * s.weight / 100), 0)
  const overallScore = Math.round((weightedScore / totalWeight) * 100)

  const tips = sections
    .filter(s => s.tip && s.score < 100)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(s => s.tip!)

  return NextResponse.json({
    score: overallScore,
    sections: sections.map(s => ({ name: s.name, score: s.score, weight: s.weight })),
    tips,
    memberSince: user.createdAt.toISOString(),
    approvedDate: p.approvalDate?.toISOString() || null,
  })
}
