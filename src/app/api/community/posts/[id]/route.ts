import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/posts/[id] — Get a single post with metadata
 * Supports lookup by id or slug. Publicly readable — no auth required.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || null

  // Try by id first, then by slug
  let post = await prisma.communityPost.findUnique({
    where: { id: params.id },
  })
  if (!post) {
    post = await prisma.communityPost.findUnique({
      where: { slug: params.id },
    })
  }

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const author = await prisma.profile.findUnique({
    where: { userId: post.authorId },
    select: { odNumber: true, firstName: true, lastName: true, profileImageUrl: true },
  })

  let authorDisplayName = 'VR Member'
  if (author) {
    if (post.showRealName && author.firstName) {
      const lastInitial = author.lastName ? ` ${author.lastName.charAt(0)}.` : ''
      authorDisplayName = `${author.firstName}${lastInitial}`
    } else {
      authorDisplayName = author.odNumber || 'VR Member'
    }
  }

  // Check if current user liked this post (only if logged in)
  let likedByMe = false
  if (currentUserId) {
    const userLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: post.id, userId: currentUserId } },
    })
    likedByMe = !!userLike
  }

  return NextResponse.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    body: post.body,
    authorDisplayName,
    authorProfileImageUrl: author?.profileImageUrl || null,
    showRealName: post.showRealName,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe,
    isMyPost: currentUserId ? post.authorId === currentUserId : false,
    createdAt: post.createdAt.toISOString(),
  })
}

/**
 * DELETE /api/community/posts/[id] — Delete own post
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 })
  }

  // Cascade deletes likes and comments
  await prisma.communityPost.delete({ where: { id: params.id } })

  return NextResponse.json({ deleted: true })
}
