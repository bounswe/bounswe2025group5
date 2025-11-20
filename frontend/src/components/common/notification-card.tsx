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

  const getNotificationMessage = () => {
    const { type, actorId, objectType } = notification;
    const actor = actorId || 'Someone';
    const objType = objectType?.toLowerCase() || 'post';

    switch (type) {
      case 'Like':
        return `${actor} liked your ${objType}`;
      case 'Create':
        return `${actor} commented on your ${objType}`;
      case 'Follow':
        return `${actor} started following you`;
      default:
        return `${actor} interacted with your content`;
    }
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
        'cursor-pointer transition-all hover:shadow-md py-2',
        !notification.isRead && 'bg-accent/50 border-primary/20',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-0.5">
            <p className={cn(
              'text-sm leading-tight',
              !notification.isRead && 'font-semibold'
            )}>
              {getNotificationMessage()}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>
          {!notification.isRead && (
            <Badge variant="default" className="shrink-0 text-[10px] h-4 px-1.5">
              {t('notifications.unread')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
