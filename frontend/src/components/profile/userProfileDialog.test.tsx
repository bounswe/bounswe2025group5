import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem('username', 'current-user');
  });

  it('loads profile details and posts when opened', async () => {
    vi.mocked(UsersApi.getProfile).mockResolvedValue(profileResponse);
    vi.mocked(UsersApi.getPosts).mockResolvedValue(postItems as never);
    vi.mocked(FollowApi.isFollowing).mockResolvedValue(false);

    render(
      <UserProfileDialog username="other-user" open onOpenChange={vi.fn()} />
    );

    await waitFor(() => expect(UsersApi.getProfile).toHaveBeenCalledWith('other-user'));
    expect(screen.getByText('Bio text')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTestId('post-1')).toHaveTextContent('first');
  });

  it('toggles follow state using follow API', async () => {
    const user = userEvent.setup();
    vi.mocked(UsersApi.getProfile).mockResolvedValue(profileResponse);
    vi.mocked(UsersApi.getPosts).mockResolvedValue(postItems as never);
    vi.mocked(FollowApi.isFollowing).mockResolvedValue(false);
    vi.mocked(FollowApi.followUser).mockResolvedValue({} as never);
    vi.mocked(FollowApi.unfollowUser).mockResolvedValue({} as never);

    render(
      <UserProfileDialog username="other-user" open onOpenChange={vi.fn()} />
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Follow' }));
    expect(FollowApi.followUser).toHaveBeenCalledWith('current-user', 'other-user');

    await waitFor(() => expect(screen.getByRole('button', { name: 'Unfollow' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Unfollow' }));
    expect(FollowApi.unfollowUser).toHaveBeenCalledWith('current-user', 'other-user');
  });

  it('shows error copy when profile fetch fails', async () => {
    vi.mocked(UsersApi.getProfile).mockRejectedValue(new Error('fail'));
    vi.mocked(UsersApi.getPosts).mockResolvedValue([]);
    vi.mocked(FollowApi.isFollowing).mockResolvedValue(false);

    render(
      <UserProfileDialog username="other-user" open onOpenChange={vi.fn()} />
    );

    await waitFor(() => expect(UsersApi.getProfile).toHaveBeenCalled());
    expect(screen.getByText('profile.error.loadFailed')).toBeInTheDocument();
  });
});

