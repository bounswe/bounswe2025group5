import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/api/comments';
import { CommentsApi } from '@/lib/api/comments';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CommentItemProps {
  comment: Comment;
  onUpdate?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  className?: string;
}

export default function CommentItem({ comment, onUpdate, onDelete, className }: CommentItemProps) {
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

      if (diffInSeconds < 60) {
        return t('comment.timeAgo.seconds', { count: diffInSeconds });
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return t('comment.timeAgo.minutes', { count: minutes });
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return t('comment.timeAgo.hours', { count: hours });
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return t('comment.timeAgo.days', { count: days });
      }
    } catch {
      return dateString;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
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
    <div className={cn("flex gap-3 py-2", className)}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src="" alt={comment.username || 'User'} />
        <AvatarFallback className="bg-[#b07f5a] text-white text-xs">
          {(comment.username || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
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
                    className="h-7 px-2 text-xs"
                  >
                    {t('comment.save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="h-7 px-2 text-xs"
                  >
                    {t('comment.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {comment.username}
                  </p>
                  <p className="text-sm text-gray-700 break-words">
                    {comment.content}
                  </p>
                </div>
                {comment.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1 ml-3">
                    {formatDate(comment.createdAt)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Actions Menu for Owner */}
          {isOwner && !isEditing && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-32 p-1">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="w-full justify-start h-8 px-2 text-xs"
                  >
                    <Edit3 className="h-3 w-3 mr-2" />
                    {t('comment.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="w-full justify-start h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
}