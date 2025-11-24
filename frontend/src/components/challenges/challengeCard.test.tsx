import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ChallengeCard from './challengeCard';
import { ChallengesApi } from '@/lib/api/challenges';
import type { ChallengeListItem } from '@/lib/api/schemas/challenges';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock ChallengesApi
vi.mock('@/lib/api/challenges', () => ({
  ChallengesApi: {
    attend: vi.fn(),
    leave: vi.fn(),
    logChallengeProgress: vi.fn(),
  },
}));

// Mock child components
vi.mock('./Leaderboard', () => ({
  default: ({ challengeId }: { challengeId: number }) => (
    <button data-testid={`leaderboard-${challengeId}`}>Leaderboard</button>
  ),
}));

vi.mock('./RecyclingProgressVisualization', () => ({
  default: ({ progress }: { progress: number }) => (
    <div data-testid="progress-visualization">{progress.toFixed(0)}%</div>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress-bar" data-value={value} />
  ),
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

// Mock alert
const mockAlert = vi.fn();
window.alert = mockAlert;

const mockChallenge: ChallengeListItem = {
  challengeId: 1,
  name: 'Recycle Paper Challenge',
  description: 'Recycle as much paper as possible this month',
  type: 'PAPER',
  status: 'ACTIVE',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  amount: 1000,
  currentAmount: 250,
  userInChallenge: false,
};

describe('ChallengeCard', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('username', 'testuser');
    vi.clearAllMocks();
    mockAlert.mockClear();
  });

  describe('Rendering', () => {
    test('renders challenge name and description', () => {
      render(<ChallengeCard challenge={mockChallenge} />);

      expect(screen.getByText('Recycle Paper Challenge')).toBeInTheDocument();
      expect(screen.getByText('Recycle as much paper as possible this month')).toBeInTheDocument();
    });

    test('renders challenge details when accordion is expanded', async () => {
      const user = userEvent.setup();
      render(<ChallengeCard challenge={mockChallenge} />);

      // Expand accordion
      const accordionTrigger = screen.getByRole('button', { expanded: false });
      await user.click(accordionTrigger);

      await waitFor(() => {
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('PAPER')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('Dates')).toBeInTheDocument();
        expect(screen.getByText('2025-01-01 → 2025-01-31')).toBeInTheDocument();
      });
    });

    test('displays progress visualization with correct percentage', () => {
      render(<ChallengeCard challenge={mockChallenge} />);

      const visualization = screen.getByTestId('progress-visualization');
      expect(visualization).toHaveTextContent('25%'); // 250/1000 = 25%
    });

    test('displays progress bar with correct values when expanded', async () => {
      const user = userEvent.setup();
      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));

      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveAttribute('data-value', '25');
        expect(screen.getByText('250 / 1000')).toBeInTheDocument();
      });
    });

    test('renders without amount when amount is null', () => {
      const challengeWithoutAmount = { ...mockChallenge, amount: null, currentAmount: null };
      render(<ChallengeCard challenge={challengeWithoutAmount} />);

      expect(screen.queryByTestId('progress-visualization')).not.toBeInTheDocument();
    });
  });

  describe('Attend Challenge', () => {
    test('shows attend button when user is not in challenge', async () => {
      const user = userEvent.setup();
      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /attend/i })).toBeInTheDocument();
      });
    });

    test('calls API and updates state when attend button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.attend).mockResolvedValue({ success: true });

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /attend/i }));

      await waitFor(() => {
        expect(ChallengesApi.attend).toHaveBeenCalledWith(1, { username: 'testuser' });
      });

      // Button should change to leave after attending
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /attend/i })).not.toBeInTheDocument();
      });
    });

    test('shows attending... text while request is pending', async () => {
      const user = userEvent.setup();
      let resolveAttend: () => void;
      const attendPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveAttend = () => resolve({ success: true });
      });
      vi.mocked(ChallengesApi.attend).mockReturnValue(attendPromise);

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /attend/i }));

      expect(screen.getByText('Attending...')).toBeInTheDocument();

      resolveAttend!();
      await waitFor(() => {
        expect(screen.queryByText('Attending...')).not.toBeInTheDocument();
      });
    });

    test('shows alert when attend fails', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.attend).mockRejectedValue(new Error('Network error'));

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /attend/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Could not attend the challenge');
      });
    });

    test('disables buttons while attending', async () => {
      const user = userEvent.setup();
      let resolveAttend: () => void;
      const attendPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveAttend = () => resolve({ success: true });
      });
      vi.mocked(ChallengesApi.attend).mockReturnValue(attendPromise);

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      
      const attendButton = screen.getByRole('button', { name: /attend/i });
      const logButton = screen.getByRole('button', { name: /log/i });
      
      await user.click(attendButton);

      expect(attendButton).toBeDisabled();
      expect(logButton).toBeDisabled();

      resolveAttend!();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leave/i })).not.toBeDisabled();
      });
    });
  });

  describe('Leave Challenge', () => {
    test('shows leave button when user is in challenge', async () => {
      const user = userEvent.setup();
      const userInChallenge = { ...mockChallenge, userInChallenge: true };
      render(<ChallengeCard challenge={userInChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /attend/i })).not.toBeInTheDocument();
      });
    });

    test('calls API and updates state when leave button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.leave).mockResolvedValue({ success: true });

      const userInChallenge = { ...mockChallenge, userInChallenge: true };
      render(<ChallengeCard challenge={userInChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /leave/i }));

      await waitFor(() => {
        expect(ChallengesApi.leave).toHaveBeenCalledWith(1, 'testuser');
      });

      // Button should change to attend after leaving
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /attend/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /leave/i })).not.toBeInTheDocument();
      });
    });

    test('shows leaving... text while request is pending', async () => {
      const user = userEvent.setup();
      let resolveLeave: () => void;
      const leavePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveLeave = () => resolve({ success: true });
      });
      vi.mocked(ChallengesApi.leave).mockReturnValue(leavePromise);

      const userInChallenge = { ...mockChallenge, userInChallenge: true };
      render(<ChallengeCard challenge={userInChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /leave/i }));

      expect(screen.getByText('Leaving...')).toBeInTheDocument();

      resolveLeave!();
      await waitFor(() => {
        expect(screen.queryByText('Leaving...')).not.toBeInTheDocument();
      });
    });

    test('shows alert when leave fails', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.leave).mockRejectedValue(new Error('Network error'));

      const userInChallenge = { ...mockChallenge, userInChallenge: true };
      render(<ChallengeCard challenge={userInChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /leave/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Could not leave the challenge');
      });
    });
  });

  describe('Log Progress', () => {
    test('opens popover when log button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /log/i }));

      await waitFor(() => {
        expect(screen.getByRole('spinbutton')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });
    });

    test('shows alert when submitting empty amount', async () => {
      const user = userEvent.setup();

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /log/i }));
      
      // Submit without entering a value (empty input converts to 0, which is invalid)
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Please enter a positive amount');
        expect(ChallengesApi.logChallengeProgress).not.toHaveBeenCalled();
      });
    });

    test('logs progress with valid amount', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.logChallengeProgress).mockResolvedValue({
        username: 'testuser',
        challengeId: 1,
        newTotalAmount: 260,
      });

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /log/i }));

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      await user.type(input, '10');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(ChallengesApi.logChallengeProgress).toHaveBeenCalledWith(
          1,
          { username: 'testuser', amount: 10 }
        );
      });
    });

    test('logs progress with custom amount', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.logChallengeProgress).mockResolvedValue({
        username: 'testuser',
        challengeId: 1,
        newTotalAmount: 300,
      });

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /log/i }));

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      
      // Clear input properly and type new value
      await user.clear(input);
      await user.type(input, '50');

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(ChallengesApi.logChallengeProgress).toHaveBeenCalledWith(
          1,
          { username: 'testuser', amount: 50 }
        );
      });
    });

    test('updates current amount after successful log', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.logChallengeProgress).mockResolvedValue({
        username: 'testuser',
        challengeId: 1,
        newTotalAmount: 300,
      });

      render(<ChallengeCard challenge={mockChallenge} />);

      // Initial progress is 25% (250/1000)
      expect(screen.getByTestId('progress-visualization')).toHaveTextContent('25%');

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /log/i }));

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      
      // Clear and type new value
      await user.clear(input);
      await user.type(input, '50');

      await user.click(screen.getByRole('button', { name: /submit/i }));

      // After logging 50, progress should be 30% (250 + 50 = 300, 300/1000 = 30%)
      await waitFor(() => {
        expect(screen.getByTestId('progress-visualization')).toHaveTextContent('30%');
      });

      // Check progress text is visible in expanded accordion
      await waitFor(() => {
        expect(screen.getByText('300 / 1000')).toBeInTheDocument();
      });
    });

    test('shows logging... text while request is pending', async () => {
      const user = userEvent.setup();
      let resolveLog: () => void;
      const logPromise = new Promise<{ username: string; challengeId: number; newTotalAmount: number }>((resolve) => {
        resolveLog = () => resolve({ username: 'testuser', challengeId: 1, newTotalAmount: 251 });
      });
      vi.mocked(ChallengesApi.logChallengeProgress).mockReturnValue(logPromise);

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      
      const logButton = screen.getByRole('button', { name: /log/i });
      await user.click(logButton);
      
      // Enter a valid value first
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      await user.type(input, '1');
      
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Use getAllByText since "Logging..." appears in both the Log button and Submit button
      await waitFor(() => {
        const loggingTexts = screen.getAllByText('Logging...');
        expect(loggingTexts.length).toBeGreaterThan(0);
      });

      resolveLog!();
      await waitFor(() => {
        expect(screen.queryByText('Logging...')).not.toBeInTheDocument();
      });
    });

    test('shows alert when log fails', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.logChallengeProgress).mockRejectedValue(new Error('Network error'));

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /log/i }));
      
      // Enter a valid value first so validation passes and API is called
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      await user.type(input, '5');
      
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Could not log challenge progress');
      });
    });

    test('prevents negative and zero amounts via submit validation', async () => {
      const user = userEvent.setup();
      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /log/i }));

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      
      // Try to submit negative value - should alert and not call API
      await user.clear(input);
      await user.type(input, '-5');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Please enter a positive amount');
        expect(ChallengesApi.logChallengeProgress).not.toHaveBeenCalled();
      });
      
      mockAlert.mockClear();
      vi.clearAllMocks();

      // Try to submit zero - should alert and not call API
      await user.clear(input);
      await user.type(input, '0');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Please enter a positive amount');
        expect(ChallengesApi.logChallengeProgress).not.toHaveBeenCalled();
      });
      
      mockAlert.mockClear();
      vi.clearAllMocks();

      // Valid positive value should work
      vi.mocked(ChallengesApi.logChallengeProgress).mockResolvedValue({
        username: 'testuser',
        challengeId: 1,
        newTotalAmount: 275,
      });
      
      await user.clear(input);
      await user.type(input, '25');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(ChallengesApi.logChallengeProgress).toHaveBeenCalledWith(
          1,
          { username: 'testuser', amount: 25 }
        );
      });
    });

    test('disables buttons while logging', async () => {
      const user = userEvent.setup();
      let resolveLog: () => void;
      const logPromise = new Promise<{ username: string; challengeId: number; newTotalAmount: number }>((resolve) => {
        resolveLog = () => resolve({ username: 'testuser', challengeId: 1, newTotalAmount: 251 });
      });
      vi.mocked(ChallengesApi.logChallengeProgress).mockReturnValue(logPromise);

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      
      const attendButton = screen.getByRole('button', { name: /attend/i });
      const logButton = screen.getByRole('button', { name: /log/i });
      
      await user.click(logButton);
      
      // Enter a valid value first
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      await user.type(input, '1');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(attendButton).toBeDisabled();
        expect(logButton).toBeDisabled();
      });

      resolveLog!();
      await waitFor(() => {
        expect(attendButton).not.toBeDisabled();
        expect(logButton).not.toBeDisabled();
      });
    });
  });

  describe('Leaderboard', () => {
    test('renders leaderboard component', async () => {
      const user = userEvent.setup();
      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-1')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles challenge without description', async () => {
      const user = userEvent.setup();
      const challengeWithoutDesc = { ...mockChallenge, description: null };
      render(<ChallengeCard challenge={challengeWithoutDesc} />);

      expect(screen.getByText('Recycle Paper Challenge')).toBeInTheDocument();
      expect(screen.queryByText('Recycle as much paper as possible this month')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { expanded: false }));

      // Should not show description section in expanded view
      await waitFor(() => {
        expect(screen.queryByText('Recycle as much paper as possible this month')).not.toBeInTheDocument();
      });
    });

    test('handles missing username in localStorage', async () => {
      localStorageMock.clear();
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.attend).mockResolvedValue({ success: true });

      render(<ChallengeCard challenge={mockChallenge} />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { name: /attend/i }));

      await waitFor(() => {
        expect(ChallengesApi.attend).toHaveBeenCalledWith(1, { username: '' });
      });
    });

    test('handles zero progress correctly', () => {
      const zeroProgressChallenge = { ...mockChallenge, currentAmount: 0 };
      render(<ChallengeCard challenge={zeroProgressChallenge} />);

      const visualization = screen.getByTestId('progress-visualization');
      expect(visualization).toHaveTextContent('0%');
    });

    test('handles challenge with zero amount', () => {
      const zeroAmountChallenge = { ...mockChallenge, amount: 0, currentAmount: 0 };
      render(<ChallengeCard challenge={zeroAmountChallenge} />);

      const visualization = screen.getByTestId('progress-visualization');
      expect(visualization).toHaveTextContent('0%'); // Should handle division by zero
    });
  });
});
