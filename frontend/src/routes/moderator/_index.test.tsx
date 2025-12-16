import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeratorDashboard } from '@/routes/moderator/_index';
import { ReportsApi } from '@/lib/api/reports';
import { FeedbackApi } from '@/lib/api/feedback';
import { USERNAME_KEY } from '@/lib/api/client';
import { PostsApi } from '@/lib/api/posts';
import { CommentsApi } from '@/lib/api/comments';
import { UsersApi } from '@/lib/api/users';

vi.mock('react-i18next', () => {
  const t = (key: string, defaultValue?: string | { defaultValue?: string; [key: string]: unknown }, options?: Record<string, unknown>) => {
    // Handle object-style parameters (e.g., { defaultValue: 'text', someKey: value })
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      const opts = defaultValue as { defaultValue?: string; [key: string]: unknown };
      const text = opts.defaultValue || key;
      return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token) =>
        String(opts[token] ?? ''),
      );
    }
    // Handle string defaultValue with separate options
    if (typeof defaultValue === 'string') {
      return defaultValue.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token) =>
        String(options?.[token] ?? ''),
      );
    }
    return key;
  };
  return {
    useTranslation: () => ({ t }),
  };
});

vi.mock('@/lib/api/reports', () => ({
  ReportsApi: {
    getUnread: vi.fn(),
    markSolved: vi.fn(),
    markDeletion: vi.fn(),
  },
}));

vi.mock('@/lib/api/feedback', () => ({
  FeedbackApi: {
    getUnseen: vi.fn(),
    markAsSeen: vi.fn(),
  },
}));

vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    getUserByUsername: vi.fn(),
  },
}));

vi.mock('@/lib/api/posts', () => ({
  PostsApi: {
    remove: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('@/lib/api/comments', () => ({
  CommentsApi: {
    remove: vi.fn(),
    getById: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
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

const samplePostItem = {
  postId: 42,
  creatorUsername: 'poster',
  content: 'offending post',
  photoUrl: null,
  likes: 0,
  liked: false,
  saved: false,
  comments: 0,
  createdAt: '2024-05-01T10:00:00Z',
};

const sampleComment = {
  commentId: 99,
  postId: 42,
  content: 'bad comment',
  creatorUsername: 'commenter',
  createdAt: '2024-05-02T10:00:00Z',
};

describe('ModeratorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem(USERNAME_KEY, 'moderator-user');
  });

  it('renders unread reports returned by the API', async () => {
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([sampleReport]);
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);
    vi.mocked(UsersApi.getUserByUsername).mockResolvedValue({
      username: 'alice',
      profilePhotoUrl: null,
      bio: '',
    });

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-1')).toBeInTheDocument();
    expect(ReportsApi.getUnread).toHaveBeenCalledWith('moderator-user');
    expect(FeedbackApi.getUnseen).toHaveBeenCalledWith('moderator-user');
    expect(screen.getByText(/alice/)).toBeInTheDocument();
    expect(screen.getByText(/Spam content detected/)).toBeInTheDocument();
  });

  it('surfaces backend errors to the moderator', async () => {
    vi.mocked(ReportsApi.getUnread).mockRejectedValue(new Error('boom'));
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);

    render(<ModeratorDashboard />);

    await waitFor(() => expect(screen.getByTestId('error-banner')).toBeInTheDocument());
    expect(screen.getByTestId('error-banner')).toHaveTextContent('boom');
  });

  it('allows manually refreshing the queue', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...sampleReport, id: 2, reporterUsername: 'bob' }]);
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);
    vi.mocked(UsersApi.getUserByUsername).mockResolvedValue({
      username: 'bob',
      profilePhotoUrl: null,
      bio: '',
    });

    render(<ModeratorDashboard />);

    await waitFor(() => expect(ReportsApi.getUnread).toHaveBeenCalled());
    expect(ReportsApi.getUnread).toHaveBeenCalledWith('moderator-user');

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => expect(ReportsApi.getUnread).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('report-2')).toBeInTheDocument();
    expect(screen.getByText(/bob/)).toBeInTheDocument();
  });

  it('marks reports as solved', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([sampleReport]);
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);
    vi.mocked(UsersApi.getUserByUsername).mockResolvedValue({
      username: 'alice',
      profilePhotoUrl: null,
      bio: '',
    });
    vi.mocked(ReportsApi.markSolved).mockResolvedValue({ success: true, id: 1 });

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark as solved/i }));

    await waitFor(() => expect(ReportsApi.markSolved).toHaveBeenCalledWith('moderator-user', 1));
    await waitFor(() => expect(screen.queryByTestId('report-1')).not.toBeInTheDocument());
  });

  it('deletes reported posts when requested', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([sampleReport]);
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);
    vi.mocked(UsersApi.getUserByUsername).mockResolvedValue({
      username: 'alice',
      profilePhotoUrl: null,
      bio: '',
    });
    vi.mocked(PostsApi.remove).mockResolvedValue({} as never);
    vi.mocked(ReportsApi.markDeletion).mockResolvedValue({ success: true, id: 1 });

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete content/i }));

    await waitFor(() => expect(PostsApi.remove).toHaveBeenCalledWith(42));
    await waitFor(() => expect(ReportsApi.markDeletion).toHaveBeenCalledWith('moderator-user', 1));
    await waitFor(() => expect(screen.queryByTestId('report-1')).not.toBeInTheDocument());
  });

  it('deletes reported comments with the proper API', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([{ ...sampleReport, id: 3, contentType: 'COMMENT', objectId: 99 }]);
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);
    vi.mocked(UsersApi.getUserByUsername).mockResolvedValue({
      username: 'alice',
      profilePhotoUrl: null,
      bio: '',
    });
    vi.mocked(CommentsApi.remove).mockResolvedValue({} as never);
    vi.mocked(ReportsApi.markDeletion).mockResolvedValue({ success: true, id: 3 });

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete content/i }));

    await waitFor(() => expect(CommentsApi.remove).toHaveBeenCalledWith(99));
    await waitFor(() => expect(ReportsApi.markDeletion).toHaveBeenCalledWith('moderator-user', 3));
    await waitFor(() => expect(screen.queryByTestId('report-3')).not.toBeInTheDocument());
  });

  it('opens a dialog to preview reported posts', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([sampleReport]);
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);
    vi.mocked(UsersApi.getUserByUsername).mockResolvedValue({
      username: 'alice',
      profilePhotoUrl: null,
      bio: '',
    });
    vi.mocked(PostsApi.getById).mockResolvedValue(samplePostItem as never);

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view content/i }));

    await waitFor(() => expect(PostsApi.getById).toHaveBeenCalledWith(42, 'moderator-user'));
    expect(await screen.findByText(/offending post/)).toBeInTheDocument();
  });

  it('shows comment preview when viewing reported comments', async () => {
    const user = userEvent.setup();
    vi.mocked(ReportsApi.getUnread).mockResolvedValue([
      { ...sampleReport, id: 5, contentType: 'COMMENT', objectId: 99 },
    ]);
    vi.mocked(FeedbackApi.getUnseen).mockResolvedValue([]);
    vi.mocked(UsersApi.getUserByUsername).mockResolvedValue({
      username: 'alice',
      profilePhotoUrl: null,
      bio: '',
    });
    vi.mocked(CommentsApi.getById).mockResolvedValue(sampleComment as never);
    vi.mocked(PostsApi.getById).mockResolvedValue(samplePostItem as never);

    render(<ModeratorDashboard />);

    expect(await screen.findByTestId('report-5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view content/i }));

    await waitFor(() => expect(CommentsApi.getById).toHaveBeenCalledWith(99));
    expect(await screen.findByText(/bad comment/)).toBeInTheDocument();
  });
});


