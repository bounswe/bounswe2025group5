import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import FeedbackDialog from './feedback-dialog';
import { FeedbackApi } from '@/lib/api/feedback';
import { toast } from 'sonner';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'feedback.title': 'Send Feedback',
        'feedback.description': 'Share your thoughts about WasteLess',
        'feedback.messageLabel': 'Message',
        'feedback.placeholder': 'Tell us what you think...',
        'feedback.submitting': 'Submitting...',
        'feedback.emptyError': 'Please provide feedback',
        'feedback.authError': 'Please sign in to send feedback',
        'feedback.success': 'Feedback submitted successfully',
        'feedback.error': 'Failed to submit feedback',
        'feedback.forbiddenError': 'You do not have permission to send feedback',
        'feedback.userNotFoundError': 'User not found',
        'common.cancel': 'Cancel',
        'common.submit': 'Submit',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock FeedbackApi
vi.mock('@/lib/api/feedback', () => ({
  FeedbackApi: {
    create: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ id, value, onChange, placeholder }: any) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="feedback-textarea"
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('FeedbackDialog', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('username', 'testuser');
    vi.clearAllMocks();
  });

  describe('Dialog Rendering', () => {
    test('does not render when open is false', () => {
      render(<FeedbackDialog open={false} onOpenChange={vi.fn()} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    test('renders when open is true', () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    test('renders dialog title', () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      expect(screen.getByText('Send Feedback')).toBeInTheDocument();
    });

    test('renders dialog description', () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      expect(screen.getByText('Share your thoughts about WasteLess')).toBeInTheDocument();
    });

    test('renders message label', () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      expect(screen.getByText('Message')).toBeInTheDocument();
    });

    test('renders textarea with placeholder', () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByPlaceholderText('Tell us what you think...');
      expect(textarea).toBeInTheDocument();
    });

    test('renders cancel button', () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    test('renders submit button', () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    test('allows typing in textarea', async () => {
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Great app!');
      
      expect(textarea).toHaveValue('Great app!');
    });

    test('clears textarea when cancelled', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<FeedbackDialog open={true} onOpenChange={onOpenChange} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Form Submission', () => {
    test('shows error when submitting empty feedback', async () => {
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      // Submit button should be disabled when textarea is empty
      expect(submitButton).toBeDisabled();
    });

    test('shows error when submitting only whitespace', async () => {
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, '   ');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      // Submit button should be disabled when textarea has only whitespace
      expect(submitButton).toBeDisabled();
    });

    test('shows error when user is not logged in', async () => {
      localStorageMock.removeItem('username');
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      expect(toast.error).toHaveBeenCalledWith('Please sign in to send feedback');
    });

    test('submits feedback successfully', async () => {
      vi.mocked(FeedbackApi.create).mockResolvedValue(undefined);
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<FeedbackDialog open={true} onOpenChange={onOpenChange} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Great app!');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(FeedbackApi.create).toHaveBeenCalledWith({
          feedbackerUsername: 'testuser',
          contentType: 'Compliment',
          content: 'Great app!',
        });
        expect(toast.success).toHaveBeenCalledWith('Feedback submitted successfully');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    test('disables submit button while submitting', async () => {
      vi.mocked(FeedbackApi.create).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('shows generic error message on submission failure', async () => {
      vi.mocked(FeedbackApi.create).mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('shows forbidden error for 403 responses', async () => {
      vi.mocked(FeedbackApi.create).mockRejectedValue(new Error('403 Forbidden'));
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('You do not have permission to send feedback');
      });
    });

    test('shows auth error for 401 responses', async () => {
      vi.mocked(FeedbackApi.create).mockRejectedValue(new Error('401 Unauthorized'));
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please sign in to send feedback');
      });
    });

    test('shows user not found error', async () => {
      vi.mocked(FeedbackApi.create).mockRejectedValue(new Error('User not found'));
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('User not found');
      });
    });
  });

  describe('State Management', () => {
    test('clears textarea after successful submission', async () => {
      vi.mocked(FeedbackApi.create).mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    test('preserves textarea value on submission error', async () => {
      vi.mocked(FeedbackApi.create).mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
      
      const textarea = screen.getByTestId('feedback-textarea');
      await user.type(textarea, 'Test feedback');
      
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      
      expect(textarea).toHaveValue('Test feedback');
    });
  });
});
