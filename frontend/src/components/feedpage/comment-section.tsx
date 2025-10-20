import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CommentsApi, type Comment } from '@/lib/api/comments';
import userAvatar from '@/assets/user.png';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CommentSectionProps {
  postId: number;
  onCommentAdded?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  onUpdate?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
}

function CommentItem({ comment, onUpdate, onDelete }: CommentItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
  const isOwner = currentUser === comment.username;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds}s`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      return `${Math.floor(diffInSeconds / 86400)}d`;
    } catch {
      return dateString;
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !comment.commentId || editContent.trim() === comment.content || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const updatedComment = await CommentsApi.update(comment.commentId, {
        content: editContent.trim(),
        username: currentUser,
      });
      onUpdate?.(updatedComment);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!comment.commentId || isLoading) return;

    setIsLoading(true);
    try {
      await CommentsApi.remove(comment.commentId);
      onDelete?.(comment.commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-3 py-2 group">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={userAvatar} alt={comment.username || 'User'} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {(comment.username || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="text-sm"
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || editContent.trim() === comment.content || isLoading}
              >
                {t('comment.save')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                {t('comment.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-sm font-medium mb-1">
                {comment.username}
              </p>
              <p className="text-sm text-foreground break-words">
                {comment.content}
              </p>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground ml-3">
                {formatDate(comment.createdAt)}
              </p>
              {isOwner && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-32 p-1">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="w-full justify-start"
                      >
                        <Edit3 className="h-3 w-3 mr-2" />
                        {t('comment.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="w-full justify-start text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        {t('comment.delete')}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
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
            />
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={userAvatar} alt={currentUser} />
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