import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/posts/[id]/comments — Paginated comments (oldest first)
 */
export async function GET(
  request: NextRequest,
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

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') || undefined
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)

  const comments = await prisma.postComment.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: 'asc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = comments.length > limit
  const sliced = hasMore ? comments.slice(0, limit) : comments

  // Batch-load author profiles
  const authorIds = Array.from(new Set(sliced.map(c => c.authorId)))
  const authorProfiles = await prisma.profile.findMany({
    where: { userId: { in: authorIds } },
    select: { userId: true, odNumber: true, firstName: true, lastName: true, profileImageUrl: true },
  })
  const profileMap = new Map(authorProfiles.map(p => [p.userId, p]))

  const formatted = sliced.map(comment => {
    const author = profileMap.get(comment.authorId)
    let authorDisplayName = 'Anonymous'
    if (author) {
      if (comment.showRealName && author.firstName) {
        const lastInitial = author.lastName ? ` ${author.lastName.charAt(0)}.` : ''
        authorDisplayName = `${author.firstName}${lastInitial}`
      } else {
        authorDisplayName = author.odNumber || 'Member'
      }
    }

    return {
      id: comment.id,
      body: comment.body,
      authorDisplayName,
      authorProfileImageUrl: author?.profileImageUrl || null,
      isMyComment: comment.authorId === session.user.id,
      createdAt: comment.createdAt.toISOString(),
    }
  })

  return NextResponse.json({
    comments: formatted,
    hasMore,
    nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
  })
}

/**
 * POST /api/community/posts/[id]/comments — Add a comment
 * Only approved members can comment.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { approvalStatus: true },
  })
  if (!profile || profile.approvalStatus !== 'approved') {
    return NextResponse.json({ error: 'Only approved members can comment' }, { status: 403 })
  }

  // Verify post exists
  const post = await prisma.communityPost.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const body = await request.json()
  const commentBody = typeof body.body === 'string' ? body.body.trim() : ''
  const showRealName = body.showRealName === true

  if (!commentBody || commentBody.length > 2000) {
    return NextResponse.json({ error: 'Comment is required (max 2000 characters)' }, { status: 400 })
  }

  const [comment] = await prisma.$transaction([
    prisma.postComment.create({
      data: {
        postId: params.id,
        authorId: session.user.id,
        body: commentBody,
        showRealName,
      },
    }),
    prisma.communityPost.update({
      where: { id: params.id },
      data: { commentCount: { increment: 1 } },
    }),
  ])

  return NextResponse.json({ id: comment.id, createdAt: comment.createdAt.toISOString() }, { status: 201 })
}
