'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Loader2,
  ArrowLeft,
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

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentShowRealName, setCommentShowRealName] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)

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

  // Fetch post
  useEffect(() => {
    fetch(`/api/community/posts/${params.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setPost(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  // Fetch comments
  useEffect(() => {
    fetch(`/api/community/posts/${params.id}/comments`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setComments(data.comments)
      })
      .catch(() => {})
      .finally(() => setLoadingComments(false))
  }, [params.id])

  const handleLikeToggle = async () => {
    if (!post) return
    setPost(prev =>
      prev
        ? {
            ...prev,
            likedByMe: !prev.likedByMe,
            likeCount: prev.likedByMe ? prev.likeCount - 1 : prev.likeCount + 1,
          }
        : prev
    )
    try {
      await fetch(`/api/community/posts/${params.id}/like`, { method: 'POST' })
    } catch {
      setPost(prev =>
        prev
          ? {
              ...prev,
              likedByMe: !prev.likedByMe,
              likeCount: prev.likedByMe ? prev.likeCount - 1 : prev.likeCount + 1,
            }
          : prev
      )
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    const res = await fetch(`/api/community/posts/${params.id}`, { method: 'DELETE' })
    if (res.ok) setDeleted(true)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Link copied!')
    }).catch(() => {})
  }

  const handleAddComment = async () => {
    if (!commentBody.trim() || submittingComment) return
    setSubmittingComment(true)

    try {
      const res = await fetch(`/api/community/posts/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody.trim(), showRealName: commentShowRealName }),
      })

      if (res.ok) {
        setCommentBody('')
        setCommentShowRealName(false)
        // Refresh comments
        const commentsRes = await fetch(`/api/community/posts/${params.id}/comments`)
        if (commentsRes.ok) {
          const data = await commentsRes.json()
          setComments(data.comments)
        }
        if (post) {
          setPost({ ...post, commentCount: post.commentCount + 1 })
        }
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

  if (deleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-gray-500 mb-4">Post deleted.</p>
        <Link href="/community" className="text-primary-600 hover:underline text-sm font-medium">
          Back to Forum
        </Link>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-gray-500 mb-4">Post not found.</p>
        <Link href="/community" className="text-primary-600 hover:underline text-sm font-medium">
          Back to Forum
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Forum
      </Link>

      {/* Post */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0">
                {post.authorDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{post.authorDisplayName}</p>
                <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
              </div>
            </div>
            {post.isMyPost && (
              <button
                onClick={handleDelete}
                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                title="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {post.title && (
            <h1 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h1>
          )}
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{post.body}</p>
        </div>

        {/* Action bar */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              post.likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
            {post.likeCount > 0 && post.likeCount}
          </button>

          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
            <MessageCircle className="h-4 w-4" />
            {post.commentCount > 0 && post.commentCount}
          </span>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-primary-600 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Comments */}
        <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
          <h2 className="text-sm font-medium text-gray-700 py-3">
            Comments {post.commentCount > 0 && `(${post.commentCount})`}
          </h2>

          {loadingComments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[11px] font-bold flex-shrink-0 mt-0.5">
                    {comment.authorDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-gray-700">{comment.authorDisplayName}</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          {isApproved && (
            <div className="pt-3 border-t border-gray-200">
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
                      handleAddComment()
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentBody.trim() || submittingComment}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? '...' : 'Reply'}
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-2 cursor-pointer">
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
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Check className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
