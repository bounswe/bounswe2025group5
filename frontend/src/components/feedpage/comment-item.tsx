import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/api/comments';
import { CommentsApi } from '@/lib/api/comments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import userAvatar from '@/assets/user.png';

interface CommentItemProps {
  comment: Comment;
  onUpdate?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  onUsernameClick?: (username: string) => void;
  className?: string;
}

export default function CommentItem({ comment, onUpdate, onDelete, onUsernameClick, className }: CommentItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
  const commentUsername = comment.creatorUsername || comment.username;
  const isOwner = currentUser === commentUsername;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

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

  const handleDeleteComment = async () => {
    if (!comment.commentId || isLoading) return;

    setIsLoading(true);
    try {
      await CommentsApi.remove(comment.commentId);
      onDelete?.(comment.commentId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex gap-3 py-2 group", className)}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage
          src={userAvatar}
          alt={commentUsername
            ? t('profile.photoAlt', {
                username: commentUsername,
                defaultValue: `${commentUsername}'s profile photo`,
              })
            : t('profile.photoAltAnon', 'Profile photo')}
        />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {(commentUsername || 'U').charAt(0).toUpperCase()}
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
              <div
                role="link"
                tabIndex={0}
                onClick={() => commentUsername && onUsernameClick?.(commentUsername)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    commentUsername && onUsernameClick?.(commentUsername);
                  }
                }}
                className="block text-sm font-medium text-gray-900 mb-1 hover:underline text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
                aria-label={t('profile.userLabel', { username: commentUsername, defaultValue: `User ${commentUsername}` })}
              >
                {commentUsername}
              </div>
              <p className="text-sm text-gray-700 break-words">
                {comment.content}
              </p>
            </div>
            <div className="flex items-center justify-between mt-1 ml-3">
              {comment.createdAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </p>
              )}
              
              {/* Actions Buttons for Owner */}
              {isOwner && (
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEdit}
                    className="h-5 w-5 hover:bg-blue-50 hover:text-blue-600"
                    aria-label={t('comment.edit', 'Edit comment')}
                  >
                    <Edit3 className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-5 w-5 hover:bg-red-50 hover:text-red-600"
                    aria-label={t('comment.delete', 'Delete comment')}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('comment.deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('comment.deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              {t('comment.deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteComment}
              disabled={isLoading}
            >
              {isLoading ? t('comment.deleteDialog.deleting') : t('comment.deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}