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
import ReportAlarmButton from '@/components/common/ReportAlarmButton';
import { Textarea } from '@/components/ui/textarea';
import { ReportsApi } from '@/lib/api/reports';
import { toast } from 'sonner';

const REPORT_TYPES = ['SPAM', 'HARASSMENT', 'MISINFORMATION', 'OTHER'] as const;

interface CommentItemProps {
  comment: Comment;
  onUpdate?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  onUsernameClick?: (username: string) => void;
  commenterPhotoUrl?: string | null;
  className?: string;
}

export default function CommentItem({ comment, onUpdate, onDelete, onUsernameClick, commenterPhotoUrl, className }: CommentItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportType, setReportType] = useState<(typeof REPORT_TYPES)[number]>(REPORT_TYPES[0]);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  
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

  const handleOpenReport = () => {
    if (!currentUser) {
      toast.error(t('reports.loginRequired', 'Sign in to report content'));
      return;
    }
    if (!comment.commentId) {
      toast.error(t('reports.error', 'Failed to submit report'));
      return;
    }
    setReportDialogOpen(true);
  };

  const resetReportState = () => {
    setReportReason('');
    setReportError(null);
    setReportType(REPORT_TYPES[0]);
  };

  const handleSubmitReport = async () => {
    if (!currentUser || !comment.commentId) {
      toast.error(t('reports.loginRequired', 'Sign in to report content'));
      return;
    }
    if (!reportReason.trim()) {
      setReportError(t('reports.missingReason', 'Please provide a short explanation.'));
      return;
    }
    setIsReporting(true);
    try {
      await ReportsApi.create({
        reporterName: currentUser,
        description: reportReason.trim(),
        type: reportType,
        contentType: 'COMMENT',
        objectId: comment.commentId,
      });
      toast.success(t('reports.success', 'Report submitted. Thank you!'));
      setReportDialogOpen(false);
      resetReportState();
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error(t('reports.error', 'Failed to submit report'));
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className={cn("flex gap-3 py-2 group", className)}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage
          src={commenterPhotoUrl || userAvatar}
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
            <div className="flex items-center justify-between mt-1 ml-3 gap-2">
              {comment.createdAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </p>
              )}
              
              {/* Actions Buttons for Owner */}
              <div className="flex items-center gap-0.5">
                {isOwner && (
                  <>
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
                  </>
                )}
                <ReportAlarmButton
                  size="sm"
                  onClick={handleOpenReport}
                  aria-label={t('reports.titleComment', 'Report comment')}
                  title={t('reports.titleComment', 'Report comment')}
                />
              </div>
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

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onOpenChange={(open) => {
          setReportDialogOpen(open);
          if (!open) resetReportState();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reports.titleComment', 'Report comment')}</DialogTitle>
            <DialogDescription>
              {t('reports.description', 'Help us keep the community safe by telling us what is wrong with this content.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor={`report-type-comment-${comment.commentId ?? 'temp'}`}>
                {t('reports.typeLabel', 'Report type')}
              </label>
              <select
                id={`report-type-comment-${comment.commentId ?? 'temp'}`}
                value={reportType}
                onChange={(e) => setReportType(e.target.value as (typeof REPORT_TYPES)[number])}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`reports.typeOptions.${type}`, type)}
                  </option>
                ))}
              </select>
            </div>
            <label className="text-sm font-medium text-foreground" htmlFor={`report-comment-${comment.commentId ?? 'temp'}`}>
              {t('reports.reasonLabel', 'Reason')}
            </label>
            <Textarea
              id={`report-comment-${comment.commentId ?? 'temp'}`}
              value={reportReason}
              onChange={(e) => {
                setReportReason(e.target.value);
                if (reportError) setReportError(null);
              }}
              placeholder={t('reports.reasonPlaceholder', 'Describe the issue...')}
              maxLength={500}
            />
            {reportError && <p className="text-sm text-destructive">{reportError}</p>}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)} disabled={isReporting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmitReport} disabled={isReporting}>
              {isReporting ? t('reports.submitting', 'Submitting...') : t('reports.submit', 'Submit report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}