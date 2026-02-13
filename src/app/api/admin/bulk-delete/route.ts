import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds must be a non-empty array' }, { status: 400 })
    }

    if (userIds.length > 50) {
      return NextResponse.json({ error: 'Cannot delete more than 50 users at once' }, { status: 400 })
    }

    const result = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    })

    return NextResponse.json({
      message: `${result.count} account(s) deleted successfully`,
      deletedCount: result.count,
    })
  } catch (error) {
    console.error('Admin bulk delete error:', error)
    return NextResponse.json({ error: 'Failed to delete accounts' }, { status: 500 })
  }
}
