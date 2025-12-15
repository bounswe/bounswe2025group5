import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CreateChallenge from './createChallenge';
import { ChallengesApi } from '@/lib/api/challenges';
import { WASTE_TYPE_OPTIONS } from '@/lib/api/schemas/goals';
import type { CreateChallengeResponse } from '@/lib/api/schemas/challenges';

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

const buildCreateResponse = (overrides: Partial<CreateChallengeResponse> = {}): CreateChallengeResponse => ({
  challengeId: 1,
  name: 'Test Challenge',
  amount: 100,
  description: 'Test description',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  type: 'PLASTIC',
  ...overrides,
});

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /createChallenge/i }));
};

const selectType = async (user: ReturnType<typeof userEvent.setup>, type = 'PLASTIC') => {
  await user.click(screen.getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: type }));
};

const fillDates = async (user: ReturnType<typeof userEvent.setup>, start = '2025-01-01', end = '2025-01-31') => {
  const startDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.startDate');
  const endDateInput = screen.getByLabelText<HTMLInputElement>('challenges.create.endDate');
  await user.clear(startDateInput);
  await user.type(startDateInput, start);
  await user.clear(endDateInput);
  await user.type(endDateInput, end);
};

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
      
      await openDialog(user);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('challenges.create.titleLabel')).toBeInTheDocument();
      });
    });

    test('renders all form fields when dialog is open', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await openDialog(user);
      
      await waitFor(() => {
        expect(screen.getByLabelText('challenges.create.name')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.amount')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.description')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.startDate')).toBeInTheDocument();
        expect(screen.getByLabelText('challenges.create.endDate')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });
    });

    test('lists all configured waste types in the select', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);

      await openDialog(user);
      await user.click(screen.getByRole('combobox'));

      WASTE_TYPE_OPTIONS.forEach((type) => {
        expect(screen.getByRole('option', { name: type })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('shows error when required fields are missing', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await openDialog(user);
      
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
      
      await openDialog(user);
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-01-01', '2025-01-31');
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });

    test('shows error when amount is zero', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await openDialog(user);
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '0');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-01-01', '2025-01-31');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Amount must be a number greater than 0')).toBeInTheDocument();
      });
    });

    test('shows error when amount is negative', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await openDialog(user);
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '-5');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-01-01', '2025-01-31');
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Amount must be a number greater than 0')).toBeInTheDocument();
      });
    });

    test('shows error when end date is before start date', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await openDialog(user);
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-01-31', '2025-01-01');
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
      });
    });

    test('shows error when start date equals end date', async () => {
      const user = userEvent.setup();
      render(<CreateChallenge />);
      
      await openDialog(user);
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-01-15', '2025-01-15');
      
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
      vi.mocked(ChallengesApi.create).mockResolvedValue(buildCreateResponse({
        name: 'Plastic Challenge',
        description: 'Recycle plastic waste',
        amount: 500,
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        type: 'PLASTIC',
      }));
      
      render(<CreateChallenge />);
      
      await openDialog(user);
      await user.type(screen.getByLabelText('challenges.create.name'), 'Plastic Challenge');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '500');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Recycle plastic waste');
      await fillDates(user, '2025-02-01', '2025-02-28');
      
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
      vi.mocked(ChallengesApi.create).mockResolvedValue(buildCreateResponse({
        name: 'Test Challenge',
        description: 'Test description',
        amount: 250,
        startDate: '2025-03-01',
        endDate: '2025-03-31',
        type: 'PAPER',
      }));
      
      render(<CreateChallenge />);
      
      await openDialog(user);
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PAPER');
      await user.type(screen.getByLabelText('challenges.create.amount'), '250');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-03-01', '2025-03-31');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Challenge created successfully')).toBeInTheDocument();
      });
    });

    test('clears form fields after successful submission', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockResolvedValue(buildCreateResponse({
        name: 'Test Challenge',
        description: 'Test description',
        amount: 300,
        startDate: '2025-04-01',
        endDate: '2025-04-30',
        type: 'GLASS',
      }));
      
      render(<CreateChallenge />);
      
      await openDialog(user);
      
      const nameInput = screen.getByLabelText('challenges.create.name') as HTMLInputElement;
      const amountInput = screen.getByLabelText('challenges.create.amount') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('challenges.create.description') as HTMLInputElement;
      const startDateInput = screen.getByLabelText('challenges.create.startDate') as HTMLInputElement;
      const endDateInput = screen.getByLabelText('challenges.create.endDate') as HTMLInputElement;
      
      await user.type(nameInput, 'Test Challenge');
      await selectType(user, 'GLASS');
      await user.type(amountInput, '300');
      await user.type(descriptionInput, 'Test description');
      await fillDates(user, '2025-04-01', '2025-04-30');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(screen.getByRole('combobox')).toHaveTextContent('challenges.create.typePlaceholder');
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
      
      await openDialog(user);
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'METAL');
      await user.type(screen.getByLabelText('challenges.create.amount'), '150');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-05-01', '2025-05-31');
      
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
      
      await openDialog(user);
      
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'ORGANIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '200');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-06-01', '2025-06-30');
      
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
      
      await openDialog(user);
      
      // First submission - trigger error
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PAPER');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test');
      await fillDates(user, '2025-01-01', '2025-01-31');
      
      let submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second submission - error should be cleared before new attempt
      vi.mocked(ChallengesApi.create).mockResolvedValue(buildCreateResponse());
      
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
      const createPromise = new Promise<CreateChallengeResponse>((resolve) => {
        resolveCreate = () => resolve(buildCreateResponse());
      });
      vi.mocked(ChallengesApi.create).mockReturnValue(createPromise);
      
      render(<CreateChallenge />);
      
      await openDialog(user);
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '100');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-07-01', '2025-07-31');
      
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
      const createPromise = new Promise<CreateChallengeResponse>((resolve) => {
        resolveCreate = () => resolve(buildCreateResponse());
      });
      vi.mocked(ChallengesApi.create).mockReturnValue(createPromise);
      
      render(<CreateChallenge />);
      
      await openDialog(user);
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test Challenge');
      await selectType(user, 'GLASS');
      await user.type(screen.getByLabelText('challenges.create.amount'), '75');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test description');
      await fillDates(user, '2025-08-01', '2025-08-31');
      
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
      
      await openDialog(user);
      const nameInput = screen.getByLabelText('challenges.create.name') as HTMLInputElement;
      const amountInput = screen.getByLabelText('challenges.create.amount') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('challenges.create.description') as HTMLInputElement;
      
      await user.type(nameInput, 'My Challenge');
      await selectType(user, 'PAPER');
      await user.type(amountInput, '999');
      await user.type(descriptionInput, 'My description');
      
      expect(nameInput.value).toBe('My Challenge');
      expect(screen.getByRole('combobox')).toHaveTextContent('PAPER');
      expect(amountInput.value).toBe('999');
      expect(descriptionInput.value).toBe('My description');
    });

    test('handles amount input with decimal numbers', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.create).mockResolvedValue(buildCreateResponse({
        name: 'Test',
        description: 'Test',
        amount: 123.45,
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        type: 'PLASTIC',
      }));
      
      render(<CreateChallenge />);
      
      await openDialog(user);
      await user.type(screen.getByLabelText('challenges.create.name'), 'Test');
      await selectType(user, 'PLASTIC');
      await user.type(screen.getByLabelText('challenges.create.amount'), '123.45');
      await user.type(screen.getByLabelText('challenges.create.description'), 'Test');
      await fillDates(user, '2025-09-01', '2025-09-30');
      
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
