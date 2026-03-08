import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveSessionUserId } from '@/lib/testAuth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = resolveSessionUserId(request, session)
    if (!userId) {
      return NextResponse.json({ hasGivenFeedback: false })
    }

    const count = await prisma.feedback.count({
      where: { userId },
      take: 1,
    })

    return NextResponse.json({ hasGivenFeedback: count > 0 })
  } catch {
    return NextResponse.json({ hasGivenFeedback: false })
  }
}
