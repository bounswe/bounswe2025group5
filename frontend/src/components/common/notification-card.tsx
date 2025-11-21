import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/lib/api/schemas/notifications';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onClick?: (notification: Notification) => void;
  className?: string;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onClick,
  className,
}: NotificationCardProps) {
  const { t } = useTranslation();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return t('notifications.timeAgo.days', { count: diffDays });
    if (diffHours > 0) return t('notifications.timeAgo.hours', { count: diffHours });
    if (diffMinutes > 0) return t('notifications.timeAgo.minutes', { count: diffMinutes });
    return t('notifications.timeAgo.seconds', { count: diffSeconds });
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        !notification.isRead && 'bg-accent/50 border-primary/20',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <p className={cn(
              'text-sm',
              !notification.isRead && 'font-semibold'
            )}>
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>
          {!notification.isRead && (
            <Badge variant="default" className="shrink-0">
              {t('notifications.unread')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
