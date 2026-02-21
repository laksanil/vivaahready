'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  X,
  Check,
  MessageSquare,
} from 'lucide-react'

interface Post {
  id: string
  title: string | null
  body: string
  authorDisplayName: string
  authorProfileImageUrl: string | null
  showRealName: boolean
  likeCount: number
  commentCount: number
  likedByMe: boolean
  isMyPost: boolean
  createdAt: string
}

interface Comment {
  id: string
  body: string
  authorDisplayName: string
  authorProfileImageUrl: string | null
  isMyComment: boolean
  createdAt: string
}

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function CommunityPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  // Create post form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')
  const [showRealName, setShowRealName] = useState(false)

  // Expanded post (inline comments)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentShowRealName, setCommentShowRealName] = useState(false)

  // Approval status
  const [isApproved, setIsApproved] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // Check approval status
  useEffect(() => {
    if (!session) return
    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.approvalStatus === 'approved') setIsApproved(true)
      })
      .catch(() => {})
  }, [session])

  const fetchPosts = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/community/posts?cursor=${cursor}`
      : '/api/community/posts'

    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  }, [])

  // Initial load
  useEffect(() => {
    fetchPosts()
      .then(data => {
        if (data) {
          setPosts(data.posts)
          setHasMore(data.hasMore)
          setNextCursor(data.nextCursor)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fetchPosts])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPosts(nextCursor)
      if (data) {
        setPosts(prev => [...prev, ...data.posts])
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postBody.trim() || creating) return
    setCreating(true)

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle.trim() || null,
          body: postBody.trim(),
          showRealName,
        }),
      })

      if (res.ok) {
        setPostTitle('')
        setPostBody('')
        setShowRealName(false)
        setShowCreateForm(false)
        // Refresh feed
        const data = await fetchPosts()
        if (data) {
          setPosts(data.posts)
          setHasMore(data.hasMore)
          setNextCursor(data.nextCursor)
        }
        showToast('Post published!')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleLikeToggle = async (postId: string) => {
    // Optimistic update
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    )

    try {
      await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' })
    } catch {
      // Revert on failure
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p
        )
      )
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return
    const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId))
      if (expandedPostId === postId) setExpandedPostId(null)
      showToast('Post deleted')
    }
  }

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/community/post/${postId}`
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied!')
    }).catch(() => {})
  }

  const toggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
      setComments([])
      return
    }
    setExpandedPostId(postId)
    setLoadingComments(true)
    setComments([])

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments)
      }
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!commentBody.trim() || submittingComment) return
    setSubmittingComment(true)

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody.trim(), showRealName: commentShowRealName }),
      })

      if (res.ok) {
        setCommentBody('')
        setCommentShowRealName(false)
        // Refresh comments
        const commentsRes = await fetch(`/api/community/posts/${postId}/comments`)
        if (commentsRes.ok) {
          const data = await commentsRes.json()
          setComments(data.comments)
        }
        // Update comment count in feed
        setPosts(prev =>
          prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)
        )
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
        </div>
        {isApproved && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreateForm ? 'Cancel' : 'New Post'}
          </button>
        )}
      </div>

      {/* Create Post Form */}
      {showCreateForm && isApproved && (
        <form onSubmit={handleCreatePost} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <input
            type="text"
            placeholder="Title (optional)"
            value={postTitle}
            onChange={e => setPostTitle(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <textarea
            placeholder="What's on your mind?"
            value={postBody}
            onChange={e => setPostBody(e.target.value)}
            maxLength={5000}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showRealName}
                onChange={e => setShowRealName(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Show my name (instead of VR ID)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{postBody.length}/5000</span>
              <button
                type="submit"
                disabled={!postBody.trim() || creating}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Post header */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                      {post.authorDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{post.authorDisplayName}</p>
                      <p className="text-[11px] text-gray-400">{timeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  {post.isMyPost && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Post content */}
                {post.title && (
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{post.title}</h3>
                )}
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {expandedPostId === post.id
                    ? post.body
                    : post.body.length > 300
                      ? post.body.slice(0, 300) + '...'
                      : post.body}
                </p>
                {post.body.length > 300 && expandedPostId !== post.id && (
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-primary-600 text-xs font-medium mt-1 hover:underline"
                  >
                    Read more
                  </button>
                )}
              </div>

              {/* Action bar */}
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4">
                <button
                  onClick={() => handleLikeToggle(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    post.likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
                  {post.likeCount > 0 && post.likeCount}
                </button>

                <button
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    expandedPostId === post.id ? 'text-primary-600' : 'text-gray-400 hover:text-primary-600'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.commentCount > 0 && post.commentCount}
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded comments */}
              {expandedPostId === post.id && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <>
                      {comments.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3 text-center">No comments yet</p>
                      ) : (
                        <div className="space-y-3 py-3">
                          {comments.map(comment => (
                            <div key={comment.id} className="flex gap-2">
                              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] font-bold flex-shrink-0 mt-0.5">
                                {comment.authorDisplayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-medium text-gray-700">{comment.authorDisplayName}</span>
                                  <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-line">{comment.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment form */}
                      {isApproved && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentBody}
                              onChange={e => setCommentBody(e.target.value)}
                              maxLength={2000}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleAddComment(post.id)
                                }
                              }}
                              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentBody.trim() || submittingComment}
                              className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {submittingComment ? '...' : 'Reply'}
                            </button>
                          </div>
                          <label className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={commentShowRealName}
                              onChange={e => setCommentShowRealName(e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                            />
                            Show my name
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Load More
                <ChevronDown className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <Check className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
