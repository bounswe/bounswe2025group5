import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/lib/api/schemas/notifications';
import type { PostItem } from '@/lib/api/schemas/posts';
import { PostsApi } from '@/lib/api/posts';
import PostCard from '@/components/feedpage/post-card';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notification || !open) {
      setPost(null);
      setError(null);
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

  const getDialogTitle = () => {
    if (!notification) return '';
    
    const actor = notification.actorId || 'Someone';
    switch (notification.type) {
      case 'Like':
        return `${actor} liked your post`;
      case 'Create':
        return `${actor} commented on your post`;
      case 'Follow':
        return `${actor} started following you`;
      default:
        return 'Notification';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
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
            />
          )}
          {!isLoading && !error && !post && notification?.type === 'Follow' && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {notification.actorId} is now following you
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
