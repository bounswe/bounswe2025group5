import { vi, beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useEffect: actual.useLayoutEffect,
  };
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import UserProfileDialog from '@/components/profile/userProfileDialog';
import { UsersApi } from '@/lib/api/users';
import { FollowApi } from '@/lib/api/follow';

const formatTemplate = (template: string, vars?: Record<string, unknown>) =>
  template.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (_, token) => String(vars?.[token] ?? ''));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValueOrOptions?: unknown, maybeOptions?: Record<string, unknown>) => {
      const options =
        typeof defaultValueOrOptions === 'object' && defaultValueOrOptions !== null && !Array.isArray(defaultValueOrOptions)
          ? (defaultValueOrOptions as Record<string, unknown>)
          : maybeOptions;
      const defaultText =
        typeof defaultValueOrOptions === 'string'
          ? defaultValueOrOptions
          : typeof options?.defaultValue === 'string'
            ? options.defaultValue
            : undefined;
      return defaultText ? formatTemplate(defaultText, options) : key;
    },
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/feedpage/post-card', () => ({
  default: ({ post }: { post: { postId: number; content: string } }) => (
    <div data-testid={`post-${post.postId}`}>{post.content}</div>
  ),
}));

vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    getProfile: vi.fn(),
    getPosts: vi.fn(),
  },
}));

vi.mock('@/lib/api/follow', () => ({
  FollowApi: {
    isFollowing: vi.fn(),
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
  },
}));

const profileResponse = {
  username: 'other-user',
  biography: 'Bio text',
  followerCount: 5,
  followingCount: 3,
  photoUrl: null,
};

const postItems = [
  { postId: 1, content: 'first', creatorUsername: 'other-user' },
  { postId: 2, content: 'second', creatorUsername: 'other-user' },
];

describe('UserProfileDialog', () => {
  const originalLocalStorage = window.localStorage;
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem('username', 'current-user');
  });

  it('loads profile details and posts when opened', async () => {
    const user = userEvent.setup();
    render(
      <UserProfileDialog
        username="other-user"
        open
        onOpenChange={vi.fn()}
        __testOverrides={{ profile: profileResponse, posts: postItems, isFollowing: false }}
      />
    );

    expect(screen.getByText('Bio text')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /posts/i }));
    expect(screen.getByTestId('post-1')).toHaveTextContent('first');
  });

  it('toggles follow state using follow API', async () => {
    const user = userEvent.setup();
    vi.mocked(FollowApi.followUser).mockResolvedValue({} as never);
    vi.mocked(FollowApi.unfollowUser).mockResolvedValue({} as never);
    render(
      <UserProfileDialog
        username="other-user"
        open
        onOpenChange={vi.fn()}
        __testOverrides={{ profile: profileResponse, posts: postItems, isFollowing: false }}
      />
    );

    const followButton = await screen.findByRole('button', { name: /follow/i });
    await user.click(followButton);
    await waitFor(() => expect(FollowApi.followUser).toHaveBeenCalledWith('current-user', 'other-user'));

    const unfollowButton = await screen.findByRole('button', { name: /unfollow/i });
    await user.click(unfollowButton);
    await waitFor(() => expect(FollowApi.unfollowUser).toHaveBeenCalledWith('current-user', 'other-user'));
  });

  it('handles profile fetch failure gracefully', () => {
    render(
      <UserProfileDialog
        username="other-user"
        open
        onOpenChange={vi.fn()}
        __testOverrides={{ profile: null, posts: [], isFollowing: false, profileError: 'profile.error.loadFailed' }}
      />
    );

    expect(screen.getByText('profile.error.loadFailed')).toBeInTheDocument();
  });
});

