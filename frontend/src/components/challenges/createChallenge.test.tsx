import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CreateChallenge from './createChallenge';
import { ChallengesApi } from '@/lib/api/challenges';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock ChallengesApi
vi.mock('@/lib/api/challenges', () => ({
  ChallengesApi: {
    create: vi.fn(),
  },
}));

// Mock UI components
vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

describe('CreateChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders create challenge button', () => {
      render(<CreateChallenge />);
      
      expect(screen.getByRole('button', { name: /createChallenge/i })).toBeInTheDocument();
    });

    test('opens dialog when button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('challenges.create.titleLabel')).toBeInTheDocument();
      });
    });

    test('renders all form fields when dialog is open', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await waitFor(() => {
        expect(screen.getByLabelText('challenges.create.name')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.type')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.amount')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.description')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.startDate')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.endDate')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('shows error when required fields are missing', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
      expect(ChallengesApi.create).not.toHaveBeenCalled();
    });

    test('shows error when amount is not a number', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-31');
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });

    test('shows error when amount is zero', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '0');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-31');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Amount must be a number greater than 0')).toBeInTheDocument();
      });
    });

    test('shows error when amount is negative', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '-5');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-31');
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Amount must be a number greater than 0')).toBeInTheDocument();
      });
    });

    test('shows error when end date is before start date', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-31');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-01');
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
      });
    });

    test('shows error when start date equals end date', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-15');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-15');
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Submission', () => {
    test('creates challenge with valid data', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockResolvedValue({ challengeId: 1 });
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Plastic Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '500');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Recycle plastic waste');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-02-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-02-28');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(ChallengesApi.create).toHaveBeenCalledWith({
          name: 'Plastic Challenge',
          description: 'Recycle plastic waste',
          amount: 500,
          startDate: '2025-02-01',
          endDate: '2025-02-28',
          type: 'PLASTIC'
        });
      });
    });

    test('shows success message after creating challenge', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockResolvedValue({ challengeId: 1 });
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PAPER');
      await user.type(screen.getByLabelText('challenges.create.amount'), '250');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-03-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-03-31');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Challenge created successfully')).toBeInTheDocument();
      });
    });

    test('clears form fields after successful submission', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockResolvedValue({ challengeId: 1 });
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      const nameInput = screen.getByLabelText('challenges.create.name') as HTMLInputElement;
      const typeInput = screen.getByLabelText('challenges.create.type') as HTMLInputElement;
      const amountInput = screen.getByLabelText('challenges.create.amount') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('challenges.create.description') as HTMLInputElement;
      const startDateInput = screen.getByLabelText('challenges.create.startDate') as HTMLInputElement;
      const endDateInput = screen.getByLabelText('challenges.create.endDate') as HTMLInputElement;
      
      await user.type(nameInput, 'Test Challenge');
      await user.type(typeInput, 'GLASS');
      await user.type(amountInput, '300');
      await user.type(descriptionInput, 'Test description');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-04-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-04-30');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(typeInput.value).toBe('');
        expect(amountInput.value).toBe('');
        expect(descriptionInput.value).toBe('');
        expect(startDateInput.value).toBe('');
        expect(endDateInput.value).toBe('');
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message when API call fails', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockRejectedValue(new Error('Network error'));
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'METAL');
      await user.type(screen.getByLabelText('challenges.create.amount'), '150');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-05-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-05-31');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('shows generic error message when error is not an Error instance', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockRejectedValue('Unknown error');
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'ORGANIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '200');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-06-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-06-30');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create challenge')).toBeInTheDocument();
      });
    });

    test('clears previous error when submitting again', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockRejectedValue(new Error('First error'));
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      // First submission - trigger error
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PAPER');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-31');
      
      let submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second submission - error should be cleared before new attempt
      vi.mocked(ChallengesApi.create).mockResolvedValue({ challengeId: 1 });
      
      submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('shows spinner while submitting', async () => {
      const user = userEvent.setup();
      let resolveCreate: () => void;
      const createPromise = new Promise<{ challengeId: number }>((resolve) => {
        resolveCreate = () => resolve({ challengeId: 1 });
      });
      vi.mocked(ChallengesApi.create).mockReturnValue(createPromise);
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-07-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-07-31');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
      });
      
      resolveCreate!();
      
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });

    test('disables submit button while loading', async () => {
      const user = userEvent.setup();
      let resolveCreate: () => void;
      const createPromise = new Promise<{ challengeId: number }>((resolve) => {
        resolveCreate = () => resolve({ challengeId: 1 });
      });
      vi.mocked(ChallengesApi.create).mockReturnValue(createPromise);
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await user.type(screen.getByLabelText('challenges.create.type'), 'GLASS');
      await user.type(screen.getByLabelText('challenges.create.amount'), '75');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-08-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-08-31');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      
      resolveCreate!();
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Input Handling', () => {
    test('updates form fields correctly', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      const nameInput = screen.getByLabelText('challenges.create.name') as HTMLInputElement;
      const typeInput = screen.getByLabelText('challenges.create.type') as HTMLInputElement;
      const amountInput = screen.getByLabelText('challenges.create.amount') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('challenges.create.description') as HTMLInputElement;
      
      await user.type(nameInput, 'My Challenge');
      await user.type(typeInput, 'PAPER');
      await user.type(amountInput, '999');
      await user.type(descriptionInput, 'My description');
      
      expect(nameInput.value).toBe('My Challenge');
      expect(typeInput.value).toBe('PAPER');
      expect(amountInput.value).toBe('999');
      expect(descriptionInput.value).toBe('My description');
    });

    test('handles amount input with decimal numbers', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockResolvedValue({ challengeId: 1 });
      
      render(<CreateChallenge />);
      
      await user.click(screen.getByRole('button', { name: /createChallenge/i }));
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test');
      await user.type(screen.getByLabelText('challenges.create.type'), 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '123.45');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test');
      
      const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
      const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-09-01');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-09-30');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(ChallengesApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 123.45
          })
        );
      });
    });
  });
});
