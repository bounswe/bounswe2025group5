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
import type { Notification } from '@/lib/api/schemas/notifications';

export default function NotificationIcon() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = localStorage.getItem('username');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching notifications for username:', username);
      const data = await NotificationsApi.list(username);
      console.log('Notifications received:', data);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      console.error('Error details:', err instanceof Error ? err.message : err);
      setError(t('notifications.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications on mount (page refresh/login)
  useEffect(() => {
    if (username) {
      fetchNotifications();
    }
  }, [username]);

  // Refresh notifications when popover is opened
  useEffect(() => {
    if (username && isOpen) {
      fetchNotifications();
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

  if (!username) return null;

  return (
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
            <span className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-md bg-secondary text-secondary-foreground font-medium border border-white/20">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[32rem] overflow-y-auto p-0" align="end">
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
                  className="shadow-none"
                />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
