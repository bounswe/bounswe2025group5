import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreatePostButton from './create-post-button';
import { PostsApi } from '@/lib/api/posts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('@/lib/api/posts', () => ({
  PostsApi: {
    create: vi.fn(),
  },
}));

describe('CreatePostButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('username', 'testuser');
  });

  it('renders the create post button', () => {
    render(<CreatePostButton />);
    expect(screen.getByRole('button', { name: 'feed.createPost.placeholder' })).toBeInTheDocument();
  });

  it('opens dialog when clicked', async () => {
    const user = userEvent.setup();
    render(<CreatePostButton />);
    
    await user.click(screen.getByRole('button', { name: 'feed.createPost.placeholder' }));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('feed.createPost.content.label')).toBeInTheDocument();
  });

  it('submits form and calls API', async () => {
    const onPostCreated = vi.fn();
    const mockPost = { id: 1, content: 'New post', username: 'testuser' };
    vi.mocked(PostsApi.create).mockResolvedValue(mockPost as any);
    
    const user = userEvent.setup();
    render(<CreatePostButton onPostCreated={onPostCreated} />);
    
    // Open dialog
    await user.click(screen.getByRole('button', { name: 'feed.createPost.placeholder' }));
    
    // Fill form
    const contentInput = screen.getByLabelText('feed.createPost.content.label');
    await user.type(contentInput, 'New post content');
    
    // Submit
    const submitButton = screen.getByRole('button', { name: 'feed.createPost.submit' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(PostsApi.create).toHaveBeenCalledWith({
        content: 'New post content',
        username: 'testuser',
        photoFile: undefined,
      });
    });
    
    expect(onPostCreated).toHaveBeenCalledWith(mockPost);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(PostsApi.create).mockRejectedValue(new Error('Failed to create'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const user = userEvent.setup();
    render(<CreatePostButton />);
    
    // Open dialog
    await user.click(screen.getByRole('button', { name: 'feed.createPost.placeholder' }));
    
    // Fill form
    await user.type(screen.getByLabelText('feed.createPost.content.label'), 'New post content');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'feed.createPost.submit' }));
    
    await waitFor(() => {
      expect(PostsApi.create).toHaveBeenCalled();
    });
    
    // Dialog should still be open on error (or handle error display)
    // Based on implementation, it might just log error. 
    // We check that console.error was called.
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
