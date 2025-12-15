import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WasteSummaryCard from '@/components/profile/WasteSummaryCard';
import { WasteApi } from '@/lib/api/waste';

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

vi.mock('@/lib/api/waste', () => ({
  WasteApi: {
    summary: vi.fn(),
  },
}));

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const summaryResponse = {
  wasteType: { id: 1, name: 'PLASTIC' },
  totalAmount: 5000,
};

describe('WasteSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(WasteApi.summary).mockResolvedValue(summaryResponse);
  });

  it('loads the default summary on mount', async () => {
    render(<WasteSummaryCard />);

    await waitFor(() => expect(WasteApi.summary).toHaveBeenCalled());
    expect(screen.getByLabelText('5 kg (Total collected)')).toBeInTheDocument();
    expect(screen.getByText('0.08 barrels of oil')).toBeInTheDocument();
    expect(
      screen.getByText('You logged 5 kg of PLASTIC, saving about 0.08 barrels of oil.')
    ).toBeInTheDocument();
  });

  it('submits a custom range when the form is valid', async () => {
    const user = userEvent.setup();
    render(<WasteSummaryCard />);

    await waitFor(() => expect(WasteApi.summary).toHaveBeenCalledTimes(1));

    const startInput = screen.getByLabelText('Start date') as HTMLInputElement;
    const endInput = screen.getByLabelText('End date') as HTMLInputElement;
    const wasteTypeInput = screen.getByLabelText('Waste type') as HTMLInputElement;

    await user.clear(startInput);
    await user.type(startInput, '2024-01-01');
    await user.clear(endInput);
    await user.type(endInput, '2024-01-03');
    await user.clear(wasteTypeInput);
    await user.type(wasteTypeInput, 'METAL');

    await user.click(screen.getByRole('button', { name: 'Refresh data' }));

    await waitFor(() =>
      expect(WasteApi.summary).toHaveBeenLastCalledWith({
        startDate: '2024-01-01T00:00:00',
        endDate: '2024-01-03T23:59:59',
        wasteType: 'METAL',
      })
    );
  });

  it('surfaces errors from the API', async () => {
    vi.mocked(WasteApi.summary).mockRejectedValueOnce(new Error('boom'));

    render(<WasteSummaryCard />);

    await waitFor(() => expect(WasteApi.summary).toHaveBeenCalled());
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('prevents submission when the date range is invalid', async () => {
    const user = userEvent.setup();
    render(<WasteSummaryCard />);

    await waitFor(() => expect(WasteApi.summary).toHaveBeenCalledTimes(1));

    const startInput = screen.getByLabelText('Start date') as HTMLInputElement;
    const endInput = screen.getByLabelText('End date') as HTMLInputElement;

    await user.clear(startInput);
    await user.type(startInput, '2024-02-10');
    await user.clear(endInput);
    await user.type(endInput, '2024-02-01');

    await user.click(screen.getByRole('button', { name: 'Refresh data' }));

    expect(WasteApi.summary).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Start date must be on or before the end date.')).toBeInTheDocument();
  });
});

