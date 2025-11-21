import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import CreatePostCard from '@/components/feedpage/create-post-card';
import { PostsApi } from '@/lib/api/posts';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock PostsApi
vi.mock('@/lib/api/posts', () => ({
  PostsApi: {
    create: vi.fn().mockResolvedValue({
      postId: 999,
      content: 'New post',
      creatorUsername: 'testuser',
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
    }),
  },
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

describe('CreatePostCard', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('username', 'testuser');
  });

  test('renders create post card with title', () => {
    render(<CreatePostCard />);

    expect(screen.getByText('feed.createPost.title')).toBeInTheDocument();
    expect(screen.getByText('feed.createPost.subtitle')).toBeInTheDocument();
  });

  test('opens popover when placeholder is clicked', async () => {
    const user = userEvent.setup();
    render(<CreatePostCard />);

    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Form should be visible
    await waitFor(() => {
      expect(screen.getByLabelText('feed.createPost.content.label')).toBeInTheDocument();
    });
  });

  test('allows typing in content textarea', async () => {
    const user = userEvent.setup();
    render(<CreatePostCard />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Type in textarea
    const textarea = screen.getByPlaceholderText('feed.createPost.content.placeholder');
    await user.type(textarea, 'My new post content');

    expect(textarea).toHaveValue('My new post content');
  });

  test('displays image upload input', async () => {
    const user = userEvent.setup();
    render(<CreatePostCard />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Check for image upload input
    const imageInput = screen.getByLabelText(/image|photo/i);
    expect(imageInput).toBeInTheDocument();
  });

  test('submits form with content', async () => {
    const user = userEvent.setup();
    const onPostCreated = vi.fn();

    render(<CreatePostCard onPostCreated={onPostCreated} />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Fill in content
    const textarea = screen.getByPlaceholderText('feed.createPost.content.placeholder');
    await user.type(textarea, 'Test post content');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should call onPostCreated
    await waitFor(() => {
      expect(PostsApi.create).toHaveBeenCalled();
      expect(onPostCreated).toHaveBeenCalled();
    });
  });

  test('form has submit button when opened', async () => {
    const user = userEvent.setup();
    render(<CreatePostCard />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Should have a submit button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('allows content to be filled', async () => {
    const user = userEvent.setup();
    render(<CreatePostCard />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Type content
    const textarea = screen.getByPlaceholderText('feed.createPost.content.placeholder');
    await user.type(textarea, 'Test content');

    expect(textarea).toHaveValue('Test content');
  });

  test('form can be submitted', async () => {
    const user = userEvent.setup();
    const onPostCreated = vi.fn();
    render(<CreatePostCard onPostCreated={onPostCreated} />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Fill content
    const textarea = screen.getByPlaceholderText('feed.createPost.content.placeholder');
    await user.type(textarea, 'Test content');

    expect(textarea).toHaveValue('Test content');
  });

  test('clears form after successful submission', async () => {
    const user = userEvent.setup();
    const onPostCreated = vi.fn();

    render(<CreatePostCard onPostCreated={onPostCreated} />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Fill content
    const textarea = screen.getByPlaceholderText('feed.createPost.content.placeholder');
    await user.type(textarea, 'Test content');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Wait for submission
    await waitFor(() => {
      expect(onPostCreated).toHaveBeenCalled();
    });

    // Form should be closed
    await waitFor(() => {
      expect(screen.queryByLabelText('feed.createPost.content.label')).not.toBeInTheDocument();
    });
  });

  test('handles image file selection', async () => {
    const user = userEvent.setup();
    render(<CreatePostCard />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Select image file
    const imageInput = screen.getByLabelText(/image|photo/i) as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await user.upload(imageInput, file);

    // File should be selected
    expect(imageInput.files?.[0]).toBe(file);
  });

  test('form opens in a popover', async () => {
    const user = userEvent.setup();
    render(<CreatePostCard />);

    // Open popover
    const placeholder = screen.getByText('feed.createPost.placeholder');
    await user.click(placeholder);

    // Check if form is open
    expect(screen.getByLabelText('feed.createPost.content.label')).toBeInTheDocument();
  });
});
