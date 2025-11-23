import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UsersApi } from '@/lib/api/users';
import { WasteApi } from '@/lib/api/waste';
import type { WasteItem } from '@/lib/api/schemas/goals';
import { useTranslation } from 'react-i18next';

type Props = {
  goalId: number;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged?: () => void;
};

export default function LogWasteDialog({ goalId, username, open, onOpenChange, onLogged }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<WasteItem[]>([]);
  const [itemId, setItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingItems(true);
      try {
        const res = await UsersApi.listWasteItemsForGoal(goalId);
        setItems(res);
        if (res.length > 0) setItemId(res[0].id);
      } finally {
        setLoadingItems(false);
      }
    })();
  }, [open, goalId]);

  const canSubmit = useMemo(() => itemId != null && quantity > 0, [itemId, quantity]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('goals.logWaste', 'Log waste')}</DialogTitle>
          <DialogDescription>{t('goals.logWasteDescription', 'Select an item and quantity to log.')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label htmlFor="waste-item">{t('goals.item', 'Item')}</Label>
            <select
              id="waste-item"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={itemId ?? ''}
              onChange={(e) => setItemId(Number(e.target.value))}
              disabled={loadingItems}
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.displayName}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="waste-quantity">{t('goals.quantity', 'Quantity')}</Label>
            <Input id="waste-quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t('goals.cancel', 'Cancel')}</Button>
          <Button
            onClick={async () => {
              if (!canSubmit) return;
              try {
                setSubmitting(true);
                await WasteApi.create(goalId, { username, itemId, quantity });
                onOpenChange(false);
                onLogged?.();
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!canSubmit || submitting}
          >
            {t('goals.log', 'Log')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

