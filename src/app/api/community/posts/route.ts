import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardCommunityPostPoints } from '@/lib/engagementPoints'

export const dynamic = 'force-dynamic'

/** Format VR ID for display: VR20251124011 → "VR 11/24/2025 #011" */
function formatVrIdDisplay(odNumber: string | null | undefined): string {
  if (!odNumber) return 'VR Member'
  const match = odNumber.match(/^VR(\d{4})(\d{2})(\d{2})(\d{3,})$/)
  if (!match) return odNumber
  const [, year, month, day, seq] = match
  return `VR ${month}/${day}/${year} #${seq}`
}

/** Generate a URL-friendly slug from a title */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

/** Ensure slug uniqueness by appending a short suffix if needed */
async function uniqueSlug(base: string): Promise<string> {
  const existing = await prisma.communityPost.findUnique({ where: { slug: base } })
  if (!existing) return base
  const suffix = Date.now().toString(36).slice(-4)
  return `${base}-${suffix}`
}

/**
 * GET /api/community/posts — Paginated community feed (newest first)
 * Publicly readable — no auth required. Only returns published posts.
 * Logged-in users get likedByMe/isMyPost data.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || null

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') || undefined
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)

  const posts = await prisma.communityPost.findMany({
    where: { isPublished: true },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
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

  // Check which posts the current user has liked (only if logged in)
  const postIds = sliced.map(p => p.id)
  let likedSet = new Set<string>()
  if (currentUserId) {
    const userLikes = await prisma.postLike.findMany({
      where: { postId: { in: postIds }, userId: currentUserId },
      select: { postId: true },
    })
    likedSet = new Set(userLikes.map(l => l.postId))
  }

  const formatted = sliced.map(post => {
    const author = profileMap.get(post.authorId)
    let authorDisplayName = 'VR Member'
    if (post.isAnonymous) {
      authorDisplayName = 'Anonymous'
    } else if (author) {
      if (post.showRealName && author.firstName) {
        const lastInitial = author.lastName ? ` ${author.lastName.charAt(0)}.` : ''
        authorDisplayName = `${author.firstName}${lastInitial}`
      } else {
        authorDisplayName = formatVrIdDisplay(author.odNumber)
      }
    } else if (post.authorId.startsWith('vr-seeded-')) {
      authorDisplayName = post.authorId.replace('vr-seeded-', 'VR ')
    }

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      body: post.body,
      authorDisplayName,
      authorProfileImageUrl: author?.profileImageUrl || null,
      showRealName: post.showRealName,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      likedByMe: likedSet.has(post.id),
      isPinned: post.isPinned,
      isMyPost: currentUserId ? post.authorId === currentUserId : false,
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
 * Authenticated users with a complete profile can create posts.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, signupStep: true, photoUrls: true },
  })
  if (!profile || (profile.signupStep ?? 0) < 9 || !profile.photoUrls) {
    return NextResponse.json({ error: 'Complete profile with photos required to create posts' }, { status: 403 })
  }

  const body = await request.json()
  const postBody = typeof body.body === 'string' ? body.body.trim() : ''
  const postTitle = typeof body.title === 'string' ? body.title.trim() : null

  // Support new identityMode ('vr_id' | 'real_name' | 'anonymous') with fallback to legacy showRealName
  const identityMode = body.identityMode || (body.showRealName === true ? 'real_name' : 'vr_id')
  const showRealName = identityMode === 'real_name'
  const isAnonymous = identityMode === 'anonymous'

  if (!postBody || postBody.length > 5000) {
    return NextResponse.json({ error: 'Post body is required (max 5000 characters)' }, { status: 400 })
  }
  if (postTitle && postTitle.length > 200) {
    return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
  }

  // Auto-generate slug from title
  let slug: string | null = null
  if (postTitle) {
    const baseSlug = generateSlug(postTitle)
    if (baseSlug) {
      slug = await uniqueSlug(baseSlug)
    }
  }

  const post = await prisma.communityPost.create({
    data: {
      authorId: session.user.id,
      title: postTitle || null,
      slug,
      body: postBody,
      showRealName,
      isAnonymous,
    },
  })

  // Award engagement rewards for this post (awaited so rewards are reliably persisted)
  await awardCommunityPostPoints(session.user.id, post.id).catch((error) => {
    console.error('Failed to award community post points:', error)
  })

  return NextResponse.json({ id: post.id, slug: post.slug, createdAt: post.createdAt.toISOString() }, { status: 201 })
}
