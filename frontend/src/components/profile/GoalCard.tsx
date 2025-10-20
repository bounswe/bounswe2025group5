import { type WasteGoalItem } from '@/lib/api/schemas/goals';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';

export default function GoalCard({ goal }: { goal: WasteGoalItem }) {
  const { t } = useTranslation();
  const progressPercent = Math.max(0, Math.min(100, goal.progress ?? 0));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">
          {t('goals.cardTitle', '{type} goal', { type: goal.wasteType })}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <div className="flex justify-between"><span>{t('goals.type', 'Type')}</span><span>{goal.wasteType}</span></div>
        <div className="flex justify-between"><span>{t('goals.restriction', 'Restriction (g)')}</span><span>{goal.restrictionAmountGrams}</span></div>
        <div className="flex justify-between"><span>{t('goals.duration', 'Duration (days)')}</span><span>{goal.duration}</span></div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>{t('goals.progress', 'Progress')}</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" data-action="log-waste" aria-label={t('goals.log', 'Log')}>
          <PlusCircle /> {t('goals.log', 'Log')}
        </Button>
        <Button variant="ghost" size="sm" data-action="edit-goal" aria-label={t('goals.edit', 'Edit')}>
          <Pencil /> {t('goals.edit', 'Edit')}
        </Button>
        <Button variant="destructive" size="sm" data-action="delete-goal" aria-label={t('goals.delete', 'Delete')}>
          <Trash2 /> {t('goals.delete', 'Delete')}
        </Button>
      </CardFooter>
    </Card>
  );
}



