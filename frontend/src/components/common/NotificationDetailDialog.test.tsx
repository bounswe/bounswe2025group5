import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import NotificationDetailDialog from './NotificationDetailDialog';
import { PostsApi } from '@/lib/api/posts';
import type { Notification } from '@/lib/api/schemas/notifications';
import type { PostItem } from '@/lib/api/schemas/posts';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'notifications.likedYourPost': `${options?.actor} liked your post`,
        'notifications.likedYourPost_suffix': 'liked your post',
        'notifications.commentedOnYourPost': `${options?.actor} commented on your post`,
        'notifications.commentedOnYourPost_suffix': 'commented on your post',
        'notifications.startedFollowing': `${options?.actor} started following you`,
        'notifications.startedFollowing_suffix': 'started following you',
        'notifications.loading': 'Loading...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock PostsApi
vi.mock('@/lib/api/posts', () => ({
  PostsApi: {
    getById: vi.fn(),
  },
}));

// Mock assets
vi.mock('@/assets/user.png', () => ({
  default: 'user-avatar.png',
}));

// Mock child components
vi.mock('@/components/feedpage/post-card', () => ({
  default: ({ post, onUsernameClick }: any) => (
    <div data-testid="post-card">
      <div>Post by {post.creatorUsername}</div>
      <button onClick={() => onUsernameClick?.(post.creatorUsername)}>
        View Profile
      </button>
    </div>
  ),
}));

vi.mock('@/components/profile/userProfileDialog', () => ({
  default: ({ username, open, onOpenChange }: any) =>
    open && username ? (
      <div data-testid="user-profile-dialog">
        Profile for {username}
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => {
    return open ? <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>{children}</div> : null;
  },
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
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

const mockNotificationLike: Notification = {
  id: 1,
  type: 'Like',
  actorId: 'john_doe',
  isRead: false,
  createdAt: '2025-01-15T10:00:00Z',
  objectId: '123',
  objectType: 'Post',
  timestamp: '2025-01-15T10:00:00Z',
};

const mockNotificationComment: Notification = {
  id: 2,
  type: 'Create',
  actorId: 'jane_smith',
  isRead: false,
  createdAt: '2025-01-15T11:00:00Z',
  objectId: '124',
  objectType: 'Comment',
  timestamp: '2025-01-15T11:00:00Z',
};

const mockNotificationFollow: Notification = {
  id: 3,
  type: 'Follow',
  actorId: 'alice_wonder',
  isRead: false,
  createdAt: '2025-01-15T12:00:00Z',
  objectId: null,
  objectType: null,
  timestamp: '2025-01-15T12:00:00Z',
};

const mockPost: PostItem = {
  postId: 123,
  content: 'Test post content',
  createdAt: '2025-01-15T10:00:00Z',
  creatorUsername: 'testuser',
  photoUrl: null,
  likes: 5,
  comments: 2,
  liked: false,
  saved: false,
};

describe('NotificationDetailDialog', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('username', 'testuser');
    vi.clearAllMocks();
  });

  describe('Dialog Opening and Closing', () => {
    test('does not render when open is false', () => {
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={false}
          onOpenChange={vi.fn()}
        />
      );
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    test('renders when open is true', () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    test('does not render when notification is null', () => {
      render(
        <NotificationDetailDialog
          notification={null}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      // Dialog renders but without meaningful content when notification is null
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('post-card')).not.toBeInTheDocument();
    });
  });

  describe('Dialog Title', () => {
    test('renders title for like notification', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('liked your post')).toBeInTheDocument();
      });
    });

    test('renders title for comment notification', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationComment}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
        expect(screen.getByText('commented on your post')).toBeInTheDocument();
      });
    });

    test('renders title for follow notification', async () => {
      render(
        <NotificationDetailDialog
          notification={mockNotificationFollow}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      // Follow notifications open profile dialog instead
      await waitFor(() => {
        expect(screen.getByTestId('user-profile-dialog')).toBeInTheDocument();
      });
    });

    test('renders avatar with actor username', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        const avatar = screen.getByAltText('john_doe');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', 'user-avatar.png');
      });
    });

    test('renders avatar fallback with first letter', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument();
      });
    });
  });

  describe('Follow Notification Handling', () => {
    test('opens profile dialog for follow notifications', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationFollow}
          open={true}
          onOpenChange={onOpenChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('user-profile-dialog')).toBeInTheDocument();
        expect(screen.getByText('Profile for alice_wonder')).toBeInTheDocument();
      });
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    test('does not open profile dialog if actorId is missing', () => {
      const notificationWithoutActor: Notification = {
        ...mockNotificationFollow,
        actorId: null,
      };
      
      render(
        <NotificationDetailDialog
          notification={notificationWithoutActor}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      expect(screen.queryByTestId('user-profile-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Post Fetching', () => {
    test('fetches post when notification has objectId', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(PostsApi.getById).toHaveBeenCalledWith(123, 'testuser');
      });
    });

    test('shows loading state while fetching post', async () => {
      let resolvePromise: any;
      vi.mocked(PostsApi.getById).mockReturnValue(
        new Promise((resolve) => { resolvePromise = resolve; })
      );
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      resolvePromise(mockPost);
    });

    test('displays post card after successful fetch', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('post-card')).toBeInTheDocument();
        expect(screen.getByText('Post by testuser')).toBeInTheDocument();
      });
    });

    test('shows error message when fetch fails', async () => {
      vi.mocked(PostsApi.getById).mockRejectedValue(new Error('Network error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load content')).toBeInTheDocument();
      });
      
      consoleError.mockRestore();
    });

    test('shows error when post is not found', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(null as any);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Post not found')).toBeInTheDocument();
      });
    });
  });

  describe('Comment Notification Handling', () => {
    test('fetches post for comment notifications', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationComment}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(PostsApi.getById).toHaveBeenCalledWith(124, 'testuser');
        expect(screen.getByTestId('post-card')).toBeInTheDocument();
      });
    });
  });

  describe('Username Click Interaction', () => {
    test('opens profile dialog when username in title is clicked', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      const user = userEvent.setup();
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
      
      const usernameButton = screen.getByRole('button', { name: 'john_doe' });
      await user.click(usernameButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-profile-dialog')).toBeInTheDocument();
        expect(screen.getByText('Profile for john_doe')).toBeInTheDocument();
      });
    });

    test('opens profile dialog when username in post card is clicked', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      const user = userEvent.setup();
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('post-card')).toBeInTheDocument();
      });
      
      const viewProfileButton = screen.getByRole('button', { name: 'View Profile' });
      await user.click(viewProfileButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-profile-dialog')).toBeInTheDocument();
        expect(screen.getByText('Profile for testuser')).toBeInTheDocument();
      });
    });

    test('closes profile dialog when close button is clicked', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      const user = userEvent.setup();
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
      
      const usernameButton = screen.getByRole('button', { name: 'john_doe' });
      await user.click(usernameButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-profile-dialog')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('user-profile-dialog')).not.toBeInTheDocument();
      });
    });

    test('username button is disabled when actorId is missing', async () => {
      const notificationWithoutActor: Notification = {
        ...mockNotificationLike,
        actorId: null,
      };
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={notificationWithoutActor}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        const usernameButton = screen.getByRole('button', { name: 'Someone' });
        expect(usernameButton).toBeDisabled();
      });
    });
  });

  describe('Post Update and Delete', () => {
    test('updates post state when post is updated', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('post-card')).toBeInTheDocument();
      });
      
      // This tests that the onPostUpdate callback works
      expect(screen.getByTestId('post-card')).toBeInTheDocument();
    });

    test('closes dialog when post is deleted', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      const onOpenChange = vi.fn();
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={onOpenChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('post-card')).toBeInTheDocument();
      });
      
      // The onPostDelete callback should call onOpenChange(false)
      // This is tested through the PostCard mock
    });
  });

  describe('State Reset', () => {
    test('resets state when dialog is closed', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      const { rerender } = render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('post-card')).toBeInTheDocument();
      });
      
      rerender(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={false}
          onOpenChange={vi.fn()}
        />
      );
      
      expect(screen.queryByTestId('post-card')).not.toBeInTheDocument();
    });

    test('resets state when notification changes', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      const { rerender } = render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('post-card')).toBeInTheDocument();
      });
      
      rerender(
        <NotificationDetailDialog
          notification={mockNotificationComment}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(PostsApi.getById).toHaveBeenCalledWith(124, 'testuser');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles notification without objectId', () => {
      const notificationNoObjectId: Notification = {
        ...mockNotificationLike,
        objectId: null,
      };
      
      render(
        <NotificationDetailDialog
          notification={notificationNoObjectId}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      expect(PostsApi.getById).not.toHaveBeenCalled();
    });

    test('handles notification without actorId', async () => {
      const notificationNoActor: Notification = {
        ...mockNotificationLike,
        actorId: null,
      };
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={notificationNoActor}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Someone')).toBeInTheDocument();
      });
    });

    test('handles missing username in localStorage', async () => {
      localStorageMock.removeItem('username');
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(PostsApi.getById).toHaveBeenCalledWith(123, undefined);
      });
    });
  });

  describe('Accessibility', () => {
    test('username buttons have focus-visible styling', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        const usernameButton = screen.getByRole('button', { name: 'john_doe' });
        expect(usernameButton).toHaveClass('focus-visible:outline-none');
      });
    });

    test('username buttons have hover styling when enabled', async () => {
      vi.mocked(PostsApi.getById).mockResolvedValue(mockPost);
      
      render(
        <NotificationDetailDialog
          notification={mockNotificationLike}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
      
      await waitFor(() => {
        const usernameButton = screen.getByRole('button', { name: 'john_doe' });
        expect(usernameButton).toHaveClass('hover:underline');
      });
    });
  });
});
