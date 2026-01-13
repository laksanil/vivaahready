import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Create a deletion request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { reason, otherReason } = await request.json()

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Check if user already has a pending deletion request
    const existingRequest = await prisma.deletionRequest.findUnique({
      where: { userId: session.user.id },
    })

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending deletion request' },
          { status: 400 }
        )
      }
      // If there's an old completed/rejected request, update it
      const updatedRequest = await prisma.deletionRequest.update({
        where: { userId: session.user.id },
        data: {
          reason,
          otherReason,
          status: 'pending',
          adminNotes: null,
          processedAt: null,
          processedBy: null,
        },
      })
      return NextResponse.json({ success: true, request: updatedRequest })
    }

    // Create new deletion request
    const deletionRequest = await prisma.deletionRequest.create({
      data: {
        userId: session.user.id,
        reason,
        otherReason,
      },
    })

    return NextResponse.json({ success: true, request: deletionRequest })
  } catch (error) {
    console.error('Deletion request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit deletion request' },
      { status: 500 }
    )
  }
}

// Get user's deletion request status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const deletionRequest = await prisma.deletionRequest.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ request: deletionRequest })
  } catch (error) {
    console.error('Get deletion request error:', error)
    return NextResponse.json(
      { error: 'Failed to get deletion request' },
      { status: 500 }
    )
  }
}
