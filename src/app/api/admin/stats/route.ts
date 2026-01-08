import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalProfiles, brides, grooms, totalMatches, pendingMatches, recentProfiles] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { gender: 'female' } }),
      prisma.profile.count({ where: { gender: 'male' } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'pending' } }),
      prisma.profile.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      })
    ])

    return NextResponse.json({
      totalProfiles,
      brides,
      grooms,
      totalMatches,
      pendingMatches,
      recentProfiles
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
