import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GoalCard from '@/components/goals/GoalCard';
import { type WasteGoalItem } from '@/lib/api/schemas/goals';
import { UsersApi } from '@/lib/api/users';
import CreateOrEditGoalDialog from '@/components/goals/CreateOrEditGoalDialog';
import LogWasteDialog from '@/components/goals/LogWasteDialog';
import WasteSummaryCard from '@/components/profile/WasteSummaryCard';
import WasteMonthlyChart from '@/components/profile/WasteMonthlyChart';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import GlassCard from '@/components/ui/glass-card';

export default function GoalsIndex() {
  const { t } = useTranslation();
  const [items, setItems] = useState<WasteGoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (!username) {
        setItems([]);
        setLoading(false);
        return;
      }
      const response = await UsersApi.listGoals(username, 50);
      setItems(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editState, setEditState] = useState<{ open: boolean; goal?: WasteGoalItem }>({ open: false });
  const [logState, setLogState] = useState<{ open: boolean; goal?: WasteGoalItem }>({ open: false });

  return (
    <div className="min-h-screen pt-32 pb-8 px-4">
      <div className="max-w-6xl mx-auto flex justify-center">
        <GlassCard className="w-full">
          {/* Create Goal Button - Centered */}
          <div className="flex justify-center mb-4">
            {username && (
              <Button variant="tertiary" className="px-6" onClick={() => setCreateOpen(true)}>
                {t('goals.create', 'Create Goal')}
              </Button>
            )}
          </div>

          {/* Chart Cards Section */}
          <div className="flex justify-center pb-8">
            <div className="grid w-full max-w-6xl gap-4 md:grid-cols-2 justify-items-center items-start">
              <WasteSummaryCard variant="compact" className="w-full max-w-sm" />
              <WasteMonthlyChart username={username ?? undefined} variant="compact" className="w-full max-w-sm" />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-muted-foreground">{t('goals.loading', 'Loading...')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-destructive">{error}</p>
              </div>
            </div>
        ) : items.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground text-lg">
                {t('goals.empty', 'No goals found.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div key={item.goalId}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const action = target.closest('[data-action]')?.getAttribute('data-action');
                  if (!action) return;
                  if (action === 'edit-goal') {
                    setEditState({ open: true, goal: item });
                  } else if (action === 'delete-goal') {
                    (async () => {
                      try {
                        await UsersApi.deleteWasteGoal(item.goalId);
                        toast.success(t('goals.deleted', 'Goal deleted'));
                        void load();
                      } catch (err) {
                        toast.error(t('goals.deleteError', 'Failed to delete goal'));
                      }
                    })();
                  } else if (action === 'log-waste') {
                    setLogState({ open: true, goal: item });
                  }
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <GoalCard goal={item} />
              </div>
            ))}
          </div>
        )}
        </GlassCard>
      </div>

      <CreateOrEditGoalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (values) => {
          if (!username) return;
          try {
            const res = await UsersApi.createWasteGoal(username, values);
            toast.success(t('goals.created', 'Goal created'));
            await load();
            // Open log dialog for the newly created goal to list items of the selected type
            const created = items.find(g => g.goalId === res.goalId);
            if (created) {
              setLogState({ open: true, goal: created });
            }
          } catch {
            toast.error(t('goals.createError', 'Failed to create goal'));
          }
        }}
      />

      <CreateOrEditGoalDialog
        open={editState.open}
        onOpenChange={(o) => setEditState((s) => ({ ...s, open: o }))}
        initial={editState.goal && {
          type: editState.goal.wasteType,
          duration: editState.goal.duration,
          restrictionAmountGrams: editState.goal.restrictionAmountGrams,
        }}
        onSubmit={async (values) => {
          if (!editState.goal) return;
          try {
            await UsersApi.editWasteGoal(editState.goal.goalId, values);
            toast.success(t('goals.updated', 'Goal updated'));
            void load();
          } catch {
            toast.error(t('goals.updateError', 'Failed to update goal'));
          }
        }}
      />

      <LogWasteDialog
        open={logState.open}
        onOpenChange={(o) => setLogState((s) => ({ ...s, open: o }))}
        goalId={logState.goal?.goalId ?? 0}
        username={username ?? ''}
        onLogged={() => {
          toast.success(t('goals.logged', 'Waste logged'));
          void load();
        }}
      />
    </div>
  );
}



