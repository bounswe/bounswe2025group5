import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: { type: string; duration: number; restrictionAmountGrams: number };
  onSubmit: (values: { type: string; duration: number; restrictionAmountGrams: number }) => Promise<void> | void;
  title?: string;
  description?: string;
};

export default function CreateOrEditGoalDialog({ open, onOpenChange, initial, onSubmit, title = 'Waste Goal', description = 'Set your waste reduction goal' }: Props) {
  const wasteTypes = [
    { id: 3, name: 'GLASS' },
    { id: 2, name: 'METAL' },
    { id: 5, name: 'ORGANIC' },
    { id: 4, name: 'PAPER' },
    { id: 1, name: 'PLASTIC' },
  ];
  const [type, setType] = useState(initial?.type ?? wasteTypes[0].name);
  const [duration, setDuration] = useState<number>(initial?.duration ?? 7);
  const [restrictionAmountGrams, setRestrictionAmountGrams] = useState<number>(initial?.restrictionAmountGrams ?? 0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setType(initial?.type ?? wasteTypes[0].name);
      setDuration(initial?.duration ?? 7);
      setRestrictionAmountGrams(initial?.restrictionAmountGrams ?? 0);
    }
  }, [open, initial]);

  const canSubmit = useMemo(() => type.trim().length > 0 && duration > 0 && restrictionAmountGrams >= 0, [type, duration, restrictionAmountGrams]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label htmlFor="goal-type">Type</Label>
            <select
              id="goal-type"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {wasteTypes.map((wt) => (
                <option key={wt.id} value={wt.name}>{wt.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="goal-duration">Duration (days)</Label>
            <Input id="goal-duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="goal-restriction">Restriction amount (grams)</Label>
            <Input id="goal-restriction" type="number" value={restrictionAmountGrams} onChange={(e) => setRestrictionAmountGrams(Number(e.target.value))} min={0} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
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
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


