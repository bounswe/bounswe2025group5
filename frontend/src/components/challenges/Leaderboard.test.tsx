import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Leaderboard from './Leaderboard';
import { ChallengesApi } from '@/lib/api/challenges';
import type { LeaderboardItem } from '@/lib/api/schemas/leaderboard';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock ChallengesApi
vi.mock('@/lib/api/challenges', () => ({
  ChallengesApi: {
    getLeaderboard: vi.fn(),
  },
}));

// Mock UI components
vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

describe('Leaderboard', () => {
  const mockLeaderboardData: LeaderboardItem[] = [
    { username: 'user1', logAmount: 500 },
    { username: 'user2', logAmount: 300 },
    { username: 'user3', logAmount: 150 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders leaderboard button', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue([]);
      
      render(<Leaderboard challengeId={1} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leaderboard/i })).toBeInTheDocument();
      });
    });

    test('opens dialog when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue([]);
      
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    test('stops event propagation when button is clicked', async () => {
      const user = userEvent.setup();
      const mockStopPropagation = vi.fn();
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue([]);
      
      render(
        <div onClick={mockStopPropagation}>
          <Leaderboard challengeId={1} />
        </div>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /leaderboard/i })).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button', { name: /leaderboard/i });
      await user.click(button);
      
      expect(mockStopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    test('fetches leaderboard data on mount', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      render(<Leaderboard challengeId={1} />);
      
      await waitFor(() => {
        expect(ChallengesApi.getLeaderboard).toHaveBeenCalledWith(1);
      });
    });

    test('refetches data when challengeId changes', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      const { rerender } = render(<Leaderboard challengeId={1} />);
      
      await waitFor(() => {
        expect(ChallengesApi.getLeaderboard).toHaveBeenCalledWith(1);
      });
      
      vi.clearAllMocks();
      
      rerender(<Leaderboard challengeId={2} />);
      
      await waitFor(() => {
        expect(ChallengesApi.getLeaderboard).toHaveBeenCalledWith(2);
      });
    });

    test('handles API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(ChallengesApi.getLeaderboard).mockRejectedValue(new Error('Network error'));
      
      render(<Leaderboard challengeId={1} />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Network error'));
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading State', () => {
    test('shows spinner while loading', async () => {
      let resolveLeaderboard: (value: LeaderboardItem[]) => void;
      const leaderboardPromise = new Promise<LeaderboardItem[]>((resolve) => {
        resolveLeaderboard = resolve;
      });
      vi.mocked(ChallengesApi.getLeaderboard).mockReturnValue(leaderboardPromise);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
      });
      
      resolveLeaderboard!(mockLeaderboardData);
      
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });

    test('hides spinner after data is loaded', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });

    test('hides spinner after error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(ChallengesApi.getLeaderboard).mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Leaderboard Display', () => {
    test('displays leaderboard entries with correct ranking', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
      });
    });

    test('displays username for each entry', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
        expect(screen.getByText('user3')).toBeInTheDocument();
      });
    });

    test('displays log amount for each entry', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('300')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    test('displays entries in correct order', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
        expect(listItems[0]).toHaveTextContent('user1');
        expect(listItems[1]).toHaveTextContent('user2');
        expect(listItems[2]).toHaveTextContent('user3');
      });
    });

    test('shows empty state when no entries', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue([]);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('No entries yet')).toBeInTheDocument();
      });
    });

    test('handles null logAmount values', async () => {
      const dataWithNull: LeaderboardItem[] = [
        { username: 'user1', logAmount: null },
      ];
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(dataWithNull);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });
    });

    test('handles undefined logAmount values', async () => {
      const dataWithUndefined: LeaderboardItem[] = [
        { username: 'user1', logAmount: undefined },
      ];
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(dataWithUndefined);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });
    });

    test('displays large number of entries with scrolling', async () => {
      const largeDataSet: LeaderboardItem[] = Array.from({ length: 50 }, (_, i) => ({
        username: `user${i + 1}`,
        logAmount: 1000 - i * 10,
      }));
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(largeDataSet);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#50')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Behavior', () => {
    test('displays dialog title', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        const dialogTitle = screen.getAllByText('Leaderboard');
        expect(dialogTitle.length).toBeGreaterThan(1);
      });
    });

    test('fetches data immediately on mount, not when dialog opens', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(mockLeaderboardData);
      
      render(<Leaderboard challengeId={1} />);
      
      await waitFor(() => {
        expect(ChallengesApi.getLeaderboard).toHaveBeenCalledTimes(1);
        expect(ChallengesApi.getLeaderboard).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles single entry leaderboard', async () => {
      const singleEntry: LeaderboardItem[] = [
        { username: 'onlyuser', logAmount: 100 },
      ];
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(singleEntry);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('onlyuser')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    test('handles entries with zero log amount', async () => {
      const dataWithZero: LeaderboardItem[] = [
        { username: 'user1', logAmount: 0 },
      ];
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(dataWithZero);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    test('handles entries with very large log amounts', async () => {
      const dataWithLargeNumbers: LeaderboardItem[] = [
        { username: 'user1', logAmount: 999999999 },
      ];
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue(dataWithLargeNumbers);
      
      const user = userEvent.setup();
      render(<Leaderboard challengeId={1} />);
      
      await user.click(screen.getByRole('button', { name: /leaderboard/i }));
      
      await waitFor(() => {
        expect(screen.getByText('999999999')).toBeInTheDocument();
      });
    });

    test('handles challengeId of 0', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue([]);
      
      render(<Leaderboard challengeId={0} />);
      
      await waitFor(() => {
        expect(ChallengesApi.getLeaderboard).toHaveBeenCalledWith(0);
      });
    });

    test('handles negative challengeId', async () => {
      vi.mocked(ChallengesApi.getLeaderboard).mockResolvedValue([]);
      
      render(<Leaderboard challengeId={-1} />);
      
      await waitFor(() => {
        expect(ChallengesApi.getLeaderboard).toHaveBeenCalledWith(-1);
      });
    });
  });
});
