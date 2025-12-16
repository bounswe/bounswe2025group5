import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as Pill } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BadgeCardProps = {
  titleKey: string;
  descriptionKey: string;
  category: string;
  iconUrl?: string;
  earned: boolean;
  className?: string;
};

export function BadgeCard({
  titleKey,
  descriptionKey,
  category,
  iconUrl,
  earned,
  className,
}: BadgeCardProps) {
  const { t } = useTranslation();
  const title = t(titleKey, { defaultValue: titleKey });
  const description = t(descriptionKey, { defaultValue: descriptionKey });
  const categoryLabel = t(`badges.categories.${category}`, { defaultValue: category });
  const statusLabel = earned
    ? t('badges.status.earned', 'Earned')
    : t('badges.status.locked', 'Locked');

  return (
    <Card
      className={cn(
        'bg-background/90 border border-border/60 shadow-lg transition',
        !earned && 'opacity-60 saturate-20',
        className
      )}
      aria-label={`${title} (${statusLabel})`}
    >
      <CardHeader className="flex flex-row justify-between items-start gap-3 space-y-0">
        <div className="flex flex-col items-center text-center flex-1">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={`${title} icon`}
              className="object-contain rounded-2xl"
            />
          ) : (
            <div className="rounded-2xl bg-primary/10 grid place-items-center text-8xl font-semibold text-primary-foreground">
              {title.charAt(0).toUpperCase()}
            </div>
          )}
          <CardTitle className="mt-3 text-lg text-foreground">{title}</CardTitle>
          <div className="flex gap-2 mt-2">
            <Pill variant="tertiary">{categoryLabel}</Pill>
            <Pill variant={earned ? 'default' : 'destructive'}>{statusLabel}</Pill>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}
