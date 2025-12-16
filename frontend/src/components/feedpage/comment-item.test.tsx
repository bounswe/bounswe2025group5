import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import CommentItem from './comment-item';
import { CommentsApi, type Comment } from '@/lib/api/comments';
import { ReportsApi } from '@/lib/api/reports';
import { toast } from 'sonner';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'comment.timeAgo.seconds': `${options?.count} seconds ago`,
        'comment.timeAgo.minutes': `${options?.count} minutes ago`,
        'comment.timeAgo.hours': `${options?.count} hours ago`,
        'comment.timeAgo.days': `${options?.count} days ago`,
        'comment.save': 'Save',
        'comment.cancel': 'Cancel',
        'comment.edit': 'Edit comment',
        'comment.delete': 'Delete comment',
        'comment.deleteDialog.title': 'Delete Comment',
        'comment.deleteDialog.description': 'Are you sure you want to delete this comment?',
        'comment.deleteDialog.cancel': 'Cancel',
        'comment.deleteDialog.confirm': 'Delete',
        'comment.deleteDialog.deleting': 'Deleting...',
        'reports.titleComment': 'Report comment',
        'reports.description': 'Help us keep the community safe',
        'reports.typeLabel': 'Report type',
        'reports.reasonLabel': 'Reason',
        'reports.reasonPlaceholder': 'Describe the issue...',
        'reports.missingReason': 'Please provide a short explanation.',
        'reports.submit': 'Submit report',
        'reports.submitting': 'Submitting...',
        'reports.success': 'Report submitted. Thank you!',
        'reports.error': 'Failed to submit report',
        'reports.loginRequired': 'Sign in to report content',
        'common.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock assets
vi.mock('@/assets/user.png', () => ({
  default: 'user-avatar.png',
}));

// Mock CommentsApi
vi.mock('@/lib/api/comments', () => ({
  CommentsApi: {
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock ReportsApi
vi.mock('@/lib/api/reports', () => ({
  ReportsApi: {
    create: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useProfilePhoto hook
vi.mock('@/hooks/useProfilePhotos', () => ({
  useProfilePhoto: () => ({ photoUrl: null }),
}));

// Mock ReportAlarmButton
vi.mock('@/components/common/ReportAlarmButton', () => ({
  default: ({ onClick, 'aria-label': ariaLabel }: any) => (
    <button onClick={onClick} aria-label={ariaLabel}>Report</button>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
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

const mockComment: Comment = {
  commentId: 1,
  content: 'Test comment content',
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  creatorUsername: 'testuser',
  username: 'testuser',
};

describe('CommentItem', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('username', 'testuser');
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders comment content correctly', () => {
      render(<CommentItem comment={mockComment} />);
      expect(screen.getByText('Test comment content')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('displays time ago correctly', () => {
      render(<CommentItem comment={mockComment} />);
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    test('renders avatar with username initial', () => {
      render(<CommentItem comment={mockComment} />);
      const fallback = screen.getByText('T');
      expect(fallback).toBeInTheDocument();
    });

    test('shows edit and delete buttons for own comments', () => {
      render(<CommentItem comment={mockComment} />);
      expect(screen.getByRole('button', { name: /edit comment/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete comment/i })).toBeInTheDocument();
    });

    test('hides edit and delete buttons for other users comments', () => {
      const otherComment = { ...mockComment, creatorUsername: 'otheruser', username: 'otheruser' };
      render(<CommentItem comment={otherComment} />);
      expect(screen.queryByRole('button', { name: /edit comment/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete comment/i })).not.toBeInTheDocument();
    });

    test('shows report button for all comments', () => {
      render(<CommentItem comment={mockComment} />);
      expect(screen.getByRole('button', { name: /report comment/i })).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    test('displays seconds for very recent comments', () => {
      const recentComment = {
        ...mockComment,
        createdAt: new Date(Date.now() - 30 * 1000).toISOString(),
      };
      render(<CommentItem comment={recentComment} />);
      expect(screen.getByText('30 seconds ago')).toBeInTheDocument();
    });

    test('displays minutes for comments under an hour', () => {
      const minutesComment = {
        ...mockComment,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      };
      render(<CommentItem comment={minutesComment} />);
      expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
    });

    test('displays days for old comments', () => {
      const oldComment = {
        ...mockComment,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
      render(<CommentItem comment={oldComment} />);
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });
  });

  describe('Edit Functionality', () => {
    test('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const editButton = screen.getByRole('button', { name: /edit comment/i });
      await user.click(editButton);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('allows editing comment content', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const editButton = screen.getByRole('button', { name: /edit comment/i });
      await user.click(editButton);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Updated comment content');

      expect(input).toHaveValue('Updated comment content');
    });

    test('cancels edit when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const editButton = screen.getByRole('button', { name: /edit comment/i });
      await user.click(editButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Test comment content')).toBeInTheDocument();
    });

    test('saves edited comment when save button is clicked', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const updatedComment = { ...mockComment, content: 'Updated comment' };
      vi.mocked(CommentsApi.update).mockResolvedValue(updatedComment);

      render(<CommentItem comment={mockComment} onUpdate={onUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit comment/i });
      await user.click(editButton);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Updated comment');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(CommentsApi.update).toHaveBeenCalledWith(1, {
          content: 'Updated comment',
          username: 'testuser',
        });
        expect(onUpdate).toHaveBeenCalledWith(updatedComment);
      });
    });

    test('disables save button when content is unchanged', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const editButton = screen.getByRole('button', { name: /edit comment/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    test('disables save button when content is empty', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const editButton = screen.getByRole('button', { name: /edit comment/i });
      await user.click(editButton);

      const input = screen.getByRole('textbox');
      await user.clear(input);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Delete Functionality', () => {
    test('opens delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole('button', { name: /delete comment/i });
      await user.click(deleteButton);

      expect(screen.getByText('Delete Comment')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this comment?')).toBeInTheDocument();
    });

    test('closes dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole('button', { name: /delete comment/i });
      await user.click(deleteButton);

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Comment')).not.toBeInTheDocument();
      });
    });

    test('deletes comment when confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      vi.mocked(CommentsApi.remove).mockResolvedValue({});

      render(<CommentItem comment={mockComment} onDelete={onDelete} />);

      const deleteButton = screen.getByRole('button', { name: /delete comment/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(CommentsApi.remove).toHaveBeenCalledWith(1);
        expect(onDelete).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Report Functionality', () => {
    test('opens report dialog when report button is clicked', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const reportButton = screen.getByRole('button', { name: /report comment/i });
      await user.click(reportButton);

      expect(screen.getByText('Report comment')).toBeInTheDocument();
      expect(screen.getByText('Help us keep the community safe')).toBeInTheDocument();
    });

    test('shows error toast when not logged in', async () => {
      const user = userEvent.setup();
      localStorageMock.clear();
      render(<CommentItem comment={mockComment} />);

      const reportButton = screen.getByRole('button', { name: /report comment/i });
      await user.click(reportButton);

      expect(toast.error).toHaveBeenCalledWith('Sign in to report content');
    });

    test('submits report with reason', async () => {
      const user = userEvent.setup();
      vi.mocked(ReportsApi.create).mockResolvedValue({} as any);

      render(<CommentItem comment={mockComment} />);

      const reportButton = screen.getByRole('button', { name: /report comment/i });
      await user.click(reportButton);

      const reasonTextarea = screen.getByPlaceholderText('Describe the issue...');
      await user.type(reasonTextarea, 'This is spam');

      const submitButton = screen.getByRole('button', { name: /submit report/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(ReportsApi.create).toHaveBeenCalledWith({
          reporterName: 'testuser',
          description: 'This is spam',
          type: 'SPAM',
          contentType: 'COMMENT',
          objectId: 1,
        });
        expect(toast.success).toHaveBeenCalledWith('Report submitted. Thank you!');
      });
    });

    test('shows error when report reason is missing', async () => {
      const user = userEvent.setup();
      render(<CommentItem comment={mockComment} />);

      const reportButton = screen.getByRole('button', { name: /report comment/i });
      await user.click(reportButton);

      const submitButton = screen.getByRole('button', { name: /submit report/i });
      await user.click(submitButton);

      expect(screen.getByText('Please provide a short explanation.')).toBeInTheDocument();
    });
  });

  describe('Username Click', () => {
    test('calls onUsernameClick when username is clicked', async () => {
      const user = userEvent.setup();
      const onUsernameClick = vi.fn();

      render(<CommentItem comment={mockComment} onUsernameClick={onUsernameClick} />);

      const usernameLink = screen.getByRole('link', { name: /profile\.userLabel/i });
      await user.click(usernameLink);

      expect(onUsernameClick).toHaveBeenCalledWith('testuser');
    });

    test('handles keyboard interaction for username', async () => {
      const user = userEvent.setup();
      const onUsernameClick = vi.fn();
      
      render(<CommentItem comment={mockComment} onUsernameClick={onUsernameClick} />);

      const usernameLink = screen.getByRole('link', { name: /profile\.userLabel/i });
      usernameLink.focus();
      await user.keyboard('{Enter}');

      expect(onUsernameClick).toHaveBeenCalledWith('testuser');
    });
  });

  describe('Edge Cases', () => {
    test('handles comment without createdAt', () => {
      const commentWithoutDate = { ...mockComment, createdAt: undefined };
      render(<CommentItem comment={commentWithoutDate} />);
      expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
    });

    test('handles comment without commentId', () => {
      const commentWithoutId = { ...mockComment, commentId: undefined };
      render(<CommentItem comment={commentWithoutId} />);
      expect(screen.getByText('Test comment content')).toBeInTheDocument();
    });

    test('uses username fallback when creatorUsername is missing', () => {
      const commentWithUsername = { ...mockComment, creatorUsername: undefined, username: 'fallbackuser' };
      render(<CommentItem comment={commentWithUsername} />);
      expect(screen.getByText('fallbackuser')).toBeInTheDocument();
    });
  });
});
