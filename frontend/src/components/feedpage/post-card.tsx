import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Bookmark, BookmarkCheck, Trash2, Edit3 } from 'lucide-react';
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

interface PostCardProps {
  post: PostItem;
  onPostUpdate?: (post: PostItem) => void;
  onPostDelete?: (postId: number) => void;
  className?: string;
}

export default function PostCard({ post, onPostUpdate, onPostDelete, className }: PostCardProps) {
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

  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

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
            <Avatar className="w-6 h-6">
              <AvatarImage
                src={userAvatar}
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
            <p className="font-semibold text-sm">{post.creatorUsername}</p>
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
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowComments(!showComments)}
            className="hover:bg-blue-50 hover:text-blue-500 transition-colors h-8 w-8"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              "hover:bg-amber-50 hover:text-amber-600 transition-colors h-8 w-8",
              isSaved && "text-amber-600"
            )}
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
    </Card>
  );
}