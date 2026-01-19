'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Trash2, Reply, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  content: string
  created_at: string
  likes_count: number
  users: { id: string; name: string; avatar_url?: string }
  replies?: Comment[]
}

interface CommentSectionProps {
  entityType: string
  entityId: string
}

export function CommentSection({ entityType, entityId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [entityType, entityId])

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`)
    if (res.ok) {
      const data = await res.json()
      setComments(data.comments || [])
    }
  }

  const submitComment = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          content,
          parentId
        })
      })

      if (res.ok) {
        toast.success(parentId ? 'Reply posted!' : 'Comment posted!')
        setNewComment('')
        setReplyContent('')
        setReplyTo(null)
        fetchComments()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to post comment')
      }
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(false)
  }

  const deleteComment = async (commentId: string) => {
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Comment deleted')
      fetchComments()
    }
  }

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={20} className="text-fuchsia-400" />
        <h3 className="text-white font-semibold">Comments ({comments.length})</h3>
      </div>

      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
          <User size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500/50 resize-none"
          />
          <button
            onClick={() => submitComment()}
            disabled={loading || !newComment.trim()}
            className="mt-2 px-6 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} />
            Post Comment
          </button>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {comments.length === 0 ? (
          <p className="text-white/50 text-center py-8">No comments yet. Be the first!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="space-y-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500/50 to-cyan-500/50 flex items-center justify-center flex-shrink-0">
                    {comment.users?.avatar_url ? (
                      <img src={comment.users.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{comment.users?.name || 'Anonymous'}</span>
                      <span className="text-white/40 text-xs">{formatTime(comment.created_at)}</span>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="text-white/50 text-xs hover:text-fuchsia-400 flex items-center gap-1"
                      >
                        <Reply size={14} />
                        Reply
                      </button>
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-white/50 text-xs hover:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {replyTo === comment.id && (
                  <div className="mt-4 ml-11">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500/50 resize-none text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => submitComment(comment.id)}
                        disabled={loading || !replyContent.trim()}
                        className="px-4 py-1.5 rounded-full bg-fuchsia-500 text-white text-xs font-semibold hover:bg-fuchsia-600 disabled:opacity-50"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => { setReplyTo(null); setReplyContent('') }}
                        className="px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-xs hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-2">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/50 to-blue-500/50 flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-xs">{reply.users?.name || 'Anonymous'}</span>
                            <span className="text-white/40 text-xs">{formatTime(reply.created_at)}</span>
                          </div>
                          <p className="text-white/70 text-xs">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
