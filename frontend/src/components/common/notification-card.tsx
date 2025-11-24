import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/lib/api/schemas/notifications';
import userAvatar from '@/assets/user.png';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onNotificationClick,
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
        return { actor, text: `liked your ${objType}` };
      case 'Create':
        return { actor, text: `commented on your ${objType}` };
      case 'Follow':
        return { actor, text: 'started following you' };
      default:
        return { actor, text: 'interacted with your content' };
    }
  };

  const getActionIcon = () => {
    switch (notification.type) {
      case 'Like':
        return <Heart className="h-3.5 w-3.5 text-red-500" />;
      case 'Create':
        return <MessageCircle className="h-3.5 w-3.5 text-blue-500" />;
      case 'Follow':
        return <UserPlus className="h-3.5 w-3.5 text-green-500" />;
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset py-2',
        !notification.isRead && 'bg-[#f0c647]',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${getNotificationMessage().actor} ${getNotificationMessage().text}. ${formatTimeAgo(notification.createdAt)}. ${!notification.isRead ? t('notifications.unread') : ''}`}
    >
      <CardContent className="p-3 py-2 relative">
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={userAvatar} alt={notification.actorId || 'User'} />
            <AvatarFallback>{(notification.actorId || 'U')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-tight">
              <span className="font-semibold">{getNotificationMessage().actor}</span>
              {' '}
              <span className={cn(!notification.isRead && 'font-medium')}>
                {getNotificationMessage().text}
              </span>
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[10px] text-muted-foreground">
                {formatTimeAgo(notification.createdAt)}
              </p>
              <div className="flex items-center gap-1">
                {getActionIcon()}
                {!notification.isRead && (
                  <Badge variant="default" className="shrink-0 text-[10px] h-4 px-1.5 ml-1">
                    {t('notifications.unread')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
