import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/lib/api/schemas/notifications';
import type { PostItem } from '@/lib/api/schemas/posts';
import type { ChallengeListItem } from '@/lib/api/schemas/challenges';
import { PostsApi } from '@/lib/api/posts';
import { UsersApi } from '@/lib/api/users';
import PostCard from '@/components/feedpage/post-card';
import ChallengeCard from '@/components/challenges/challengeCard';
import UserProfileDialog from '@/components/profile/userProfileDialog';
import userAvatar from '@/assets/user.png';
import { useProfilePhoto } from '@/hooks/useProfilePhotos';

interface NotificationDetailDialogProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
}: NotificationDetailDialogProps) {
  const { t } = useTranslation();
  const [post, setPost] = useState<PostItem | null>(null);
  const [challenge, setChallenge] = useState<ChallengeListItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  // Fetch profile photo for notification actor
  const { photoUrl: actorPhotoUrl } = useProfilePhoto(notification?.actorId);

  useEffect(() => {
    if (!notification || !open) {
      setPost(null);
      setChallenge(null);
      setError(null);
      // Don't reset profile dialog state here - it might be opening
      return;
    }

    // For follow notifications, show profile dialog
    if (notification.type === 'Follow') {
      if (notification.actorId) {
        setProfileUsername(notification.actorId);
        // Use setTimeout to ensure profile dialog opens after this dialog closes
        setTimeout(() => {
          setShowProfileDialog(true);
        }, 0);
        onOpenChange(false); // Close the notification detail dialog
      }
      return;
    }

    const fetchRelatedObject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Handle different object types
        if (notification.objectType?.toLowerCase() === 'post' && notification.objectId) {
          // Fetch the specific post by ID
          const username = localStorage.getItem('username');
          const foundPost = await PostsApi.getById(
            parseInt(notification.objectId),
            username || undefined
          );
          
          if (foundPost) {
            setPost(foundPost);
          } else {
            setError('Post not found');
          }
        } else if (notification.objectType?.toLowerCase() === 'comment') {
          // For comments, we could show the post with comments expanded
          // This would require the post ID to be in objectId
          if (notification.objectId) {
            const username = localStorage.getItem('username');
            const foundPost = await PostsApi.getById(
              parseInt(notification.objectId),
              username || undefined
            );
            
            if (foundPost) {
              setPost(foundPost);
            } else {
              setError('Post not found');
            }
          }
        } else if (notification.objectType?.toLowerCase() === 'challenge' && notification.objectId) {
          // Fetch all challenges and find the specific one
          const username = localStorage.getItem('username');
          if (username) {
            const challenges = await UsersApi.listChallenges(username);
            const foundChallenge = challenges.find(
              (c) => c.challengeId === parseInt(notification.objectId!)
            );
            
            if (foundChallenge) {
              setChallenge(foundChallenge);
            } else {
              setError('Challenge not found');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch notification object:', err);
        setError('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedObject();
  }, [notification, open]);


  const handleUsernameClick = (username: string) => {
    setProfileUsername(username);
    setShowProfileDialog(true);
  };

  const renderDialogTitle = () => {
    if (!notification) return null;
    
    const actor = notification.actorId || 'Someone';
    const hasActorId = !!notification.actorId;
    
    switch (notification.type) {
      case 'Like':
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={actorPhotoUrl || userAvatar} alt={actor} />
              <AvatarFallback>{actor[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-normal">
              <button
                type="button"
                onClick={() => hasActorId && handleUsernameClick(actor)}
                className={hasActorId ? "font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" : "font-semibold"}
                disabled={!hasActorId}
              >
                {actor}
              </button>
              {' '}{t('notifications.likedYourPost_suffix')}
            </span>
          </div>
        );
      case 'Comment':
      case 'Create':
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={actorPhotoUrl || userAvatar} alt={actor} />
              <AvatarFallback>{actor[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-normal">
              <button
                type="button"
                onClick={() => hasActorId && handleUsernameClick(actor)}
                className={hasActorId ? "font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" : "font-semibold"}
                disabled={!hasActorId}
              >
                {actor}
              </button>
              {' '}{t('notifications.commentedOnYourPost_suffix')}
            </span>
          </div>
        );
      case 'Follow':
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={actorPhotoUrl || userAvatar} alt={actor} />
              <AvatarFallback>{actor[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-normal">
              <button
                type="button"
                onClick={() => hasActorId && handleUsernameClick(actor)}
                className={hasActorId ? "font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" : "font-semibold"}
                disabled={!hasActorId}
              >
                {actor}
              </button>
              {' '}{t('notifications.startedFollowing_suffix')}
            </span>
          </div>
        );
      case 'End':
        if (notification.objectType?.toLowerCase() === 'challenge') {
          return (
            <div className="flex items-center gap-3">
              <span className="font-semibold">
                {t('notifications.challengeEnded_suffix')}
              </span>
            </div>
          );
        }
        return 'Notification';
      default:
        return 'Notification';
    }
  };

  return (
    <>
      <Dialog open={open && !showProfileDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{renderDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isLoading && (
              <p className="text-center text-muted-foreground py-8">
                {t('notifications.loading')}
              </p>
            )}
            {error && (
              <p className="text-center text-destructive py-8">{error}</p>
            )}
            {!isLoading && !error && post && (
              <PostCard
                post={post}
                onPostUpdate={(updatedPost) => setPost(updatedPost)}
                onPostDelete={() => {
                  onOpenChange(false);
                }}
                onUsernameClick={handleUsernameClick}
              />
            )}
            {!isLoading && !error && challenge && (
              <ChallengeCard challenge={challenge} />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <UserProfileDialog
        username={profileUsername}
        open={showProfileDialog}
        onOpenChange={(isOpen) => {
          setShowProfileDialog(isOpen);
          // Reset username when profile dialog is closed
          if (!isOpen) {
            setProfileUsername(null);
          }
        }}
        onUsernameClick={handleUsernameClick}
      />
    </>
  );
}
