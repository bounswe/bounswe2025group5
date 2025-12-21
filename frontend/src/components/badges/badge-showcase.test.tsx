import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadgeShowcase } from './badge-showcase';

const mockNavigate = vi.fn();
const getBadgesMock = vi.fn();

const { tMock, mockCatalog } = vi.hoisted(() => {
  const translationsHoisted: Record<string, string> = {
    'badges.badgeNames.heroOne': 'Hero One',
    'badges.badgeNames.heroTwo': 'Hero Two',
    'badges.badgeDescriptions.heroOne': 'Hero One description',
    'badges.badgeDescriptions.heroTwo': 'Hero Two description',
    'badges.status.earned': 'Earned',
    'profile.badges.cta': 'See Badge Catalog',
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
        key: 'badges.badgeNames.heroOne',
        descriptionKey: 'badges.badgeDescriptions.heroOne',
        category: 'test',
        priority: 2,
        iconUrl: 'hero-one.png',
      },
      {
        key: 'badges.badgeNames.heroTwo',
        descriptionKey: 'badges.badgeDescriptions.heroTwo',
        category: 'test',
        priority: 1,
        iconUrl: 'hero-two.png',
      },
    ],
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/ui/hover-card', () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
});

beforeEach(() => {
  getBadgesMock.mockResolvedValue([]);
});

describe('BadgeShowcase', () => {
  it('returns null when no username is provided', () => {
    const { container } = render(<BadgeShowcase username={null} />);
    expect(container.firstChild).toBeNull();
    expect(getBadgesMock).not.toHaveBeenCalled();
  });

  it('shows spinner while loading and renders earned badges sorted by priority', async () => {
    getBadgesMock.mockResolvedValueOnce([
      { badgeName: 'badges.badgeNames.heroOne' },
      { badgeName: 'badges.badgeNames.heroTwo' },
    ]);

    render(<BadgeShowcase username="alice" maxEarnedToShow={1} />);

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    expect(getBadgesMock).toHaveBeenCalledWith('alice');
    expect(screen.getByAltText('Hero Two is Earned')).toBeInTheDocument();
    expect(screen.queryByAltText('Hero One is Earned')).not.toBeInTheDocument();
  });

  it('renders only the earned badges from the catalog', async () => {
    getBadgesMock.mockResolvedValueOnce([{ badgeName: 'badges.badgeNames.heroOne' }]);

    render(<BadgeShowcase username="bob" />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    expect(getBadgesMock).toHaveBeenCalledWith('bob');
    expect(screen.getByAltText('Hero One is Earned')).toBeInTheDocument();
    expect(screen.queryByAltText('Hero Two is Earned')).not.toBeInTheDocument();
  });

  it('shows an error state when badge loading fails', async () => {
    getBadgesMock.mockRejectedValueOnce(new Error('Unable to load badges'));

    render(<BadgeShowcase username="alice" />);

    await waitFor(() => expect(screen.getByText('Unable to load badges')).toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('navigates to catalog when CTA button is clicked', async () => {
    getBadgesMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(<BadgeShowcase username="alice" showCatalogButton />);

    const cta = await screen.findByRole('button', { name: /see badge catalog/i });
    await user.click(cta);

    expect(mockNavigate).toHaveBeenCalledWith('/badges');
  });
});
