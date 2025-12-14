import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BadgesIndex from './_index';

const getBadgesMock = vi.fn();

const { translations, tMock, mockCatalog } = vi.hoisted(() => {
  const translationsHoisted: Record<string, string> = {
    'badges.title': 'Badge Catalog',
    'badges.subtitle': 'Preview the badges you can earn in WasteLess.',
    'badges.filters.all': 'All categories',
    'badges.categories.waste': 'Waste',
    'badges.categories.challenge': 'Challenge',
    'badges.badgeNames.plasticHero': 'Plastic Hero',
    'badges.badgeDescriptions.plasticHero': 'Plastic Hero description',
    'badges.badgeNames.challengeStar': 'Challenge Star',
    'badges.badgeDescriptions.challengeStar': 'Challenge Star description',
    'badges.status.earned': 'Earned',
    'badges.status.locked': 'Locked',
    'badges.loginRequired': 'Please sign in to view your badges.',
    'badges.empty': 'No badges to show yet.',
  };

  return {
    translations: translationsHoisted,
    tMock: (key: string, options?: any) => {
      if (translationsHoisted[key]) return translationsHoisted[key];
      if (typeof options === 'string') return options;
      if (options?.defaultValue) return options.defaultValue;
      return key;
    },
    mockCatalog: [
      {
        key: 'badges.badgeNames.plasticHero',
        descriptionKey: 'badges.badgeDescriptions.plasticHero',
        category: 'waste',
        priority: 2,
      },
      {
        key: 'badges.badgeNames.challengeStar',
        descriptionKey: 'badges.badgeDescriptions.challengeStar',
        category: 'challenge',
        priority: 1,
      },
    ],
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
    i18n: {
      getFixedT: () => (key: string, opts?: any) => translations[key] ?? opts?.defaultValue ?? key,
    },
  }),
}));

vi.mock('@/lib/api/badges', () => ({
  BadgeApi: {
    getBadges: (...args: unknown[]) => getBadgesMock(...args),
  },
}));

vi.mock('@/lib/badges/catalog', () => ({
  badgeCatalog: mockCatalog,
}));

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

beforeEach(() => {
  getBadgesMock.mockResolvedValue([]);
});

describe('BadgesIndex route', () => {
  it('prompts the user to log in when no username is available', async () => {
    render(<BadgesIndex />);

    await waitFor(() =>
      expect(screen.getByText('Please sign in to view your badges.')).toBeInTheDocument(),
    );
    expect(getBadgesMock).not.toHaveBeenCalled();
  });

  it('renders badges and filters by category', async () => {
    localStorage.setItem('username', 'alice');
    getBadgesMock.mockResolvedValueOnce([
      { badgeName: 'badges.badgeNames.plasticHero' },
      { badgeName: 'badges.badgeNames.challengeStar' },
    ]);
    const user = userEvent.setup();

    render(<BadgesIndex />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(getBadgesMock).toHaveBeenCalledWith('alice');
    expect(screen.getByText('Plastic Hero')).toBeInTheDocument();
    expect(screen.getByText('Challenge Star')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/filter by challenge/i));
    await waitFor(() => expect(screen.queryByText('Plastic Hero')).not.toBeInTheDocument());
    expect(screen.getByText('Challenge Star')).toBeInTheDocument();
  });

  it('shows an error when badge loading fails', async () => {
    localStorage.setItem('username', 'alice');
    getBadgesMock.mockRejectedValueOnce(new Error('Server unavailable'));

    render(<BadgesIndex />);

    await waitFor(() => expect(screen.getByText('Server unavailable')).toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
