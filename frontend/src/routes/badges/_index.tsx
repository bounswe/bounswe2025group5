import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from '@/components/ui/glass-card';
import { Badge as Pill } from '@/components/ui/badge';
import { BadgeCard } from '@/components/badges/badge-card';
import { Spinner } from '@/components/ui/spinner';
import { BadgeApi } from '@/lib/api/badges';
import type { Badge } from '@/lib/api/schemas/badge';

// Badge Icon Assets
import plasticSaverIcon from '@/assets/badges/plastic-saver.png';
import plasticHeroIcon from '@/assets/badges/plastic-hero.png';
import plasticLegendIcon from '@/assets/badges/plastic-legend.png';
import paperSaverIcon from '@/assets/badges/paper-saver.png';
import paperHeroIcon from '@/assets/badges/paper-hero.png';
import paperLegendIcon from '@/assets/badges/paper-legend.png';
import glassSaverIcon from '@/assets/badges/glass-saver.png';
import glassHeroIcon from '@/assets/badges/glass-hero.png';
import glassLegendIcon from '@/assets/badges/glass-legend.png';
import metalSaverIcon from '@/assets/badges/metal-saver.png';
import metalHeroIcon from '@/assets/badges/metal-hero.png';
import metalLegendIcon from '@/assets/badges/metal-legend.png';
import organicSaverIcon from '@/assets/badges/organic-saver.png';
import organicHeroIcon from '@/assets/badges/organic-hero.png';
import organicLegendIcon from '@/assets/badges/organic-legend.png';
import topChallengerIcon from '@/assets/badges/top-challenger.png';

type CatalogBadge = {
  key: string;
  descriptionKey: string;
  category: string;
  iconUrl?: string;
};

const catalog: CatalogBadge[] = [
  { key: 'badges.badgeNames.plasticSaver', descriptionKey: 'badges.badgeDescriptions.plasticSaver', category: 'waste', iconUrl: plasticSaverIcon },
  { key: 'badges.badgeNames.plasticHero', descriptionKey: 'badges.badgeDescriptions.plasticHero', category: 'waste', iconUrl: plasticHeroIcon },
  { key: 'badges.badgeNames.plasticLegend', descriptionKey: 'badges.badgeDescriptions.plasticLegend', category: 'waste', iconUrl: plasticLegendIcon },
  { key: 'badges.badgeNames.paperSaver', descriptionKey: 'badges.badgeDescriptions.paperSaver', category: 'waste', iconUrl: paperSaverIcon },
  { key: 'badges.badgeNames.paperHero', descriptionKey: 'badges.badgeDescriptions.paperHero', category: 'waste', iconUrl: paperHeroIcon },
  { key: 'badges.badgeNames.paperLegend', descriptionKey: 'badges.badgeDescriptions.paperLegend', category: 'waste', iconUrl: paperLegendIcon },
  { key: 'badges.badgeNames.glassSaver', descriptionKey: 'badges.badgeDescriptions.glassSaver', category: 'waste', iconUrl: glassSaverIcon },
  { key: 'badges.badgeNames.glassHero', descriptionKey: 'badges.badgeDescriptions.glassHero', category: 'waste', iconUrl: glassHeroIcon },
  { key: 'badges.badgeNames.glassLegend', descriptionKey: 'badges.badgeDescriptions.glassLegend', category: 'waste', iconUrl: glassLegendIcon },
  { key: 'badges.badgeNames.metalSaver', descriptionKey: 'badges.badgeDescriptions.metalSaver', category: 'waste', iconUrl: metalSaverIcon },
  { key: 'badges.badgeNames.metalHero', descriptionKey: 'badges.badgeDescriptions.metalHero', category: 'waste', iconUrl: metalHeroIcon },
  { key: 'badges.badgeNames.metalLegend', descriptionKey: 'badges.badgeDescriptions.metalLegend', category: 'waste', iconUrl: metalLegendIcon },
  { key: 'badges.badgeNames.organicSaver', descriptionKey: 'badges.badgeDescriptions.organicSaver', category: 'waste', iconUrl: organicSaverIcon },
  { key: 'badges.badgeNames.organicHero', descriptionKey: 'badges.badgeDescriptions.organicHero', category: 'waste', iconUrl: organicHeroIcon },
  { key: 'badges.badgeNames.organicLegend', descriptionKey: 'badges.badgeDescriptions.organicLegend', category: 'waste', iconUrl: organicLegendIcon },
  { key: 'badges.badgeNames.topChallenger', descriptionKey: 'badges.badgeDescriptions.topChallenger', category: 'challenge', iconUrl: topChallengerIcon },
];

export default function BadgesIndex() {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<string>('all');
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalize = (value: string) => value.trim().toLowerCase();

  const username = useMemo(() => {
    try {
      const raw = localStorage.getItem('username');
      if (raw) return raw;
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = JSON.parse(atob(payload));
      return typeof json.username === 'string' ? json.username : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setError(t('badges.loginRequired', 'Please sign in to view your badges.'));
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await BadgeApi.getBadges(username);
        const earned = new Set(res.map((badge: Badge) => normalize(badge.badgeName)));
        setEarnedBadges(earned);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('badges.loadError', 'Failed to load badges.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [username, t]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(catalog.map(item => item.category)));
    return ['all', ...unique];
  }, []);

  const filtered = useMemo(() => {
    if (category === 'all') return catalog;
    return catalog.filter(item => item.category === category);
  }, [category]);

  return (
    <div className="min-h-screen pt-32 pb-8 px-4">
      <div className="max-w-6xl mx-auto flex justify-center">
        <GlassCard className="w-full">
          <div className="flex flex-col gap-6">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground/85">
                {t('badges.title', 'Badge Catalog')}
              </h1>
              <p className="text-muted-foreground">
                {t('badges.subtitle', 'Preview the badges you can earn in WasteLess.')}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="focus-visible:outline-none"
                    aria-label={t('badges.filterBy', { category: cat, defaultValue: `Filter by ${cat}` })}
                  >
                    <Pill variant={category === cat ? 'tertiary' : 'outline'}>
                      {cat === 'all'
                        ? t('badges.filters.all', 'All categories')
                        : t(`badges.categories.${cat}`, {
                            defaultValue: cat.charAt(0).toUpperCase() + cat.slice(1),
                          })}
                    </Pill>
                  </button>
                ))}
              </div>
            </header>

            {loading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Spinner />
              </div>
            ) : error ? (
              <div className="text-center text-destructive py-12">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                {t('badges.empty', 'No badges to show yet.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {filtered.map((badge) => (
                  <BadgeCard
                    key={badge.key}
                    titleKey={badge.key}
                    descriptionKey={badge.descriptionKey}
                    category={badge.category}
                    iconUrl={badge.iconUrl}
                    earned={
                      earnedBadges.has(normalize(badge.key)) ||
                      earnedBadges.has(normalize(t(badge.key, { defaultValue: badge.key }))) ||
                      earnedBadges.has(
                        normalize(
                          i18n.getFixedT?.('en')?.(badge.key, { defaultValue: badge.key }) ?? badge.key
                        )
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
