import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'
import { isTestAdminRequest } from '@/lib/testAuth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = (await isAdminAuthenticated()) || isTestAdminRequest(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
    })

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Admin feedback detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback detail' }, { status: 500 })
  }
}
