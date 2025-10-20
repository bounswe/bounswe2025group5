import { type WasteGoalItem } from '@/lib/api/schemas/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

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
    </Card>
  );
}



