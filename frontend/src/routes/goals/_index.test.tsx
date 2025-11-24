import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GoalsIndex from '@/routes/goals/_index';
import type { WasteGoalItem } from '@/lib/api/schemas/goals';
import { UsersApi } from '@/lib/api/users';
import { toast } from 'sonner';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/profile/WasteSummaryCard', () => ({
  default: () => <div data-testid="summary-card" />,
}));

vi.mock('@/components/profile/WasteMonthlyChart', () => ({
  default: () => <div data-testid="monthly-chart" />,
}));

vi.mock('@/components/goals/GoalCard', () => ({
  default: ({ goal }: { goal: WasteGoalItem }) => (
    <div data-testid={`goal-${goal.goalId}`}>
      <button data-action="edit-goal">Edit</button>
      <button data-action="delete-goal">Delete</button>
      <button data-action="log-waste">Log</button>
    </div>
  ),
}));

vi.mock('@/components/goals/CreateOrEditGoalDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/goals/LogWasteDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/glass-card', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    listGoals: vi.fn(),
    deleteWasteGoal: vi.fn(),
    createWasteGoal: vi.fn(),
    editWasteGoal: vi.fn(),
  },
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockListGoals = vi.mocked(UsersApi.listGoals);
const mockDeleteGoal = vi.mocked(UsersApi.deleteWasteGoal);

describe('GoalsIndex route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorage.setItem('username', 'demo-user');
  });

  it('renders fetched goals', async () => {
    mockListGoals.mockResolvedValue([
      {
        goalId: 42,
        wasteType: 'PLASTIC',
        restrictionAmountGrams: 100,
        duration: 7,
        progress: 0,
        createdAt: '',
        creatorUsername: 'demo-user',
      },
    ]);

    render(<GoalsIndex />);

    expect(await screen.findByTestId('goal-42')).toBeInTheDocument();
  });

  it('shows empty state when no username is available', async () => {
    localStorageMock.clear();
    mockListGoals.mockResolvedValue([]);

    render(<GoalsIndex />);

    expect(await screen.findByText('No goals found.')).toBeInTheDocument();
  });

  it('deletes a goal when delete action is triggered', async () => {
    const user = userEvent.setup();
    mockListGoals.mockResolvedValue([
      {
        goalId: 1,
        wasteType: 'GLASS',
        restrictionAmountGrams: 500,
        duration: 10,
        progress: 0,
        createdAt: '',
        creatorUsername: 'demo-user',
      },
    ]);
    mockDeleteGoal.mockResolvedValue({ goalId: 1 } as any);

    render(<GoalsIndex />);

    const deleteButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => expect(mockDeleteGoal).toHaveBeenCalledWith(1));
    expect(toast.success).toHaveBeenCalledWith('Goal deleted');
  });
});

