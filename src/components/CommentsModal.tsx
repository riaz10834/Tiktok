import { useState, useEffect } from 'react';
import { X, Send, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api, Comment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoUsername: string;
  onAddComment: (videoId: string, comment: string) => void;
  onDeleteComment?: (videoId: string, removed: number) => void;
  requireLogin?: () => boolean;
}

const CommentsModal = ({
  isOpen,
  onClose,
  videoId,
  onAddComment,
  onDeleteComment,
  requireLogin,
}: CommentsModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();

  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0
  );

  useEffect(() => {
    if (!isOpen) {
      setReplyTo(null);
      setNewComment('');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { comments } = await api.getComments(videoId);
        setComments(comments);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, videoId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (requireLogin && !requireLogin()) return;
    if (!user) return;

    const text = newComment.trim();
    const parentId = replyTo?.id;
    setNewComment('');
    try {
      const { comment } = await api.addComment(videoId, text, parentId);
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), comment] }
              : c
          )
        );
      } else {
        setComments((prev) => [comment, ...prev]);
      }
      setReplyTo(null);
      onAddComment(videoId, text);
    } catch {
      setNewComment(text);
    }
  };

  const handleLikeComment = async (commentId: string, isReply = false, parentId?: string) => {
    if (requireLogin && !requireLogin()) return;
    try {
      const { liked, likes } = await api.likeComment(commentId);
      setComments((prev) =>
        prev.map((c) => {
          if (!isReply && c.id === commentId) return { ...c, liked, likes };
          if (isReply && c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).map((r) =>
                r.id === commentId ? { ...r, liked, likes } : r
              ),
            };
          }
          return c;
        })
      );
    } catch {
      // ignore
    }
  };

  const handleDeleteComment = async (
    commentId: string,
    isReply = false,
    parentId?: string
  ) => {
    if (requireLogin && !requireLogin()) return;
    if (!window.confirm('Delete this comment?')) return;

    setDeletingId(commentId);
    try {
      const { removed } = await api.deleteComment(commentId);
      if (isReply && parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      if (replyTo?.id === commentId) setReplyTo(null);
      onDeleteComment?.(videoId, removed);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (!isOpen) return null;

  const CommentRow = ({
    comment,
    isReply = false,
    parentId,
  }: {
    comment: Comment;
    isReply?: boolean;
    parentId?: string;
  }) => {
    const canDelete =
      comment.isMine ||
      (user && (comment.userId === user.id || comment.username === user.username));

    return (
      <div className={cn('flex gap-3', isReply && 'ml-10 mt-3')}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.avatar} alt={comment.username} />
          <AvatarFallback>{comment.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground text-sm">{comment.username}</span>
            <span className="text-muted-foreground text-xs">{comment.timestamp}</span>
          </div>
          <p className="text-foreground text-sm leading-relaxed break-words">{comment.text}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleLikeComment(comment.id, isReply, parentId)}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                comment.liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', comment.liked && 'fill-red-500')} />
              {comment.likes > 0 ? comment.likes : ''}
            </button>
            {!isReply && (
              <button
                onClick={() => {
                  if (requireLogin && !requireLogin()) return;
                  setReplyTo(comment);
                }}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteComment(comment.id, isReply, parentId)}
                disabled={deletingId === comment.id}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingId === comment.id ? '...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-end justify-center z-[90]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-card w-full max-h-[70%] rounded-t-2xl animate-slide-in-up mb-0 flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Comments ({totalCount})
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <CommentRow comment={comment} />
                  {(comment.replies || []).map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      isReply
                      parentId={comment.id}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {replyTo && (
          <div className="px-4 py-2 border-t border-border bg-muted/40 flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate">
              Replying to <span className="text-foreground font-medium">@{replyTo.username}</span>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-muted-foreground hover:text-foreground ml-2"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <div className="flex gap-3 items-center">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={user?.avatar} alt="You" />
              <AvatarFallback>{user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={
                  !user
                    ? 'Log in to comment'
                    : replyTo
                      ? `Reply to @${replyTo.username}...`
                      : 'Add a comment...'
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (requireLogin && !requireLogin()) return;
                }}
                className="flex-1 bg-muted border-0 focus:ring-1 focus:ring-primary"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
