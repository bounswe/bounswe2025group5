import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GoalCard from '@/components/profile/GoalCard';
import { type WasteGoalItem } from '@/lib/api/schemas/goals';
import { UsersApi } from '@/lib/api/users';
import CreateOrEditGoalDialog from '@/components/profile/CreateOrEditGoalDialog';
import LogWasteDialog from '@/components/profile/LogWasteDialog';
import WasteSummaryCard from '@/components/profile/WasteSummaryCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
    <div className="min-h-screen flex flex-col text-foreground p-4">
      <div className="text-center mb-4 mt-30">
        <h1 className="text-3xl font-bold"> {t('goals.title', 'Goals')} </h1>
      </div>

      <div className="flex justify-center pb-8">
        <WasteSummaryCard className="max-w-6xl" />
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-6xl flex justify-end mb-4">
          {username && (
            <Button onClick={() => setCreateOpen(true)}>
              {t('goals.create', 'Create Goal')}
            </Button>
          )}
        </div>
        {loading ? (
          <div className="text-foreground">{t('goals.loading', 'Loading...')}</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground">{t('goals.empty', 'No goals found.')}</div>
        ) : (
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.goalId}
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
          </div>
        )}
      </div>

      <CreateOrEditGoalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t('goals.createTitle', 'Create waste goal')}
        description={t('goals.createDesc', 'Define a new waste reduction goal')}
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
        title={t('goals.editTitle', 'Edit waste goal')}
        description={t('goals.editDesc', 'Update your waste reduction goal')}
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



