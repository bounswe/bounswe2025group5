import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WasteMonthlyChart from '@/components/profile/WasteMonthlyChart';
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

vi.mock('recharts', () => {
  const Mock = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Mock,
    BarChart: Mock,
    Bar: Mock,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Cell: () => null,
    ReferenceLine: Mock,
  };
});

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api/waste', () => ({
  WasteApi: {
    monthly: vi.fn(),
  },
}));

const monthlyResponse = {
  username: 'demo',
  wasteType: 'METAL',
  monthlyData: [
    { year: 2024, month: 1, totalWeight: 500 },
    { year: 2024, month: 2, totalWeight: 0 },
  ],
};

describe('WasteMonthlyChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('fetches and renders monthly waste data', async () => {
    const user = userEvent.setup();
    vi.mocked(WasteApi.monthly).mockResolvedValue(monthlyResponse);

    render(<WasteMonthlyChart username="demo" />);

    await waitFor(() =>
      expect(WasteApi.monthly).toHaveBeenCalledWith({ username: 'demo', wasteType: 'GLASS' })
    );
    expect(screen.getByText('12-month waste trends')).toBeInTheDocument();
    expect(
      screen.getByText((content, node) => node?.tagName === 'SPAN' && content === 'METAL')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh data' }));
    expect(WasteApi.monthly).toHaveBeenCalledTimes(2);
  });

  it('shows an error message when the request fails', async () => {
    vi.mocked(WasteApi.monthly).mockRejectedValue(new Error('network failure'));

    render(<WasteMonthlyChart username="demo" />);

    await waitFor(() => expect(WasteApi.monthly).toHaveBeenCalled());
    expect(screen.getByText('network failure')).toBeInTheDocument();
  });

  it('prompts the user to sign in when username is unavailable', async () => {
    render(<WasteMonthlyChart username={null} />);

    await waitFor(() =>
      expect(screen.getByText('You need to be signed in to view monthly waste stats.')).toBeInTheDocument()
    );
    expect(WasteApi.monthly).not.toHaveBeenCalled();
  });
});

