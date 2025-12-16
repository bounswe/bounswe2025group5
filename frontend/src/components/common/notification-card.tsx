import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, UserPlus, Forward, Trophy, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/lib/api/schemas/notifications';
import userAvatar from '@/assets/user.png';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onNotificationClick?: (notification: Notification) => void;
  actorPhotoUrl?: string | null;
  className?: string;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onNotificationClick,
  actorPhotoUrl,
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
        // If objectType is 'comment', it's a comment notification
        // If objectType is 'post', it's a share notification
        if (objectType?.toLowerCase() === 'comment') {
          return { actor, text: `commented on your post` };
        } else if (objectType?.toLowerCase() === 'post') {
          return { actor, text: `shared a post` };
        }
        return { actor, text: `interacted with your ${objType}` };
      case 'Follow':
        return { actor, text: 'started following you' };
      case 'End':
        // Challenge ended notification
        if (objectType?.toLowerCase() === 'challenge') {
          return { actor: 'Challenge', text: 'ended' };
        }
        return { actor, text: 'ended' };
      case 'ClosedWithoutChange':
        return { actor: 'Moderator', text: `closed your ${objType} without changes` };
      case 'Deletion':
        return { actor: 'Moderator', text: `deleted your ${objType}` };
      case 'Seen':
        return { actor: 'Moderator', text: `reviewed your ${objType}` };
      default:
        return { actor, text: 'interacted with your content' };
    }
  };

  const getActionIcon = () => {
    switch (notification.type) {
      case 'Like':
        return <Heart className="h-3.5 w-3.5 text-red-500" />;
      case 'Create':
        // If objectType is 'comment', show comment icon
        // If objectType is 'post', show share icon
        if (notification.objectType?.toLowerCase() === 'comment') {
          return <MessageCircle className="h-3.5 w-3.5 text-blue-500" />;
        } else if (notification.objectType?.toLowerCase() === 'post') {
          return <Forward className="h-3.5 w-3.5 text-purple-500" />;
        }
        return <MessageCircle className="h-3.5 w-3.5 text-blue-500" />;
      case 'Follow':
        return <UserPlus className="h-3.5 w-3.5 text-green-500" />;
      case 'End':
        // Challenge ended notification
        if (notification.objectType?.toLowerCase() === 'challenge') {
          return <Trophy className="h-3.5 w-3.5 text-yellow-500" />;
        }
        return null;
      case 'ClosedWithoutChange':
        return <CheckCircle className="h-3.5 w-3.5 text-orange-500" />;
      case 'Deletion':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
      case 'Seen':
        return <Eye className="h-3.5 w-3.5 text-blue-600" />;
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
            <AvatarImage src={actorPhotoUrl || userAvatar} alt={notification.actorId || 'User'} />
            <AvatarFallback>{(notification.actorId || 'U')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-tight">
              {getNotificationMessage().actor && (
                <>
                  <span className="font-semibold">{getNotificationMessage().actor}</span>
                  {' '}
                </>
              )}
              <span className={cn(!notification.isRead && 'font-medium')}>
                {getNotificationMessage().text}
              </span>
            </p>
            {(notification.preview || notification.postMessage || notification.commentContent || notification.challengeTitle) && (
              <div className="mt-2 p-2 rounded-md bg-muted/50 border border-border/50">
                {/* Use preview field from backend (preferred), fallback to legacy fields */}
                {(notification.preview || notification.postMessage || notification.commentContent) && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    "{(() => {
                      const content = notification.preview || notification.postMessage || notification.commentContent || '';
                      return content.length > 80 ? `${content.slice(0, 80)}...` : content;
                    })()}"
                  </p>
                )}
                {notification.challengeTitle && (
                  <p className="text-xs font-medium text-primary">
                    {notification.challengeTitle}
                  </p>
                )}
              </div>
            )}
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
