import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GoalCard from '@/components/goals/GoalCard';
import type { WasteGoalItem } from '@/lib/api/schemas/goals';

const formatTemplate = (template: string, vars?: Record<string, unknown>) =>
  template.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (_, token) => String(vars?.[token] ?? ''));

const t = (key: string, defaultValueOrOptions?: unknown, maybeOptions?: Record<string, unknown>) => {
  const options =
    typeof defaultValueOrOptions === 'object' && defaultValueOrOptions !== null && !Array.isArray(defaultValueOrOptions)
      ? (defaultValueOrOptions as Record<string, unknown>)
      : maybeOptions;
  const defaultText =
    typeof defaultValueOrOptions === 'string'
      ? defaultValueOrOptions
      : typeof options?.defaultValue === 'string'
        ? options.defaultValue
        : undefined;
  return defaultText ? formatTemplate(defaultText, options) : key;
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t,
  }),
}));

const baseGoal: WasteGoalItem = {
  goalId: 1,
  wasteType: 'PLASTIC',
  restrictionAmountGrams: 1200,
  duration: 30,
  progress: 72.5,
  createdAt: '2024-01-01T00:00:00Z',
  creatorUsername: 'tester',
};

describe('GoalCard', () => {
  it('renders goal details including stats and actions', () => {
    render(<GoalCard goal={baseGoal} />);

    expect(screen.getByText('PLASTIC goal')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('73%')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Log' })).toHaveAttribute('data-action', 'log-waste');
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('data-action', 'edit-goal');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-action', 'delete-goal');
  });

  it('keeps action buttons enabled when progress exceeds limit', () => {
    render(<GoalCard goal={{ ...baseGoal, progress: 150 }} />);

    expect(screen.getByRole('button', { name: 'Log' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(screen.getByText('150%')).toBeInTheDocument();
  });
});

