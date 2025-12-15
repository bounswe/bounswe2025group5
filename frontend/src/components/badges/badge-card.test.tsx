import { render, screen } from '@testing-library/react';
import { describe, expect, it, afterEach, vi } from 'vitest';
import { BadgeCard } from './badge-card';

const translations: Record<string, string> = {
  'badges.badgeNames.heroOne': 'Hero One',
  'badges.badgeNames.paperSaver': 'Paper Saver',
  'badges.badgeDescriptions.heroOne': 'Earned by doing heroic things',
  'badges.badgeDescriptions.paperSaver': 'Earned by saving paper',
  'badges.categories.waste': 'Waste',
  'badges.status.earned': 'Earned',
  'badges.status.locked': 'Locked',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (translations[key]) return translations[key];
      if (typeof options === 'string') return options;
      if (options?.defaultValue) return options.defaultValue;
      return key;
    },
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('BadgeCard', () => {
  it('renders the provided icon and earned status', () => {
    render(
      <BadgeCard
        titleKey="badges.badgeNames.heroOne"
        descriptionKey="badges.badgeDescriptions.heroOne"
        category="waste"
        iconUrl="/hero.png"
        earned
      />,
    );

    expect(screen.getByText('Hero One')).toBeInTheDocument();
    expect(screen.getByAltText('Hero One icon')).toHaveAttribute('src', '/hero.png');
    expect(screen.getByText('Waste')).toBeInTheDocument();
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByLabelText('Hero One (Earned)')).toBeInTheDocument();
  });

  it('falls back to an initial avatar when icon is missing and shows locked status', () => {
    render(
      <BadgeCard
        titleKey="badges.badgeNames.paperSaver"
        descriptionKey="badges.badgeDescriptions.paperSaver"
        category="waste"
        earned={false}
      />,
    );

    expect(screen.getByText('Paper Saver')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getByLabelText('Paper Saver (Locked)')).toHaveClass('opacity-60');
  });
});
