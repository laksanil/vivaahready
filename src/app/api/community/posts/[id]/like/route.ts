import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/community/posts/[id]/like — Toggle like on a post
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify post exists
  const post = await prisma.communityPost.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Check if already liked
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: params.id, userId: session.user.id } },
  })

  if (existing) {
    // Unlike
    await prisma.$transaction([
      prisma.postLike.delete({ where: { id: existing.id } }),
      prisma.communityPost.update({
        where: { id: params.id },
        data: { likeCount: { decrement: 1 } },
      }),
    ])
    return NextResponse.json({ liked: false })
  } else {
    // Like
    try {
      await prisma.$transaction([
        prisma.postLike.create({
          data: { postId: params.id, userId: session.user.id },
        }),
        prisma.communityPost.update({
          where: { id: params.id },
          data: { likeCount: { increment: 1 } },
        }),
      ])
      return NextResponse.json({ liked: true })
    } catch (error: unknown) {
      // Race condition: another request already created the like
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return NextResponse.json({ liked: true })
      }
      throw error
    }
  }
}
