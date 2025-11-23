import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ChallengesIndex from './_index';
import { UsersApi } from '@/lib/api/users';
import type { ChallengeListItem } from '@/lib/api/schemas/challenges';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock UsersApi
vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    listChallenges: vi.fn(),
  },
}));

// Mock child components
vi.mock('@/components/challenges/challengeCard', () => ({
  default: ({ challenge }: { challenge: ChallengeListItem }) => (
    <div data-testid="challenge-card">{challenge.name}</div>
  ),
}));

vi.mock('@/components/challenges/createChallenge', () => ({
  default: () => <button data-testid="create-challenge-button">Create Challenge</button>,
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

vi.mock('@/components/ui/glass-card', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

describe('ChallengesIndex', () => {
  const mockChallenges: ChallengeListItem[] = [
    {
      challengeId: 1,
      name: 'Plastic Challenge',
      description: 'Reduce plastic waste',
      type: 'PLASTIC',
      amount: 100,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'ACTIVE',
      userInChallenge: false,
      currentAmount: 0,
    },
    {
      challengeId: 2,
      name: 'Paper Challenge',
      description: 'Recycle paper',
      type: 'PAPER',
      amount: 50,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'ACTIVE',
      userInChallenge: true,
      currentAmount: 25,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('Rendering', () => {
    test('renders the page with glass card container', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.getByTestId('glass-card')).toBeInTheDocument();
      });
    });

    test('renders create challenge button', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.getByTestId('create-challenge-button')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner while fetching data', async () => {
      let resolveListChallenges: (value: ChallengeListItem[]) => void;
      const listChallengesPromise = new Promise<ChallengeListItem[]>((resolve) => {
        resolveListChallenges = resolve;
      });
      vi.mocked(UsersApi.listChallenges).mockReturnValue(listChallengesPromise);
      
      renderWithRouter(<ChallengesIndex />);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading challenges...')).toBeInTheDocument();
      
      resolveListChallenges!(mockChallenges);
      
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });

    test('hides loading spinner after data loads', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue(mockChallenges);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    test('fetches challenges on mount with username from localStorage', async () => {
      localStorage.setItem('username', 'testuser');
      vi.mocked(UsersApi.listChallenges).mockResolvedValue(mockChallenges);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(UsersApi.listChallenges).toHaveBeenCalledWith('testuser');
      });
    });

    test('extracts username from JWT token when username not in localStorage', async () => {
      const token = 'header.' + btoa(JSON.stringify({ username: 'jwtuser' })) + '.signature';
      localStorage.setItem('authToken', token);
      vi.mocked(UsersApi.listChallenges).mockResolvedValue(mockChallenges);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(UsersApi.listChallenges).toHaveBeenCalledWith('jwtuser');
      });
    });

    test('calls API with null when no username or token available', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(UsersApi.listChallenges).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Challenge Display', () => {
    test('displays challenge cards when data loads', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue(mockChallenges);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.getByText('Plastic Challenge')).toBeInTheDocument();
        expect(screen.getByText('Paper Challenge')).toBeInTheDocument();
      });
    });

    test('renders correct number of challenge cards', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue(mockChallenges);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        const cards = screen.getAllByTestId('challenge-card');
        expect(cards).toHaveLength(2);
      });
    });

    test('displays challenges in grid layout', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue(mockChallenges);
      
      const { container } = renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
      });
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no challenges', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.getByText('No challenges found.')).toBeInTheDocument();
        expect(screen.getByText('Create the first challenge to get started!')).toBeInTheDocument();
      });
    });

    test('does not show challenge cards in empty state', async () => {
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('challenge-card')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      vi.mocked(UsersApi.listChallenges).mockRejectedValue(new Error('Network error'));
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('displays generic error for non-Error exceptions', async () => {
      vi.mocked(UsersApi.listChallenges).mockRejectedValue('Unknown error');
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load challenges')).toBeInTheDocument();
      });
    });

    test('does not show challenges when error occurs', async () => {
      vi.mocked(UsersApi.listChallenges).mockRejectedValue(new Error('API Error'));
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('challenge-card')).not.toBeInTheDocument();
      });
    });

    test('hides loading spinner after error', async () => {
      vi.mocked(UsersApi.listChallenges).mockRejectedValue(new Error('API Error'));
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Username Extraction', () => {
    test('handles invalid JWT token gracefully', async () => {
      localStorage.setItem('authToken', 'invalid.token.format');
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(UsersApi.listChallenges).toHaveBeenCalledWith(null);
      });
    });

    test('handles malformed JWT payload', async () => {
      localStorage.setItem('authToken', 'header.invalid-base64.signature');
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(UsersApi.listChallenges).toHaveBeenCalledWith(null);
      });
    });

    test('prefers username from localStorage over JWT', async () => {
      localStorage.setItem('username', 'localuser');
      const token = 'header.' + btoa(JSON.stringify({ username: 'jwtuser' })) + '.signature';
      localStorage.setItem('authToken', token);
      vi.mocked(UsersApi.listChallenges).mockResolvedValue([]);
      
      renderWithRouter(<ChallengesIndex />);
      
      await waitFor(() => {
        expect(UsersApi.listChallenges).toHaveBeenCalledWith('localuser');
      });
    });
  });
});
