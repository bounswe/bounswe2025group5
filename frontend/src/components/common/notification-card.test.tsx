import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, vi } from 'vitest';
import NotificationCard from './notification-card';
import type { Notification } from '@/lib/api/schemas/notifications';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, any> = {
        'notifications.timeAgo.days': `${options?.count} days ago`,
        'notifications.timeAgo.hours': `${options?.count} hours ago`,
        'notifications.timeAgo.minutes': `${options?.count} minutes ago`,
        'notifications.timeAgo.seconds': `${options?.count} seconds ago`,
        'notifications.unread': 'New',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock assets
vi.mock('@/assets/user.png', () => ({
  default: 'user-avatar.png',
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, onClick, className, ...props }: any) => (
    <div className={className} onClick={onClick} {...props}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

const mockNotificationLike: Notification = {
  id: 1,
  type: 'Like',
  actorId: 'john_doe',
  isRead: false,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  objectId: '123',
  objectType: 'Post',
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

const mockNotificationComment: Notification = {
  id: 2,
  type: 'Create',
  actorId: 'jane_smith',
  isRead: true,
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  objectId: '124',
  objectType: 'Comment',
  timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
};

const mockNotificationFollow: Notification = {
  id: 3,
  type: 'Follow',
  actorId: 'alice_wonder',
  isRead: false,
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
  objectId: null,
  objectType: null,
  timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
};

const mockNotificationWithPreview: Notification = {
  id: 4,
  type: 'Like',
  actorId: 'bob_smith',
  isRead: false,
  createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  objectId: '125',
  objectType: 'Post',
  timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  preview: 'This is a sample post content that was liked by someone',
};

const mockNotificationWithLongPreview: Notification = {
  id: 5,
  type: 'Create',
  actorId: 'charlie_brown',
  isRead: false,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  objectId: '126',
  objectType: 'Comment',
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  preview: 'This is a very long comment content that exceeds the 80 character limit and should be truncated with ellipsis at the end',
};

const mockNotificationWithChallengeTitle: Notification = {
  id: 6,
  type: 'End',
  actorId: null,
  isRead: false,
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  objectId: '127',
  objectType: 'Challenge',
  timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  challengeTitle: 'Recycle 100 Bottles Challenge',
};

const mockNotificationWithPostMessage: Notification = {
  id: 7,
  type: 'Like',
  actorId: 'david_jones',
  isRead: false,
  createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  objectId: '128',
  objectType: 'Post',
  timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  postMessage: 'Legacy post message field for backward compatibility',
};

const mockNotificationWithCommentContent: Notification = {
  id: 8,
  type: 'Create',
  actorId: 'emily_davis',
  isRead: false,
  createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  objectId: '129',
  objectType: 'Comment',
  timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  commentContent: 'Legacy comment content field for backward compatibility',
};

describe('NotificationCard', () => {
  describe('Rendering', () => {
    test('renders notification with actor name', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    test('renders like notification message', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      expect(screen.getByText(/liked your post/i)).toBeInTheDocument();
    });

    test('renders comment notification message', () => {
      render(<NotificationCard notification={mockNotificationComment} />);
      expect(screen.getByText('jane_smith')).toBeInTheDocument();
      expect(screen.getByText(/commented on your post/i)).toBeInTheDocument();
    });

    test('renders follow notification message', () => {
      render(<NotificationCard notification={mockNotificationFollow} />);
      expect(screen.getByText('alice_wonder')).toBeInTheDocument();
      expect(screen.getByText(/started following you/i)).toBeInTheDocument();
    });

    test('renders avatar with correct props', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      const avatar = screen.getByAltText('john_doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'user-avatar.png');
    });

    test('renders avatar fallback with first letter of username', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    test('displays time in hours for recent notifications', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
    });

    test('displays time in days for older notifications', () => {
      render(<NotificationCard notification={mockNotificationComment} />);
      expect(screen.getByText(/1 days ago/i)).toBeInTheDocument();
    });

    test('displays time in minutes for very recent notifications', () => {
      render(<NotificationCard notification={mockNotificationFollow} />);
      expect(screen.getByText(/30 minutes ago/i)).toBeInTheDocument();
    });
  });

  describe('Action Icons', () => {
    test('displays heart icon for like notifications', () => {
      const { container } = render(<NotificationCard notification={mockNotificationLike} />);
      const heartIcon = container.querySelector('.lucide-heart');
      expect(heartIcon).toBeInTheDocument();
    });

    test('displays message icon for comment notifications', () => {
      const { container } = render(<NotificationCard notification={mockNotificationComment} />);
      const messageIcon = container.querySelector('.lucide-message-circle');
      expect(messageIcon).toBeInTheDocument();
    });

    test('displays user-plus icon for follow notifications', () => {
      const { container } = render(<NotificationCard notification={mockNotificationFollow} />);
      const userPlusIcon = container.querySelector('.lucide-user-plus');
      expect(userPlusIcon).toBeInTheDocument();
    });
  });

  describe('Read/Unread State', () => {
    test('displays unread badge for unread notifications', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    test('does not display unread badge for read notifications', () => {
      render(<NotificationCard notification={mockNotificationComment} />);
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    test('applies highlight background for unread notifications', () => {
      const { container } = render(<NotificationCard notification={mockNotificationLike} />);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-[#f0c647]');
    });

    test('does not apply highlight background for read notifications', () => {
      const { container } = render(<NotificationCard notification={mockNotificationComment} />);
      const card = container.firstChild;
      expect(card).not.toHaveClass('bg-[#f0c647]');
    });
  });

  describe('Interaction', () => {
    test('calls onNotificationClick when card is clicked', async () => {
      const onNotificationClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <NotificationCard
          notification={mockNotificationLike}
          onNotificationClick={onNotificationClick}
        />
      );
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotificationLike);
    });

    test('calls onMarkAsRead when unread notification is clicked', async () => {
      const onMarkAsRead = vi.fn();
      const onNotificationClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <NotificationCard
          notification={mockNotificationLike}
          onMarkAsRead={onMarkAsRead}
          onNotificationClick={onNotificationClick}
        />
      );
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(onMarkAsRead).toHaveBeenCalledWith(1);
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotificationLike);
    });

    test('does not call onMarkAsRead when read notification is clicked', async () => {
      const onMarkAsRead = vi.fn();
      const onNotificationClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <NotificationCard
          notification={mockNotificationComment}
          onMarkAsRead={onMarkAsRead}
          onNotificationClick={onNotificationClick}
        />
      );
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(onMarkAsRead).not.toHaveBeenCalled();
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotificationComment);
    });

    test('handles click when no callbacks provided', async () => {
      const user = userEvent.setup();
      
      render(<NotificationCard notification={mockNotificationLike} />);
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      // Should not throw error
      expect(card).toBeInTheDocument();
    });
  });

  describe('Keyboard Interaction', () => {
    test('calls handlers when Enter key is pressed', async () => {
      const onNotificationClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <NotificationCard
          notification={mockNotificationLike}
          onNotificationClick={onNotificationClick}
        />
      );
      
      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');
      
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotificationLike);
    });

    test('calls handlers when Space key is pressed', async () => {
      const onNotificationClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <NotificationCard
          notification={mockNotificationLike}
          onNotificationClick={onNotificationClick}
        />
      );
      
      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');
      
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotificationLike);
    });
  });

  describe('Accessibility', () => {
    test('has role button', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('is keyboard focusable', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    test('has descriptive aria-label for unread notifications', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      const card = screen.getByRole('button');
      const ariaLabel = card.getAttribute('aria-label');
      expect(ariaLabel).toContain('john_doe');
      expect(ariaLabel).toContain('liked your post');
      expect(ariaLabel).toContain('hours ago');
    });

    test('has descriptive aria-label for read notifications', () => {
      render(<NotificationCard notification={mockNotificationComment} />);
      const card = screen.getByRole('button');
      const ariaLabel = card.getAttribute('aria-label');
      expect(ariaLabel).toContain('jane_smith');
      expect(ariaLabel).not.toContain('New');
    });

    test('includes focus-visible styling', () => {
      const { container } = render(<NotificationCard notification={mockNotificationLike} />);
      const card = container.firstChild;
      expect(card).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className', () => {
      const { container } = render(
        <NotificationCard
          notification={mockNotificationLike}
          className="custom-class"
        />
      );
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    test('applies default cursor-pointer and hover styles', () => {
      const { container } = render(<NotificationCard notification={mockNotificationLike} />);
      const card = container.firstChild;
      expect(card).toHaveClass('cursor-pointer', 'transition-all', 'hover:shadow-md');
    });
  });

  describe('Edge Cases', () => {
    test('handles notification without actorId', () => {
      const notificationWithoutActor: Notification = {
        ...mockNotificationLike,
        actorId: null,
      };
      
      render(<NotificationCard notification={notificationWithoutActor} />);
      expect(screen.getByText('Someone')).toBeInTheDocument();
    });

    test('handles notification with unknown type', () => {
      const notificationUnknownType: Notification = {
        ...mockNotificationLike,
        type: 'Unknown',
      };
      
      render(<NotificationCard notification={notificationUnknownType} />);
      expect(screen.getByText(/interacted with your content/i)).toBeInTheDocument();
    });

    test('handles notification without objectType', () => {
      const notificationNoObjectType: Notification = {
        ...mockNotificationLike,
        objectType: null,
      };
      
      render(<NotificationCard notification={notificationNoObjectType} />);
      expect(screen.getByText(/liked your post/i)).toBeInTheDocument();
    });

    test('handles very recent notification (seconds)', () => {
      const veryRecentNotification: Notification = {
        ...mockNotificationLike,
        createdAt: new Date(Date.now() - 10 * 1000).toISOString(), // 10 seconds ago
        timestamp: new Date(Date.now() - 10 * 1000).toISOString(),
      };
      
      render(<NotificationCard notification={veryRecentNotification} />);
      expect(screen.getByText(/seconds ago/i)).toBeInTheDocument();
    });
  });

  describe('Preview Content', () => {
    test('displays preview content from preview field', () => {
      render(<NotificationCard notification={mockNotificationWithPreview} />);
      expect(screen.getByText(/"This is a sample post content that was liked by someone"/i)).toBeInTheDocument();
    });

    test('truncates long preview content to 80 characters with ellipsis', () => {
      render(<NotificationCard notification={mockNotificationWithLongPreview} />);
      const previewText = screen.getByText((content) => {
        // Check if text contains the beginning of the preview and ends with ellipsis
        return content.includes('This is a very long comment content') && content.includes('...');
      });
      expect(previewText).toBeInTheDocument();
      // Verify the text is actually truncated (80 chars + "..." + quotes = 85)
      expect(previewText.textContent).toHaveLength(85);
    });

    test('displays challenge title in preview section', () => {
      render(<NotificationCard notification={mockNotificationWithChallengeTitle} />);
      expect(screen.getByText('Recycle 100 Bottles Challenge')).toBeInTheDocument();
    });

    test('falls back to postMessage when preview is not available', () => {
      render(<NotificationCard notification={mockNotificationWithPostMessage} />);
      expect(screen.getByText(/"Legacy post message field for backward compatibility"/i)).toBeInTheDocument();
    });

    test('falls back to commentContent when preview and postMessage are not available', () => {
      render(<NotificationCard notification={mockNotificationWithCommentContent} />);
      expect(screen.getByText(/"Legacy comment content field for backward compatibility"/i)).toBeInTheDocument();
    });

    test('does not display preview section when no preview content is available', () => {
      render(<NotificationCard notification={mockNotificationLike} />);
      const { container } = render(<NotificationCard notification={mockNotificationLike} />);
      const previewSection = container.querySelector('.bg-muted\\/50');
      expect(previewSection).not.toBeInTheDocument();
    });

    test('preview section has correct styling', () => {
      const { container } = render(<NotificationCard notification={mockNotificationWithPreview} />);
      const previewSection = container.querySelector('.bg-muted\\/50');
      expect(previewSection).toBeInTheDocument();
      expect(previewSection).toHaveClass('mt-2', 'p-2', 'rounded-md', 'border', 'border-border/50');
    });

    test('preview text has italic styling', () => {
      render(<NotificationCard notification={mockNotificationWithPreview} />);
      const previewText = screen.getByText(/"This is a sample post content that was liked by someone"/i);
      expect(previewText).toHaveClass('italic');
    });

    test('preview text is limited to 2 lines (line-clamp)', () => {
      render(<NotificationCard notification={mockNotificationWithPreview} />);
      const previewText = screen.getByText(/"This is a sample post content that was liked by someone"/i);
      expect(previewText).toHaveClass('line-clamp-2');
    });

    test('challenge title has primary color styling', () => {
      render(<NotificationCard notification={mockNotificationWithChallengeTitle} />);
      const challengeTitle = screen.getByText('Recycle 100 Bottles Challenge');
      expect(challengeTitle).toHaveClass('text-primary');
    });

    test('prioritizes preview field over legacy postMessage', () => {
      const notificationWithBoth: Notification = {
        ...mockNotificationWithPreview,
        postMessage: 'This should not be displayed',
      };
      render(<NotificationCard notification={notificationWithBoth} />);
      expect(screen.getByText(/"This is a sample post content that was liked by someone"/i)).toBeInTheDocument();
      expect(screen.queryByText(/"This should not be displayed"/i)).not.toBeInTheDocument();
    });

    test('prioritizes preview field over legacy commentContent', () => {
      const notificationWithBoth: Notification = {
        ...mockNotificationWithLongPreview,
        commentContent: 'This should not be displayed',
      };
      render(<NotificationCard notification={notificationWithBoth} />);
      expect(screen.getByText((content) => content.includes('This is a very long comment content'))).toBeInTheDocument();
      expect(screen.queryByText(/"This should not be displayed"/i)).not.toBeInTheDocument();
    });

    test('handles empty preview string', () => {
      const notificationWithEmptyPreview: Notification = {
        ...mockNotificationWithPreview,
        preview: '',
      };
      const { container } = render(<NotificationCard notification={notificationWithEmptyPreview} />);
      const previewSection = container.querySelector('.bg-muted\\/50');
      expect(previewSection).not.toBeInTheDocument();
    });

    test('displays both preview and challenge title when available', () => {
      const notificationWithBoth: Notification = {
        ...mockNotificationWithPreview,
        challengeTitle: 'Test Challenge',
      };
      render(<NotificationCard notification={notificationWithBoth} />);
      expect(screen.getByText(/"This is a sample post content that was liked by someone"/i)).toBeInTheDocument();
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });

    test('preview section appears between message and timestamp', () => {
      const { container } = render(<NotificationCard notification={mockNotificationWithPreview} />);
      const card = container.firstChild as HTMLElement;
      const content = card.textContent || '';
      
      // Check order: actor name -> message -> preview content -> timestamp
      expect(content.indexOf('bob_smith')).toBeLessThan(content.indexOf('liked your post'));
      expect(content.indexOf('liked your post')).toBeLessThan(content.indexOf('This is a sample post content'));
      expect(content.indexOf('This is a sample post content')).toBeLessThan(content.indexOf('hours ago'));
    });
  });
});
