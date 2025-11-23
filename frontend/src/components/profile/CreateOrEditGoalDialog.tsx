import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WASTE_TYPES } from '@/lib/api/schemas/goals';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: { type: string; duration: number; restrictionAmountGrams: number };
  onSubmit: (values: { type: string; duration: number; restrictionAmountGrams: number }) => Promise<void> | void;
};

export default function CreateOrEditGoalDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState(initial?.type ?? WASTE_TYPES[0].name);
  const [duration, setDuration] = useState<number>(initial?.duration ?? 7);
  const [restrictionAmountGrams, setRestrictionAmountGrams] = useState<number>(initial?.restrictionAmountGrams ?? 0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setType(initial?.type ?? WASTE_TYPES[0].name);
      setDuration(initial?.duration ?? 7);
      setRestrictionAmountGrams(initial?.restrictionAmountGrams ?? 0);
    }
  }, [open, initial]);

  const canSubmit = useMemo(() => type.trim().length > 0 && duration > 0 && restrictionAmountGrams >= 0, [type, duration, restrictionAmountGrams]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('goals.createTitle', 'Create waste goal')}</DialogTitle>
          <DialogDescription>{t('goals.createDesc', 'Define a new waste reduction goal')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label htmlFor="goal-type">{t('goals.type', 'Type')}</Label>
            <select
              id="goal-type"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {WASTE_TYPES.map((wt) => (
                <option key={wt.id} value={wt.name}>{wt.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="goal-duration">{t('goals.duration', 'Duration (days)')}</Label>
            <Input id="goal-duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="goal-restriction">{t('goals.restriction', 'Restriction amount (grams)')}</Label>
            <Input id="goal-restriction" type="number" value={restrictionAmountGrams} onChange={(e) => setRestrictionAmountGrams(Number(e.target.value))} min={0} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t('goals.cancel', 'Cancel')}</Button>
          <Button
            onClick={async () => {
              if (!canSubmit) return;
              try {
                setSubmitting(true);
                await onSubmit({ type: type.trim(), duration, restrictionAmountGrams });
                onOpenChange(false);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!canSubmit || submitting}
          >
            {t('goals.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


