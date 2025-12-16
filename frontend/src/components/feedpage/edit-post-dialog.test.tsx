import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import EditPostDialog from './edit-post-dialog';
import { PostsApi } from '@/lib/api/posts';
import type { PostItem } from '@/lib/api/schemas/posts';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'post.edit.button': 'Edit post',
        'post.edit.title': 'Edit Post',
        'post.edit.currentImage': 'Current image will be kept if not replaced',
        'post.edit.newImage': 'Upload new image (optional)',
        'post.edit.saving': 'Saving...',
        'post.edit.save': 'Save Changes',
        'feed.createPost.content.label': 'Content',
        'feed.createPost.content.placeholder': 'What\'s on your mind?',
        'feed.createPost.image.selected': 'Selected',
        'common.cancel': 'Cancel',
      };
      return translations[key] || defaultValue || key;
    },
  }),
}));

// Mock PostsApi
vi.mock('@/lib/api/posts', () => ({
  PostsApi: {
    edit: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  XIcon: () => <div data-testid="x-icon">X</div>,
}));

const mockPost: PostItem = {
  postId: 1,
  content: 'Original post content',
  username: 'testuser',
  createdAt: '2025-01-15T10:00:00Z',
  likeCount: 5,
  commentCount: 3,
  isLiked: false,
  photoUrl: 'https://example.com/photo.jpg',
  hashtags: ['test'],
};

describe('EditPostDialog', () => {
  const mockOnPostUpdated = vi.fn();
  const currentUsername = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog Trigger', () => {
    test('renders edit button', () => {
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      expect(screen.getByRole('button', { name: /edit post/i })).toBeInTheDocument();
    });

    test('opens dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      expect(screen.getByText('Edit Post')).toBeInTheDocument();
    });
  });

  describe('Dialog Content', () => {
    test('displays post content in textarea', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Original post content');
    });

    test('displays current image indicator when post has photo', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      expect(screen.getByText(/current image will be kept/i)).toBeInTheDocument();
    });

    test('does not display current image indicator when post has no photo', async () => {
      const user = userEvent.setup();
      const postWithoutPhoto = { ...mockPost, photoUrl: undefined };
      
      render(
        <EditPostDialog
          post={postWithoutPhoto}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      expect(screen.queryByText(/current image will be kept/i)).not.toBeInTheDocument();
    });

    test('displays file input for new image upload', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const fileInput = screen.getByLabelText(/upload new image/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    test('displays cancel and save buttons', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Content Editing', () => {
    test('allows editing content', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i);
      await user.clear(textarea);
      await user.type(textarea, 'Updated content');

      expect(textarea).toHaveValue('Updated content');
    });

    test('disables save button when content is empty', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i);
      await user.clear(textarea);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    test('disables save button when content is only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i);
      await user.clear(textarea);
      await user.type(textarea, '   ');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    test('enables save button when content is valid', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeEnabled();
    });
  });

  describe('Image Upload', () => {
    test('displays selected file name', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload new image/i);
      await user.upload(fileInput, file);

      expect(screen.getByText(/selected.*test\.jpg/i)).toBeInTheDocument();
    });

    test('handles file selection', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload new image/i);
      await user.upload(fileInput, file);

      expect(screen.getByText(/photo\.png/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('submits updated content', async () => {
      const user = userEvent.setup();
      const updatedPostResponse = { ...mockPost, content: 'Updated content' };
      vi.mocked(PostsApi.edit).mockResolvedValue(updatedPostResponse);

      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i);
      await user.clear(textarea);
      await user.type(textarea, 'Updated content');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(PostsApi.edit).toHaveBeenCalledWith(1, {
          content: 'Updated content',
          username: currentUsername,
          photoFile: undefined,
        });
      });
    });

    test('submits with new image', async () => {
      const user = userEvent.setup();
      const updatedPostResponse = { ...mockPost, content: 'Updated content' };
      vi.mocked(PostsApi.edit).mockResolvedValue(updatedPostResponse);

      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i);
      await user.clear(textarea);
      await user.type(textarea, 'Updated content');

      const file = new File(['test'], 'new-photo.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload new image/i);
      await user.upload(fileInput, file);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(PostsApi.edit).toHaveBeenCalledWith(1, {
          content: 'Updated content',
          username: currentUsername,
          photoFile: file,
        });
      });
    });

    test('calls onPostUpdated after successful submission', async () => {
      const user = userEvent.setup();
      const updatedPostResponse = { ...mockPost, content: 'Updated content' };
      vi.mocked(PostsApi.edit).mockResolvedValue(updatedPostResponse);

      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i);
      await user.clear(textarea);
      await user.type(textarea, 'Updated content');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnPostUpdated).toHaveBeenCalledWith({
          ...mockPost,
          ...updatedPostResponse,
        });
      });
    });

    test('closes dialog after successful submission', async () => {
      const user = userEvent.setup();
      const updatedPostResponse = { ...mockPost, content: 'Updated content' };
      vi.mocked(PostsApi.edit).mockResolvedValue(updatedPostResponse);

      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Post')).not.toBeInTheDocument();
      });
    });

    test('displays loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(PostsApi.edit).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    test('handles submission error gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(PostsApi.edit).mockRejectedValue(new Error('Network error'));

      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    test('prevents submission when loading', async () => {
      const user = userEvent.setup();
      vi.mocked(PostsApi.edit).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);
      await user.click(saveButton); // Try to submit again

      expect(PostsApi.edit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dialog Interactions', () => {
    test('closes dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Post')).not.toBeInTheDocument();
      });
    });

    test('resets form when dialog is reopened', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i);
      await user.clear(textarea);
      await user.type(textarea, 'Modified content');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await user.click(editButton);

      const textareaReopened = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
      expect(textareaReopened.value).toBe('Original post content');
    });

    test('resets file selection when dialog is reopened', async () => {
      const user = userEvent.setup();
      render(
        <EditPostDialog
          post={mockPost}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload new image/i);
      await user.upload(fileInput, file);

      expect(screen.getByText(/test\.jpg/i)).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await user.click(editButton);

      expect(screen.queryByText(/test\.jpg/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles post with empty content', async () => {
      const user = userEvent.setup();
      const postWithEmptyContent = { ...mockPost, content: '' };
      
      render(
        <EditPostDialog
          post={postWithEmptyContent}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    test('handles long content', async () => {
      const user = userEvent.setup();
      const longContent = 'a'.repeat(1000);
      const postWithLongContent = { ...mockPost, content: longContent };
      
      render(
        <EditPostDialog
          post={postWithLongContent}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe(longContent);
    });

    test('handles special characters in content', async () => {
      const user = userEvent.setup();
      const specialContent = '<script>alert("xss")</script>';
      const postWithSpecialContent = { ...mockPost, content: specialContent };
      
      render(
        <EditPostDialog
          post={postWithSpecialContent}
          onPostUpdated={mockOnPostUpdated}
          currentUsername={currentUsername}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit post/i });
      await user.click(editButton);

      const textarea = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialContent);
    });
  });
});
