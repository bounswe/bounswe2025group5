import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import FeedbackButton from './feedback-button';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'feedback.buttonLabel': 'Send Feedback',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock child components
vi.mock('./feedback-dialog', () => ({
  default: ({ open, onOpenChange }: any) =>
    open ? (
      <div data-testid="feedback-dialog">
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MessageSquare: () => <svg data-testid="message-square-icon" />,
}));

describe('FeedbackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders feedback button', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      expect(button).toBeInTheDocument();
    });

    test('renders MessageSquare icon', () => {
      render(<FeedbackButton />);
      
      expect(screen.getByTestId('message-square-icon')).toBeInTheDocument();
    });

    test('has correct aria-label', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      expect(button).toHaveAttribute('aria-label', 'Send Feedback');
    });

    test('has correct title attribute', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      expect(button).toHaveAttribute('title', 'Send Feedback');
    });
  });

  describe('Positioning and Styling', () => {
    test('has fixed positioning classes', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      expect(button).toHaveClass('fixed', 'bottom-6', 'left-6');
    });

    test('has z-index for proper layering', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      expect(button).toHaveClass('z-50');
    });

    test('has rounded-full class for circular shape', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      expect(button).toHaveClass('rounded-full');
    });

    test('applies custom className when provided', () => {
      render(<FeedbackButton className="custom-class" />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Dialog Interaction', () => {
    test('does not show dialog initially', () => {
      render(<FeedbackButton />);
      
      expect(screen.queryByTestId('feedback-dialog')).not.toBeInTheDocument();
    });

    test('opens dialog when button is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      await user.click(button);
      
      expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
    });

    test('closes dialog when onOpenChange is called with false', async () => {
      const user = userEvent.setup();
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      await user.click(button);
      
      expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('feedback-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('button is focusable', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button', { name: 'Send Feedback' });
      button.focus();
      expect(button).toHaveFocus();
    });

    test('button has accessible name', () => {
      render(<FeedbackButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Send Feedback');
    });
  });
});
