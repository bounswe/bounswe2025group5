import { type WasteGoalItem } from '@/lib/api/schemas/goals';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GoalCard({ goal }: { goal: WasteGoalItem }) {
  const { t } = useTranslation();
  const progressPercent = Math.max(0, goal.progress ?? 0);
  const formattedProgress = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(progressPercent);
  const wasteTypeLabel = t(`wasteTypes.${goal.wasteType}`, { defaultValue: goal.wasteType });
  const isExceeded = progressPercent >= 100;

  return (
    <Card className={cn('flex flex-col', isExceeded && 'opacity-90 bg-gray-100')}>
      <CardHeader>
        <CardTitle className="text-base">
          {t('goals.cardTitle', '{type} goal', { type: wasteTypeLabel })}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <div className="flex justify-between"><span>{t('goals.type', 'Type')}</span><span>{wasteTypeLabel}</span></div>
        <div className="flex justify-between"><span>{t('goals.restriction', 'Restriction (g)')}</span><span>{goal.restrictionAmountGrams}</span></div>
        <div className="flex justify-between"><span>{t('goals.duration', 'Duration (days)')}</span><span>{goal.duration}</span></div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>{t('goals.progress', 'Progress')}</span>
            <span>{formattedProgress}%</span>
          </div>
          <Progress value={Math.min(progressPercent, 100)} className={cn(isExceeded && 'bg-red-200 [&>div]:bg-red-500')} />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" data-action="log-waste" aria-label={t('goals.log', 'Log')}>
          <PlusCircle /> {t('goals.log', 'Log')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-action="edit-goal"
          aria-label={t('goals.edit', 'Edit')}
          className="opacity-100"
        >
          <Pencil /> {t('goals.edit', 'Edit')}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          data-action="delete-goal"
          aria-label={t('goals.delete', 'Delete')}
          className="opacity-100"
        >
          <Trash2 /> {t('goals.delete', 'Delete')}
        </Button>
      </CardFooter>
    </Card>
  );
}

