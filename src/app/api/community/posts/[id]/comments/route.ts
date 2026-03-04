import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardCommunityCommentPoints } from '@/lib/engagementPoints'

export const dynamic = 'force-dynamic'

interface FormattedComment {
  id: string
  body: string
  parentId: string | null
  authorDisplayName: string
  authorProfileImageUrl: string | null
  isMyComment: boolean
  createdAt: string
  replies: FormattedComment[]
}

/**
 * GET /api/community/posts/[id]/comments — All comments with nested replies
 * Publicly readable — no auth required.
 * Returns a tree structure: top-level comments with nested replies array.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || null

  // Verify post exists
  const post = await prisma.communityPost.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Fetch all comments for this post (flat list, ordered by creation time)
  const comments = await prisma.postComment.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  // Batch-load author profiles
  const authorIds = Array.from(new Set(comments.map(c => c.authorId)))
  const authorProfiles = await prisma.profile.findMany({
    where: { userId: { in: authorIds } },
    select: { userId: true, odNumber: true, profileImageUrl: true },
  })
  const profileMap = new Map(authorProfiles.map(p => [p.userId, p]))

  // Format all comments into flat list first
  const formattedMap = new Map<string, FormattedComment>()
  const topLevel: FormattedComment[] = []

  for (const comment of comments) {
    const author = profileMap.get(comment.authorId)
    const authorDisplayName = author?.odNumber || 'VR-UNKNOWN'

    const formatted: FormattedComment = {
      id: comment.id,
      body: comment.body,
      parentId: comment.parentId,
      authorDisplayName,
      authorProfileImageUrl: author?.profileImageUrl || null,
      isMyComment: currentUserId ? comment.authorId === currentUserId : false,
      createdAt: comment.createdAt.toISOString(),
      replies: [],
    }

    formattedMap.set(comment.id, formatted)
  }

  // Build tree: attach replies to their parents
  for (const comment of Array.from(formattedMap.values())) {
    if (comment.parentId && formattedMap.has(comment.parentId)) {
      formattedMap.get(comment.parentId)!.replies.push(comment)
    } else {
      topLevel.push(comment)
    }
  }

  return NextResponse.json({
    comments: topLevel,
    totalCount: comments.length,
  })
}

/**
 * POST /api/community/posts/[id]/comments — Add a comment or reply
 * Authenticated users with complete profiles can comment.
 * Pass parentId to create a nested reply.
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
    select: { id: true, signupStep: true, photoUrls: true },
  })
  if (!profile || (profile.signupStep ?? 0) < 9 || !profile.photoUrls) {
    return NextResponse.json({ error: 'Complete profile with photos required to comment' }, { status: 403 })
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
  const parentId = typeof body.parentId === 'string' ? body.parentId : null

  if (!commentBody || commentBody.length > 2000) {
    return NextResponse.json({ error: 'Comment is required (max 2000 characters)' }, { status: 400 })
  }

  // If replying to a comment, verify parent exists and belongs to same post
  if (parentId) {
    const parentComment = await prisma.postComment.findUnique({
      where: { id: parentId },
      select: { postId: true },
    })
    if (!parentComment || parentComment.postId !== params.id) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
    }
  }

  const [comment] = await prisma.$transaction([
    prisma.postComment.create({
      data: {
        postId: params.id,
        authorId: session.user.id,
        body: commentBody,
        showRealName: false,
        parentId,
      },
    }),
    prisma.communityPost.update({
      where: { id: params.id },
      data: { commentCount: { increment: 1 } },
    }),
  ])

  // Award comment point (awaited so reward is reliably persisted)
  await awardCommunityCommentPoints(session.user.id, comment.id).catch((error) => {
    console.error('Failed to award community comment points:', error)
  })

  return NextResponse.json({ id: comment.id, parentId: comment.parentId, createdAt: comment.createdAt.toISOString() }, { status: 201 })
}
