import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated()

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messageId, status } = await request.json()

    if (!messageId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await prisma.supportMessage.update({
      where: { id: messageId },
      data: { status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating message status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}
