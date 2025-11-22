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
      
      // Merge new notifications with existing ones, avoiding duplicates
      setNotifications(prevNotifications => {
        const existingIds = new Set(prevNotifications.map(n => n.id));
        const newNotifications = data.filter(n => !existingIds.has(n.id));
        
        // If this is a background refresh and we have new notifications, add them
        if (isBackgroundRefresh && newNotifications.length > 0) {
          return [...newNotifications, ...prevNotifications];
        }
        
        // Otherwise, replace the entire list (for initial load)
        return data;
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
      <PopoverContent className="w-80 max-h-[32rem] bg-[#68656015] backdrop-blur-md overflow-y-auto p-0 rounded-xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500" align="end">
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
              {notifications.map(notification => (
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
