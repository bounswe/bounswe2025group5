import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import FeedPage from '@/routes/feed/_index';
import { PostsApi } from '@/lib/api/posts';
import { SearchApi } from '@/lib/api/search';
import type { PostItem } from '@/lib/api/schemas/posts';
import { BrowserRouter } from 'react-router-dom';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock APIs
vi.mock('@/lib/api/posts', () => ({
  PostsApi: {
    list: vi.fn(),
    listMostLiked: vi.fn(),
  },
}));

vi.mock('@/lib/api/search', () => ({
  SearchApi: {
    searchPostsSemantic: vi.fn(),
  },
}));

// Mock components
vi.mock('@/components/feedpage/create-post-button', () => ({
  default: ({ onPostCreated }: { onPostCreated: () => void }) => (
    <div data-testid="create-post-button">
      <button onClick={onPostCreated}>Create Post</button>
    </div>
  ),
}));

vi.mock('@/components/feedpage/post-card', () => ({
  default: ({ post }: { post: PostItem }) => (
    <div data-testid={`post-card-${post.postId}`}>
      {post.content}
    </div>
  ),
}));

vi.mock('@/components/feedpage/search-card', () => ({
  default: ({ onSearch, onClear, isActive }: any) => (
    <div data-testid="search-card">
      <input
        placeholder="search.placeholder"
        onChange={(e) => onSearch(e.target.value)}
      />
      <button onClick={() => onSearch('test query')}>search.button</button>
      {isActive && <button onClick={onClear}>search.clear</button>}
    </div>
  ),
}));

vi.mock('react-masonry-css', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="masonry-grid">{children}</div>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockPosts: PostItem[] = [
  {
    postId: 1,
    content: 'Test Post 1',
    creatorUsername: 'user1',
    createdAt: '2023-01-01T00:00:00Z',
    likes: 10,
    comments: 5,
    liked: false,
    saved: false,
  },
  {
    postId: 2,
    content: 'Test Post 2',
    creatorUsername: 'user2',
    createdAt: '2023-01-02T00:00:00Z',
    likes: 20,
    comments: 10,
    liked: true,
    saved: true,
  },
];

describe('FeedPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('username', 'testuser');
    vi.clearAllMocks();
  });

  test('renders loading state initially', () => {
    (PostsApi.list as any).mockReturnValue(new Promise(() => { })); // Never resolves
    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('loads and renders feed page with posts', async () => {
    (PostsApi.list as any).mockResolvedValue(mockPosts);

    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('feed.loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText('feed.title')).toBeInTheDocument();
    expect(screen.getByTestId('post-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('post-card-2')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    (PostsApi.list as any).mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('feed.loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText('feed.error.loadFailed')).toBeInTheDocument();
  });

  test('initial load and feed type selection', async () => {
    (PostsApi.list as any).mockResolvedValue(mockPosts);

    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(PostsApi.list).toHaveBeenCalled();
    });

    // Feed type buttons should be visible
    expect(screen.getByText('feed.latest')).toBeInTheDocument();
    expect(screen.getByText('feed.popular')).toBeInTheDocument();
  });

  test('loads more posts', async () => {
    // Create 10 posts to trigger hasMorePosts = true
    const manyPosts = Array(10).fill(null).map((_, i) => ({
      ...mockPosts[0],
      postId: i + 1,
      content: `Post ${i + 1}`
    }));

    (PostsApi.list as any).mockResolvedValue(manyPosts);

    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('feed.loading')).not.toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByText('feed.loadMore');
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(PostsApi.list).toHaveBeenCalledTimes(2);
    });
  });

  test('search functionality', async () => {
    (PostsApi.list as any).mockResolvedValue(mockPosts);
    (SearchApi.searchPostsSemantic as any).mockResolvedValue([mockPosts[0]]);

    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('feed.loading')).not.toBeInTheDocument();
    });

    const searchBtn = screen.getByText('search.button');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(SearchApi.searchPostsSemantic).toHaveBeenCalled();
    });

    // Verify search results are displayed
    expect(screen.getByTestId('post-card-1')).toBeInTheDocument();
    // Should show clear button
    expect(screen.getByText('search.clear')).toBeInTheDocument();
  });
});
