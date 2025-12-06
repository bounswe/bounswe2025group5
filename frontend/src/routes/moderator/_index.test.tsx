import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeratorDashboard } from '@/routes/moderator/_index';
import { ReportsApi } from '@/lib/api/reports';
import { USERNAME_KEY } from '@/lib/api/client';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string, options?: Record<string, unknown>) => {
      if (defaultValue) {
        return defaultValue.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token) =>
          String(options?.[token] ?? ''),
        );
      }
      return key;
    },
  }),
}));

vi.mock('@/lib/api/reports', () => ({
  ReportsApi: {
    getUnread: vi.fn(),
    markSolved: vi.fn(),
  },
}));

const sampleReport = {
  id: 1,
  reporterUsername: 'alice',
  type: 'SPAM',
  description: 'Spam content detected',
  isSolved: 0,
  contentType: 'POST',
  objectId: 42,
  createdAt: '2024-05-01T10:00:00Z',
};

describe('ModeratorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem(USERNAME_KEY, 'moderator-user');
  });

  it('renders unread reports returned by the API', async () => {
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([sampleReport]);

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-1')).toBeInTheDocument();
    expect(ReportsApi.getUnread).toHaveBeenCalledWith('moderator-user');
    expect(screen.getByText(/alice/)).toBeInTheDocument();
    expect(screen.getByText(/Spam content detected/)).toBeInTheDocument();
  });

  it('surfaces backend errors to the moderator', async () => {
    vi.mocked(ReportsApi.getUnread).mockRejectedValue(new Error('boom'));

    render(<ModeratorDashboard />);

    await waitFor(() => expect(screen.getByTestId('error-banner')).toBeInTheDocument());
    expect(screen.getByTestId('error-banner')).toHaveTextContent('boom');
  });

  it('allows manually refreshing the queue', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...sampleReport, id: 2, reporterUsername: 'bob' }]);

    render(<ModeratorDashboard />);

    await waitFor(() => expect(ReportsApi.getUnread).toHaveBeenCalledTimes(1));
    expect(ReportsApi.getUnread).toHaveBeenCalledWith('moderator-user');

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => expect(ReportsApi.getUnread).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('report-2')).toBeInTheDocument();
    expect(screen.getByText(/bob/)).toBeInTheDocument();
  });

  it('marks reports as solved', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([sampleReport]);
    vi.mocked(ReportsApi.markSolved).mockResolvedValue({ success: true, id: 1 });

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark as solved/i }));

    await waitFor(() => expect(ReportsApi.markSolved).toHaveBeenCalledWith('moderator-user', 1));
    await waitFor(() => expect(screen.queryByTestId('report-1')).not.toBeInTheDocument());
  });
});


