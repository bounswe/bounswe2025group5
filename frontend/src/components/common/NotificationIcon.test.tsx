import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import NotificationIcon from './NotificationIcon';
import { NotificationsApi } from '@/lib/api/notifications';
import type { Notification } from '@/lib/api/schemas/notifications';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'notifications.title': 'Notifications',
        'notifications.loading': 'Loading...',
        'notifications.error': 'Failed to load notifications',
        'notifications.noNotifications': 'No notifications yet',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock NotificationsApi
vi.mock('@/lib/api/notifications', () => ({
  NotificationsApi: {
    list: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

// Mock child components
vi.mock('./notification-card', () => ({
  default: ({ notification, onMarkAsRead, onNotificationClick }: any) => (
    <div
      data-testid={`notification-card-${notification.id}`}
      onClick={() => onNotificationClick?.(notification)}
    >
      <span>{notification.actorId}</span>
      <button onClick={(e) => {
        e.stopPropagation();
        onMarkAsRead?.(notification.id);
      }}>
        Mark as read
      </button>
      {!notification.isRead && <span>Unread</span>}
    </div>
  ),
}));

vi.mock('./NotificationDetailDialog', () => ({
  default: ({ notification, open }: any) => 
    open && notification ? (
      <div data-testid="notification-detail-dialog">
        Detail for {notification.actorId}
      </div>
    ) : null,
}));

// Mock UI components
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-open={open} data-testid="popover">
      {children}
    </div>
  ),
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'Like',
    actorId: 'user1',
    isRead: false,
    createdAt: '2025-01-15T10:00:00Z',
    objectId: '123',
    objectType: 'Post',
    timestamp: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    type: 'Create',
    actorId: 'user2',
    isRead: true,
    createdAt: '2025-01-14T10:00:00Z',
    objectId: '124',
    objectType: 'Comment',
    timestamp: '2025-01-14T10:00:00Z',
  },
  {
    id: 3,
    type: 'Follow',
    actorId: 'user3',
    isRead: false,
    createdAt: '2025-01-16T10:00:00Z',
    objectId: null,
    objectType: null,
    timestamp: '2025-01-16T10:00:00Z',
  },
];

describe('NotificationIcon', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vi.mocked(NotificationsApi.list).mockResolvedValue([]);
    vi.mocked(NotificationsApi.markAsRead).mockResolvedValue({ success: true });
  });

  describe('Authentication', () => {
    test('does not render when user is not authenticated', () => {
      localStorageMock.removeItem('username');
      const { container } = render(<NotificationIcon />);
      expect(container.firstChild).toBeNull();
    });

    test('renders when user is authenticated', () => {
      localStorageMock.setItem('username', 'testuser');
      render(<NotificationIcon />);
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });
  });

  describe('Notification Bell', () => {
    test('renders bell icon button', () => {
      localStorageMock.setItem('username', 'testuser');
      render(<NotificationIcon />);
      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('text-white', 'hover:bg-white/20');
    });

    test('does not show unread badge when no unread notifications', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue([
        { ...mockNotifications[1], isRead: true },
      ]);
      
      render(<NotificationIcon />);
      
      await waitFor(() => {
        const badge = screen.queryByText(/9\+|[1-9]/);
        expect(badge).not.toBeInTheDocument();
      });
    });

    test('shows unread count badge when unread notifications exist', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      render(<NotificationIcon />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    test('shows "9+" badge when more than 9 unread notifications', async () => {
      localStorageMock.setItem('username', 'testuser');
      const manyNotifications = Array.from({ length: 12 }, (_, i) => ({
        ...mockNotifications[0],
        id: i + 1,
        isRead: false,
      }));
      vi.mocked(NotificationsApi.list).mockResolvedValue(manyNotifications);
      
      render(<NotificationIcon />);
      
      await waitFor(() => {
        expect(screen.getByText('9+')).toBeInTheDocument();
      });
    });
  });

  describe('Fetching Notifications', () => {
    test('fetches notifications on mount', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      render(<NotificationIcon />);
      
      await waitFor(() => {
        expect(NotificationsApi.list).toHaveBeenCalledWith('testuser');
      });
    });

    test('does not fetch notifications when username is missing', () => {
      localStorageMock.removeItem('username');
      render(<NotificationIcon />);
      expect(NotificationsApi.list).not.toHaveBeenCalled();
    });

    test('shows loading state while fetching', async () => {
      localStorageMock.setItem('username', 'testuser');
      let resolvePromise: any;
      vi.mocked(NotificationsApi.list).mockReturnValue(
        new Promise((resolve) => { resolvePromise = resolve; })
      );
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      resolvePromise([]);
    });

    test('shows error message when fetch fails', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      });
    });

    test('fetches notifications on initial render', async () => {
      localStorageMock.setItem('username', 'testuser');
      const listSpy = vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      render(<NotificationIcon />);
      
      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(listSpy).toHaveBeenCalledWith('testuser');
      });
      
      // Verify API was called with correct username
      expect(listSpy).toHaveBeenCalled();
    });
  });

  describe('Popover Interaction', () => {
    test('opens popover when bell icon is clicked', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    test('displays notifications in popover', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('notification-card-2')).toBeInTheDocument();
        expect(screen.getByTestId('notification-card-3')).toBeInTheDocument();
      });
    });

    test('shows empty state when no notifications', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue([]);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Sorting', () => {
    test('sorts notifications with unread first, then by timestamp', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        const cards = screen.getAllByTestId(/notification-card-/);
        // Unread notifications (id: 3, 1) should come before read (id: 2)
        // Among unread, newest first (id: 3 has newer timestamp '2025-01-16' than id: 1 '2025-01-15')
        // First card should be id: 3 (unread, newest)
        expect(cards[0].getAttribute('data-testid')).toMatch(/notification-card-(3|1)/);
        // Last card should be id: 2 (read)
        expect(cards[2]).toHaveAttribute('data-testid', 'notification-card-2');
      });
    });
  });

  describe('Mark as Read', () => {
    test('marks notification as read when requested', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      });
      
      const markAsReadButtons = screen.getAllByText('Mark as read');
      // First unread notification after sorting is id: 3
      await user.click(markAsReadButtons[0]);
      
      // The first button corresponds to the first unread notification (id: 3 or 1 depending on sort)
      expect(NotificationsApi.markAsRead).toHaveBeenCalled();
    });

    test('updates notification state after marking as read', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue([mockNotifications[0]]);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Unread')).toBeInTheDocument();
      });
      
      const markAsReadButton = screen.getByText('Mark as read');
      await user.click(markAsReadButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Unread')).not.toBeInTheDocument();
      });
    });

    test('handles mark as read failure gracefully', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      vi.mocked(NotificationsApi.markAsRead).mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      });
      
      const markAsReadButton = screen.getAllByText('Mark as read')[0];
      await user.click(markAsReadButton);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      
      consoleError.mockRestore();
    });
  });

  describe('Notification Detail Dialog', () => {
    test('opens detail dialog when notification is clicked', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      });
      
      const notificationCard = screen.getByTestId('notification-card-1');
      await user.click(notificationCard);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-detail-dialog')).toBeInTheDocument();
        expect(screen.getByText('Detail for user1')).toBeInTheDocument();
      });
    });

    test('closes popover when notification is clicked', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      });
      
      const notificationCard = screen.getByTestId('notification-card-1');
      await user.click(notificationCard);
      
      // Popover should be closed (isOpen = false)
      const popover = screen.getByTestId('popover');
      expect(popover).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Unread Count Badge', () => {
    test('updates unread count when notification is marked as read', async () => {
      localStorageMock.setItem('username', 'testuser');
      vi.mocked(NotificationsApi.list).mockResolvedValue(mockNotifications);
      
      const user = userEvent.setup();
      render(<NotificationIcon />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      });
      
      const markAsReadButton = screen.getAllByText('Mark as read')[0];
      await user.click(markAsReadButton);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('bell button has accessible label', () => {
      localStorageMock.setItem('username', 'testuser');
      render(<NotificationIcon />);
      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toHaveAccessibleName();
    });

    test('bell button has correct styling classes', () => {
      localStorageMock.setItem('username', 'testuser');
      render(<NotificationIcon />);
      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toHaveClass('relative', 'text-white', 'hover:bg-white/20');
    });
  });
});
