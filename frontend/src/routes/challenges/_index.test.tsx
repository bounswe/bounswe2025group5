import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import ChallengesIndex from '@/routes/challenges/_index';
import { UsersApi } from '@/lib/api/users';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/components/challenges/createChallenge', () => ({
  default: () => <button data-testid="create-challenge">Create</button>,
}));

vi.mock('@/components/challenges/challengeCard', () => ({
  default: ({ challenge }: { challenge: { title: string } }) => (
    <div data-testid="challenge-card">{challenge.title}</div>
  ),
}));

vi.mock('@/components/ui/glass-card', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div data-testid="spinner" />,
  default: () => <div data-testid="spinner" />,
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

const originalLocalStorage = window.localStorage;

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    configurable: true,
    writable: true,
  });
});

const mockedListChallenges = vi.spyOn(UsersApi, 'listChallenges');

describe('ChallengesIndex route', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockedListChallenges.mockReset();
    localStorage.setItem('username', 'demo');
  });

  it('renders returned challenges', async () => {
    mockedListChallenges.mockResolvedValue([{ challengeId: 1, title: 'Water' }] as any);

    render(<ChallengesIndex />);

    await waitFor(() => expect(mockedListChallenges).toHaveBeenCalledWith('demo'));
    expect(await screen.findByTestId('challenge-card')).toHaveTextContent('Water');
  });

  it('shows empty state when there are no challenges', async () => {
    mockedListChallenges.mockResolvedValue([]);

    render(<ChallengesIndex />);

    expect(await screen.findByText('No challenges found.')).toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    mockedListChallenges.mockRejectedValue(new Error('boom'));

    render(<ChallengesIndex />);

    expect(await screen.findByText('boom')).toBeInTheDocument();
  });
});

