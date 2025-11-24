import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LogWasteDialog from '@/components/goals/LogWasteDialog';
import { UsersApi } from '@/lib/api/users';
import { WasteApi } from '@/lib/api/waste';

const formatTemplate = (template: string, vars?: Record<string, unknown>) =>
  template.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (_, token) => String(vars?.[token] ?? ''));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValueOrOptions?: unknown, maybeOptions?: Record<string, unknown>) => {
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
    },
  }),
}));

vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    listWasteItemsForGoal: vi.fn(),
  },
}));

vi.mock('@/lib/api/waste', () => ({
  WasteApi: {
    create: vi.fn(),
  },
}));

const wasteItems = [
  {
    id: 10,
    name: 'bottle',
    displayName: 'Reusable Bottle',
    weightInGrams: 120,
    type: { id: 1, name: 'PLASTIC' },
  },
  {
    id: 11,
    name: 'bag',
    displayName: 'Reusable Bag',
    weightInGrams: 60,
    type: { id: 1, name: 'PLASTIC' },
  },
];

describe('LogWasteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UsersApi.listWasteItemsForGoal).mockResolvedValue(wasteItems);
    vi.mocked(WasteApi.create).mockResolvedValue({});
  });

  it('loads available waste items when opened', async () => {
    render(
      <LogWasteDialog goalId={3} username="demo" open onOpenChange={vi.fn()} />
    );

    await waitFor(() => expect(UsersApi.listWasteItemsForGoal).toHaveBeenCalledWith(3));

    expect(screen.getByRole('option', { name: 'Reusable Bottle' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Reusable Bag' })).toBeInTheDocument();
  });

  it('disables submission when quantity is invalid', async () => {
    const user = userEvent.setup();
    render(
      <LogWasteDialog goalId={5} username="demo" open onOpenChange={vi.fn()} />
    );

    await waitFor(() => expect(UsersApi.listWasteItemsForGoal).toHaveBeenCalled());

    const quantityInput = screen.getByLabelText('Quantity') as HTMLInputElement;
    await user.clear(quantityInput);
    await user.type(quantityInput, '0');

    expect(screen.getByRole('button', { name: 'Log' })).toBeDisabled();
    expect(WasteApi.create).not.toHaveBeenCalled();
  });

  it('submits the selected item and quantity', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onLogged = vi.fn();

    render(
      <LogWasteDialog goalId={7} username="demo" open onOpenChange={onOpenChange} onLogged={onLogged} />
    );

    await waitFor(() => expect(UsersApi.listWasteItemsForGoal).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText('Item'), '11');
    const quantityInput = screen.getByLabelText('Quantity') as HTMLInputElement;
    await user.clear(quantityInput);
    await user.type(quantityInput, '3');

    await user.click(screen.getByRole('button', { name: 'Log' }));

    await waitFor(() =>
      expect(WasteApi.create).toHaveBeenCalledWith(7, { username: 'demo', itemId: 11, quantity: 3 })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onLogged).toHaveBeenCalled();
  });
});

