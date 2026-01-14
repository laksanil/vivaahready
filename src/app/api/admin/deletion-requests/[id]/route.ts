import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

// Process a deletion request (approve/reject/complete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action, adminNotes } = await request.json()

    if (!action || !['approve', 'reject', 'complete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const deletionRequest = await prisma.deletionRequest.findUnique({
      where: { id },
    })

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found' },
        { status: 404 }
      )
    }

    if (action === 'complete') {
      // Actually delete the user and all related data
      // Prisma cascade will handle deleting profile, matches, messages, etc.
      await prisma.$transaction(async (tx) => {
        // Delete the user (cascade will handle related records)
        await tx.user.delete({
          where: { id: deletionRequest.userId },
        })

        // Delete the deletion request
        await tx.deletionRequest.delete({
          where: { id },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'User and profile deleted successfully',
      })
    }

    // Update the deletion request status
    const status = action === 'approve' ? 'approved' : 'rejected'
    const updatedRequest = await prisma.deletionRequest.update({
      where: { id },
      data: {
        status,
        adminNotes,
        processedAt: new Date(),
        processedBy: 'admin', // Could store actual admin ID if needed
      },
    })

    return NextResponse.json({ success: true, request: updatedRequest })
  } catch (error) {
    console.error('Process deletion request error:', error)
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    )
  }
}
