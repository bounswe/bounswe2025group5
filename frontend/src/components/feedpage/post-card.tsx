import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PostItem } from '@/lib/api/schemas/posts';
import { LikesApi } from '@/lib/api/likes';
import { PostsApi } from '@/lib/api/posts';
import CommentSection from './comment-section';
import EditPostDialog from './edit-post-dialog';
import ImageDialog from './image-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import userAvatar from '@/assets/user.png';
import { useProfilePhoto } from '@/hooks/useProfilePhotos';
import ReportAlarmButton from '@/components/common/ReportAlarmButton';
import { Textarea } from '@/components/ui/textarea';
import { ReportsApi } from '@/lib/api/reports';
import { toast } from 'sonner';

const REPORT_TYPES = ['SPAM', 'HARASSMENT', 'MISINFORMATION', 'OTHER'] as const;

interface PostCardProps {
  post: PostItem;
  onPostUpdate?: (post: PostItem) => void;
  onPostDelete?: (postId: number) => void;
  onUsernameClick?: (username: string) => void;
  className?: string;
}

export default function PostCard({ post, onPostUpdate, onPostDelete, onUsernameClick, className }: PostCardProps) {
  const { t } = useTranslation();
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [showComments, setShowComments] = useState(false);
  
  // Optimistic state management - initialize from post data
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isSaved, setIsSaved] = useState(post.saved || false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image dialog state
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showProfileImageDialog, setShowProfileImageDialog] = useState(false);

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportType, setReportType] = useState<(typeof REPORT_TYPES)[number]>(REPORT_TYPES[0]);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  // Fetch profile photo for post creator
  const { photoUrl: creatorPhotoUrl } = useProfilePhoto(post.creatorUsername);

  // Sync local state with post prop changes
  useEffect(() => {
    setIsLiked(post.liked || false);
    setIsSaved(post.saved || false);
    setLikeCount(post.likes || 0);
    setCommentCount(post.comments || 0);
  }, [post.liked, post.saved, post.likes, post.comments]);

  // Optimistic like toggle with revert on failure
  const handleLike = async () => {
    if (!currentUser || isLoading) return;

    // Store previous state before optimistic update
    const prevLiked = isLiked;
    const prevCount = likeCount;
    const willBeLiked = !isLiked;
    const newCount = prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
    
    // Optimistic update
    setIsLiked(willBeLiked);
    setLikeCount(newCount);
    setIsLoading(true);

    try {
      if (prevLiked) {
        // Currently liked, so unlike it
        await LikesApi.remove({ username: currentUser, postId: post.postId });
      } else {
        // Currently not liked, so like it
        await LikesApi.add({ username: currentUser, postId: post.postId });
      }
      onPostUpdate?.({ ...post, likes: newCount, liked: willBeLiked, comments: commentCount });
    } catch (error) {
      // Revert on failure
      console.error('Error toggling like:', error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic save toggle with revert on failure
  const handleSave = async () => {
    if (!currentUser || isLoading) return;

    // Store previous state before optimistic update
    const prevSaved = isSaved;
    const willBeSaved = !isSaved;
    
    // Optimistic update
    setIsSaved(willBeSaved);
    setIsLoading(true);

    try {
      if (prevSaved) {
        // Currently saved, so unsave it
        await PostsApi.deleteSaved(post.postId, currentUser);
      } else {
        // Currently not saved, so save it
        await PostsApi.save(post.postId, { username: currentUser });
      }
      onPostUpdate?.({ ...post, saved: willBeSaved, comments: commentCount });
    } catch (error) {
      // Revert on failure
      console.error('Error toggling save:', error);
      setIsSaved(prevSaved);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const dateFormatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timeFormatted = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return { date: dateFormatted, time: timeFormatted };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  const handleCommentAdded = () => {
    setCommentCount(prev => prev + 1);
  };

  const handleDeletePost = async () => {
    if (!currentUser || isDeleting) return;

    setIsDeleting(true);
    try {
      await PostsApi.remove(post.postId);
      onPostDelete?.(post.postId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const { date, time } = formatDate(post.createdAt || post.savedAt || '');

  const handleOpenReport = () => {
    if (!currentUser) {
      toast.error(t('reports.loginRequired', 'Sign in to report content'));
      return;
    }
    setReportDialogOpen(true);
  };

  const resetReportState = () => {
    setReportReason('');
    setReportError(null);
    setReportType(REPORT_TYPES[0]);
  };

  const handleReportSubmit = async () => {
    if (!currentUser) {
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
        contentType: 'POST',
        objectId: post.postId,
      });
      toast.success(t('reports.success', 'Report submitted. Thank you!'));
      setReportDialogOpen(false);
      resetReportState();
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error(t('reports.error', 'Failed to submit report'));
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Card className={cn(
      "w-full max-w-2xl mx-auto overflow-hidden p-0 py-0 gap-0 h-auto min-h-[180px]",
      className
    )}>
      {/* Post Image */}
      {post.photoUrl && (
        <div 
          className="w-full aspect-square relative overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => setShowImageDialog(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowImageDialog(true);
            }
          }}
        >
          <img
            src={post.photoUrl}
            alt={t('post.imageAlt', { username: post.creatorUsername, defaultValue: `${post.creatorUsername}'s post image` })}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Username and Content with Avatar */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar 
              className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowProfileImageDialog(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowProfileImageDialog(true);
                }
              }}
            >
              <AvatarImage
                src={creatorPhotoUrl || userAvatar}
                alt={post.creatorUsername
                  ? t('profile.photoAlt', {
                      username: post.creatorUsername,
                      defaultValue: `${post.creatorUsername}'s profile photo`,
                    })
                  : t('profile.photoAltAnon', 'Profile photo')}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {post.creatorUsername.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              role="link"
              tabIndex={0}
              onClick={() => onUsernameClick?.(post.creatorUsername)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onUsernameClick?.(post.creatorUsername);
                }
              }}
              className="font-semibold text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
              aria-label={t('profile.userLabel', { username: post.creatorUsername, defaultValue: `User ${post.creatorUsername}` })}
            >
              {post.creatorUsername}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{date}</p>
            <p className="text-[10px] text-muted-foreground/70">{time}</p>
          </div>
        </div>
        {post.content && (
          <p className="text-sm text-gray-700 mt-1">{post.content}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-3 pb-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={isLoading}
            className={cn(
              "hover:bg-red-50 hover:text-red-500 transition-colors h-8 w-8",
              isLiked && "text-red-500"
            )}
            aria-label={isLiked ? t('post.unlike', 'Unlike post') : t('post.like', 'Like post')}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowComments(!showComments)}
            className="hover:bg-blue-50 hover:text-blue-500 transition-colors h-8 w-8"
            aria-label={showComments ? t('post.hideComments', 'Hide comments') : t('post.showComments', 'Show comments')}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <ReportAlarmButton
            size="sm"
            onClick={handleOpenReport}
            aria-label={t('reports.titlePost', 'Report post')}
            title={t('reports.titlePost', 'Report post')}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              "hover:bg-amber-50 hover:text-amber-600 transition-colors h-8 w-8",
              isSaved && "text-amber-600"
            )}
            aria-label={isSaved ? t('post.unsave', 'Unsave post') : t('post.save', 'Save post')}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 fill-current" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          {currentUser === post.creatorUsername && (
            <>
              <EditPostDialog
                post={post}
                currentUsername={currentUser}
                onPostUpdated={(updatedPost) => onPostUpdate?.(updatedPost)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="hover:bg-red-50 hover:text-red-600 transition-colors h-8 w-8"
                aria-label={t('post.delete.button', 'Delete post')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Like Count */}
      {likeCount > 0 && (
        <div className="px-3">
          <p className="text-sm font-semibold">
            {t('post.likes', { count: likeCount })}
          </p>
        </div>
      )}

      {/* Comments Count */}
      {commentCount > 0 && (
        <div className="px-3 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
          >
            {showComments
              ? t('post.hideComments')
              : t('post.viewComments', { count: commentCount })
            }
          </Button>
        </div>
      )}

      {/* Comment Section */}
      {showComments && (
        <CommentSection
          postId={post.postId}
          onCommentAdded={handleCommentAdded}
          onUsernameClick={onUsernameClick}
        />
      )}

      {/* Bottom Padding */}
      <div className="pb-3"></div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('post.delete.title')}</DialogTitle>
            <DialogDescription>
              {t('post.delete.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t('post.delete.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? t('post.delete.deleting') : t('post.delete.confirm')}
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
            <DialogTitle>{t('reports.titlePost', 'Report post')}</DialogTitle>
            <DialogDescription>{t('reports.description', 'Help us keep the community safe by telling us what is wrong with this content.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor={`report-type-${post.postId}`}>
                {t('reports.typeLabel', 'Report type')}
              </label>
              <select
                id={`report-type-${post.postId}`}
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
            <label className="text-sm font-medium text-foreground" htmlFor={`report-reason-${post.postId}`}>
              {t('reports.reasonLabel', 'Reason')}
            </label>
            <Textarea
              id={`report-reason-${post.postId}`}
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
            <Button onClick={handleReportSubmit} disabled={isReporting}>
              {isReporting ? t('reports.submitting', 'Submitting...') : t('reports.submit', 'Submit report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      {post.photoUrl && (
        <ImageDialog
          open={showImageDialog}
          onOpenChange={setShowImageDialog}
          imageUrl={post.photoUrl}
          altText={t('post.imageAlt', { username: post.creatorUsername, defaultValue: `${post.creatorUsername}'s post image` })}
          username={post.creatorUsername}
        />
      )}

      {/* Profile Photo Dialog */}
      <ImageDialog
        open={showProfileImageDialog}
        onOpenChange={setShowProfileImageDialog}
        imageUrl={userAvatar}
        altText={
          post.creatorUsername
            ? t('profile.photoAlt', {
                username: post.creatorUsername,
                defaultValue: `${post.creatorUsername}'s profile photo`,
              })
            : t('profile.photoAltAnon', 'Profile photo')
        }
        username={post.creatorUsername}
      />
    </Card>
  );
}