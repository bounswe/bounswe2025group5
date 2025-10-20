import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GoalCard from '@/components/profile/GoalCard';
import { type WasteGoalItem } from '@/lib/api/schemas/goals';
import { UsersApi } from '@/lib/api/users';

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

  useEffect(() => {
    (async () => {
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
    })();
  }, [username]);

  return (
    <div className="min-h-screen flex flex-col text-foreground p-4">
      <div className="text-center mb-4 mt-30">
        <h1 className="text-3xl font-bold"> {t('goals.title', 'Goals')} </h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
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
                <GoalCard key={item.goalId} goal={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



