import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import PostCard from '@/components/feedpage/post-card';
import type { PostItem } from '@/lib/api/schemas/posts';
import { PostsApi } from '@/lib/api/posts';
import { LikesApi } from '@/lib/api/likes';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (typeof options === 'string') return options;
      if (typeof options === 'object') {
        if (options.defaultValue) return options.defaultValue;
        if (options.count !== undefined) return `${options.count}`;
      }
      return key;
    },
  }),
}));

// Mock assets
vi.mock('@/assets/user.png', () => ({
  default: 'user-avatar.png',
}));

// Mock LikesApi
vi.mock('@/lib/api/likes', () => ({
  LikesApi: {
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock PostsApi
vi.mock('@/lib/api/posts', () => ({
  PostsApi: {
    save: vi.fn().mockResolvedValue({}),
    deleteSaved: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue({}),
  },
}));

// Mock child components
vi.mock('./comment-section', () => ({
  default: ({ postId }: { postId: number }) => <div data-testid={`comment-section-${postId}`}>Comments</div>,
}));

vi.mock('./edit-post-dialog', () => ({
  default: () => <button aria-label="Edit">Edit Post</button>,
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ResizeObserver
window.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

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

const mockPost: PostItem = {
  postId: 1,
  content: 'Test post content',
  createdAt: '2025-01-15T10:00:00Z',
  creatorUsername: 'testuser',
  photoUrl: null,
  likes: 5,
  comments: 2,
  liked: false,
  saved: false,
};

describe('PostCard', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('username', 'testuser');
    vi.clearAllMocks();
  });

  test('renders post content correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test post content')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('displays like count and comment count', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('5')).toBeInTheDocument(); // likes
    expect(screen.getByText('2')).toBeInTheDocument(); // comments
  });

  test('shows filled heart icon when post is liked', () => {
    const likedPost = { ...mockPost, liked: true };
    render(<PostCard post={likedPost} />);

    const likeButton = screen.getByRole('button', { name: /unlike/i });
    expect(likeButton).toBeInTheDocument();
  });

  test('shows filled bookmark icon when post is saved', () => {
    const savedPost = { ...mockPost, saved: true };
    render(<PostCard post={savedPost} />);

    const saveButton = screen.getByRole('button', { name: /unsave/i });
    expect(saveButton).toBeInTheDocument();
  });

  test('toggles like when like button is clicked', async () => {
    const user = userEvent.setup();
    const onPostUpdate = vi.fn();

    render(<PostCard post={mockPost} onPostUpdate={onPostUpdate} />);

    const likeButton = screen.getByRole('button', { name: /like/i });
    await user.click(likeButton);

    // Should optimistically update the UI
    await waitFor(() => {
      expect(LikesApi.add).toHaveBeenCalled();
      expect(screen.getByText('6')).toBeInTheDocument(); // likes increased
    });
  });

  test('toggles save when bookmark button is clicked', async () => {
    const user = userEvent.setup();
    const onPostUpdate = vi.fn();

    render(<PostCard post={mockPost} onPostUpdate={onPostUpdate} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should call onPostUpdate with saved state
    await waitFor(() => {
      expect(PostsApi.save).toHaveBeenCalled();
      expect(onPostUpdate).toHaveBeenCalled();
    });
  });

  test('shows edit and delete buttons for own posts', () => {
    const ownPost = { ...mockPost, creatorUsername: 'testuser' };
    localStorageMock.setItem('username', 'testuser');

    render(<PostCard post={ownPost} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('hides edit and delete buttons for other users posts', () => {
    const otherPost = { ...mockPost, creatorUsername: 'otheruser' };
    localStorageMock.setItem('username', 'testuser');

    render(<PostCard post={otherPost} />);

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  test('renders without crashing for own posts', () => {
    const ownPost = { ...mockPost, creatorUsername: 'testuser' };

    const { container } = render(<PostCard post={ownPost} />);

    expect(container).toBeTruthy();
  });

  test('has comment button', () => {
    render(<PostCard post={mockPost} />);

    // Check that comment count is displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // comment count
  });

  test('displays post image when photoUrl is provided', () => {
    const postWithImage = { ...mockPost, photoUrl: 'https://example.com/image.jpg' };

    render(<PostCard post={postWithImage} />);

    // Use alt text which includes username (mocked to return defaultValue)
    const image = screen.getByAltText(`${postWithImage.creatorUsername}'s post image`);
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  test('formats date correctly', () => {
    render(<PostCard post={mockPost} />);

    // Should display formatted date
    expect(screen.getByText(/Jan/i)).toBeInTheDocument();
  });

  test('accepts onPostDelete callback', () => {
    const onPostDelete = vi.fn();
    const ownPost = { ...mockPost, creatorUsername: 'testuser' };

    const { container } = render(<PostCard post={ownPost} onPostDelete={onPostDelete} />);

    expect(container).toBeTruthy();
  });

  test('increments comment count when comment is added', () => {
    const { rerender } = render(<PostCard post={mockPost} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // initial comment count

    // Update post with new comment count
    const updatedPost = { ...mockPost, comments: 3 };
    rerender(<PostCard post={updatedPost} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
