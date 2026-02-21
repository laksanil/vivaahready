import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardCommunityPostPoints } from '@/lib/engagementPoints'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/posts — Paginated community feed (newest first)
 * Any user with a profile can read.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user has a profile
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) {
    return NextResponse.json({ error: 'Profile required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') || undefined
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)

  const posts = await prisma.communityPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = posts.length > limit
  const sliced = hasMore ? posts.slice(0, limit) : posts

  // Batch-load author profiles
  const authorIds = Array.from(new Set(sliced.map(p => p.authorId)))
  const authorProfiles = await prisma.profile.findMany({
    where: { userId: { in: authorIds } },
    select: { userId: true, odNumber: true, firstName: true, lastName: true, profileImageUrl: true },
  })
  const profileMap = new Map(authorProfiles.map(p => [p.userId, p]))

  // Check which posts the current user has liked
  const postIds = sliced.map(p => p.id)
  const userLikes = await prisma.postLike.findMany({
    where: { postId: { in: postIds }, userId: session.user.id },
    select: { postId: true },
  })
  const likedSet = new Set(userLikes.map(l => l.postId))

  const formatted = sliced.map(post => {
    const author = profileMap.get(post.authorId)
    let authorDisplayName = 'Anonymous'
    if (author) {
      if (post.showRealName && author.firstName) {
        const lastInitial = author.lastName ? ` ${author.lastName.charAt(0)}.` : ''
        authorDisplayName = `${author.firstName}${lastInitial}`
      } else {
        authorDisplayName = author.odNumber || 'Member'
      }
    }

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      authorDisplayName,
      authorProfileImageUrl: author?.profileImageUrl || null,
      showRealName: post.showRealName,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      likedByMe: likedSet.has(post.id),
      isMyPost: post.authorId === session.user.id,
      createdAt: post.createdAt.toISOString(),
    }
  })

  return NextResponse.json({
    posts: formatted,
    hasMore,
    nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
  })
}

/**
 * POST /api/community/posts — Create a new community post
 * Only approved members can create posts.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { approvalStatus: true },
  })
  if (!profile || profile.approvalStatus !== 'approved') {
    return NextResponse.json({ error: 'Only approved members can create posts' }, { status: 403 })
  }

  const body = await request.json()
  const postBody = typeof body.body === 'string' ? body.body.trim() : ''
  const postTitle = typeof body.title === 'string' ? body.title.trim() : null
  const showRealName = body.showRealName === true

  if (!postBody || postBody.length > 5000) {
    return NextResponse.json({ error: 'Post body is required (max 5000 characters)' }, { status: 400 })
  }
  if (postTitle && postTitle.length > 200) {
    return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
  }

  const post = await prisma.communityPost.create({
    data: {
      authorId: session.user.id,
      title: postTitle || null,
      body: postBody,
      showRealName,
    },
  })

  // Fire and forget: award engagement points (max 1/day)
  awardCommunityPostPoints(session.user.id).catch(() => {})

  return NextResponse.json({ id: post.id, createdAt: post.createdAt.toISOString() }, { status: 201 })
}
