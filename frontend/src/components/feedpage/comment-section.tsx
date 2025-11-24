import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CommentsApi, type Comment } from '@/lib/api/comments';
import CommentItem from './comment-item';
import userAvatar from '@/assets/user.png';

interface CommentSectionProps {
  postId: number;
  onCommentAdded?: () => void;
  onUsernameClick?: (username: string) => void;
}

export default function CommentSection({ postId, onCommentAdded, onUsernameClick }: CommentSectionProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await CommentsApi.list(postId);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await CommentsApi.add(postId, {
        content: newComment.trim(),
        username: currentUser,
      });
      
      setComments(prev => [...prev, comment]);
      setNewComment('');
      onCommentAdded?.();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = (updatedComment: Comment) => {
    setComments(prev =>
      prev.map(comment =>
        comment.commentId === updatedComment.commentId ? updatedComment : comment
      )
    );
  };

  const handleCommentDelete = (commentId: number) => {
    setComments(prev => prev.filter(comment => comment.commentId !== commentId));
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t bg-muted/20">
      {/* Comments List */}
      {comments.length > 0 && (
        <div className="px-4 py-2 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId || `temp-${comment.content}`}
              comment={comment}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
              onUsernameClick={onUsernameClick}
            />
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="p-4 border-t">
          {/* Kindness Reminder */}
          <div className="bg-tertiary/5 border border-secondary/20 rounded-md p-2 mb-3">
            <p className="text-xs text-tertiary font-medium">
              {t('kindnessReminder.message')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={userAvatar} alt={t('profile.photoAlt', { username: currentUser, defaultValue: `${currentUser}'s profile photo` })} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {currentUser.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder={t('comment.placeholder')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || isSubmitting}
                aria-label={t('comment.send', 'Send comment')}
                title={t('comment.send', 'Send comment')}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}