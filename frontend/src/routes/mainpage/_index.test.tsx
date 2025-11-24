import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import MainpageIndex from '@/routes/mainpage/_index';
import { UsersApi } from '@/lib/api/users';
import { PostsApi } from '@/lib/api/posts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/components/mainpage/ScrollPanel', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section data-testid={`panel-${title}`}>{children}</section>
  ),
}));

vi.mock('@/components/challenges/challengeCard', () => ({
  default: ({ challenge }: { challenge: { challengeId: number } }) => (
    <div data-testid={`challenge-${challenge.challengeId}`}>challenge {challenge.challengeId}</div>
  ),
}));

vi.mock('@/components/feedpage/post-card', () => ({
  default: ({ post }: { post: { postId: number; content: string } }) => (
    <div data-testid={`post-${post.postId}`}>{post.content}</div>
  ),
}));

vi.mock('@/components/profile/userProfileDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div data-testid="spinner" />,
  default: () => <div data-testid="spinner" />,
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
});

const mockedListChallenges = vi.spyOn(UsersApi, 'listChallenges');
const mockedListPosts = vi.spyOn(PostsApi, 'list');

describe('MainpageIndex route', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorage.setItem('username', 'demo');
    mockedListChallenges.mockReset();
    mockedListPosts.mockReset();
  });

  it('renders challenge and post panels when data loads', async () => {
    mockedListChallenges.mockResolvedValue([
      { challengeId: 1, userInChallenge: true },
    ] as any);
    mockedListPosts.mockResolvedValue([
      { postId: 7, content: 'hello', creatorUsername: 'demo' },
    ] as any);

    render(<MainpageIndex />);

    expect(await screen.findByTestId('challenge-1')).toBeInTheDocument();
    expect(await screen.findByTestId('post-7')).toHaveTextContent('hello');
  });

  it('shows an error message when loading fails', async () => {
    mockedListChallenges.mockRejectedValue(new Error('unauthorized'));
    mockedListPosts.mockResolvedValue([]);

    render(<MainpageIndex />);

    expect(await screen.findByText('unauthorized')).toBeInTheDocument();
  });
});

