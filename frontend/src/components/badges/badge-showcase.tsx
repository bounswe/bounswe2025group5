import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { BadgeApi } from '@/lib/api/badges';
import type { Badge } from '@/lib/api/schemas/badge';
import { badgeCatalog } from '@/lib/badges/catalog';
import { cn } from '@/lib/utils';

type BadgeShowcaseProps = {
  username: string | null;
  maxEarnedToShow?: number;
  showCatalogButton?: boolean;
  className?: string;
  iconClassName?: string;
  gapClassName?: string;
};

const normalize = (val: string) => val.trim().toLowerCase();

export function BadgeShowcase({
  username,
  maxEarnedToShow = 3,
  showCatalogButton = false,
  className,
  iconClassName,
  gapClassName,
}: BadgeShowcaseProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnedBadgeNames, setEarnedBadgeNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    BadgeApi.getBadges(username)
      .then((res: Badge[]) => {
        if (cancelled) return;
        setEarnedBadgeNames(new Set(res.map((b) => normalize(b.badgeName))));
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : t('badges.loadError', 'Failed to load badges.'));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username, t]);

  const showcaseBadges = useMemo(() => {
    const translatedMatch = (key: string) => normalize(t(key, { defaultValue: key }));
    const earned = badgeCatalog.filter(
      (badge) =>
        earnedBadgeNames.has(normalize(badge.key)) ||
        earnedBadgeNames.has(translatedMatch(badge.key))
    );
    const sortedByPriority = [...earned].sort((a, b) => a.priority - b.priority);
    return sortedByPriority.slice(0, Math.min(maxEarnedToShow, sortedByPriority.length || maxEarnedToShow));
  }, [earnedBadgeNames, maxEarnedToShow, t]);

  if (!username) return null;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-4 w-4" />
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : showcaseBadges.length > 0 ? (
        <div className={cn('flex items-center justify-center', gapClassName)}>
          {showcaseBadges.map((badge) => {
            const title = t(badge.key, { defaultValue: badge.key });
            const alt = `${title} is ${t('badges.status.earned', 'Earned')}`;
            return (
              <div key={badge.key} className="flex items-center justify-center">
                {badge.iconUrl ? (
                  <img
                    src={badge.iconUrl}
                    alt={alt}
                    className={cn(
                      'h-15 w-20 sm:h-15 sm:w-20 min-h-[8rem] min-w-[8rem] sm:min-h-[10rem] sm:min-w-[10rem] object-contain flex-shrink-0',
                      iconClassName
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      'h-15 w-20 sm:h-15 sm:w-20 min-h-[8rem] min-w-[8rem] sm:min-h-[10rem] sm:min-w-[10rem] rounded-full bg-primary/10 grid place-items-center text-2xl font-semibold text-primary-foreground',
                      iconClassName
                    )}
                  >
                    {title.charAt(0)}
                  </div>
                )}
                <span className="sr-only">{title}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {showCatalogButton && (
        <div className="flex items-center justify-center mt-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/badges')}>
            {t('profile.badges.cta', 'See Badge Catalog')}
          </Button>
        </div>
      )}
    </div>
  );
}
