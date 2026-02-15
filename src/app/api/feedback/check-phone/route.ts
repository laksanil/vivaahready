import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Lightweight check: does the authenticated user have a phone number on file? */
export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  if (!session?.user || !userId) {
    return NextResponse.json({ hasPhone: false, authenticated: false })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  })

  const phone = user?.phone?.trim()
  return NextResponse.json({ hasPhone: !!phone, authenticated: true })
}
