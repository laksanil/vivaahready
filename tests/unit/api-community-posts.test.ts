import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ---
const getServerSessionMock = vi.fn()

const prismaMock = {
  profile: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  communityPost: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  postLike: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  postComment: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}

const awardCommunityPostPointsMock = vi.fn()

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/engagementPoints', () => ({
  awardCommunityPostPoints: awardCommunityPostPointsMock,
}))

function buildGetRequest(url: string) {
  return new Request(url, { method: 'GET' })
}

function buildPostRequest(url: string, body: Record<string, unknown>) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildDeleteRequest(url: string) {
  return new Request(url, { method: 'DELETE' })
}

// ============================================================
// GET /api/community/posts — Feed
// ============================================================
describe('GET /api/community/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.profile.findUnique.mockResolvedValue({ id: 'profile-1' })
    prismaMock.communityPost.findMany.mockResolvedValue([])
    prismaMock.postLike.findMany.mockResolvedValue([])
    prismaMock.profile.findMany.mockResolvedValue([])
  })

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)
    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 if user has no profile', async () => {
    prismaMock.profile.findUnique.mockResolvedValue(null)
    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    expect(res.status).toBe(403)
  })

  it('returns empty feed when no posts exist', async () => {
    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.posts).toEqual([])
    expect(data.hasMore).toBe(false)
    expect(data.nextCursor).toBeNull()
  })

  it('returns posts with correct display name (VR ID) when showRealName is false', async () => {
    prismaMock.communityPost.findMany.mockResolvedValue([
      {
        id: 'post-1',
        authorId: 'author-1',
        title: 'Test Title',
        body: 'Test body',
        showRealName: false,
        likeCount: 3,
        commentCount: 1,
        createdAt: new Date('2026-01-01'),
      },
    ])
    prismaMock.profile.findMany.mockResolvedValue([
      { userId: 'author-1', odNumber: 'VR-00123', firstName: 'John', lastName: 'Doe', profileImageUrl: null },
    ])
    prismaMock.postLike.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    const data = await res.json()

    expect(data.posts).toHaveLength(1)
    expect(data.posts[0].authorDisplayName).toBe('VR-00123')
    expect(data.posts[0].title).toBe('Test Title')
    expect(data.posts[0].body).toBe('Test body')
    expect(data.posts[0].likeCount).toBe(3)
    expect(data.posts[0].commentCount).toBe(1)
    expect(data.posts[0].likedByMe).toBe(false)
    expect(data.posts[0].isMyPost).toBe(false)
  })

  it('returns "FirstName L." when showRealName is true', async () => {
    prismaMock.communityPost.findMany.mockResolvedValue([
      {
        id: 'post-1',
        authorId: 'author-1',
        title: null,
        body: 'My thoughts',
        showRealName: true,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date(),
      },
    ])
    prismaMock.profile.findMany.mockResolvedValue([
      { userId: 'author-1', odNumber: 'VR-00123', firstName: 'Priya', lastName: 'Sharma', profileImageUrl: null },
    ])
    prismaMock.postLike.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    const data = await res.json()

    expect(data.posts[0].authorDisplayName).toBe('Priya S.')
  })

  it('marks likedByMe correctly when user has liked a post', async () => {
    prismaMock.communityPost.findMany.mockResolvedValue([
      { id: 'post-1', authorId: 'author-1', title: null, body: 'Test', showRealName: false, likeCount: 1, commentCount: 0, createdAt: new Date() },
    ])
    prismaMock.profile.findMany.mockResolvedValue([
      { userId: 'author-1', odNumber: 'VR-001', firstName: 'A', lastName: 'B', profileImageUrl: null },
    ])
    prismaMock.postLike.findMany.mockResolvedValue([{ postId: 'post-1' }])

    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    const data = await res.json()

    expect(data.posts[0].likedByMe).toBe(true)
  })

  it('marks isMyPost when the current user authored the post', async () => {
    prismaMock.communityPost.findMany.mockResolvedValue([
      { id: 'post-1', authorId: 'user-1', title: null, body: 'My post', showRealName: false, likeCount: 0, commentCount: 0, createdAt: new Date() },
    ])
    prismaMock.profile.findMany.mockResolvedValue([
      { userId: 'user-1', odNumber: 'VR-001', firstName: 'Me', lastName: 'Self', profileImageUrl: null },
    ])
    prismaMock.postLike.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    const data = await res.json()

    expect(data.posts[0].isMyPost).toBe(true)
  })

  it('returns hasMore=true and nextCursor when more posts exist', async () => {
    // Return 21 posts (limit is 20, so hasMore = true)
    const posts = Array.from({ length: 21 }, (_, i) => ({
      id: `post-${i}`,
      authorId: 'author-1',
      title: null,
      body: `Post ${i}`,
      showRealName: false,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
    }))
    prismaMock.communityPost.findMany.mockResolvedValue(posts)
    prismaMock.profile.findMany.mockResolvedValue([
      { userId: 'author-1', odNumber: 'VR-001', firstName: 'A', lastName: 'B', profileImageUrl: null },
    ])
    prismaMock.postLike.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    const data = await res.json()

    expect(data.posts).toHaveLength(20)
    expect(data.hasMore).toBe(true)
    expect(data.nextCursor).toBe('post-19')
  })

  it('shows "Member" when author has no odNumber', async () => {
    prismaMock.communityPost.findMany.mockResolvedValue([
      { id: 'post-1', authorId: 'author-1', title: null, body: 'Test', showRealName: false, likeCount: 0, commentCount: 0, createdAt: new Date() },
    ])
    prismaMock.profile.findMany.mockResolvedValue([
      { userId: 'author-1', odNumber: null, firstName: 'A', lastName: 'B', profileImageUrl: null },
    ])
    prismaMock.postLike.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    const data = await res.json()

    expect(data.posts[0].authorDisplayName).toBe('Member')
  })

  it('shows "Anonymous" when author profile is not found', async () => {
    prismaMock.communityPost.findMany.mockResolvedValue([
      { id: 'post-1', authorId: 'deleted-author', title: null, body: 'Test', showRealName: false, likeCount: 0, commentCount: 0, createdAt: new Date() },
    ])
    prismaMock.profile.findMany.mockResolvedValue([]) // No matching profile
    prismaMock.postLike.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/community/posts/route')
    const res = await GET(new Request('http://localhost/api/community/posts') as any)
    const data = await res.json()

    expect(data.posts[0].authorDisplayName).toBe('Anonymous')
  })
})

// ============================================================
// POST /api/community/posts — Create Post
// ============================================================
describe('POST /api/community/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    awardCommunityPostPointsMock.mockResolvedValue({ awarded: true })
  })

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)
    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', { body: 'test' }) as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 if user profile is not approved', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'pending' })
    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', { body: 'test' }) as any)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('approved')
  })

  it('returns 403 if user has no profile', async () => {
    prismaMock.profile.findUnique.mockResolvedValue(null)
    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', { body: 'test' }) as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 if body is empty', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', { body: '' }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 if body is only whitespace', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', { body: '   ' }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 if body exceeds 5000 characters', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', { body: 'x'.repeat(5001) }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 if title exceeds 200 characters', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', {
      body: 'valid body',
      title: 'x'.repeat(201),
    }) as any)
    expect(res.status).toBe(400)
  })

  it('creates a post successfully and returns 201', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.create.mockResolvedValue({
      id: 'new-post-1',
      createdAt: new Date('2026-01-15T10:00:00Z'),
    })

    const { POST } = await import('@/app/api/community/posts/route')
    const res = await POST(buildPostRequest('http://localhost/api/community/posts', {
      body: 'Hello community!',
      title: 'My First Post',
      showRealName: true,
    }) as any)

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('new-post-1')

    // Verify prisma.communityPost.create was called with correct data
    expect(prismaMock.communityPost.create).toHaveBeenCalledWith({
      data: {
        authorId: 'user-1',
        title: 'My First Post',
        body: 'Hello community!',
        showRealName: true,
      },
    })
  })

  it('calls awardCommunityPostPoints after creating a post', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.create.mockResolvedValue({
      id: 'new-post-1',
      createdAt: new Date(),
    })

    const { POST } = await import('@/app/api/community/posts/route')
    await POST(buildPostRequest('http://localhost/api/community/posts', { body: 'test' }) as any)

    // Allow fire-and-forget to resolve
    await new Promise(r => setTimeout(r, 10))

    expect(awardCommunityPostPointsMock).toHaveBeenCalledWith('user-1')
  })

  it('sets showRealName to false by default', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.create.mockResolvedValue({
      id: 'new-post-1',
      createdAt: new Date(),
    })

    const { POST } = await import('@/app/api/community/posts/route')
    await POST(buildPostRequest('http://localhost/api/community/posts', { body: 'test' }) as any)

    expect(prismaMock.communityPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          showRealName: false,
        }),
      })
    )
  })

  it('trims body and title whitespace', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.create.mockResolvedValue({
      id: 'new-post-1',
      createdAt: new Date(),
    })

    const { POST } = await import('@/app/api/community/posts/route')
    await POST(buildPostRequest('http://localhost/api/community/posts', {
      body: '  hello world  ',
      title: '  My Title  ',
    }) as any)

    expect(prismaMock.communityPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          body: 'hello world',
          title: 'My Title',
        }),
      })
    )
  })

  it('sets title to null when title is empty string', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.create.mockResolvedValue({
      id: 'new-post-1',
      createdAt: new Date(),
    })

    const { POST } = await import('@/app/api/community/posts/route')
    await POST(buildPostRequest('http://localhost/api/community/posts', {
      body: 'Just a body',
      title: '  ',
    }) as any)

    expect(prismaMock.communityPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: null,
        }),
      })
    )
  })
})

// ============================================================
// GET /api/community/posts/[id] — Single Post
// ============================================================
describe('GET /api/community/posts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)
    const { GET } = await import('@/app/api/community/posts/[id]/route')
    const res = await GET(
      buildGetRequest('http://localhost/api/community/posts/post-1'),
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 if post does not exist', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(null)
    const { GET } = await import('@/app/api/community/posts/[id]/route')
    const res = await GET(
      buildGetRequest('http://localhost/api/community/posts/nonexistent'),
      { params: { id: 'nonexistent' } }
    )
    expect(res.status).toBe(404)
  })

  it('returns post with correct data', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({
      id: 'post-1',
      authorId: 'author-1',
      title: 'Test',
      body: 'Body text',
      showRealName: false,
      likeCount: 5,
      commentCount: 2,
      createdAt: new Date('2026-01-01'),
    })
    prismaMock.profile.findUnique.mockResolvedValue({
      odNumber: 'VR-00123',
      firstName: 'John',
      lastName: 'Doe',
      profileImageUrl: null,
    })
    prismaMock.postLike.findUnique.mockResolvedValue(null)

    const { GET } = await import('@/app/api/community/posts/[id]/route')
    const res = await GET(
      buildGetRequest('http://localhost/api/community/posts/post-1'),
      { params: { id: 'post-1' } }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('post-1')
    expect(data.authorDisplayName).toBe('VR-00123')
    expect(data.likeCount).toBe(5)
    expect(data.isMyPost).toBe(false)
    expect(data.likedByMe).toBe(false)
  })
})

// ============================================================
// DELETE /api/community/posts/[id] — Delete Post
// ============================================================
describe('DELETE /api/community/posts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)
    const { DELETE } = await import('@/app/api/community/posts/[id]/route')
    const res = await DELETE(
      buildDeleteRequest('http://localhost/api/community/posts/post-1'),
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 if post does not exist', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(null)
    const { DELETE } = await import('@/app/api/community/posts/[id]/route')
    const res = await DELETE(
      buildDeleteRequest('http://localhost/api/community/posts/post-1'),
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(404)
  })

  it('returns 403 if user is not the author', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ authorId: 'other-user' })
    const { DELETE } = await import('@/app/api/community/posts/[id]/route')
    const res = await DELETE(
      buildDeleteRequest('http://localhost/api/community/posts/post-1'),
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('own posts')
  })

  it('deletes the post successfully when user is the author', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ authorId: 'user-1' })
    prismaMock.communityPost.delete.mockResolvedValue({})

    const { DELETE } = await import('@/app/api/community/posts/[id]/route')
    const res = await DELETE(
      buildDeleteRequest('http://localhost/api/community/posts/post-1'),
      { params: { id: 'post-1' } }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.deleted).toBe(true)
    expect(prismaMock.communityPost.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } })
  })
})

// ============================================================
// POST /api/community/posts/[id]/like — Like Toggle
// ============================================================
describe('POST /api/community/posts/[id]/like', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => ops)
  })

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)
    const { POST } = await import('@/app/api/community/posts/[id]/like/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/like', {}),
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 if post does not exist', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(null)
    const { POST } = await import('@/app/api/community/posts/[id]/like/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/like', {}),
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(404)
  })

  it('likes a post when not already liked', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    prismaMock.postLike.findUnique.mockResolvedValue(null) // Not liked yet

    const { POST } = await import('@/app/api/community/posts/[id]/like/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/like', {}),
      { params: { id: 'post-1' } }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.liked).toBe(true)
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })

  it('unlikes a post when already liked', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    prismaMock.postLike.findUnique.mockResolvedValue({ id: 'like-1' }) // Already liked

    const { POST } = await import('@/app/api/community/posts/[id]/like/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/like', {}),
      { params: { id: 'post-1' } }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.liked).toBe(false)
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })

  it('handles P2002 race condition on like gracefully', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    prismaMock.postLike.findUnique.mockResolvedValue(null)
    // Simulate unique constraint violation (another request created the like)
    prismaMock.$transaction.mockRejectedValue({ code: 'P2002' })

    const { POST } = await import('@/app/api/community/posts/[id]/like/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/like', {}),
      { params: { id: 'post-1' } }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.liked).toBe(true) // Treat as already liked
  })
})

// ============================================================
// GET /api/community/posts/[id]/comments — List Comments
// ============================================================
describe('GET /api/community/posts/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)
    const { GET } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await GET(
      new Request('http://localhost/api/community/posts/post-1/comments') as any,
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 if post does not exist', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue(null)
    const { GET } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await GET(
      new Request('http://localhost/api/community/posts/post-1/comments') as any,
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(404)
  })

  it('returns empty comments list when no comments', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    prismaMock.postComment.findMany.mockResolvedValue([])
    prismaMock.profile.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await GET(
      new Request('http://localhost/api/community/posts/post-1/comments') as any,
      { params: { id: 'post-1' } }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.comments).toEqual([])
    expect(data.hasMore).toBe(false)
  })

  it('returns comments with correct display names', async () => {
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    prismaMock.postComment.findMany.mockResolvedValue([
      {
        id: 'comment-1',
        authorId: 'commenter-1',
        body: 'Great post!',
        showRealName: true,
        createdAt: new Date('2026-01-15'),
      },
    ])
    prismaMock.profile.findMany.mockResolvedValue([
      { userId: 'commenter-1', odNumber: 'VR-555', firstName: 'Anita', lastName: 'Mehta', profileImageUrl: null },
    ])

    const { GET } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await GET(
      new Request('http://localhost/api/community/posts/post-1/comments') as any,
      { params: { id: 'post-1' } }
    )

    const data = await res.json()
    expect(data.comments).toHaveLength(1)
    expect(data.comments[0].authorDisplayName).toBe('Anita M.')
    expect(data.comments[0].body).toBe('Great post!')
    expect(data.comments[0].isMyComment).toBe(false)
  })
})

// ============================================================
// POST /api/community/posts/[id]/comments — Add Comment
// ============================================================
describe('POST /api/community/posts/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } })
    prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => ops)
  })

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValue(null)
    const { POST } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/comments', { body: 'nice' }) as any,
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 if user is not approved', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'pending' })
    const { POST } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/comments', { body: 'nice' }) as any,
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(403)
  })

  it('returns 404 if post does not exist', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.findUnique.mockResolvedValue(null)
    const { POST } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/comments', { body: 'nice' }) as any,
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 if comment body is empty', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    const { POST } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/comments', { body: '' }) as any,
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 if comment body exceeds 2000 characters', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    const { POST } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/comments', { body: 'x'.repeat(2001) }) as any,
      { params: { id: 'post-1' } }
    )
    expect(res.status).toBe(400)
  })

  it('creates comment successfully and returns 201', async () => {
    prismaMock.profile.findUnique.mockResolvedValue({ approvalStatus: 'approved' })
    prismaMock.communityPost.findUnique.mockResolvedValue({ id: 'post-1' })
    prismaMock.$transaction.mockResolvedValue([
      { id: 'comment-1', createdAt: new Date('2026-01-15T10:00:00Z') },
      {},
    ])

    const { POST } = await import('@/app/api/community/posts/[id]/comments/route')
    const res = await POST(
      buildPostRequest('http://localhost/api/community/posts/post-1/comments', {
        body: 'Great post!',
        showRealName: true,
      }) as any,
      { params: { id: 'post-1' } }
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('comment-1')
  })
})
