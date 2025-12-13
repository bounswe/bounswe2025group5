import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    <Card className={cn('bg-background/90 border border-border/60 shadow-lg', className)}>
      <CardHeader className="flex flex-row justify-between gap-3 space-y-0">
        <div className="flex gap-3 items-start">
          <div className="h-20 w-20 sm:w-24 rounded-xl bg-primary/10 grid place-items-center border border-border/60 text-base font-semibold text-primary-foreground overflow-hidden">
            {iconUrl ? (
              <img src={iconUrl} alt={`${title} icon`} className="h-full w-full object-cover" />
            ) : (
              title.charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
            <div className="flex gap-2">
              <Pill variant="outline">{categoryLabel}</Pill>
            </div>
          </div>
        </div>
        <Pill variant={earned ? 'tertiary' : 'secondary'}>{statusLabel}</Pill>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground"></CardContent>
    </Card>
  );
}
