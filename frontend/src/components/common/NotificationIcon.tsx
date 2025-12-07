import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import { NotificationsApi } from '@/lib/api/notifications';
import { PostsApi } from '@/lib/api/posts';
import { UsersApi } from '@/lib/api/users';
import { CommentsApi } from '@/lib/api/comments';
import NotificationCard from './notification-card';
import NotificationDetailDialog from './NotificationDetailDialog';
import type { Notification } from '@/lib/api/schemas/notifications';

export default function NotificationIcon() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const username = localStorage.getItem('username');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Sort notifications: unread first, then by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1; // Unread (false) comes before read (true)
    }
    return new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime();
  });

  const enrichNotificationsWithContent = async (notificationsList: Notification[]) => {
    // Filter notifications that need enrichment
    const postNotifications = notificationsList.filter(
      n => (n.type === 'Like' || n.type === 'Create' || n.type === 'Comment') && 
           n.objectType?.toLowerCase() === 'post' && 
           n.objectId
    );

    const challengeNotifications = notificationsList.filter(
      n => n.type === 'End' && 
           n.objectType?.toLowerCase() === 'challenge' && 
           n.objectId
    );

    const commentNotifications = notificationsList.filter(
      n => n.type === 'Create' && 
           n.objectType?.toLowerCase() === 'comment' && 
           n.objectId
    );

    // Fetch post details for post-related notifications (in parallel)
    const enrichedPosts = await Promise.allSettled(
      postNotifications.map(async (notification) => {
        try {
          const post = await PostsApi.getById(parseInt(notification.objectId!), username || undefined);
          return {
            ...notification,
            postMessage: post.content || undefined,
          };
        } catch (error) {
          console.error(`Failed to fetch post ${notification.objectId}:`, error);
          return notification; // Return original notification if fetch fails
        }
      })
    );

    // Fetch comment details for comment notifications (in parallel)
    // Note: objectId is the postId for comment notifications, not commentId
    const enrichedComments = await Promise.allSettled(
      commentNotifications.map(async (notification) => {
        try {
          const postId = parseInt(notification.objectId!);
          const commentsResponse = await CommentsApi.list(postId);
          
          // Find the most recent comment from the actor
          const actorComments = commentsResponse.comments.filter(
            c => c.creatorUsername === notification.actorId
          );
          
          if (actorComments.length > 0) {
            // Sort by createdAt and get the most recent
            const sortedComments = actorComments.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            
            return {
              ...notification,
              commentContent: sortedComments[0].content || undefined,
            };
          }
          
          return notification;
        } catch (error) {
          console.error(`Failed to fetch comments for post ${notification.objectId}:`, error);
          return notification;
        }
      })
    );

    // Fetch challenge details for challenge-ending notifications (in parallel)
    const enrichedChallenges = await Promise.allSettled(
      challengeNotifications.map(async (notification) => {
        try {
          if (!username) return notification;
          const challenges = await UsersApi.listChallenges(username);
          const challenge = challenges.find(c => c.challengeId === parseInt(notification.objectId!));
          return {
            ...notification,
            challengeTitle: challenge?.name || undefined,
          };
        } catch (error) {
          console.error(`Failed to fetch challenge ${notification.objectId}:`, error);
          return notification; // Return original notification if fetch fails
        }
      })
    );

    // Create a map of enriched notifications
    const enrichedMap = new Map<number, Notification>();
    
    enrichedPosts.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        enrichedMap.set(postNotifications[index].id, result.value);
      }
    });

    enrichedComments.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        enrichedMap.set(commentNotifications[index].id, result.value);
      }
    });

    enrichedChallenges.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        enrichedMap.set(challengeNotifications[index].id, result.value);
      }
    });

    // Merge enriched data back into the full notification list
    return notificationsList.map(n => enrichedMap.get(n.id) || n);
  };

  const fetchNotifications = async (isBackgroundRefresh = false) => {
    if (!username) return;
    
    // Only show loading state if not a background refresh
    if (!isBackgroundRefresh) {
      setIsLoading(true);
    }
    setError(null);
    try {
      console.log('Fetching notifications for username:', username);
      const data = await NotificationsApi.list(username);
      console.log('Notifications received:', data);
      
      // Enrich notifications with post messages and challenge titles
      const enrichedData = await enrichNotificationsWithContent(data);
      
      // Merge new notifications with existing ones, avoiding duplicates
      setNotifications(prevNotifications => {
        const existingIds = new Set(prevNotifications.map(n => n.id));
        const newNotifications = enrichedData.filter(n => !existingIds.has(n.id));
        
        // If this is a background refresh and we have new notifications, add them
        if (isBackgroundRefresh && newNotifications.length > 0) {
          return [...newNotifications, ...prevNotifications];
        }
        
        // Otherwise, replace the entire list (for initial load)
        return enrichedData;
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      console.error('Error details:', err instanceof Error ? err.message : err);
      setError(t('notifications.error'));
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  };

  // Fetch notifications on mount (page refresh/login)
  useEffect(() => {
    if (username) {
      fetchNotifications(false);
    }
  }, [username]);

  // Refresh notifications when popover is opened (background refresh)
  useEffect(() => {
    if (username && isOpen) {
      fetchNotifications(true);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await NotificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailDialog(true);
    setIsOpen(false); // Close the popover
  };

  if (!username) return null;

  return (
    <>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-white hover:bg-white/20 transition-colors"
          aria-label={t('notifications.title')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-md bg-tertiary text-secondary-foreground font-medium border border-white/20">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent variant="glass" scrollable align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">{t('notifications.title')}</h3>
        </div>
        <div className="p-2 space-y-2">
          {isLoading && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t('notifications.loading')}
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-destructive py-8">{error}</p>
          )}
          {!isLoading && !error && notifications.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t('notifications.noNotifications')}
            </p>
          )}
          {!isLoading && !error && notifications.length > 0 && (
            <>
              {sortedNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onNotificationClick={handleNotificationClick}
                  className="shadow-sm"
                />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
    <NotificationDetailDialog
      notification={selectedNotification}
      open={showDetailDialog}
      onOpenChange={setShowDetailDialog}
    />
  </>
  );
}
