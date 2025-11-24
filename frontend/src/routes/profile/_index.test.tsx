import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileIndex from '@/routes/profile/_index';
import { UsersApi } from '@/lib/api/users';
import { FollowApi } from '@/lib/api/follow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/components/profile/delete_account', () => ({
  default: () => <button data-testid="delete-account">Delete</button>,
}));

vi.mock('@/components/profile/edit_profile', () => ({
  default: () => <button data-testid="edit-profile">Edit</button>,
}));

vi.mock('@/components/feedpage/post-card', () => ({
  default: ({ post }: { post: { postId: number; content?: string } }) => (
    <div data-testid={`post-${post.postId}`}>{post.content ?? 'post'}</div>
  ),
}));

vi.mock('@/components/profile/userProfileDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/glass-card', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div data-testid="spinner" />,
  default: () => <div data-testid="spinner" />,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: () => null,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/assets/user.png', () => ({
  default: 'avatar.png',
}));

vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    getProfile: vi.fn(),
    getPosts: vi.fn(),
    getSavedPosts: vi.fn(),
  },
}));

vi.mock('@/lib/api/follow', () => ({
  FollowApi: {
    getFollowers: vi.fn(),
    getFollowings: vi.fn(),
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

const mockedGetProfile = vi.mocked(UsersApi.getProfile);
const mockedGetPosts = vi.mocked(UsersApi.getPosts);
const mockedGetSavedPosts = vi.mocked(UsersApi.getSavedPosts);
const mockedGetFollowers = vi.mocked(FollowApi.getFollowers);
const mockedGetFollowings = vi.mocked(FollowApi.getFollowings);

describe('ProfileIndex route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('shows auth error when username is missing', async () => {
    render(<ProfileIndex />);

    expect(await screen.findByText('Not authenticated')).toBeInTheDocument();
  });

  it('renders profile information after loading', async () => {
    localStorage.setItem('username', 'demo');
    mockedGetProfile.mockResolvedValue({
      username: 'demo',
      biography: 'bio',
      photoUrl: null,
      followerCount: 1,
      followingCount: 2,
    } as any);
    mockedGetPosts.mockResolvedValue([
      { postId: 1, content: 'first', creatorUsername: 'demo' },
    ] as any);
    mockedGetSavedPosts.mockResolvedValue([]);
    mockedGetFollowers.mockResolvedValue([]);
    mockedGetFollowings.mockResolvedValue([]);

    render(<ProfileIndex />);

    expect(await screen.findByText('demo')).toBeInTheDocument();
    expect(await screen.findByTestId('post-1')).toHaveTextContent('first');
  });

  it('loads saved posts when toggle is clicked', async () => {
    localStorage.setItem('username', 'demo');
    mockedGetProfile.mockResolvedValue({
      username: 'demo',
      biography: '',
      photoUrl: null,
      followerCount: 0,
      followingCount: 0,
    } as any);
    mockedGetPosts.mockResolvedValue([
      { postId: 2, content: 'latest', creatorUsername: 'demo' },
    ] as any);
    mockedGetSavedPosts.mockResolvedValue([
      { postId: 3, content: 'saved', creatorUsername: 'demo' },
    ] as any);
    mockedGetFollowers.mockResolvedValue([]);
    mockedGetFollowings.mockResolvedValue([]);

    render(<ProfileIndex />);

    const user = userEvent.setup();
    const toggleButton = await screen.findByRole('button', { name: 'Show Saved Posts' });
    await user.click(toggleButton);

    await waitFor(() => expect(mockedGetSavedPosts).toHaveBeenCalled());
    expect(await screen.findByTestId('post-3')).toHaveTextContent('saved');
  });
});

